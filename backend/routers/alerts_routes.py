from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Notification, User, utcnow
from backend.schemas import NotificationOut, AlertAcknowledge
from backend.auth import get_current_user
from backend.notifications_engine import notification_engine
from backend.websocket_manager import ws_manager

router = APIRouter(prefix="/alerts", tags=["Alerts and Notifications"])

@router.get("", response_model=list[NotificationOut])
def list_alerts(
    delivery_status: str = Query(default=None),
    alert_level: str = Query(default=None),
    limit: int = Query(default=50),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if delivery_status:
        query = query.filter(Notification.delivery_status == delivery_status)
    if alert_level:
        query = query.filter(Notification.alert_level == alert_level)
    return query.order_by(Notification.created_at.desc()).limit(limit).all()

@router.post("/{alert_id}/acknowledge", response_model=NotificationOut)
async def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledge,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = await notification_engine.acknowledge_alert(db, alert_id, current_user, payload.notes)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.post("/{alert_id}/retry", response_model=NotificationOut)
async def retry_alert(alert_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == alert_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.retry_count += 1
    notif.last_attempt_at = utcnow()
    notif.delivery_status = "DELIVERED"
    db.commit()
    db.refresh(notif)
    
    await ws_manager.broadcast("ALERT_RETRIED", {
        "id": notif.id,
        "retry_count": notif.retry_count,
        "delivery_status": notif.delivery_status
    })
    return notif

@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db)):
    total = db.query(Notification).count()
    delivered = db.query(Notification).filter(Notification.delivery_status.in_(["DELIVERED", "SENT"])).count()
    acknowledged = db.query(Notification).filter(Notification.delivery_status == "ACKNOWLEDGED").count()
    failed = db.query(Notification).filter(Notification.delivery_status == "FAILED").count()
    escalated = db.query(Notification).filter(Notification.escalation_level > 1).count()

    return {
        "total_alerts": total,
        "delivered": delivered,
        "acknowledged": acknowledged,
        "failed": failed,
        "escalated": escalated,
        "delivery_rate_percent": round((delivered + acknowledged) / max(1, total) * 100, 1)
    }
