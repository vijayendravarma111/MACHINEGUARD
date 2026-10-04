export interface Machine {
  machine_id: string;
  name: string;
  machine_type: string;
  quality_tier: string;
  operating_status: string; // 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  current_health: number;
  current_risk: number;
  current_anomaly_state: string; // 'NORMAL' | 'ABNORMAL'
  operating_hours: number;
  installation_date: string;
  maintenance_status: string;
  last_reading_timestamp?: string;
  created_at: string;
}

export interface SensorReading {
  reading_id: number;
  machine_id: string;
  timestamp: string;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  temp_difference_k: number;
  power_w: number;
  is_simulated: boolean;
}

export interface FactorAttribution {
  factor_name: string;
  impact_level: 'HIGH' | 'MODERATE' | 'LOW';
  human_explanation: string;
  attribution_score: number;
}

export interface Prediction {
  prediction_id: number;
  machine_id: string;
  timestamp: string;
  anomaly_score: number;
  anomaly_state: string;
  failure_risk: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probable_fault?: string;
  contributing_factors: FactorAttribution[];
  model_version: string;
}

export interface Alert {
  alert_id: number;
  machine_id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  reason: string;
  recommended_action: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export interface MaintenanceRecord {
  record_id: number;
  machine_id: string;
  scheduled_date: string;
  completion_date?: string;
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  description: string;
  technician: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_machines: number;
  healthy_machines: number;
  warning_machines: number;
  critical_machines: number;
  maintenance_due_machines: number;
  open_alerts_count: number;
  active_simulation: boolean;
  machines: Machine[];
}

export interface SystemHealth {
  status: string;
  database_connected: boolean;
  ml_models_loaded: boolean;
  active_model_version: string;
  server_time: string;
}

export interface SimulationStepResponse {
  machine_id: string;
  timestamp: string;
  telemetry: {
    air_temperature_k: number;
    process_temperature_k: number;
    temp_difference_k: number;
    rotational_speed_rpm: number;
    torque_nm: number;
    power_w: number;
    tool_wear_min: number;
  };
  machine_state: {
    current_health: number;
    current_risk: number;
    current_anomaly_state: string;
    risk_level: string;
    maintenance_status: string;
    probable_fault: string;
    contributing_factors: FactorAttribution[];
  };
  alerts_generated: {
    alert_id: number;
    severity: string;
    reason: string;
    recommended_action: string;
  }[];
}

export interface StateSnapshot {
  health_score: number;
  failure_risk: number;
  anomaly_state: string;
  risk_level: string;
  condition: string;
  probable_fault: string;
  contributing_factors: FactorAttribution[];
}

export interface DeltaImpactItem {
  parameter: string;
  unit: string;
  current_val: number;
  simulated_val: number;
  delta: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
}

export interface WhatIfResponse {
  machine_id: string;
  current_state: StateSnapshot;
  simulated_state: StateSnapshot;
  delta_impact: DeltaImpactItem[];
  scenario_assessment: string;
  recommended_action: string;
  disclaimer: string;
}

export interface BaselineDelta {
  parameter: string;
  unit: string;
  current_val: number;
  baseline_val: number;
  delta: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
}

export interface FailureInvestigationResponse {
  machine_id: string;
  name: string;
  current_health: number;
  current_risk: number;
  condition: string;
  what_changed: BaselineDelta[];
  contributing_factors: FactorAttribution[];
  condition_assessment: string;
  recommended_action: string;
}
