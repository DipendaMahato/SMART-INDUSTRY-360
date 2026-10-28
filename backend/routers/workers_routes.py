from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Worker, User, Incident, Zone, AuditLog, utcnow
from backend.schemas import WorkerOut, WorkerSOSRequest
from backend.auth import get_current_user
from backend.notifications_engine import notification_engine
from backend.websocket_manager import ws_manager
from backend.firebase_admin import writeData

router = APIRouter(prefix="/workers", tags=["Workers and Teams"])

@router.get("", response_model=list[WorkerOut])
def list_workers(on_site_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Worker)
    if on_site_only:
        q = q.filter(Worker.is_on_site == True)
    return q.all()

@router.post("/sos")
async def trigger_worker_sos(
    payload: WorkerSOSRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Worker Mobile Portal SOS Trigger.
    Creates a CRITICAL Worker SOS incident and broadcasts immediate plant-wide alerts.
    """
    zone = db.query(Zone).filter(Zone.id == payload.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    inc_count = db.query(Incident).count() + 1
    inc_number = f"INC-{utcnow().strftime('%Y%m%d')}-{inc_count:04d}"

    incident = Incident(
        incident_number=inc_number,
        plant_id=zone.plant_id,
        zone_id=zone.id,
        category="WORKER_SOS",
        severity="CRITICAL",
        detection_method="MANUAL_WORKER_SOS",
        title=f"WORKER DISTRESS SOS ACTIVATED - {current_user.full_name}",
        description=f"Emergency distress call initiated by worker {current_user.full_name} ({current_user.username}) in {zone.name}. {payload.description or ''}",
        status="NEW",
        assigned_team="Rapid Emergency Extraction & Medical Unit",
        created_at=utcnow(),
        is_simulated=False
    )
    db.add(incident)
    
    # Mark zone for response
    zone.hazard_status = "EVACUATE"

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="TRIGGER_WORKER_SOS",
        entity_type="INCIDENT",
        entity_id=inc_number,
        details=f"Worker {current_user.username} pressed mobile SOS distress button in Zone {zone.name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    # Dispatches immediate multi-channel alerts (SMS, Browser, Dashboard)
    await notification_engine.dispatch_incident_alerts(db, incident)

    await ws_manager.broadcast("INCIDENT_CREATED", {
        "id": incident.id,
        "incident_number": incident.incident_number,
        "title": incident.title,
        "severity": incident.severity,
        "status": incident.status,
        "zone_id": incident.zone_id,
        "is_sos": True
    })

    # Sync SOS incident to Firebase
    try:
        writeData(f"incidents/{incident.incident_number}", {
            "id": incident.id,
            "incident_number": incident.incident_number,
            "plant_id": zone.plant_id,
            "zone_id": zone.id,
            "category": "WORKER_SOS",
            "severity": "CRITICAL",
            "title": incident.title,
            "status": "NEW",
            "created_at": incident.created_at,
            "is_simulated": False,
        })
        writeData(f"zones/{zone.id}/hazard_status", "EVACUATE")
    except Exception:
        pass

    return {
        "status": "SOS_DISPATCHED",
        "incident_number": incident.incident_number,
        "zone_name": zone.name,
        "message": "Emergency extraction and medical rescue teams have been alerted."
    }

@router.post("/check-in")
def worker_checkin(
    zone_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        # Create worker profile if not existing
        worker = Worker(
            user_id=current_user.id,
            badge_number=f"BADGE-{current_user.id:04d}",
            department=current_user.department or "Operations",
            emergency_contact="+1-555-0199",
            certification_level="Standard Field Safety"
        )
        db.add(worker)

    worker.current_zone_id = zone_id
    worker.is_on_site = True
    worker.last_checkin_at = utcnow()
    worker.evacuated = False
    db.commit()
    db.refresh(worker)

    # Sync check-in to Firebase
    try:
        writeData(f"workers/{worker.badge_number}", {
            "id": worker.id,
            "badge_number": worker.badge_number,
            "user_id": current_user.id,
            "full_name": current_user.full_name,
            "department": worker.department,
            "current_zone_id": zone_id,
            "is_on_site": True,
            "last_checkin_at": worker.last_checkin_at,
            "evacuated": False,
            "heart_rate": worker.heart_rate,
            "body_temp": worker.body_temp,
        })
        writeData(f"zones/{zone_id}/current_occupancy", None)  # Will be recalculated
    except Exception:
        pass

    return {"status": "CHECKED_IN", "zone_id": zone_id, "badge": worker.badge_number}
