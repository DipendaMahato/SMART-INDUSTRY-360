from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Incident, User, AuditLog, Zone, utcnow
from backend.schemas import IncidentCreate, IncidentUpdate, IncidentOut
from backend.auth import get_current_user, require_roles
from backend.notifications_engine import notification_engine
from backend.websocket_manager import ws_manager
from backend.firebase_admin import writeData

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=list[IncidentOut])
def list_incidents(
    plant_id: int = Query(default=1),
    status: str = Query(default=None),
    severity: str = Query(default=None),
    category: str = Query(default=None),
    limit: int = Query(default=50),
    db: Session = Depends(get_db)
):
    query = db.query(Incident).filter(Incident.plant_id == plant_id)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if category:
        query = query.filter(Incident.category == category)
    return query.order_by(Incident.created_at.desc()).limit(limit).all()

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("", response_model=IncidentOut)
async def create_incident(
    inc_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc_count = db.query(Incident).count() + 1
    inc_number = f"INC-{utcnow().strftime('%Y%m%d')}-{inc_count:04d}"

    incident = Incident(
        incident_number=inc_number,
        plant_id=inc_in.plant_id,
        zone_id=inc_in.zone_id,
        device_id=inc_in.device_id,
        category=inc_in.category,
        severity=inc_in.severity,
        detection_method=inc_in.detection_method or "MANUAL_REPORT",
        title=inc_in.title,
        description=inc_in.description,
        status="NEW",
        assigned_team=inc_in.assigned_team or "Rapid Emergency Response Team Alpha",
        assigned_operator_id=current_user.id,
        created_at=utcnow(),
        is_simulated=False
    )
    db.add(incident)

    # Set zone hazard status if high or critical
    if inc_in.severity in ["HIGH", "CRITICAL"]:
        zone = db.query(Zone).filter(Zone.id == inc_in.zone_id).first()
        if zone:
            zone.hazard_status = "EVACUATE" if inc_in.severity == "CRITICAL" else "WARNING"

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_INCIDENT",
        entity_type="INCIDENT",
        entity_id=inc_number,
        details=f"Incident {inc_number} [{inc_in.severity}] created: {inc_in.title}"
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    # Dispatch alerts
    await notification_engine.dispatch_incident_alerts(db, incident)

    # Sync to Firebase
    try:
        writeData(f"incidents/{incident.incident_number}", {
            "id": incident.id,
            "incident_number": incident.incident_number,
            "plant_id": incident.plant_id,
            "zone_id": incident.zone_id,
            "device_id": incident.device_id,
            "category": incident.category,
            "severity": incident.severity,
            "detection_method": incident.detection_method,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status,
            "assigned_team": incident.assigned_team,
            "created_at": incident.created_at,
            "is_simulated": False,
        })
    except Exception:
        pass

    await ws_manager.broadcast("INCIDENT_CREATED", {
        "id": incident.id,
        "incident_number": incident.incident_number,
        "title": incident.title,
        "severity": incident.severity,
        "status": incident.status,
        "zone_id": incident.zone_id
    })

    return incident

@router.post("/{incident_id}/acknowledge", response_model=IncidentOut)
async def acknowledge_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    inc.status = "ACKNOWLEDGED"
    inc.acknowledged_at = utcnow()
    inc.assigned_operator_id = current_user.id

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="ACKNOWLEDGE_INCIDENT",
        entity_type="INCIDENT",
        entity_id=inc.incident_number,
        details=f"Incident #{inc.incident_number} acknowledged by {current_user.full_name} ({current_user.role})"
    )
    db.add(audit)
    db.commit()
    db.refresh(inc)

    # Sync status update to Firebase
    try:
        writeData(f"incidents/{inc.incident_number}/status", inc.status)
        writeData(f"incidents/{inc.incident_number}/acknowledged_at", inc.acknowledged_at)
        writeData(f"incidents/{inc.incident_number}/assigned_operator_id", current_user.id)
    except Exception:
        pass

    await ws_manager.broadcast("INCIDENT_UPDATED", {
        "id": inc.id,
        "incident_number": inc.incident_number,
        "status": inc.status,
        "acknowledged_by": current_user.username
    })
    return inc

@router.patch("/{incident_id}/transition", response_model=IncidentOut)
async def transition_incident_lifecycle(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "PLANT_ADMIN", "CONTROL_ROOM_OPERATOR", "SAFETY_OFFICER"))
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = inc.status
    now = utcnow()

    if payload.status:
        inc.status = payload.status
        if payload.status == "RESPONDING":
            inc.responding_at = now
        elif payload.status == "CONTAINED":
            inc.contained_at = now
        elif payload.status in ["RESOLVED", "CANCELLED", "FALSE_ALARM"]:
            inc.resolved_at = now
            # Reset zone hazard status if no other active critical incidents
            active_other = db.query(Incident).filter(
                Incident.zone_id == inc.zone_id,
                Incident.id != inc.id,
                Incident.status.in_(["NEW", "ACKNOWLEDGED", "RESPONDING"])
            ).count()
            if active_other == 0:
                zone = db.query(Zone).filter(Zone.id == inc.zone_id).first()
                if zone:
                    zone.hazard_status = "CLEAR"

    if payload.assigned_team:
        inc.assigned_team = payload.assigned_team
    if payload.resolution_notes:
        inc.resolution_notes = payload.resolution_notes

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action=f"TRANSITION_INCIDENT_{inc.status}",
        entity_type="INCIDENT",
        entity_id=inc.incident_number,
        details=f"Incident {inc.incident_number} transitioned from {old_status} to {inc.status}. Notes: {payload.resolution_notes or 'N/A'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(inc)

    # Sync transition to Firebase
    try:
        writeData(f"incidents/{inc.incident_number}/status", inc.status)
        if inc.resolved_at:
            writeData(f"incidents/{inc.incident_number}/resolved_at", inc.resolved_at)
        if inc.resolution_notes:
            writeData(f"incidents/{inc.incident_number}/resolution_notes", inc.resolution_notes)
        # Sync zone hazard status if cleared
        if inc.status in ["RESOLVED", "CANCELLED", "FALSE_ALARM"]:
            writeData(f"zones/{inc.zone_id}/hazard_status", "CLEAR")
    except Exception:
        pass

    await ws_manager.broadcast("INCIDENT_UPDATED", {
        "id": inc.id,
        "incident_number": inc.incident_number,
        "status": inc.status,
        "resolution_notes": inc.resolution_notes
    })
    return inc
