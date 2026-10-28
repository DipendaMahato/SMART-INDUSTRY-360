from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GatewayHealth, Telemetry, AuditLog, utcnow
from backend.schemas import GatewayHealthOut
from backend.websocket_manager import ws_manager
from backend.firebase_admin import writeData

router = APIRouter(prefix="/gateways", tags=["Communication and Gateway Health"])

@router.get("", response_model=list[GatewayHealthOut])
def list_gateways(plant_id: int = Query(default=1), db: Session = Depends(get_db)):
    return db.query(GatewayHealth).filter(GatewayHealth.plant_id == plant_id).all()

@router.post("/{gateway_id}/sync-buffer")
async def sync_edge_gateway_buffer(
    gateway_id: str,
    buffered_events: list[dict] = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Edge Computing Store-and-Forward Synchronization:
    Ingests events that were buffered on the edge gateway during network or broker outage.
    """
    gw = db.query(GatewayHealth).filter(GatewayHealth.gateway_id == gateway_id).first()
    if not gw:
        raise HTTPException(status_code=404, detail="Gateway not found")

    synced_count = 0
    for evt in buffered_events:
        t = Telemetry(
            device_id=evt.get("device_id", "DEV-EDGE-01"),
            zone_id=evt.get("zone_id", 1),
            timestamp=utcnow(),
            metric_name=evt.get("metric_name", "temperature"),
            metric_value=evt.get("metric_value", 25.0),
            unit=evt.get("unit", "°C"),
            status=evt.get("status", "NORMAL"),
            quality_score=0.98,
            is_simulated=evt.get("is_simulated", True)
        )
        db.add(t)
        synced_count += 1

    gw.buffered_events_count = max(0, gw.buffered_events_count - synced_count)
    gw.status = "HEALTHY"
    gw.last_heartbeat_at = utcnow()

    audit = AuditLog(
        user_id=None,
        username="EDGE_SYNC_GATEWAY",
        action="SYNC_BUFFERED_EVENTS",
        entity_type="GATEWAY",
        entity_id=gateway_id,
        details=f"Synchronized {synced_count} offline buffered telemetry events from Edge Gateway {gateway_id}"
    )
    db.add(audit)
    db.commit()

    await ws_manager.broadcast("GATEWAY_SYNCED", {
        "gateway_id": gateway_id,
        "synced_count": synced_count,
        "remaining_buffer": gw.buffered_events_count
    })

    # Sync gateway health to Firebase
    try:
        writeData(f"gateway_health/{gateway_id}", {
            "gateway_id": gateway_id,
            "plant_id": gw.plant_id,
            "name": gw.name,
            "ip_address": gw.ip_address,
            "status": gw.status,
            "broker_connected": gw.broker_connected,
            "ping_latency_ms": gw.ping_latency_ms,
            "packet_loss_percent": gw.packet_loss_percent,
            "buffered_events_count": gw.buffered_events_count,
            "last_heartbeat_at": gw.last_heartbeat_at,
        })
    except Exception:
        pass

    return {
        "status": "BUFFER_SYNCHRONIZED",
        "gateway_id": gateway_id,
        "synced_events": synced_count,
        "timestamp": str(utcnow())
    }
