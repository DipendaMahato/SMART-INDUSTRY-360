from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import AuditLog
from backend.schemas import AuditLogOut

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    action: str = Query(default=None),
    entity_type: str = Query(default=None),
    limit: int = Query(default=50),
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    return q.order_by(AuditLog.timestamp.desc()).limit(limit).all()
