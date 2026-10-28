from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Telemetry, Device, utcnow
from backend.schemas import TelemetryIngest, TelemetryOut
from backend.websocket_manager import ws_manager
from backend.notifications_engine import notification_engine
from backend.simulator import simulator
from backend.firebase_admin import writeData

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.post("/ingest", response_model=TelemetryOut)
async def ingest_telemetry(payload: TelemetryIngest, db: Session = Depends(get_db)):
    """
    Ingest endpoint for physical IoT devices (ESP32) and Edge Gateways.
    Performs validation, updates device last_seen_at, and evaluates safety limits.
    """
    device = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {payload.device_id} not registered")

    # Evaluate status against thresholds
    status = "NORMAL"
    if payload.max_threshold is not None and payload.metric_value > payload.max_threshold:
        status = "CRITICAL" if payload.metric_value > payload.max_threshold * 1.4 else "WARNING"
    elif payload.min_threshold is not None and payload.metric_value < payload.min_threshold:
        status = "WARNING"

    now = payload.timestamp or utcnow()
    telemetry = Telemetry(
        device_id=payload.device_id,
        zone_id=payload.zone_id,
        timestamp=now,
        metric_name=payload.metric_name,
        metric_value=payload.metric_value,
        unit=payload.unit,
        min_threshold=payload.min_threshold,
        max_threshold=payload.max_threshold,
        status=status,
        quality_score=payload.quality_score or 1.0,
        is_simulated=payload.is_simulated or False
    )
    db.add(telemetry)

    # Update device online health & freshness
    device.last_seen_at = now
    device.connection_status = status if status in ["WARNING", "CRITICAL"] else "ONLINE"
    db.commit()
    db.refresh(telemetry)

    # If critical reading, trigger automatic incident and notification
    if status == "CRITICAL" and not simulator.has_open_incident_for_device(db, device.device_id):
        incident = await simulator.create_automatic_incident(db, device, payload.metric_name, payload.metric_value, payload.unit)
        if incident:
            await notification_engine.dispatch_incident_alerts(db, incident)

    # Broadcast over WebSocket
    await ws_manager.broadcast("TELEMETRY_INGESTED", {
        "device_id": telemetry.device_id,
        "metric_name": telemetry.metric_name,
        "value": telemetry.metric_value,
        "unit": telemetry.unit,
        "status": telemetry.status,
        "timestamp": str(telemetry.timestamp)
    })

    # Sync to Firebase Realtime Database
    try:
        writeData(f"live_telemetry/{payload.device_id}", {
            "device_id": payload.device_id,
            "zone_id": payload.zone_id,
            "metric_name": payload.metric_name,
            "metric_value": payload.metric_value,
            "unit": payload.unit,
            "min_threshold": payload.min_threshold,
            "max_threshold": payload.max_threshold,
            "status": status,
            "quality_score": payload.quality_score or 1.0,
            "is_simulated": payload.is_simulated or False,
            "timestamp": now,
        })
        writeData(f"devices/{payload.device_id}/connection_status", device.connection_status)
        writeData(f"devices/{payload.device_id}/last_seen_at", now)
    except Exception:
        pass

    return telemetry

@router.get("/recent", response_model=list[TelemetryOut])
def get_recent_telemetry(limit: int = Query(default=50, le=200), db: Session = Depends(get_db)):
    return db.query(Telemetry).order_by(Telemetry.timestamp.desc()).limit(limit).all()

@router.get("/device/{device_id}", response_model=list[TelemetryOut])
def get_device_telemetry(device_id: str, limit: int = Query(default=30), db: Session = Depends(get_db)):
    return db.query(Telemetry).filter(Telemetry.device_id == device_id).order_by(Telemetry.timestamp.desc()).limit(limit).all()
