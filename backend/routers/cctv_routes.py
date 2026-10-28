from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import CameraSecurityEvent, Device, User, AuditLog, utcnow
from backend.schemas import CameraEventOut, CameraVerification
from backend.auth import get_current_user, require_roles
from backend.websocket_manager import ws_manager

router = APIRouter(prefix="/cctv", tags=["CCTV and Security"])

@router.get("/cameras")
def get_cameras(db: Session = Depends(get_db)):
    cams = db.query(Device).filter(Device.device_type == "CCTV_CAMERA").all()
    return [
        {
            "id": c.id,
            "camera_id": c.device_id,
            "name": c.name,
            "zone_id": c.zone_id,
            "status": c.connection_status,
            "ip_address": c.ip_address,
            "stream_url": f"rtsp://{c.ip_address}:554/live/stream1",
            "fps": 30,
            "resolution": "1080p Full HD"
        }
        for c in cams
    ]

@router.get("/events", response_model=list[CameraEventOut])
def list_cctv_events(status: str = Query(default=None), db: Session = Depends(get_db)):
    q = db.query(CameraSecurityEvent)
    if status:
        q = q.filter(CameraSecurityEvent.human_verification_status == status)
    return q.order_by(CameraSecurityEvent.timestamp.desc()).all()

@router.post("/events/{event_id}/verify", response_model=CameraEventOut)
async def verify_camera_event(
    event_id: int,
    payload: CameraVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "SAFETY_OFFICER", "SECURITY_PERSONNEL"))
):
    ev = db.query(CameraSecurityEvent).filter(CameraSecurityEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Security event not found")

    ev.human_verification_status = payload.status
    ev.reviewed_by_user_id = current_user.id
    ev.review_notes = payload.review_notes

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="VERIFY_CCTV_EVENT",
        entity_type="CCTV_EVENT",
        entity_id=str(ev.id),
        details=f"Classified event #{ev.id} ({ev.event_type}) as {payload.status}. Notes: {payload.review_notes or ''}"
    )
    db.add(audit)
    db.commit()
    db.refresh(ev)

    await ws_manager.broadcast("CCTV_EVENT_VERIFIED", {
        "event_id": ev.id,
        "status": ev.human_verification_status,
        "reviewed_by": current_user.username
    })

    return ev
