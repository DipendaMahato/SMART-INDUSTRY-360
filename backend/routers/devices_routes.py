from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Device, AuditLog, utcnow
from backend.schemas import DeviceOut, DeviceCreate
from backend.auth import get_current_user, require_roles
from backend.websocket_manager import ws_manager
from backend.firebase_admin import writeData

router = APIRouter(prefix="/devices", tags=["Sensors and IoT Devices"])

@router.get("", response_model=list[DeviceOut])
def list_devices(
    plant_id: int = Query(default=1),
    status: str = Query(default=None),
    device_type: str = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Device).filter(Device.plant_id == plant_id)
    if status:
        query = query.filter(Device.connection_status == status)
    if device_type:
        query = query.filter(Device.device_type == device_type)
    return query.all()

@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: str, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return dev

@router.post("", response_model=DeviceOut)
def register_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("SUPER_ADMIN", "PLANT_ADMIN"))
):
    existing = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device ID already registered")

    dev = Device(
        device_id=payload.device_id,
        plant_id=payload.plant_id,
        zone_id=payload.zone_id,
        name=payload.name,
        device_type=payload.device_type,
        ip_address=payload.ip_address,
        mac_address=payload.mac_address,
        firmware_version=payload.firmware_version,
        connection_status="ONLINE",
        last_seen_at=utcnow(),
        calibration_date=utcnow()
    )
    db.add(dev)
    
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="REGISTER_DEVICE",
        entity_type="DEVICE",
        entity_id=payload.device_id,
        details=f"Registered device {payload.name} ({payload.device_type})"
    )
    db.add(audit)
    db.commit()
    db.refresh(dev)

    # Sync new device to Firebase
    try:
        writeData(f"devices/{dev.device_id}", {
            "device_id": dev.device_id,
            "plant_id": dev.plant_id,
            "zone_id": dev.zone_id,
            "name": dev.name,
            "device_type": dev.device_type,
            "connection_status": dev.connection_status,
            "signal_strength_dbm": -65,
            "battery_percentage": 100,
            "firmware_version": dev.firmware_version or "v2.4.1",
            "ip_address": dev.ip_address,
            "mac_address": dev.mac_address,
            "last_seen_at": dev.last_seen_at,
            "is_simulated": False,
        })
    except Exception:
        pass

    return dev

@router.post("/{device_id}/command")
async def send_device_command(
    device_id: str,
    command: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("SUPER_ADMIN", "PLANT_ADMIN", "CONTROL_ROOM_OPERATOR"))
):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")

    allowed_commands = ["RECALIBRATE", "SELF_TEST", "REBOOT", "SIREN_ON", "SIREN_OFF"]
    if command not in allowed_commands:
        raise HTTPException(status_code=400, detail=f"Unsupported command. Allowed: {allowed_commands}")

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="DISPATCH_DEVICE_COMMAND",
        entity_type="DEVICE",
        entity_id=device_id,
        details=f"Issued command '{command}' to device {dev.name}"
    )
    db.add(audit)
    db.commit()

    await ws_manager.broadcast("DEVICE_COMMAND_DISPATCHED", {
        "device_id": device_id,
        "command": command,
        "operator": current_user.username
    })

    return {
        "status": "COMMAND_DISPATCHED",
        "device_id": device_id,
        "command": command,
        "timestamp": str(utcnow())
    }
