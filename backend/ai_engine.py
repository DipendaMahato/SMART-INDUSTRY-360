import numpy as np
from sklearn.ensemble import IsolationForest
import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger("smart_industry.ai")

class IndustrialAIEngine:
    def __init__(self):
        self.model_version = "v1.2.4-rf-iso"
        # Pre-fit a reference IsolationForest model on representative industrial baseline data
        np.random.seed(42)
        # Normal baseline features: [temperature (18-32), smoke_ppm (0-20), gas_ppm (0-40), vibration_rms (0.5-3.0), humidity (40-60)]
        baseline_normal = np.column_stack([
            np.random.normal(25.0, 3.0, 1000),    # Temp °C
            np.random.exponential(5.0, 1000),      # Smoke ppm
            np.random.exponential(12.0, 1000),     # Gas ppm
            np.random.normal(1.8, 0.4, 1000),      # Vibration RMS
            np.random.normal(50.0, 5.0, 1000)      # Humidity %
        ])
        self.iso_forest = IsolationForest(contamination=0.03, random_state=42)
        self.iso_forest.fit(baseline_normal)
        logger.info("Industrial AI Engine initialized with Isolation Forest baseline.")

    def evaluate_telemetry_vector(self, metrics: Dict[str, float]) -> Tuple[bool, float, float, List[str]]:
        """
        Takes raw or aggregated metrics and evaluates anomaly score, fusion risk index, and explainability reason codes.
        Returns: (is_anomaly, anomaly_score, risk_index, reason_codes)
        """
        temp = metrics.get("temperature", 24.0)
        smoke = metrics.get("smoke_ppm", 4.0)
        gas = metrics.get("combustible_gas", 10.0)
        vib = metrics.get("vibration_rms", 1.5)
        hum = metrics.get("humidity", 50.0)

        feature_vector = np.array([[temp, smoke, gas, vib, hum]])
        
        # Isolation Forest decision function: lower means more abnormal
        raw_score = float(self.iso_forest.decision_function(feature_vector)[0])
        # Normalized score: -0.5 (extreme anomaly) to +0.5 (very normal) -> mapped to [0, 1] anomaly likelihood
        anomaly_score = max(0.0, min(1.0, 0.5 - raw_score))
        
        reason_codes = []
        rule_risk = 0.0

        # Multi-sensor Fusion & Explainability Logic
        if temp > 60.0:
            reason_codes.append("THERMAL_CRITICAL_EXCEEDANCE")
            rule_risk += 40.0
        elif temp > 40.0:
            reason_codes.append("THERMAL_ELEVATION_WARNING")
            rule_risk += 20.0

        if smoke > 50.0:
            reason_codes.append("SMOKE_DENSITY_HIGH")
            rule_risk += 45.0
        elif smoke > 25.0:
            reason_codes.append("SMOKE_DENSITY_MODERATE")
            rule_risk += 20.0

        if gas > 150.0:
            reason_codes.append("COMBUSTIBLE_GAS_LEAK_CRITICAL")
            rule_risk += 50.0
        elif gas > 60.0:
            reason_codes.append("COMBUSTIBLE_GAS_ELEVATED")
            rule_risk += 25.0

        if vib > 6.0:
            reason_codes.append("VIBRATION_MECHANICAL_HARMONIC_SPIKE")
            rule_risk += 35.0
        elif vib > 3.8:
            reason_codes.append("VIBRATION_DEVIATION_ALERT")
            rule_risk += 15.0

        # Sensor Fusion cross-correlation bonus
        if temp > 45.0 and smoke > 30.0:
            reason_codes.append("THERMAL_AEROSOL_CONCOMITANT_SIGNATURE")
            rule_risk += 25.0

        if gas > 70.0 and temp > 40.0:
            reason_codes.append("COMBUSTION_PRECURSOR_FUSION_DETECTED")
            rule_risk += 30.0

        # Composite fused risk index (0 to 100)
        risk_index = min(100.0, (anomaly_score * 40.0) + (rule_risk * 0.6))
        is_anomaly = anomaly_score > 0.45 or risk_index > 50.0

        if not reason_codes and is_anomaly:
            reason_codes.append("MULTIVARIATE_DISTRIBUTION_OUTLIER")

        return is_anomaly, round(anomaly_score, 4), round(risk_index, 1), reason_codes

    def calculate_equipment_rul(self, hours_operated: float, vibration_rms: float, thermal_health: float) -> Tuple[int, float, str]:
        """
        Calculates Estimated Remaining Useful Life (RUL) in days, composite health score, and recommended action.
        """
        base_lifespan_hours = 12000.0
        aging_factor = max(0.1, 1.0 - (hours_operated / base_lifespan_hours))
        
        vib_penalty = max(0.0, (vibration_rms - 1.5) * 12.0)
        thermal_penalty = max(0.0, (100.0 - thermal_health) * 0.4)
        
        composite_health = max(10.0, min(100.0, (aging_factor * 60.0) + 40.0 - vib_penalty - thermal_penalty))
        
        # Estimate RUL in days based on health
        rul_days = int(max(3, (composite_health / 100.0) * 180))
        
        if composite_health < 40.0:
            recommendation = "IMMEDIATE_SHUTDOWN_INSPECTION_REQUIRED"
        elif composite_health < 70.0:
            recommendation = "SCHEDULE_BEARING_AND_SEAL_OVERHAUL"
        elif composite_health < 85.0:
            recommendation = "ROUTINE_PREDICTIVE_MONITORING"
        else:
            recommendation = "NORMAL_OPTIMAL_OPERATION"

        return rul_days, round(composite_health, 1), recommendation

ai_engine = IndustrialAIEngine()
