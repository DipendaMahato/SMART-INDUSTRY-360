export type UserRole =
  | 'SUPER_ADMIN'
  | 'PLANT_ADMIN'
  | 'CONTROL_ROOM_OPERATOR'
  | 'SAFETY_OFFICER'
  | 'SECURITY_PERSONNEL'
  | 'MAINTENANCE_ENGINEER'
  | 'WORKER'
  | 'READ_ONLY_AUDITOR';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  plant_id?: number;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Plant {
  id: number;
  name: string;
  code: string;
  location: string;
  timezone: string;
  is_active: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Zone {
  id: number;
  plant_id: number;
  name: string;
  code: string;
  floor_level: string;
  zone_type: string;
  max_occupancy: number;
  current_occupancy: number;
  boundary_polygon?: string;
  is_evacuation_route: boolean;
  hazard_status: 'CLEAR' | 'WARNING' | 'EVACUATE';
  created_at: string;
}

export interface Device {
  id: number;
  device_id: string;
  plant_id: number;
  zone_id: number;
  name: string;
  device_type: string;
  connection_status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'STALE' | 'UNKNOWN';
  signal_strength_dbm: number;
  battery_percentage: number;
  firmware_version: string;
  ip_address: string;
  mac_address: string;
  last_seen_at: string;
  calibration_date: string;
  is_simulated: boolean;
}

export interface Telemetry {
  id: number;
  device_id: string;
  zone_id: number;
  timestamp: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  quality_score: number;
  is_simulated: boolean;
}

export type IncidentStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'CONTAINED'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'FALSE_ALARM';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Incident {
  id: number;
  incident_number: string;
  plant_id: number;
  zone_id: number;
  device_id?: string;
  category: string;
  severity: IncidentSeverity;
  detection_method: string;
  title: string;
  description: string;
  status: IncidentStatus;
  assigned_team: string;
  assigned_operator_id?: number;
  created_at: string;
  acknowledged_at?: string;
  responding_at?: string;
  contained_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  is_simulated: boolean;
}

export interface NotificationAlert {
  id: number;
  incident_id?: number;
  alert_level: 'INFO' | 'WARNING' | 'CRITICAL' | 'EVACUATE';
  channel: string;
  recipient_group: string;
  recipient_user_id?: number;
  title: string;
  message: string;
  delivery_status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
  escalation_level: number;
  retry_count: number;
  last_attempt_at: string;
  acknowledged_at?: string;
  failure_reason?: string;
  created_at: string;
}

export interface Worker {
  id: number;
  user_id?: number;
  badge_number: string;
  department: string;
  emergency_contact: string;
  certification_level: string;
  current_zone_id?: number;
  is_on_site: boolean;
  last_checkin_at: string;
  evacuated: boolean;
  heart_rate: number;
  body_temp: number;
}

export interface Equipment {
  id: number;
  equipment_id: string;
  plant_id: number;
  zone_id: number;
  name: string;
  category: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNDER_MAINTENANCE' | 'CRITICAL_FAULT' | 'OFFLINE';
  health_score: number;
  vibration_health: number;
  thermal_health: number;
  hours_operated: number;
  last_service_date: string;
  next_service_date: string;
  mtbf_hours: number;
  mttr_hours: number;
  estimated_rul_days: number;
}

export interface WorkOrder {
  id: number;
  work_order_number: string;
  equipment_id: string;
  incident_id?: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_to_user_id?: number;
  created_at: string;
  scheduled_date: string;
  completed_at?: string;
  technician_notes?: string;
}

export interface AIModel {
  id: number;
  model_name: string;
  model_type: string;
  version: string;
  status: string;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  latency_ms: number;
  last_trained_at: string;
  trained_sample_count: number;
}

export interface AIAnomaly {
  id: number;
  device_id: string;
  zone_id: number;
  timestamp: string;
  anomaly_score: number;
  risk_index: number;
  model_version: string;
  inputs_summary?: string;
  reason_codes?: string;
  confidence: number;
  human_review_status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export interface CameraSecurityEvent {
  id: number;
  camera_id: string;
  camera_name: string;
  zone_id: number;
  event_type: string;
  confidence: number;
  timestamp: string;
  frame_snapshot_url?: string;
  human_verification_status: 'PENDING' | 'VERIFIED' | 'FALSE_ALARM';
  reviewed_by_user_id?: number;
  review_notes?: string;
}

export interface EvacuationPlan {
  id: number;
  plant_id: number;
  zone_id: number;
  primary_route_name: string;
  secondary_route_name: string;
  assembly_point_name: string;
  exit_door_id: string;
  is_blocked: boolean;
  blocked_reason?: string;
  last_drill_date: string;
}

export interface GatewayHealth {
  id: number;
  gateway_id: string;
  plant_id: number;
  name: string;
  ip_address: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  broker_connected: boolean;
  ping_latency_ms: number;
  packet_loss_percent: number;
  buffered_events_count: number;
  last_heartbeat_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address: string;
  timestamp: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface DashboardSummary {
  timestamp: string;
  plant_id: number;
  kpis: {
    total_devices: number;
    online_devices: number;
    degraded_devices: number;
    critical_devices: number;
    offline_devices: number;
    active_critical_incidents: number;
    active_warnings: number;
    open_work_orders: number;
    workers_on_site: number;
    unacknowledged_alerts: number;
    gateway_status: string;
    gateway_latency_ms: number;
    overall_plant_safety_score: number;
    zones_clear: number;
    zones_warning: number;
    zones_evacuate: number;
  };
  recent_readings_sample: Array<{
    metric_name: string;
    metric_value: number;
    unit: string;
    status: string;
    timestamp: string;
  }>;
}
