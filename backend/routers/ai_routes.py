import json
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import AIModelMetadata, AIAnomalyLog, Device, utcnow
from backend.schemas import AIModelOut, AIAnomalyOut
from backend.ai_engine import ai_engine

router = APIRouter(prefix="/ai", tags=["AI Intelligence and Explainability"])

@router.get("/models", response_model=list[AIModelOut])
def get_ai_models(db: Session = Depends(get_db)):
    return db.query(AIModelMetadata).all()

@router.get("/anomalies", response_model=list[AIAnomalyOut])
def list_ai_anomalies(limit: int = Query(default=30), db: Session = Depends(get_db)):
    return db.query(AIAnomalyLog).order_by(AIAnomalyLog.timestamp.desc()).limit(limit).all()

@router.post("/evaluate-fusion")
def evaluate_sensor_fusion(
    device_id: str = Body(..., embed=True),
    zone_id: int = Body(..., embed=True),
    metrics: dict = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Evaluates multi-sensor telemetry using Scikit-Learn Isolation Forest and Sensor Fusion matrix.
    Returns anomaly status, risk index, explainability reason codes, and confidence score.
    """
    is_anomaly, anomaly_score, risk_index, reason_codes = ai_engine.evaluate_telemetry_vector(metrics)

    # Persist anomaly log if flagged
    if is_anomaly:
        log_entry = AIAnomalyLog(
            device_id=device_id,
            zone_id=zone_id,
            timestamp=utcnow(),
            anomaly_score=anomaly_score,
            risk_index=risk_index,
            model_version=ai_engine.model_version,
            inputs_summary=json.dumps(metrics),
            reason_codes=json.dumps(reason_codes),
            confidence=0.94 if risk_index > 70 else 0.86,
            human_review_status="PENDING"
        )
        db.add(log_entry)
        db.commit()

    return {
        "device_id": device_id,
        "zone_id": zone_id,
        "is_anomaly": is_anomaly,
        "anomaly_score": anomaly_score,
        "fused_risk_index": risk_index,
        "model_version": ai_engine.model_version,
        "explainability": {
            "reason_codes": reason_codes,
            "primary_driver": reason_codes[0] if reason_codes else "NORMAL_PARAMETRIC_BOUNDS",
            "confidence": 0.94 if is_anomaly else 0.99
        },
        "timestamp": str(utcnow())
    }
