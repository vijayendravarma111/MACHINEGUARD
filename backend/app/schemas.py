from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Sensor Reading Schemas ---
class SensorReadingBase(BaseModel):
    air_temperature_k: float = Field(..., description="Ambient air temperature in Kelvin")
    process_temperature_k: float = Field(..., description="Process temperature in Kelvin")
    rotational_speed_rpm: float = Field(..., description="Rotational speed in RPM")
    torque_nm: float = Field(..., description="Torque output in Nm")
    tool_wear_min: int = Field(..., description="Tool wear time in minutes")
    quality_tier: Optional[str] = Field("M", description="Machine quality tier (L, M, H)")

class SensorReadingCreate(SensorReadingBase):
    machine_id: str
    timestamp: Optional[datetime] = None
    is_simulated: bool = True

class SensorReadingResponse(SensorReadingBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    reading_id: int
    machine_id: str
    timestamp: datetime
    temp_difference_k: float
    power_w: float
    is_simulated: bool

# --- Machine Schemas ---
class MachineBase(BaseModel):
    name: str
    machine_type: str = "Rotating Machine"
    quality_tier: str = "M"
    operating_status: str = "ONLINE"
    installation_date: str

class MachineCreate(MachineBase):
    machine_id: str

class MachineResponse(MachineBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    machine_id: str
    current_health: float
    current_risk: float
    current_anomaly_state: str
    operating_hours: float
    maintenance_status: str
    last_reading_timestamp: Optional[datetime] = None
    created_at: datetime

# --- Prediction Schemas ---
class FactorAttribution(BaseModel):
    factor_name: str
    impact_level: str
    human_explanation: str
    attribution_score: float

class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    prediction_id: int
    machine_id: str
    timestamp: datetime
    anomaly_score: float
    anomaly_state: str
    failure_risk: float
    risk_level: str
    probable_fault: Optional[str] = None
    contributing_factors: List[FactorAttribution] = []
    model_version: str

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    alert_id: int
    machine_id: str
    timestamp: datetime
    severity: str
    reason: str
    recommended_action: str
    status: str
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Operations Staff"

# --- Maintenance Schemas ---
class MaintenanceRecordCreate(BaseModel):
    machine_id: str
    scheduled_date: datetime
    maintenance_type: str
    description: str
    technician: str
    notes: Optional[str] = None

class MaintenanceRecordResponse(MaintenanceRecordCreate):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    record_id: int
    completion_date: Optional[datetime] = None
    status: str
    created_at: datetime

# --- Simulation Schemas ---
class SimulationStartRequest(BaseModel):
    machine_id: str = "MOTOR-001"
    scenario: str = "NORMAL"
    speed_multiplier: float = 1.0

class SimulationFaultRequest(BaseModel):
    machine_id: str
    fault_type: str

# --- Dashboard & System Schemas ---
class DashboardSummary(BaseModel):
    total_machines: int
    healthy_machines: int
    warning_machines: int
    critical_machines: int
    maintenance_due_machines: int
    open_alerts_count: int
    active_simulation: bool
    machines: List[MachineResponse]

class SystemHealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    database_connected: bool
    ml_models_loaded: bool
    active_model_version: str
    server_time: datetime

# --- What-If Digital Twin Schemas ---
class WhatIfRequest(BaseModel):
    machine_id: str = "MOTOR-001"
    process_temperature_k: float = 308.0
    air_temperature_k: float = 300.0
    rotational_speed_rpm: float = 1500.0
    torque_nm: float = 40.0
    tool_wear_min: int = 50

class StateSnapshot(BaseModel):
    health_score: float
    failure_risk: float
    anomaly_state: str
    risk_level: str
    condition: str
    probable_fault: str
    contributing_factors: List[FactorAttribution] = []

class DeltaImpactItem(BaseModel):
    parameter: str
    unit: str
    current_val: float
    simulated_val: float
    delta: float
    direction: str

class WhatIfResponse(BaseModel):
    machine_id: str
    current_state: StateSnapshot
    simulated_state: StateSnapshot
    delta_impact: List[DeltaImpactItem]
    scenario_assessment: str
    recommended_action: str
    disclaimer: str = "MODEL-ESTIMATED SIMULATION — Hypothetical operating scenario. Does not alter actual machine state or trigger database alerts."

# --- Failure Investigation Schemas ---
class BaselineDelta(BaseModel):
    parameter: str
    unit: str
    current_val: float
    baseline_val: float
    delta: float
    direction: str

class FailureInvestigationResponse(BaseModel):
    machine_id: str
    name: str
    current_health: float
    current_risk: float
    condition: str
    what_changed: List[BaselineDelta]
    contributing_factors: List[FactorAttribution]
    condition_assessment: str
    recommended_action: str
