const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (creds: { username: string; password: string }) =>
    request<{ access_token: string; role: string; username: string; full_name: string; plant_id?: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds),
    }),
  getMe: () => request<any>('/auth/me'),
  getUsers: () => request<any[]>('/auth/users'),
  createUser: (user: any) => request<any>('/auth/users', { method: 'POST', body: JSON.stringify(user) }),

  // Dashboard
  getDashboardSummary: (plantId = 1) => request<any>(`/dashboard/summary?plant_id=${plantId}`),
  getDashboardTrends: (metric = 'temperature') => request<any[]>(`/dashboard/trends?metric=${metric}`),

  // Telemetry
  getRecentTelemetry: (limit = 50) => request<any[]>(`/telemetry/recent?limit=${limit}`),
  getDeviceTelemetry: (deviceId: string) => request<any[]>(`/telemetry/device/${deviceId}`),

  // Incidents
  getIncidents: (plantId = 1, status?: string) =>
    request<any[]>(`/incidents?plant_id=${plantId}${status ? `&status=${status}` : ''}`),
  getIncident: (id: number) => request<any>(`/incidents/${id}`),
  createIncident: (incident: any) => request<any>('/incidents', { method: 'POST', body: JSON.stringify(incident) }),
  acknowledgeIncident: (id: number) => request<any>(`/incidents/${id}/acknowledge`, { method: 'POST' }),
  transitionIncident: (id: number, payload: { status?: string; resolution_notes?: string; assigned_team?: string }) =>
    request<any>(`/incidents/${id}/transition`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Alerts
  getAlerts: () => request<any[]>('/alerts'),
  acknowledgeAlert: (id: number, notes?: string) =>
    request<any>(`/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ notes }) }),
  retryAlert: (id: number) => request<any>(`/alerts/${id}/retry`, { method: 'POST' }),
  getAlertStats: () => request<any>('/alerts/stats'),

  // Digital Twin
  getPlants: () => request<any[]>('/digital-twin/plants'),
  getZones: (plantId = 1) => request<any[]>(`/digital-twin/zones?plant_id=${plantId}`),
  getPlantLayout: (plantId = 1) => request<any>(`/digital-twin/plant/${plantId}/layout`),

  // Devices
  getDevices: (plantId = 1) => request<any[]>(`/devices?plant_id=${plantId}`),
  registerDevice: (device: any) => request<any>('/devices', { method: 'POST', body: JSON.stringify(device) }),
  sendDeviceCommand: (deviceId: string, command: string) =>
    request<any>(`/devices/${deviceId}/command`, { method: 'POST', body: JSON.stringify({ command }) }),

  // Workers
  getWorkers: () => request<any[]>('/workers'),
  triggerWorkerSOS: (zoneId: number, description?: string) =>
    request<any>('/workers/sos', { method: 'POST', body: JSON.stringify({ zone_id: zoneId, description }) }),
  workerCheckin: (zoneId: number) => request<any>(`/workers/check-in?zone_id=${zoneId}`, { method: 'POST' }),

  // Equipment
  getEquipment: (plantId = 1) => request<any[]>(`/equipment?plant_id=${plantId}`),
  getWorkOrders: () => request<any[]>('/equipment/work-orders/all'),
  createWorkOrder: (wo: any) => request<any>('/equipment/work-orders', { method: 'POST', body: JSON.stringify(wo) }),
  updateWorkOrder: (id: number, update: any) =>
    request<any>(`/equipment/work-orders/${id}`, { method: 'PATCH', body: JSON.stringify(update) }),

  // AI
  getAIModels: () => request<any[]>('/ai/models'),
  getAIAnomalies: () => request<any[]>('/ai/anomalies'),
  evaluateFusion: (deviceId: string, zoneId: number, metrics: any) =>
    request<any>('/ai/evaluate-fusion', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, zone_id: zoneId, metrics }),
    }),

  // CCTV
  getCameras: () => request<any[]>('/cctv/cameras'),
  getCCTVEvents: () => request<any[]>('/cctv/events'),
  verifyCCTVEvent: (id: number, status: string, notes?: string) =>
    request<any>(`/cctv/events/${id}/verify`, { method: 'POST', body: JSON.stringify({ status, review_notes: notes }) }),

  // Evacuation
  getEvacuationPlans: (plantId = 1) => request<any[]>(`/evacuation/plans?plant_id=${plantId}`),
  toggleRouteBlock: (planId: number, blocked: boolean, reason?: string) =>
    request<any>(`/evacuation/plans/${planId}/toggle-block`, {
      method: 'POST',
      body: JSON.stringify({ blocked, reason }),
    }),
  simulateDrill: (plantId = 1) => request<any>(`/evacuation/simulate-drill?plant_id=${plantId}`, { method: 'POST' }),

  // Gateways
  getGateways: (plantId = 1) => request<any[]>(`/gateways?plant_id=${plantId}`),
  syncGatewayBuffer: (gatewayId: string, events: any[]) =>
    request<any>(`/gateways/${gatewayId}/sync-buffer`, {
      method: 'POST',
      body: JSON.stringify({ buffered_events: events }),
    }),

  // Reports
  getReportMetrics: (plantId = 1) => request<any>(`/reports/metrics?plant_id=${plantId}`),
  getExportUrl: (plantId = 1) => `${API_BASE}/reports/export/incidents.csv?plant_id=${plantId}`,

  // Audit
  getAuditLogs: () => request<any[]>('/audit'),

  // Settings
  getSettings: () => request<any[]>('/settings'),
  updateSetting: (key: string, value: string) =>
    request<any>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  // Simulator
  injectSimulation: (scenarioType: string, zoneId = 2, plantId = 1, severity = 'CRITICAL') =>
    request<any>('/simulator/inject', {
      method: 'POST',
      body: JSON.stringify({ scenario_type: scenarioType, zone_id: zoneId, plant_id: plantId, severity }),
    }),
  resetSimulation: () => request<any>('/simulator/reset', { method: 'POST' }),
};
