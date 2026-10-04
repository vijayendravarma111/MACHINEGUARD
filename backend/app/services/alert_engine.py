import datetime
from sqlalchemy.orm import Session
import backend.app.models.db_models as db_models

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
