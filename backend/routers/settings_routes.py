from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import SystemSetting, AuditLog, utcnow
from backend.auth import get_current_user, require_roles
from backend.schemas import SystemSettingOut, SystemSettingUpdate
from backend.firebase_admin import writeData

router = APIRouter(prefix="/settings", tags=["System Settings"])

@router.get("", response_model=list[SystemSettingOut])
def get_settings(db: Session = Depends(get_db)):
    defaults = [
        ("ALERT_ESCALATION_TIMEOUT_SECONDS", "45", "Time in seconds before unacknowledged critical alert escalates"),
        ("MQTT_KEEP_ALIVE_SECONDS", "30", "Heartbeat timeout for edge gateways"),
        ("AI_ANOMALY_SENSITIVITY", "0.65", "Threshold score for flagging multivariate anomaly"),
        ("AUTOMATED_EVACUATION_TRIGGER", "DISABLED", "Require human safety officer confirmation prior to plant siren"),
        ("STALE_DATA_TIMEOUT_SECONDS", "15", "Mark sensor reading as stale if no heartbeat received"),
    ]
    for key, val, desc in defaults:
        if not db.query(SystemSetting).filter(SystemSetting.key == key).first():
            db.add(SystemSetting(key=key, value=val, description=desc))
    db.commit()
    return db.query(SystemSetting).all()

@router.put("/{key}", response_model=SystemSettingOut)
def update_setting(
    key: str,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("SUPER_ADMIN", "PLANT_ADMIN"))
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=payload.value, description="Custom setting")
        db.add(setting)
    else:
        setting.value = payload.value
        setting.updated_at = utcnow()
    
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_SYSTEM_SETTING",
        entity_type="SETTING",
        entity_id=key,
        details=f"Modified setting {key} to '{payload.value}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(setting)

    # Sync setting to Firebase
    try:
        writeData(f"system_settings/{key}", {
            "key": key,
            "value": setting.value,
            "description": setting.description,
            "updated_at": setting.updated_at,
        })
    except Exception:
        pass

    return setting
