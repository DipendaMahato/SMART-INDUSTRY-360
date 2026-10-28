from fastapi import APIRouter, Depends, HTTPException, Query
from backend.firebase_admin import writeData, pushData
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Equipment, WorkOrder, User, AuditLog, utcnow
from backend.schemas import EquipmentOut, WorkOrderOut, WorkOrderCreate, WorkOrderUpdate
from backend.auth import get_current_user, require_roles
from backend.ai_engine import ai_engine

router = APIRouter(prefix="/equipment", tags=["Equipment and Predictive Maintenance"])

@router.get("", response_model=list[EquipmentOut])
def list_equipment(plant_id: int = Query(default=1), db: Session = Depends(get_db)):
    return db.query(Equipment).filter(Equipment.plant_id == plant_id).all()

@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment_detail(equipment_id: str, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return eq

@router.get("/work-orders/all", response_model=list[WorkOrderOut])
def list_work_orders(status: str = Query(default=None), db: Session = Depends(get_db)):
    q = db.query(WorkOrder)
    if status:
        q = q.filter(WorkOrder.status == status)
    return q.order_by(WorkOrder.created_at.desc()).all()

@router.post("/work-orders", response_model=WorkOrderOut)
def create_work_order(
    payload: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(WorkOrder).count() + 1
    wo_num = f"WO-{utcnow().strftime('%Y')}-{count:04d}"

    wo = WorkOrder(
        work_order_number=wo_num,
        equipment_id=payload.equipment_id,
        incident_id=payload.incident_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="OPEN",
        assigned_to_user_id=payload.assigned_to_user_id or current_user.id,
        created_at=utcnow(),
        scheduled_date=payload.scheduled_date or utcnow()
    )
    db.add(wo)
    
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_WORK_ORDER",
        entity_type="WORK_ORDER",
        entity_id=wo_num,
        details=f"Created work order {wo_num} for equipment {payload.equipment_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(wo)
    # Push newly created work order to Firebase Realtime Database
    try:
        pushData("work_orders", {
            "id": wo.id,
            "work_order_number": wo.work_order_number,
            "equipment_id": wo.equipment_id,
            "incident_id": wo.incident_id,
            "title": wo.title,
            "description": wo.description,
            "priority": wo.priority,
            "status": wo.status,
            "assigned_to_user_id": wo.assigned_to_user_id,
            "created_at": wo.created_at,
            "scheduled_date": wo.scheduled_date,
        })
    except Exception as e:
        pass  # Firebase sync is best-effort; failure is already logged in firebase_admin
    return wo

@router.patch("/work-orders/{work_order_id}", response_model=WorkOrderOut)
def update_work_order(
    work_order_id: int,
    payload: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    if payload.status:
        wo.status = payload.status
        if payload.status == "COMPLETED":
            wo.completed_at = utcnow()
    if payload.technician_notes:
        wo.technician_notes = payload.technician_notes

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_WORK_ORDER",
        entity_type="WORK_ORDER",
        entity_id=wo.work_order_number,
        details=f"Updated status to {wo.status}. Notes: {payload.technician_notes or ''}"
    )
    db.add(audit)
    db.commit()
    db.refresh(wo)
    # Update work order status in Firebase Realtime Database
    try:
        writeData(f"work_orders/{wo.work_order_number}", {
            "status": wo.status,
            "technician_notes": wo.technician_notes,
            "completed_at": wo.completed_at,
        })
    except Exception as e:
        pass  # Firebase sync is best-effort; failure is already logged in firebase_admin
    return wo
