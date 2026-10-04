import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
import backend.app.models as db_models
import backend.app.schemas as schemas
from backend.app.services import process_new_sensor_reading
from backend.app.simulation import simulator_engine
from backend.app.ml.inference import ml_engine

router = APIRouter()

# -------------------------------------------------------------
# 1. System & Dashboard APIs
# -------------------------------------------------------------
@router.get("/system/health", response_model=schemas.SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.query(db_models.DBMachine).first()
    except Exception:
        db_ok = False
        
    return {
        "status": "ONLINE" if db_ok and ml_engine.is_loaded else "DEGRADED",
        "database_connected": db_ok,
        "ml_models_loaded": ml_engine.is_loaded,
        "active_model_version": ml_engine.metadata.get("active_version", "v1.0.0"),
        "server_time": datetime.datetime.utcnow()
    }

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    machines = db.query(db_models.DBMachine).all()
    
    total = len(machines)
    healthy = sum(1 for m in machines if m.current_health >= 80.0)
    warning = sum(1 for m in machines if 40.0 <= m.current_health < 80.0)
    critical = sum(1 for m in machines if m.current_health < 40.0)
    maintenance_due = sum(1 for m in machines if "MAINTENANCE" in m.maintenance_status or "CRITICAL" in m.maintenance_status)
    
    open_alerts = db.query(db_models.DBAlert).filter(db_models.DBAlert.status == "OPEN").count()
    active_sim = any(s.get("is_running", False) for s in simulator_engine.states.values())

    return {
        "total_machines": total,
        "healthy_machines": healthy,
        "warning_machines": warning,
        "critical_machines": critical,
        "maintenance_due_machines": maintenance_due,
        "open_alerts_count": open_alerts,
        "active_simulation": active_sim,
        "machines": machines
    }

# -------------------------------------------------------------
# 2. Machines APIs
# -------------------------------------------------------------
@router.get("/machines", response_model=List[schemas.MachineResponse])
def list_machines(db: Session = Depends(get_db)):
    return db.query(db_models.DBMachine).all()

@router.get("/machines/{machine_id}", response_model=schemas.MachineResponse)
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")
    return machine

@router.post("/machines", response_model=schemas.MachineResponse, status_code=status.HTTP_201_CREATED)
def create_machine(machine_in: schemas.MachineCreate, db: Session = Depends(get_db)):
    existing = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_in.machine_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Machine ID '{machine_in.machine_id}' already exists.")
        
    machine = db_models.DBMachine(
        machine_id=machine_in.machine_id,
        name=machine_in.name,
        machine_type=machine_in.machine_type,
        quality_tier=machine_in.quality_tier,
        operating_status=machine_in.operating_status,
        installation_date=machine_in.installation_date,
        current_health=100.0,
        current_risk=0.0,
        current_anomaly_state="NORMAL",
        maintenance_status="NORMAL"
    )
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine

@router.get("/machines/{machine_id}/readings", response_model=List[schemas.SensorReadingResponse])
def get_machine_readings(machine_id: str, limit: int = Query(50, ge=1, le=500), db: Session = Depends(get_db)):
    return db.query(db_models.DBSensorReading).filter(
        db_models.DBSensorReading.machine_id == machine_id
    ).order_by(db_models.DBSensorReading.timestamp.desc()).limit(limit).all()

@router.get("/machines/{machine_id}/health")
def get_machine_health(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")
    return {
        "machine_id": machine.machine_id,
        "name": machine.name,
        "current_health": machine.current_health,
        "current_risk": machine.current_risk,
        "current_anomaly_state": machine.current_anomaly_state,
        "operating_status": machine.operating_status,
        "maintenance_status": machine.maintenance_status,
        "last_reading_timestamp": machine.last_reading_timestamp
    }

@router.get("/machines/{machine_id}/diagnosis")
def get_machine_diagnosis(machine_id: str, db: Session = Depends(get_db)):
    latest_pred = db.query(db_models.DBPrediction).filter(
        db_models.DBPrediction.machine_id == machine_id
    ).order_by(db_models.DBPrediction.timestamp.desc()).first()
    
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")

    def normalize_factors(raw_json):
        if not raw_json:
            return []
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict):
                return [
                    {
                        "factor_name": k.replace('_', ' ').title(),
                        "impact_level": "HIGH" if v > 0.3 else "MODERATE" if v > 0.1 else "LOW",
                        "human_explanation": f"Parameter '{k}' contributes {v:.2f} to current failure risk model estimation.",
                        "attribution_score": float(v)
                    }
                    for k, v in parsed.items()
                ]
            return []
        except Exception:
            return []

    factors = normalize_factors(latest_pred.contributing_factors if latest_pred else None)

    return {
        "machine_id": machine.machine_id,
        "name": machine.name,
        "current_health": machine.current_health,
        "current_risk": machine.current_risk,
        "risk_level": latest_pred.risk_level if latest_pred else "LOW",
        "anomaly_state": machine.current_anomaly_state,
        "probable_fault": latest_pred.probable_fault if latest_pred else "Normal Operation",
        "contributing_factors": factors,
        "model_version": latest_pred.model_version if latest_pred else "v1.0.0",
        "timestamp": latest_pred.timestamp if latest_pred else datetime.datetime.utcnow()
    }

@router.get("/machines/{machine_id}/alerts", response_model=List[schemas.AlertResponse])
def get_machine_alerts(machine_id: str, db: Session = Depends(get_db)):
    return db.query(db_models.DBAlert).filter(
        db_models.DBAlert.machine_id == machine_id
    ).order_by(db_models.DBAlert.timestamp.desc()).all()

@router.get("/machines/{machine_id}/maintenance", response_model=List[schemas.MaintenanceRecordResponse])
def get_machine_maintenance(machine_id: str, db: Session = Depends(get_db)):
    return db.query(db_models.DBMaintenanceRecord).filter(
        db_models.DBMaintenanceRecord.machine_id == machine_id
    ).order_by(db_models.DBMaintenanceRecord.scheduled_date.desc()).all()

# -------------------------------------------------------------
# 3. Read & Prediction APIs
# -------------------------------------------------------------
@router.post("/readings")
def post_sensor_reading(reading_in: schemas.SensorReadingCreate, db: Session = Depends(get_db)):
    try:
        reading_dict = reading_in.model_dump()
        machine, reading, pred, prediction_results, alerts = process_new_sensor_reading(db, reading_dict)
        
        return {
            "status": "SUCCESS",
            "machine_id": machine.machine_id,
            "current_health": machine.current_health,
            "current_risk": machine.current_risk,
            "current_anomaly_state": machine.current_anomaly_state,
            "reading_id": reading.reading_id,
            "alerts_generated": len(alerts)
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing sensor reading: {e}")

# -------------------------------------------------------------
# 4. Simulation Control APIs
# -------------------------------------------------------------
@router.post("/simulation/start")
def start_simulation(sim_in: schemas.SimulationStartRequest, db: Session = Depends(get_db)):
    state = simulator_engine.get_or_create_state(sim_in.machine_id)
    state["is_running"] = True
    state["scenario"] = sim_in.scenario
    state["speed_multiplier"] = sim_in.speed_multiplier
    
    return {
        "status": "SIMULATION_STARTED",
        "machine_id": sim_in.machine_id,
        "scenario": sim_in.scenario,
        "is_running": True
    }

@router.post("/simulation/stop")
def stop_simulation(machine_id: str = Query("MOTOR-001")):
    state = simulator_engine.get_or_create_state(machine_id)
    state["is_running"] = False
    return {
        "status": "SIMULATION_STOPPED",
        "machine_id": machine_id,
        "is_running": False
    }

@router.post("/simulation/fault")
def inject_simulation_fault(fault_in: schemas.SimulationFaultRequest, db: Session = Depends(get_db)):
    simulator_engine.set_scenario(fault_in.machine_id, fault_in.fault_type)
    return {
        "status": "FAULT_INJECTED",
        "machine_id": fault_in.machine_id,
        "active_scenario": fault_in.fault_type
    }

@router.post("/simulation/reset")
def reset_simulation(machine_id: str = Query("MOTOR-001"), db: Session = Depends(get_db)):
    simulator_engine.set_scenario(machine_id, "RESET")
    
    # Reset machine twin state in database as well
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    if machine:
        machine.current_health = 98.0
        machine.current_risk = 0.02
        machine.current_anomaly_state = "NORMAL"
        
        # Preserve active scheduled maintenance status if exists
        active_maint = db.query(db_models.DBMaintenanceRecord).filter(
            db_models.DBMaintenanceRecord.machine_id == machine_id,
            db_models.DBMaintenanceRecord.status.in_(["SCHEDULED", "IN_PROGRESS"])
        ).first()
        machine.maintenance_status = active_maint.status if active_maint else "NORMAL"
        db.commit()

    # Clear/Resolve active alerts for this machine upon RESET
    active_alerts = db.query(db_models.DBAlert).filter(
        db_models.DBAlert.machine_id == machine_id,
        db_models.DBAlert.status.in_(["OPEN", "ACKNOWLEDGED"])
    ).all()
    for alert in active_alerts:
        alert.status = "RESOLVED"
    db.commit()

    return {
        "status": "MACHINE_RESET_COMPLETE",
        "machine_id": machine_id,
        "current_health": 98.0,
        "current_risk": 0.02,
        "anomaly_state": "NORMAL",
        "alerts_resolved": len(active_alerts)
    }

@router.post("/simulation/step")
def step_simulation(machine_id: str = Query("MOTOR-001"), db: Session = Depends(get_db)):
    """
    Executes a single simulated sensor reading cycle, feeds it into state engine, and returns complete updated machine twin state.
    """
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    quality_tier = machine.quality_tier if machine else "M"
    
    sim_reading = simulator_engine.generate_next_reading(machine_id, quality_tier)
    machine_obj, reading_obj, pred_obj, pred_results, alerts = process_new_sensor_reading(db, sim_reading)

    return {
        "machine_id": machine_obj.machine_id,
        "timestamp": reading_obj.timestamp,
        "telemetry": {
            "air_temperature_k": reading_obj.air_temperature_k,
            "process_temperature_k": reading_obj.process_temperature_k,
            "temp_difference_k": reading_obj.temp_difference_k,
            "rotational_speed_rpm": reading_obj.rotational_speed_rpm,
            "torque_nm": reading_obj.torque_nm,
            "power_w": reading_obj.power_w,
            "tool_wear_min": reading_obj.tool_wear_min
        },
        "machine_state": {
            "current_health": machine_obj.current_health,
            "current_risk": machine_obj.current_risk,
            "current_anomaly_state": machine_obj.current_anomaly_state,
            "risk_level": pred_results["risk_level"],
            "maintenance_status": machine_obj.maintenance_status,
            "probable_fault": pred_results["probable_fault"],
            "contributing_factors": pred_results["contributing_factors"]
        },
        "alerts_generated": [
            {
                "alert_id": a.alert_id,
                "severity": a.severity,
                "reason": a.reason,
                "recommended_action": a.recommended_action
            } for a in alerts
        ]
    }

# -------------------------------------------------------------
# 5. Alert & Maintenance Management APIs
# -------------------------------------------------------------
@router.get("/alerts", response_model=List[schemas.AlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(db_models.DBAlert)
    if severity and severity != "ALL":
        query = query.filter(db_models.DBAlert.severity == severity)
    if status and status != "ALL":
        query = query.filter(db_models.DBAlert.status == status)
    return query.order_by(db_models.DBAlert.timestamp.desc()).all()

@router.post("/alerts/{alert_id}/acknowledge", response_model=schemas.AlertResponse)
def acknowledge_alert(alert_id: int, req: schemas.AlertAcknowledgeRequest, db: Session = Depends(get_db)):
    alert = db.query(db_models.DBAlert).filter(db_models.DBAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert ID '{alert_id}' not found.")
        
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.datetime.utcnow()
    alert.acknowledged_by = req.acknowledged_by
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/maintenance", response_model=List[schemas.MaintenanceRecordResponse])
def list_maintenance(db: Session = Depends(get_db)):
    return db.query(db_models.DBMaintenanceRecord).order_by(db_models.DBMaintenanceRecord.scheduled_date.desc()).all()

@router.post("/maintenance", response_model=schemas.MaintenanceRecordResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(maint_in: schemas.MaintenanceRecordCreate, db: Session = Depends(get_db)):
    # Check for duplicate active maintenance record
    existing = db.query(db_models.DBMaintenanceRecord).filter(
        db_models.DBMaintenanceRecord.machine_id == maint_in.machine_id,
        db_models.DBMaintenanceRecord.maintenance_type == maint_in.maintenance_type,
        db_models.DBMaintenanceRecord.status.in_(["SCHEDULED", "IN_PROGRESS"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An active maintenance order already exists for machine '{maint_in.machine_id}'."
        )

    maint = db_models.DBMaintenanceRecord(
        machine_id=maint_in.machine_id,
        scheduled_date=maint_in.scheduled_date,
        maintenance_type=maint_in.maintenance_type,
        description=maint_in.description,
        technician=maint_in.technician,
        status="SCHEDULED",
        notes=maint_in.notes
    )
    db.add(maint)

    # Update machine maintenance status
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == maint_in.machine_id).first()
    if machine:
        machine.maintenance_status = "SCHEDULED"

    db.commit()
    db.refresh(maint)
    return maint

@router.post("/maintenance/{record_id}/complete", response_model=schemas.MaintenanceRecordResponse)
def complete_maintenance(record_id: int, db: Session = Depends(get_db)):
    maint = db.query(db_models.DBMaintenanceRecord).filter(db_models.DBMaintenanceRecord.record_id == record_id).first()
    if not maint:
        raise HTTPException(status_code=404, detail=f"Maintenance record '{record_id}' not found.")
    
    maint.status = "COMPLETED"
    maint.completion_date = datetime.datetime.utcnow()

    # Reset machine twin state to healthy upon maintenance completion
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == maint.machine_id).first()
    if machine:
        machine.current_health = 98.0
        machine.current_risk = 0.02
        machine.current_anomaly_state = "NORMAL"
        machine.maintenance_status = "NORMAL"

    # Resolve active open alerts for this machine
    active_alerts = db.query(db_models.DBAlert).filter(
        db_models.DBAlert.machine_id == maint.machine_id,
        db_models.DBAlert.status.in_(["OPEN", "ACKNOWLEDGED"])
    ).all()
    for alert in active_alerts:
        alert.status = "RESOLVED"

    db.commit()
    db.refresh(maint)
    return maint


# -------------------------------------------------------------
# 6. Model Insights, What-If & Investigation APIs
# -------------------------------------------------------------
def get_condition_string(health: float) -> str:
    if health >= 80.0:
        return "HEALTHY"
    elif health >= 60.0:
        return "WATCH"
    elif health >= 40.0:
        return "WARNING"
    else:
        return "CRITICAL"

@router.get("/model/metadata")
def get_model_metadata():
    return ml_engine.metadata

@router.post("/simulation/what-if", response_model=schemas.WhatIfResponse)
def run_what_if_simulation(req: schemas.WhatIfRequest, db: Session = Depends(get_db)):
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == req.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{req.machine_id}' not found.")

    latest_reading = db.query(db_models.DBSensorReading).filter(
        db_models.DBSensorReading.machine_id == req.machine_id
    ).order_by(db_models.DBSensorReading.timestamp.desc()).first()

    curr_air_temp = latest_reading.air_temperature_k if latest_reading else 300.0
    curr_proc_temp = latest_reading.process_temperature_k if latest_reading else 308.0
    curr_speed = latest_reading.rotational_speed_rpm if latest_reading else 1500.0
    curr_torque = latest_reading.torque_nm if latest_reading else 40.0
    curr_wear = latest_reading.tool_wear_min if latest_reading else 30

    curr_condition = get_condition_string(machine.current_health)
    
    latest_pred = db.query(db_models.DBPrediction).filter(
        db_models.DBPrediction.machine_id == req.machine_id
    ).order_by(db_models.DBPrediction.timestamp.desc()).first()
    
    curr_factors = []
    if latest_pred and latest_pred.contributing_factors:
        try:
            curr_factors = json.loads(latest_pred.contributing_factors)
        except Exception:
            curr_factors = []

    current_snapshot = {
        "health_score": machine.current_health,
        "failure_risk": machine.current_risk,
        "anomaly_state": machine.current_anomaly_state,
        "risk_level": latest_pred.risk_level if latest_pred else "LOW",
        "condition": curr_condition,
        "probable_fault": latest_pred.probable_fault if latest_pred else "Normal Operation",
        "contributing_factors": curr_factors
    }

    type_code_map = {'L': 0, 'M': 1, 'H': 2}
    type_code = type_code_map.get(machine.quality_tier, 1)

    sim_reading_dict = {
        "type_code": type_code,
        "air_temperature_k": req.air_temperature_k,
        "process_temperature_k": req.process_temperature_k,
        "rotational_speed_rpm": req.rotational_speed_rpm,
        "torque_nm": req.torque_nm,
        "tool_wear_min": req.tool_wear_min
    }

    sim_pred = ml_engine.predict(sim_reading_dict)
    sim_condition = get_condition_string(sim_pred["health_score"])

    simulated_snapshot = {
        "health_score": sim_pred["health_score"],
        "failure_risk": sim_pred["failure_risk"],
        "anomaly_state": sim_pred["anomaly_state"],
        "risk_level": sim_pred["risk_level"],
        "condition": sim_condition,
        "probable_fault": sim_pred["probable_fault"],
        "contributing_factors": sim_pred["contributing_factors"]
    }

    deltas = [
        {
            "parameter": "Process Temperature",
            "unit": "K",
            "current_val": curr_proc_temp,
            "simulated_val": req.process_temperature_k,
            "delta": round(req.process_temperature_k - curr_proc_temp, 2),
            "direction": "UP" if req.process_temperature_k > curr_proc_temp else ("DOWN" if req.process_temperature_k < curr_proc_temp else "STABLE")
        },
        {
            "parameter": "Rotational Speed",
            "unit": "RPM",
            "current_val": curr_speed,
            "simulated_val": req.rotational_speed_rpm,
            "delta": round(req.rotational_speed_rpm - curr_speed, 1),
            "direction": "UP" if req.rotational_speed_rpm > curr_speed else ("DOWN" if req.rotational_speed_rpm < curr_speed else "STABLE")
        },
        {
            "parameter": "Motor Torque",
            "unit": "Nm",
            "current_val": curr_torque,
            "simulated_val": req.torque_nm,
            "delta": round(req.torque_nm - curr_torque, 1),
            "direction": "UP" if req.torque_nm > curr_torque else ("DOWN" if req.torque_nm < curr_torque else "STABLE")
        },
        {
            "parameter": "Tool Wear",
            "unit": "min",
            "current_val": float(curr_wear),
            "simulated_val": float(req.tool_wear_min),
            "delta": float(req.tool_wear_min - curr_wear),
            "direction": "UP" if req.tool_wear_min > curr_wear else ("DOWN" if req.tool_wear_min < curr_wear else "STABLE")
        }
    ]

    risk_diff = round((sim_pred["failure_risk"] - machine.current_risk) * 100.0, 1)
    if risk_diff > 5.0:
        assessment = f"Hypothetical scenario increases estimated failure risk by +{risk_diff}% under simulated parameters."
        rec = "Consider reducing operational load parameters or scheduling inspection before running machine at this regime."
    elif risk_diff < -5.0:
        assessment = f"Hypothetical scenario reduces estimated failure risk by {risk_diff}%."
        rec = "Parameters maintain machine state within healthy operating envelope."
    else:
        assessment = "Hypothetical scenario maintains operating state within baseline risk envelope."
        rec = "Continue routine monitoring under current operating guidelines."

    return {
        "machine_id": req.machine_id,
        "current_state": current_snapshot,
        "simulated_state": simulated_snapshot,
        "delta_impact": deltas,
        "scenario_assessment": assessment,
        "recommended_action": rec,
        "disclaimer": "MODEL-ESTIMATED SIMULATION — Isolated sandbox scenario. Does not modify live machine twin state or trigger alerts."
    }

@router.get("/machines/{machine_id}/investigation", response_model=schemas.FailureInvestigationResponse)
def get_failure_investigation(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")

    latest_reading = db.query(db_models.DBSensorReading).filter(
        db_models.DBSensorReading.machine_id == machine_id
    ).order_by(db_models.DBSensorReading.timestamp.desc()).first()

    base_proc_temp = 308.0
    base_speed = 1500.0
    base_torque = 40.0
    base_wear = 20.0

    what_changed = []
    if latest_reading:
        p_temp = latest_reading.process_temperature_k
        d_temp = round(p_temp - base_proc_temp, 2)
        what_changed.append({
            "parameter": "Process Temperature",
            "unit": "K",
            "current_val": p_temp,
            "baseline_val": base_proc_temp,
            "delta": d_temp,
            "direction": "UP" if d_temp > 0.5 else ("DOWN" if d_temp < -0.5 else "STABLE")
        })

        speed = latest_reading.rotational_speed_rpm
        d_speed = round(speed - base_speed, 1)
        what_changed.append({
            "parameter": "Rotational Speed",
            "unit": "RPM",
            "current_val": speed,
            "baseline_val": base_speed,
            "delta": d_speed,
            "direction": "UP" if d_speed > 20.0 else ("DOWN" if d_speed < -20.0 else "STABLE")
        })

        torque = latest_reading.torque_nm
        d_torque = round(torque - base_torque, 1)
        what_changed.append({
            "parameter": "Motor Torque",
            "unit": "Nm",
            "current_val": torque,
            "baseline_val": base_torque,
            "delta": d_torque,
            "direction": "UP" if d_torque > 2.0 else ("DOWN" if d_torque < -2.0 else "STABLE")
        })

        wear = float(latest_reading.tool_wear_min)
        d_wear = round(wear - base_wear, 1)
        what_changed.append({
            "parameter": "Tool Wear",
            "unit": "min",
            "current_val": wear,
            "baseline_val": base_wear,
            "delta": d_wear,
            "direction": "UP" if d_wear > 0 else "STABLE"
        })

    latest_pred = db.query(db_models.DBPrediction).filter(
        db_models.DBPrediction.machine_id == machine_id
    ).order_by(db_models.DBPrediction.timestamp.desc()).first()

    def normalize_factors(raw_json):
        if not raw_json:
            return []
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict):
                return [
                    {
                        "factor_name": k.replace('_', ' ').title(),
                        "impact_level": "HIGH" if v > 0.3 else "MODERATE" if v > 0.1 else "LOW",
                        "human_explanation": f"Parameter '{k}' contributes {v:.2f} to current failure risk model estimation.",
                        "attribution_score": float(v)
                    }
                    for k, v in parsed.items()
                ]
            return []
        except Exception:
            return []

    factors = normalize_factors(latest_pred.contributing_factors if latest_pred else None)

    cond = get_condition_string(machine.current_health)
    
    if cond == "CRITICAL":
        assessment = "Machine operating parameters indicate severe degradation. High failure risk estimated."
        rec = "Inspect operating conditions immediately and schedule urgent preventive maintenance."
    elif cond in ["WATCH", "WARNING"]:
        assessment = "Operating parameters show deviation from baseline limits. Increased thermal/torque strain detected."
        rec = "Inspect machine during next operational window and verify lubrication/tooling wear."
    else:
        assessment = "Machine condition is healthy with all telemetry operating within baseline bounds."
        rec = "Maintain standard continuous monitoring cycle."

    return {
        "machine_id": machine.machine_id,
        "name": machine.name,
        "current_health": machine.current_health,
        "current_risk": machine.current_risk,
        "condition": cond,
        "what_changed": what_changed,
        "contributing_factors": factors,
        "condition_assessment": assessment,
        "recommended_action": rec
    }
