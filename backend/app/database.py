import os
import json
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

Base = declarative_base()

# SQLite engine configuration (zero external setup required)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
print(f"[Database] Connected to relational database at {settings.DATABASE_URL}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import backend.app.models as db_models
    
    Base.metadata.create_all(bind=engine)
    print("[Database] Database tables verified / created.")
    
    db = SessionLocal()
    try:
        existing_ids = {m.machine_id for m in db.query(db_models.DBMachine).all()}
        expected_ids = {"MOTOR-001", "MOTOR-002", "MOTOR-003", "MOTOR-004", "MOTOR-005", "PUMP-006", "PUMP-007", "COMP-008"}
        if existing_ids != expected_ids:
            print(f"[Database] Machine inventory discrepancy (found {len(existing_ids)} machines). Seeding exact 8-machine fleet inventory...")
            seed_initial_data(db)
        else:
            print(f"[Database] Fleet inventory verified: all 8 expected machines present ({', '.join(sorted(expected_ids))}).")
    except Exception as e:
        print(f"[Database] Error checking/seeding database: {e}")
    finally:
        db.close()

def seed_initial_data(db):
    import backend.app.models as db_models
    now = datetime.datetime.now(datetime.timezone.utc)
    
    db.query(db_models.DBMachine).delete()
    db.query(db_models.DBSensorReading).delete()
    db.query(db_models.DBPrediction).delete()
    db.query(db_models.DBAlert).delete()
    db.query(db_models.DBMaintenanceRecord).delete()
    db.query(db_models.DBModelMetadata).delete()
    db.commit()

    machines_data = [
        ("MOTOR-001", "Industrial Induction Motor 001", "Rotating Machine", "M", "ONLINE", 96.5, 0.032, "NORMAL", 1420.5, "2025-01-15", "NORMAL"),
        ("MOTOR-002", "High-Speed Spindle 002", "High-Speed Rotary Drive", "H", "ONLINE", 98.2, 0.015, "NORMAL", 890.0, "2025-03-01", "NORMAL"),
        ("MOTOR-003", "Heavy Duty Drive 003", "Rotating Machine", "L", "ONLINE", 68.4, 0.421, "ABNORMAL", 3150.0, "2024-08-10", "MONITORING REQUIRED"),
        ("MOTOR-004", "CNC Milling Spindle 004", "Machining Center Drive", "M", "ONLINE", 34.0, 0.846, "ABNORMAL", 4210.8, "2024-04-20", "CRITICAL MAINTENANCE DUE"),
        ("MOTOR-005", "Auxiliary Compressor 005", "Rotating Machine", "L", "MAINTENANCE", 45.0, 0.720, "ABNORMAL", 5100.2, "2024-01-05", "UNDER MAINTENANCE"),
        ("PUMP-006", "Primary Hydraulic Pump 006", "Hydraulic Fluid Drive", "H", "ONLINE", 94.1, 0.048, "NORMAL", 1120.0, "2025-02-10", "NORMAL"),
        ("PUMP-007", "Coolant Recirculation Pump 007", "Centrifugal Pump", "M", "ONLINE", 82.5, 0.125, "NORMAL", 2340.0, "2024-11-15", "NORMAL"),
        ("COMP-008", "High-Pressure Turbo Compressor 008", "Centrifugal Compressor", "H", "ONLINE", 59.8, 0.512, "ABNORMAL", 3890.5, "2024-06-18", "INSPECTION RECOMMENDED"),
    ]

    machines = []
    for m in machines_data:
        machines.append(db_models.DBMachine(
            machine_id=m[0],
            name=m[1],
            machine_type=m[2],
            quality_tier=m[3],
            operating_status=m[4],
            current_health=m[5],
            current_risk=m[6],
            current_anomaly_state=m[7],
            operating_hours=m[8],
            installation_date=m[9],
            maintenance_status=m[10],
            last_reading_timestamp=now
        ))
    db.add_all(machines)

    readings = []
    for m in machines_data:
        mid = m[0]
        health = m[5]
        proc_temp = 308.2 + (100.0 - health) * 0.15
        speed = 1550.0 if health > 50 else 1210.0
        torque = 42.8 if health > 50 else 74.2
        tool_wear = int((100.0 - health) * 2.5)
        
        readings.append(db_models.DBSensorReading(
            machine_id=mid,
            timestamp=now - datetime.timedelta(minutes=15),
            air_temperature_k=298.1,
            process_temperature_k=round(proc_temp, 1),
            rotational_speed_rpm=speed,
            torque_nm=torque,
            tool_wear_min=tool_wear,
            temp_difference_k=round(proc_temp - 298.1, 2),
            power_w=round(speed * torque * (3.141592653589793 * 2.0 / 60.0), 2),
            is_simulated=True
        ))
        readings.append(db_models.DBSensorReading(
            machine_id=mid,
            timestamp=now,
            air_temperature_k=298.3,
            process_temperature_k=round(proc_temp + 0.3, 1),
            rotational_speed_rpm=speed,
            torque_nm=round(torque + 0.1, 1),
            tool_wear_min=tool_wear + 2,
            temp_difference_k=round(proc_temp + 0.3 - 298.3, 2),
            power_w=round(speed * torque * (3.141592653589793 * 2.0 / 60.0), 2),
            is_simulated=True
        ))
    db.add_all(readings)

    preds = []
    sample_factors = json.dumps([
        {"factor_name": "Motor Torque Output", "impact_level": "HIGH", "human_explanation": "Elevated torque output under load increases mechanical strain.", "attribution_score": 0.38},
        {"factor_name": "Cumulative Tool Wear", "impact_level": "HIGH", "human_explanation": "Tool wear duration exceeds nominal baseline parameters.", "attribution_score": 0.32},
        {"factor_name": "Process Temperature", "impact_level": "MODERATE", "human_explanation": "Process temperature is elevated relative to ambient air.", "attribution_score": 0.18}
    ])
    sample_normal_factors = json.dumps([
        {"factor_name": "Rotational Speed", "impact_level": "LOW", "human_explanation": "Rotational speed is operating within nominal range.", "attribution_score": 0.05},
        {"factor_name": "Motor Torque", "impact_level": "LOW", "human_explanation": "Motor torque is operating within nominal limits.", "attribution_score": 0.04}
    ])
    for m in machines_data:
        mid, health, risk, anomaly = m[0], m[5], m[6], m[7]
        risk_lvl = "CRITICAL" if risk > 0.7 else "HIGH" if risk > 0.4 else "WARNING" if risk > 0.15 else "LOW"
        fault = "Heat Dissipation Failure / Overstrain" if risk > 0.7 else "Thermal Bearing Strain" if risk > 0.4 else "None"
        
        preds.append(db_models.DBPrediction(
            machine_id=mid,
            timestamp=now,
            anomaly_score=0.68 if anomaly == "ABNORMAL" else -0.12,
            anomaly_state=anomaly,
            failure_risk=risk,
            risk_level=risk_lvl,
            probable_fault=fault,
            contributing_factors=sample_factors if risk > 0.4 else sample_normal_factors,
            model_version="v1.0.0"
        ))
    db.add_all(preds)

    alerts = [
        db_models.DBAlert(
            machine_id="MOTOR-004",
            timestamp=now - datetime.timedelta(minutes=10),
            severity="CRITICAL",
            reason="Elevated Torque (74.2 Nm) and High Cumulative Tool Wear (222 min)",
            recommended_action="Immediate operational halt & spindle tool assembly inspection recommended.",
            status="OPEN"
        ),
        db_models.DBAlert(
            machine_id="COMP-008",
            timestamp=now - datetime.timedelta(hours=1),
            severity="WARNING",
            reason="Thermal deviation detected between process and ambient temperatures",
            recommended_action="Inspect thermal dissipation assembly during next planned window.",
            status="OPEN"
        ),
        db_models.DBAlert(
            machine_id="MOTOR-003",
            timestamp=now - datetime.timedelta(hours=2),
            severity="WARNING",
            reason="Abnormal speed oscillation under heavy mechanical load",
            recommended_action="Check rotor balancing and drive shaft couplings.",
            status="OPEN"
        )
    ]
    db.add_all(alerts)

    maint = [
        db_models.DBMaintenanceRecord(
            machine_id="MOTOR-001",
            scheduled_date=now - datetime.timedelta(days=30),
            completion_date=now - datetime.timedelta(days=30),
            maintenance_type="PREVENTIVE",
            description="Routine bearing lubrication and alignment check.",
            technician="Alex Rivera (Sr. Technician)",
            status="COMPLETED",
            notes="All tolerances within nominal factory specifications."
        ),
        db_models.DBMaintenanceRecord(
            machine_id="MOTOR-004",
            scheduled_date=now + datetime.timedelta(days=1),
            maintenance_type="CORRECTIVE",
            description="Spindle tool assembly replacement and torque recalibration.",
            technician="David Chen (Lead Maintenance Eng)",
            status="SCHEDULED",
            notes="Urgent maintenance requested due to high failure risk alert."
        )
    ]
    db.add_all(maint)

    meta = db_models.DBModelMetadata(
        version="v1.0.0",
        model_name="XGBoost (Production)",
        dataset_name="ai4i2020.csv",
        trained_at=now,
        roc_auc=0.9886,
        pr_auc=0.9277,
        f1_score=0.7164,
        accuracy=0.9747,
        is_active=True
    )
    db.add(meta)

    db.commit()
    print("[Database] Initial database seed with 8 machines successfully completed.")
