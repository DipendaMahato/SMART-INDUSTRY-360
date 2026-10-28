import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # SUPER_ADMIN, PLANT_ADMIN, CONTROL_ROOM_OPERATOR, SAFETY_OFFICER, SECURITY_PERSONNEL, MAINTENANCE_ENGINEER, WORKER, READ_ONLY_AUDITOR
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)
    phone = Column(String(30), nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

class Plant(Base):
    __tablename__ = "plants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    location = Column(String(200), nullable=False)
    timezone = Column(String(50), default="UTC")
    is_active = Column(Boolean, default=True)
    latitude = Column(Float, default=42.3314)
    longitude = Column(Float, default=-83.0458)
    created_at = Column(DateTime, default=utcnow)

    zones = relationship("Zone", back_populates="plant", cascade="all, delete-orphan")

class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(30), nullable=False)
    floor_level = Column(String(20), default="Floor 1")
    zone_type = Column(String(50), default="PRODUCTION") # PRODUCTION, CHEMICAL_STORAGE, ASSEMBLY, WAREHOUSE, CONTROL_ROOM, HIGH_VOLTAGE
    max_occupancy = Column(Integer, default=50)
    current_occupancy = Column(Integer, default=0)
    boundary_polygon = Column(Text, nullable=True) # JSON coordinates [[x,y],...]
    is_evacuation_route = Column(Boolean, default=True)
    hazard_status = Column(String(30), default="CLEAR") # CLEAR, WARNING, EVACUATE
    created_at = Column(DateTime, default=utcnow)

    plant = relationship("Plant", back_populates="zones")
    devices = relationship("Device", back_populates="zone")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False) # ENVIRONMENTAL_STATION, GAS_DETECTOR, VIBRATION_SENSOR, THERMAL_IMAGER, PHYSICAL_SOS, EDGE_GATEWAY, CCTV_CAMERA
    connection_status = Column(String(30), default="ONLINE") # ONLINE, WARNING, CRITICAL, OFFLINE, STALE, UNKNOWN
    signal_strength_dbm = Column(Integer, default=-65)
    battery_percentage = Column(Integer, default=95)
    firmware_version = Column(String(30), default="v2.4.1")
    ip_address = Column(String(50), default="192.168.1.100")
    mac_address = Column(String(30), default="AA:BB:CC:DD:EE:01")
    last_seen_at = Column(DateTime, default=utcnow)
    calibration_date = Column(DateTime, default=utcnow)
    is_simulated = Column(Boolean, default=True)

    zone = relationship("Zone", back_populates="devices")
    telemetry_logs = relationship("Telemetry", back_populates="device", cascade="all, delete-orphan")

class Telemetry(Base):
    __tablename__ = "telemetry"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), ForeignKey("devices.device_id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    metric_name = Column(String(50), nullable=False, index=True) # temperature, smoke_ppm, combustible_gas, co2_ppm, humidity, vibration_rms, noise_db
    metric_value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False) # °C, ppm, %, mm/s, dB
    min_threshold = Column(Float, nullable=True)
    max_threshold = Column(Float, nullable=True)
    status = Column(String(20), default="NORMAL") # NORMAL, WARNING, CRITICAL
    quality_score = Column(Float, default=1.0) # 0.0 - 1.0 sensor data freshness/fidelity
    is_simulated = Column(Boolean, default=True)

    device = relationship("Device", back_populates="telemetry_logs")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(30), unique=True, index=True, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    device_id = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False) # FIRE_SMOKE, HAZARDOUS_GAS, ABNORMAL_TEMPERATURE, EQUIPMENT_ELECTRICAL_FAULT, WORKER_SOS, RESTRICTED_ZONE_BREACH, WORKER_FALL_INJURY, DEVICE_COMMUNICATION_FAILURE, MANUAL_REPORT
    severity = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    detection_method = Column(String(50), default="AUTOMATED_RULE") # AUTOMATED_RULE, SENSOR_FUSION, AI_ANOMALY, MANUAL_WORKER_SOS, CCTV_INFERENCE
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="NEW") # NEW, ACKNOWLEDGED, RESPONDING, CONTAINED, RESOLVED, CANCELLED, FALSE_ALARM
    assigned_team = Column(String(100), default="Rapid Emergency Response Team Alpha")
    assigned_operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    responding_at = Column(DateTime, nullable=True)
    contained_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True, index=True)
    alert_level = Column(String(20), default="CRITICAL") # INFO, WARNING, CRITICAL, EVACUATE
    channel = Column(String(30), default="DASHBOARD") # IN_APP, DASHBOARD, BROWSER, SMS, EMAIL
    recipient_group = Column(String(50), default="SAFETY_OFFICERS") # ALL_WORKERS, SAFETY_OFFICERS, CONTROL_ROOM, SECURITY, MAINTENANCE
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    delivery_status = Column(String(30), default="QUEUED") # QUEUED, SENT, DELIVERED, ACKNOWLEDGED, FAILED
    escalation_level = Column(Integer, default=1) # 1: First Response, 2: Supervisor, 3: Plant Director
    retry_count = Column(Integer, default=0)
    last_attempt_at = Column(DateTime, default=utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    failure_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)

class Worker(Base):
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    badge_number = Column(String(30), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False)
    emergency_contact = Column(String(100), nullable=False)
    certification_level = Column(String(50), default="Certified HazMat Level 2")
    current_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    is_on_site = Column(Boolean, default=True)
    last_checkin_at = Column(DateTime, default=utcnow)
    evacuated = Column(Boolean, default=False)
    heart_rate = Column(Integer, default=74)
    body_temp = Column(Float, default=36.7)

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), unique=True, index=True, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # CNC_MACHINE, BOILER, COMPRESSOR, CONVEYOR, TRANSFORMER, PUMP, VENTILATION_FAN
    status = Column(String(30), default="OPERATIONAL") # OPERATIONAL, DEGRADED, UNDER_MAINTENANCE, CRITICAL_FAULT, OFFLINE
    health_score = Column(Float, default=94.5) # 0 - 100%
    vibration_health = Column(Float, default=96.0)
    thermal_health = Column(Float, default=93.0)
    hours_operated = Column(Float, default=4320.0)
    last_service_date = Column(DateTime, default=utcnow)
    next_service_date = Column(DateTime, default=utcnow)
    mtbf_hours = Column(Float, default=720.0) # Mean Time Between Failures
    mttr_hours = Column(Float, default=2.4)   # Mean Time to Repair
    estimated_rul_days = Column(Integer, default=85) # Remaining Useful Life

class WorkOrder(Base):
    __tablename__ = "work_orders"
    id = Column(Integer, primary_key=True, index=True)
    work_order_number = Column(String(30), unique=True, index=True, nullable=False)
    equipment_id = Column(String(50), ForeignKey("equipment.equipment_id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(30), default="OPEN") # OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    scheduled_date = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
    technician_notes = Column(Text, nullable=True)

class AIModelMetadata(Base):
    __tablename__ = "ai_models"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False) # ISOLATION_FOREST, AUTOENCODER, MULTISENSOR_FUSION, RUL_REGRESSOR, PPE_VISION
    version = Column(String(30), default="v1.2.0")
    status = Column(String(30), default="ACTIVE")
    precision = Column(Float, default=0.962)
    recall = Column(Float, default=0.948)
    f1_score = Column(Float, default=0.955)
    false_positive_rate = Column(Float, default=0.032)
    latency_ms = Column(Float, default=14.2)
    last_trained_at = Column(DateTime, default=utcnow)
    trained_sample_count = Column(Integer, default=125000)

class AIAnomalyLog(Base):
    __tablename__ = "ai_anomalies"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), nullable=False)
    zone_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=utcnow, index=True)
    anomaly_score = Column(Float, nullable=False) # -1.0 to 1.0 or raw probability
    risk_index = Column(Float, nullable=False) # 0 to 100
    model_version = Column(String(30), default="v1.2.0")
    inputs_summary = Column(Text, nullable=True)
    reason_codes = Column(Text, nullable=True) # JSON list e.g. ["THERMAL_GRADIENT_SPIKE", "GAS_CROSS_CORRELATION"]
    confidence = Column(Float, default=0.94)
    human_review_status = Column(String(30), default="PENDING") # PENDING, CONFIRMED, REJECTED

class CameraSecurityEvent(Base):
    __tablename__ = "camera_security_events"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), nullable=False)
    camera_name = Column(String(100), nullable=False)
    zone_id = Column(Integer, nullable=False)
    event_type = Column(String(50), nullable=False) # RESTRICTED_ZONE_ENTRY, MISSING_PPE, SUSPICIOUS_MOTION, WORKER_FALL
    confidence = Column(Float, default=0.91)
    timestamp = Column(DateTime, default=utcnow, index=True)
    frame_snapshot_url = Column(String(255), nullable=True)
    human_verification_status = Column(String(30), default="PENDING") # PENDING, VERIFIED, FALSE_ALARM
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)

class EvacuationPlan(Base):
    __tablename__ = "evacuation_plans"
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    primary_route_name = Column(String(100), nullable=False)
    secondary_route_name = Column(String(100), nullable=False)
    assembly_point_name = Column(String(100), nullable=False) # Assembly Point North, Muster Point B
    exit_door_id = Column(String(50), nullable=False)
    is_blocked = Column(Boolean, default=False)
    blocked_reason = Column(String(200), nullable=True)
    last_drill_date = Column(DateTime, default=utcnow)

class GatewayHealth(Base):
    __tablename__ = "gateway_health"
    id = Column(Integer, primary_key=True, index=True)
    gateway_id = Column(String(50), unique=True, index=True, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    ip_address = Column(String(50), default="10.0.1.15")
    status = Column(String(30), default="HEALTHY") # HEALTHY, DEGRADED, OFFLINE
    broker_connected = Column(Boolean, default=True)
    ping_latency_ms = Column(Float, default=4.2)
    packet_loss_percent = Column(Float, default=0.0)
    buffered_events_count = Column(Integer, default=0)
    last_heartbeat_at = Column(DateTime, default=utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False) # USER_LOGIN, ACKNOWLEDGE_ALERT, OVERRIDE_ZONE_ALARM, DISPATCH_TEAM, RECONFIGURE_LIMITS
    entity_type = Column(String(50), nullable=False) # INCIDENT, DEVICE, NOTIFICATION, USER, SETTING
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=utcnow, index=True)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=utcnow)
