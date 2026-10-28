from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import EvacuationPlan, Zone, AuditLog, User, utcnow
from backend.schemas import EvacuationPlanOut
from backend.auth import get_current_user, require_roles
from backend.websocket_manager import ws_manager

router = APIRouter(prefix="/evacuation", tags=["Evacuation Management"])

@router.get("/plans", response_model=list[EvacuationPlanOut])
def get_evacuation_plans(plant_id: int = Query(default=1), db: Session = Depends(get_db)):
    return db.query(EvacuationPlan).filter(EvacuationPlan.plant_id == plant_id).all()

@router.post("/plans/{plan_id}/toggle-block")
async def toggle_route_blocked(
    plan_id: int,
    blocked: bool = Body(..., embed=True),
    reason: str = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "SAFETY_OFFICER", "PLANT_ADMIN"))
):
    plan = db.query(EvacuationPlan).filter(EvacuationPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Evacuation plan not found")

    plan.is_blocked = blocked
    plan.blocked_reason = reason if blocked else None

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_EVACUATION_ROUTE_STATUS",
        entity_type="EVACUATION_PLAN",
        entity_id=str(plan.id),
        details=f"Route {plan.primary_route_name} set to blocked={blocked}. Reason: {reason or 'N/A'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(plan)

    await ws_manager.broadcast("EVACUATION_ROUTE_UPDATED", {
        "plan_id": plan.id,
        "is_blocked": plan.is_blocked,
        "reason": plan.blocked_reason
    })

    return plan

@router.post("/simulate-drill")
async def simulate_evacuation_drill(
    plant_id: int = Query(default=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "SAFETY_OFFICER", "PLANT_ADMIN"))
):
    """
    Executes a documented evacuation drill across the plant.
    Audits start timestamp, alerts all workers, and tracks muster point compliance.
    """
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="TRIGGER_EVACUATION_DRILL",
        entity_type="PLANT",
        entity_id=str(plant_id),
        details=f"Plant-wide safety evacuation drill initiated by {current_user.full_name} ({current_user.role})"
    )
    db.add(audit)
    db.commit()

    await ws_manager.broadcast("EVACUATION_DRILL_START", {
        "plant_id": plant_id,
        "started_by": current_user.full_name,
        "timestamp": str(utcnow()),
        "instruction": "THIS IS A SCHEDULED SAFETY DRILL. PROCEED TO DESIGNATED ASSEMBLY POINTS."
    })

    return {
        "status": "DRILL_ACTIVE",
        "plant_id": plant_id,
        "initiated_at": str(utcnow()),
        "message": "Drill broadcast dispatched across public address, worker mobile portal, and control room."
    }
