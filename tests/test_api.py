import os
os.environ["SIMULATION_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient
from backend.config import settings
settings.SIMULATION_ENABLED = False

from backend.main import app
from backend.database import SessionLocal, Base, engine
from backend.models import Device, utcnow
from database.seed_data import seed_database
from backend.ai_engine import ai_engine

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

def _get_operator_token():
    res = client.post("/api/v1/auth/login", json={"username": "operator", "password": "Operator@123"})
    return res.json()["access_token"]

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "version" in data

def test_auth_login_success():
    response = client.post("/api/v1/auth/login", json={
        "username": "operator",
        "password": "Operator@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "CONTROL_ROOM_OPERATOR"

def test_auth_login_invalid_credentials():
    response = client.post("/api/v1/auth/login", json={
        "username": "operator",
        "password": "WrongPassword999"
    })
    assert response.status_code == 401

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary?plant_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    # total_devices can be 0 when no real sensors are registered yet
    assert "total_devices" in data["kpis"]
    assert "overall_plant_safety_score" in data["kpis"]

def test_telemetry_ingest_and_validation():
    """Create a test sensor, ingest telemetry, then clean up."""
    db = SessionLocal()
    test_device = None
    try:
        # Create a temporary test device directly in DB
        test_device = Device(
            device_id="DEV-TEST-99",
            plant_id=1,
            zone_id=1,
            name="Test Gas Sensor (Automated Test)",
            device_type="GAS_DETECTOR",
            connection_status="ONLINE",
            signal_strength_dbm=-60,
            battery_percentage=95,
            firmware_version="v-test",
            ip_address="192.168.1.199",
            is_simulated=True,
        )
        db.add(test_device)
        db.commit()
        db.refresh(test_device)
    finally:
        db.close()

    payload = {
        "device_id": "DEV-TEST-99",
        "zone_id": 1,
        "metric_name": "combustible_gas",
        "metric_value": 28.5,
        "unit": "ppm",
        "min_threshold": 0.0,
        "max_threshold": 50.0,
        "is_simulated": True
    }
    response = client.post("/api/v1/telemetry/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "NORMAL"
    assert data["metric_value"] == 28.5

    # Cleanup test device and its telemetry
    db2 = SessionLocal()
    try:
        db2.query(Device).filter(Device.device_id == "DEV-TEST-99").delete()
        db2.commit()
    finally:
        db2.close()

def test_incident_lifecycle():
    # 1. Login as operator
    login_res = client.post("/api/v1/auth/login", json={
        "username": "operator",
        "password": "Operator@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Incident
    create_res = client.post("/api/v1/incidents", json={
        "plant_id": 1,
        "zone_id": 1,
        "device_id": "DEV-ENV-01",
        "category": "ABNORMAL_TEMPERATURE",
        "severity": "HIGH",
        "title": "Thermal Overheat Test Incident",
        "description": "Temperature probe exceeded safety boundary in Bay A",
        "assigned_team": "Maintenance Squad"
    }, headers=headers)
    assert create_res.status_code == 200
    inc = create_res.json()
    assert inc["status"] == "NEW"
    inc_id = inc["id"]

    # 3. Acknowledge Incident
    ack_res = client.post(f"/api/v1/incidents/{inc_id}/acknowledge", headers=headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # 4. Transition to RESPONDING
    trans_res = client.patch(f"/api/v1/incidents/{inc_id}/transition", json={
        "status": "RESPONDING"
    }, headers=headers)
    assert trans_res.status_code == 200
    assert trans_res.json()["status"] == "RESPONDING"

    # 5. Resolve
    resolve_res = client.patch(f"/api/v1/incidents/{inc_id}/transition", json={
        "status": "RESOLVED",
        "resolution_notes": "Ventilation chiller restored to operational limits."
    }, headers=headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"

    # 6. Cleanup test incident to keep database clean
    del_res = client.delete(f"/api/v1/incidents/{inc_id}", headers=headers)
    assert del_res.status_code == 200

def test_ai_anomaly_engine_evaluation():
    # Normal metrics
    is_anomaly, score, risk, reasons = ai_engine.evaluate_telemetry_vector({
        "temperature": 23.0,
        "smoke_ppm": 2.0,
        "combustible_gas": 8.0,
        "vibration_rms": 1.4,
        "humidity": 48.0
    })
    assert not is_anomaly
    assert risk < 40.0

    # Hazardous thermal & gas spike
    is_anomaly_hazard, score_h, risk_h, reasons_h = ai_engine.evaluate_telemetry_vector({
        "temperature": 78.0,
        "smoke_ppm": 55.0,
        "combustible_gas": 190.0,
        "vibration_rms": 7.2,
        "humidity": 45.0
    })
    assert is_anomaly_hazard
    assert risk_h > 70.0
    assert "COMBUSTIBLE_GAS_LEAK_CRITICAL" in reasons_h
    assert "THERMAL_CRITICAL_EXCEEDANCE" in reasons_h
