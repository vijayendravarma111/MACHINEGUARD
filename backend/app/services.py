import json
import datetime
from sqlalchemy.orm import Session
import backend.app.models as db_models
from backend.app.ml.inference import ml_engine

def check_and_generate_alerts(db: Session, machine: db_models.DBMachine, reading: db_models.DBSensorReading, prediction_results: dict) -> list:
    risk = prediction_results["failure_risk"]
    anomaly = prediction_results["anomaly_state"]
    temp_diff = reading.temp_difference_k
    tool_wear = reading.tool_wear_min
    torque = reading.torque_nm

    alerts_created = []
    five_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)

    def has_recent_alert(severity_check: str) -> bool:
        recent = db.query(db_models.DBAlert).filter(
            db_models.DBAlert.machine_id == machine.machine_id,
            db_models.DBAlert.status == "OPEN",
            db_models.DBAlert.severity == severity_check,
            db_models.DBAlert.timestamp >= five_mins_ago
        ).first()
        return recent is not None

    # Rule 1: Critical Alert (High failure risk or severe anomaly with high tool wear)
    if risk >= 0.75 or (risk >= 0.50 and anomaly == "ABNORMAL" and tool_wear > 200):
        if not has_recent_alert("CRITICAL"):
            reason_msg = f"Critical Failure Risk ({risk * 100.0:.1f}%) — {prediction_results['probable_fault']}"
            action_msg = "Inspect machine during current shift and consider scheduling corrective maintenance."
            
            alert = db_models.DBAlert(
                machine_id=machine.machine_id,
                timestamp=datetime.datetime.utcnow(),
                severity="CRITICAL",
                reason=reason_msg,
                recommended_action=action_msg,
                status="OPEN"
            )
            db.add(alert)
            alerts_created.append(alert)

    # Rule 2: High Severity Alert
    elif risk >= 0.50 or (anomaly == "ABNORMAL" and (torque > 60.0 or tool_wear > 180)):
        if not has_recent_alert("HIGH"):
            reason_msg = f"Elevated Failure Risk ({risk * 100.0:.1f}%) — Machine operating outside baseline parameters."
            action_msg = "Schedule priority inspection during current operational window."
            
            alert = db_models.DBAlert(
                machine_id=machine.machine_id,
                timestamp=datetime.datetime.utcnow(),
                severity="HIGH",
                reason=reason_msg,
                recommended_action=action_msg,
                status="OPEN"
            )
            db.add(alert)
            alerts_created.append(alert)

    # Rule 3: Warning Severity Alert
    elif risk >= 0.25 or temp_diff > 11.5:
        if not has_recent_alert("WARNING"):
            reason_msg = f"Thermal Deviation Detected (Process-Air Delta: {temp_diff:.1f} K)."
            action_msg = "Inspect thermal dissipation assembly during next planned window."
            
            alert = db_models.DBAlert(
                machine_id=machine.machine_id,
                timestamp=datetime.datetime.utcnow(),
                severity="WARNING",
                reason=reason_msg,
                recommended_action=action_msg,
                status="OPEN"
            )
            db.add(alert)
            alerts_created.append(alert)

    return alerts_created

def process_new_sensor_reading(db: Session, reading_data: dict) -> tuple:
    """
    1. Save sensor reading to DB
    2. Run ML inference (Anomaly score, Failure risk, Health score, Probable fault, Contributing factors)
    3. Update Machine twin entity state in DB
    4. Save Prediction record
    5. Check and generate Alerts / Maintenance recommendations
    """
    machine_id = reading_data["machine_id"]
    machine = db.query(db_models.DBMachine).filter(db_models.DBMachine.machine_id == machine_id).first()
    
    if not machine:
        raise ValueError(f"Machine with ID '{machine_id}' not found.")

    # Calculate derived parameters
    air_temp = float(reading_data["air_temperature_k"])
    proc_temp = float(reading_data["process_temperature_k"])
    speed = float(reading_data["rotational_speed_rpm"])
    torque = float(reading_data["torque_nm"])
    tool_wear = int(reading_data["tool_wear_min"])
    temp_diff = proc_temp - air_temp
    power = speed * torque * (3.141592653589793 * 2.0 / 60.0)

    timestamp = reading_data.get("timestamp") or datetime.datetime.utcnow()
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except Exception:
            timestamp = datetime.datetime.utcnow()

    # Create Sensor Reading Record
    reading_record = db_models.DBSensorReading(
        machine_id=machine_id,
        timestamp=timestamp,
        air_temperature_k=air_temp,
        process_temperature_k=proc_temp,
        rotational_speed_rpm=speed,
        torque_nm=torque,
        tool_wear_min=tool_wear,
        temp_difference_k=round(temp_diff, 2),
        power_w=round(power, 2),
        is_simulated=reading_data.get("is_simulated", True)
    )
    db.add(reading_record)

    # ML Inference Input Mapping
    type_code_map = {'L': 0, 'M': 1, 'H': 2}
    type_code = type_code_map.get(machine.quality_tier, 1)

    inference_input = {
        'type_code': type_code,
        'air_temperature_k': air_temp,
        'process_temperature_k': proc_temp,
        'rotational_speed_rpm': speed,
        'torque_nm': torque,
        'tool_wear_min': tool_wear,
        'temp_difference_k': temp_diff,
        'power_w': power
    }

    prediction_results = ml_engine.predict(inference_input)

    # Update Machine Entity State
    machine.current_health = prediction_results["health_score"]
    machine.current_risk = prediction_results["failure_risk"]
    machine.current_anomaly_state = prediction_results["anomaly_state"]
    machine.last_reading_timestamp = timestamp
    machine.operating_hours += round(1.0 / 60.0, 3) # Increment operating hours per reading cycle

    # Update Maintenance Status on Machine based on active work orders and Health
    active_maint = db.query(db_models.DBMaintenanceRecord).filter(
        db_models.DBMaintenanceRecord.machine_id == machine_id,
        db_models.DBMaintenanceRecord.status.in_(["SCHEDULED", "IN_PROGRESS"])
    ).order_by(db_models.DBMaintenanceRecord.scheduled_date.asc()).first()

    if active_maint:
        machine.maintenance_status = active_maint.status
    else:
        health = machine.current_health
        if health < 40.0:
            machine.maintenance_status = "CRITICAL MAINTENANCE DUE"
        elif health < 60.0:
            machine.maintenance_status = "INSPECTION RECOMMENDED"
        elif health < 80.0:
            machine.maintenance_status = "MONITORING REQUIRED"
        else:
            machine.maintenance_status = "NORMAL"

    # Create Prediction Log Record
    factors_json = json.dumps([f for f in prediction_results["contributing_factors"]])
    pred_record = db_models.DBPrediction(
        machine_id=machine_id,
        timestamp=timestamp,
        anomaly_score=prediction_results["anomaly_score"],
        anomaly_state=prediction_results["anomaly_state"],
        failure_risk=prediction_results["failure_risk"],
        risk_level=prediction_results["risk_level"],
        probable_fault=prediction_results["probable_fault"],
        contributing_factors=factors_json,
        model_version=prediction_results["model_version"]
    )
    db.add(pred_record)

    # Trigger Alert Decision Engine
    alerts_generated = check_and_generate_alerts(db, machine, reading_record, prediction_results)

    db.commit()
    db.refresh(machine)
    db.refresh(reading_record)
    db.refresh(pred_record)

    return machine, reading_record, pred_record, prediction_results, alerts_generated
