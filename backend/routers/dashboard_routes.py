import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import (
    Device, Incident, Notification, WorkOrder, Worker, GatewayHealth, Telemetry, Zone, utcnow
)
from backend.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(plant_id: int = Query(default=1), db: Session = Depends(get_db)):
    total_devices = db.query(Device).filter(Device.plant_id == plant_id).count()
    online_devices = db.query(Device).filter(Device.plant_id == plant_id, Device.connection_status == "ONLINE").count()
    degraded_devices = db.query(Device).filter(Device.plant_id == plant_id, Device.connection_status == "WARNING").count()
    critical_devices = db.query(Device).filter(Device.plant_id == plant_id, Device.connection_status == "CRITICAL").count()
    offline_devices = db.query(Device).filter(Device.plant_id == plant_id, Device.connection_status == "OFFLINE").count()

    active_critical_incidents = db.query(Incident).filter(
        Incident.plant_id == plant_id,
        Incident.severity == "CRITICAL",
        Incident.status.in_(["NEW", "ACKNOWLEDGED", "RESPONDING"])
    ).count()

    active_warnings = db.query(Incident).filter(
        Incident.plant_id == plant_id,
        Incident.severity.in_(["HIGH", "MEDIUM"]),
        Incident.status.in_(["NEW", "ACKNOWLEDGED", "RESPONDING"])
    ).count()

    open_work_orders = db.query(WorkOrder).filter(WorkOrder.status.in_(["OPEN", "IN_PROGRESS"])).count()
    workers_on_site = db.query(Worker).filter(Worker.is_on_site == True).count()
    
    unacknowledged_alerts = db.query(Notification).filter(
        Notification.delivery_status.in_(["SENT", "DELIVERED"]),
        Notification.acknowledged_at == None
    ).count()

    gateway = db.query(GatewayHealth).filter(GatewayHealth.plant_id == plant_id).first()
    gw_status = gateway.status if gateway else "HEALTHY"
    gw_ping = gateway.ping_latency_ms if gateway else 4.1

    # Recent 6 hours trend samples
    cutoff = utcnow() - datetime.timedelta(hours=6)
    recent_readings = db.query(Telemetry).filter(Telemetry.timestamp >= cutoff).order_by(Telemetry.timestamp.desc()).limit(40).all()

    # Zone hazard summary
    zones = db.query(Zone).filter(Zone.plant_id == plant_id).all()
    zone_hazard_counts = {"CLEAR": 0, "WARNING": 0, "EVACUATE": 0}
    for z in zones:
        zone_hazard_counts[z.hazard_status] = zone_hazard_counts.get(z.hazard_status, 0) + 1

    return {
        "timestamp": str(utcnow()),
        "plant_id": plant_id,
        "kpis": {
            "total_devices": total_devices,
            "online_devices": online_devices,
            "degraded_devices": degraded_devices,
            "critical_devices": critical_devices,
            "offline_devices": offline_devices,
            "active_critical_incidents": active_critical_incidents,
            "active_warnings": active_warnings,
            "open_work_orders": open_work_orders,
            "workers_on_site": workers_on_site,
            "unacknowledged_alerts": unacknowledged_alerts,
            "gateway_status": gw_status,
            "gateway_latency_ms": gw_ping,
            "overall_plant_safety_score": 98.4 if active_critical_incidents == 0 else max(50.0, 98.4 - (active_critical_incidents * 18.0)),
            "zones_clear": zone_hazard_counts["CLEAR"],
            "zones_warning": zone_hazard_counts["WARNING"],
            "zones_evacuate": zone_hazard_counts["EVACUATE"]
        },
        "recent_readings_sample": [
            {
                "metric_name": r.metric_name,
                "metric_value": r.metric_value,
                "unit": r.unit,
                "status": r.status,
                "timestamp": str(r.timestamp)
            } for r in recent_readings[:15]
        ]
    }

@router.get("/trends")
def get_dashboard_trends(metric: str = "temperature", db: Session = Depends(get_db)):
    readings = db.query(Telemetry).filter(Telemetry.metric_name == metric).order_by(Telemetry.timestamp.desc()).limit(30).all()
    # Reverse to chronological
    readings.reverse()
    return [
        {
            "time": r.timestamp.strftime("%H:%M:%S"),
            "value": r.metric_value,
            "device_id": r.device_id,
            "status": r.status,
            "is_simulated": r.is_simulated
        }
        for r in readings
    ]
