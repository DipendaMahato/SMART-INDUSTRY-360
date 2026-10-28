import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str
    plant_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str
    plant_id: Optional[int] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    full_name: str
    role: str
    plant_id: Optional[int] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

class PlantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    location: str
    timezone: str
    is_active: bool
    latitude: float
    longitude: float
    created_at: datetime.datetime

class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plant_id: int
    name: str
    code: str
    floor_level: str
    zone_type: str
    max_occupancy: int
    current_occupancy: int
    boundary_polygon: Optional[str] = None
    is_evacuation_route: bool
    hazard_status: str
    created_at: datetime.datetime

class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    device_id: str
    plant_id: int
    zone_id: int
    name: str
    device_type: str
    connection_status: str
    signal_strength_dbm: int
    battery_percentage: int
    firmware_version: str
    ip_address: str
    mac_address: str
    last_seen_at: datetime.datetime
    calibration_date: datetime.datetime
    is_simulated: bool

class DeviceCreate(BaseModel):
    device_id: str
    plant_id: int
    zone_id: int
    name: str
    device_type: str
    ip_address: Optional[str] = "192.168.1.150"
    mac_address: Optional[str] = "AA:BB:CC:11:22:33"
    firmware_version: Optional[str] = "v2.4.1"

class TelemetryIngest(BaseModel):
    device_id: str
    zone_id: int
    metric_name: str
    metric_value: float
    unit: str
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    quality_score: Optional[float] = 1.0
    timestamp: Optional[datetime.datetime] = None
    is_simulated: Optional[bool] = False

class TelemetryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    device_id: str
    zone_id: int
    timestamp: datetime.datetime
    metric_name: str
    metric_value: float
    unit: str
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    status: str
    quality_score: float
    is_simulated: bool

class IncidentCreate(BaseModel):
    plant_id: int
    zone_id: int
    device_id: Optional[str] = None
    category: str
    severity: str
    detection_method: Optional[str] = "MANUAL_REPORT"
    title: str
    description: str
    assigned_team: Optional[str] = "Rapid Emergency Response Team Alpha"

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_team: Optional[str] = None
    assigned_operator_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_number: str
    plant_id: int
    zone_id: int
    device_id: Optional[str] = None
    category: str
    severity: str
    detection_method: str
    title: str
    description: str
    status: str
    assigned_team: str
    assigned_operator_id: Optional[int] = None
    created_at: datetime.datetime
    acknowledged_at: Optional[datetime.datetime] = None
    responding_at: Optional[datetime.datetime] = None
    contained_at: Optional[datetime.datetime] = None
    resolved_at: Optional[datetime.datetime] = None
    resolution_notes: Optional[str] = None
    is_simulated: bool

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_id: Optional[int] = None
    alert_level: str
    channel: str
    recipient_group: str
    recipient_user_id: Optional[int] = None
    title: str
    message: str
    delivery_status: str
    escalation_level: int
    retry_count: int
    last_attempt_at: datetime.datetime
    acknowledged_at: Optional[datetime.datetime] = None
    failure_reason: Optional[str] = None
    created_at: datetime.datetime

class AlertAcknowledge(BaseModel):
    notes: Optional[str] = "Acknowledged by operator"

class WorkerSOSRequest(BaseModel):
    zone_id: int
    incident_type: str = "WORKER_SOS"
    description: Optional[str] = "Worker activated SOS emergency distress signal"

class WorkerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    badge_number: str
    department: str
    emergency_contact: str
    certification_level: str
    current_zone_id: Optional[int] = None
    is_on_site: bool
    last_checkin_at: datetime.datetime
    evacuated: bool
    heart_rate: int
    body_temp: float

class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    equipment_id: str
    plant_id: int
    zone_id: int
    name: str
    category: str
    status: str
    health_score: float
    vibration_health: float
    thermal_health: float
    hours_operated: float
    last_service_date: datetime.datetime
    next_service_date: datetime.datetime
    mtbf_hours: float
    mttr_hours: float
    estimated_rul_days: int

class WorkOrderCreate(BaseModel):
    equipment_id: str
    incident_id: Optional[int] = None
    title: str
    description: str
    priority: str = "MEDIUM"
    assigned_to_user_id: Optional[int] = None
    scheduled_date: Optional[datetime.datetime] = None

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    technician_notes: Optional[str] = None
    completed_at: Optional[datetime.datetime] = None

class WorkOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    work_order_number: str
    equipment_id: str
    incident_id: Optional[int] = None
    title: str
    description: str
    priority: str
    status: str
    assigned_to_user_id: Optional[int] = None
    created_at: datetime.datetime
    scheduled_date: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    technician_notes: Optional[str] = None

class AIModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    model_name: str
    model_type: str
    version: str
    status: str
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    latency_ms: float
    last_trained_at: datetime.datetime
    trained_sample_count: int

class AIAnomalyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    device_id: str
    zone_id: int
    timestamp: datetime.datetime
    anomaly_score: float
    risk_index: float
    model_version: str
    inputs_summary: Optional[str] = None
    reason_codes: Optional[str] = None
    confidence: float
    human_review_status: str

class CameraEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    camera_id: str
    camera_name: str
    zone_id: int
    event_type: str
    confidence: float
    timestamp: datetime.datetime
    frame_snapshot_url: Optional[str] = None
    human_verification_status: str
    reviewed_by_user_id: Optional[int] = None
    review_notes: Optional[str] = None

class CameraVerification(BaseModel):
    status: str # VERIFIED, FALSE_ALARM
    review_notes: Optional[str] = None

class EvacuationPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plant_id: int
    zone_id: int
    primary_route_name: str
    secondary_route_name: str
    assembly_point_name: str
    exit_door_id: str
    is_blocked: bool
    blocked_reason: Optional[str] = None
    last_drill_date: datetime.datetime

class GatewayHealthOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    gateway_id: str
    plant_id: int
    name: str
    ip_address: str
    status: str
    broker_connected: bool
    ping_latency_ms: float
    packet_loss_percent: float
    buffered_events_count: int
    last_heartbeat_at: datetime.datetime

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    username: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: str
    timestamp: datetime.datetime

class SystemSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime.datetime

class SystemSettingUpdate(BaseModel):
    value: str

class SimulationInjectPayload(BaseModel):
    plant_id: int = 1
    zone_id: int = 2
    scenario_type: str # GAS_LEAK, THERMAL_RUNAWAY, VIBRATION_SPIKE, WORKER_SOS, GATEWAY_DROP, RECONNECT_SYNC
    severity: str = "CRITICAL"
    notes: Optional[str] = "Triggered from Industrial Command Simulator Drawer"
