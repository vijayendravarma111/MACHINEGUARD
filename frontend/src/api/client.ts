import {
  DashboardSummary,
  Machine,
  SensorReading,
  Alert,
  MaintenanceRecord,
  SystemHealth,
  SimulationStepResponse
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export const api = {
  // System
  getSystemHealth: () => fetchJson<SystemHealth>('/system/health'),
  getDashboardSummary: () => fetchJson<DashboardSummary>('/dashboard/summary'),
  
  // Machines
  getMachines: () => fetchJson<Machine[]>('/machines'),
  getMachine: (id: string) => fetchJson<Machine>(`/machines/${id}`),
  getMachineReadings: (id: string, limit = 50) => fetchJson<SensorReading[]>(`/machines/${id}/readings?limit=${limit}`),
  getMachineHealth: (id: string) => fetchJson<any>(`/machines/${id}/health`),
  getMachineDiagnosis: (id: string) => fetchJson<any>(`/machines/${id}/diagnosis`),
  getMachineAlerts: (id: string) => fetchJson<Alert[]>(`/machines/${id}/alerts`),
  getMachineMaintenance: (id: string) => fetchJson<MaintenanceRecord[]>(`/machines/${id}/maintenance`),
  
  // Simulation Controls
  startSimulation: (machine_id: string, scenario: string, speed_multiplier = 1.0) => 
    fetchJson<any>('/simulation/start', {
      method: 'POST',
      body: JSON.stringify({ machine_id, scenario, speed_multiplier })
    }),
  stopSimulation: (machine_id: string) =>
    fetchJson<any>(`/simulation/stop?machine_id=${machine_id}`, { method: 'POST' }),
  injectFault: (machine_id: string, fault_type: string) =>
    fetchJson<any>('/simulation/fault', {
      method: 'POST',
      body: JSON.stringify({ machine_id, fault_type })
    }),
  resetSimulation: (machine_id: string) =>
    fetchJson<any>(`/simulation/reset?machine_id=${machine_id}`, { method: 'POST' }),
  stepSimulation: (machine_id: string) =>
    fetchJson<SimulationStepResponse>(`/simulation/step?machine_id=${machine_id}`, { method: 'POST' }),

  // Alerts
  getAlerts: (severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    return fetchJson<Alert[]>(`/alerts?${params.toString()}`);
  },
  acknowledgeAlert: (alertId: number, acknowledged_by = 'Operations Staff') =>
    fetchJson<Alert>(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledged_by })
    }),

  // Maintenance
  getMaintenance: () => fetchJson<MaintenanceRecord[]>('/maintenance'),
  createMaintenance: (data: Partial<MaintenanceRecord>) =>
    fetchJson<MaintenanceRecord>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  completeMaintenance: (recordId: number) =>
    fetchJson<MaintenanceRecord>(`/maintenance/${recordId}/complete`, {
      method: 'POST'
    }),


  // Model Metadata
  getModelMetadata: () => fetchJson<any>('/model/metadata'),

  // What-If & Failure Investigation
  runWhatIf: (data: {
    machine_id: string;
    process_temperature_k: number;
    air_temperature_k?: number;
    rotational_speed_rpm: number;
    torque_nm: number;
    tool_wear_min: number;
  }) => fetchJson<import('../types').WhatIfResponse>('/simulation/what-if', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getFailureInvestigation: (machineId: string) =>
    fetchJson<import('../types').FailureInvestigationResponse>(`/machines/${machineId}/investigation`)
};
