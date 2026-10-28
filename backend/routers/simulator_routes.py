from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Device, GatewayHealth, Zone, Incident, AuditLog, utcnow
from backend.schemas import SimulationInjectPayload
from backend.simulator import simulator
from backend.websocket_manager import ws_manager
from backend.firebase_admin import writeData

router = APIRouter(prefix="/simulator", tags=["Simulation and Testing Mode"])

@router.post("/inject")
async def inject_scenario(payload: SimulationInjectPayload, db: Session = Depends(get_db)):
    """
    Injects an operational scenario into the simulation loop.
    Supported: GAS_LEAK, THERMAL_RUNAWAY, VIBRATION_SPIKE, WORKER_SOS, GATEWAY_DROP, RECONNECT_SYNC
    """
    zone = db.query(Zone).filter(Zone.id == payload.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    if payload.scenario_type == "GATEWAY_DROP":
        gw = db.query(GatewayHealth).filter(GatewayHealth.plant_id == payload.plant_id).first()
        if gw:
            gw.status = "OFFLINE"
            gw.broker_connected = False
            gw.packet_loss_percent = 100.0
            gw.buffered_events_count += 18
            db.commit()
            await ws_manager.broadcast("GATEWAY_STATUS_CHANGED", {
                "gateway_id": gw.gateway_id,
                "status": "OFFLINE",
                "simulated": True
            })
            # Sync to Firebase
            try:
                writeData(f"gateway_health/{gw.gateway_id}/status", "OFFLINE")
                writeData(f"gateway_health/{gw.gateway_id}/broker_connected", False)
            except Exception:
                pass
        return {"status": "SCENARIO_INJECTED", "type": "GATEWAY_DROP", "message": "Edge Gateway simulation set to OFFLINE."}

    elif payload.scenario_type == "RECONNECT_SYNC":
        gw = db.query(GatewayHealth).filter(GatewayHealth.plant_id == payload.plant_id).first()
        if gw:
            gw.status = "HEALTHY"
            gw.broker_connected = True
            gw.packet_loss_percent = 0.0
            buffered_count = gw.buffered_events_count
            gw.buffered_events_count = 0
            db.commit()
            await ws_manager.broadcast("GATEWAY_STATUS_CHANGED", {
                "gateway_id": gw.gateway_id,
                "status": "HEALTHY",
                "synced_buffered_events": buffered_count
            })
            # Sync to Firebase
            try:
                writeData(f"gateway_health/{gw.gateway_id}/status", "HEALTHY")
                writeData(f"gateway_health/{gw.gateway_id}/broker_connected", True)
                writeData(f"gateway_health/{gw.gateway_id}/buffered_events_count", 0)
            except Exception:
                pass
        return {"status": "SCENARIO_INJECTED", "type": "RECONNECT_SYNC", "message": "Edge Gateway reconnected and synced buffer."}

    # Sensor-based scenarios
    simulator.inject_scenario(payload.scenario_type, payload.zone_id)

    # Force a tick immediately to generate the event without delay
    await simulator.generate_telemetry_tick(db)

    audit = AuditLog(
        user_id=None,
        username="SIMULATOR_OPERATOR",
        action="INJECT_SIMULATION_HAZARD",
        entity_type="ZONE",
        entity_id=str(payload.zone_id),
        details=f"Injected simulation scenario '{payload.scenario_type}' with severity '{payload.severity}' into {zone.name}"
    )
    db.add(audit)
    db.commit()

    await ws_manager.broadcast("SIMULATION_HAZARD_INJECTED", {
        "zone_id": payload.zone_id,
        "zone_name": zone.name,
        "scenario_type": payload.scenario_type,
        "severity": payload.severity
    })

    return {
        "status": "HAZARD_INJECTED",
        "zone_id": payload.zone_id,
        "zone_name": zone.name,
        "scenario_type": payload.scenario_type,
        "severity": payload.severity,
        "timestamp": str(utcnow())
    }

@router.post("/reset")
async def reset_simulation(db: Session = Depends(get_db)):
    simulator.clear_scenarios()
    
    # Reset zones to CLEAR
    zones = db.query(Zone).all()
    for z in zones:
        z.hazard_status = "CLEAR"

    # Reset devices to ONLINE
    devices = db.query(Device).all()
    for d in devices:
        d.connection_status = "ONLINE"

    # Reset gateways
    gateways = db.query(GatewayHealth).all()
    for g in gateways:
        g.status = "HEALTHY"
        g.broker_connected = True
        g.packet_loss_percent = 0.0
        g.buffered_events_count = 0

    db.commit()

    # Reset all Firebase zone/device/gateway statuses
    try:
        for z in zones:
            writeData(f"zones/{z.id}/hazard_status", "CLEAR")
        for d in devices:
            writeData(f"devices/{d.device_id}/connection_status", "ONLINE")
        for g in gateways:
            writeData(f"gateway_health/{g.gateway_id}/status", "HEALTHY")
            writeData(f"gateway_health/{g.gateway_id}/broker_connected", True)
            writeData(f"gateway_health/{g.gateway_id}/buffered_events_count", 0)
    except Exception:
        pass

    await ws_manager.broadcast("SIMULATION_RESET", {
        "timestamp": str(utcnow()),
        "message": "All simulation hazards cleared and baseline restored."
    })

    return {"status": "SIMULATION_RESET_SUCCESSFUL"}
