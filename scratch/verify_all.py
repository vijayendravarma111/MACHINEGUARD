import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal
from backend.app.models import DBMachine, DBAlert, DBMaintenanceRecord
from backend.app.ml.inference import ml_engine

def run_verification():
    print("=" * 70)
    print("      MACHINEGUARD — COMPREHENSIVE END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Initialize & Verify Database (Relational SQLite)
    print("\n[Step 1] Initializing Relational Database & Seeding Fleet...")
    init_db()
    db = SessionLocal()
    machines = db.query(DBMachine).all()
    print(f"-> Database Connection Verified! Fleet count: {len(machines)} machines.")
    assert len(machines) == 8, f"Expected 8 machines, found {len(machines)}"
    db.close()


    # 2. TestClient Setup
    client = TestClient(app)

    # 3. Test API Health
    print("\n[Step 2] Testing /api/system/health Endpoint...")
    res = client.get("/api/system/health")
    assert res.status_code == 200
    health_data = res.json()
    print("-> System Health:", health_data)
    assert health_data["database_connected"] is True
    assert health_data["ml_models_loaded"] is True

    # 4. Verify ML Inference Engine & Model Metrics
    print("\n[Step 3] Verifying ML Inference & Model Metrics...")
    meta = ml_engine.metadata
    print(f"-> Production Model: {meta.get('production_model')}")
    xgb_metrics = meta["metrics"]["XGBoost (Production)"]
    acc = xgb_metrics["accuracy"]
    rec = xgb_metrics["recall"]
    print(f"-> XGBoost Validated Metrics: Accuracy = {acc * 100:.2f}%, Recall = {rec * 100:.2f}%")
    assert acc == 0.9747, f"Expected accuracy 0.9747, got {acc}"
    assert rec == 0.9412, f"Expected recall 0.9412, got {rec}"

    # 5. Test Anomaly Detection & Failure Risk Inference
    print("\n[Step 4] Testing Isolation Forest & XGBoost Predictions...")
    sample_input = {
        "type_code": 1,
        "air_temperature_k": 298.15,
        "process_temperature_k": 315.0, # High temp diff = 16.85 K
        "rotational_speed_rpm": 1200.0,
        "torque_nm": 68.0,
        "tool_wear_min": 210
    }
    pred = ml_engine.predict(sample_input)
    print("-> Inference Results:", json.dumps(pred, indent=2))
    assert pred["anomaly_state"] in ["NORMAL", "ABNORMAL"]
    assert pred["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert 0.0 <= pred["health_score"] <= 100.0

    # 6. Test Posting New Sensor Reading (Digital Twin Update)
    print("\n[Step 5] Testing Sensor Reading Post & Digital Twin State Update...")
    reading_payload = {
        "machine_id": "MOTOR-001",
        "air_temperature_k": 298.2,
        "process_temperature_k": 308.3,
        "rotational_speed_rpm": 1545.0,
        "torque_nm": 43.0,
        "tool_wear_min": 25,
        "quality_tier": "M",
        "is_simulated": True
    }
    res = client.post("/api/readings", json=reading_payload)
    assert res.status_code == 200
    reading_res = res.json()
    print("-> Sensor Reading Processed:", reading_res)
    assert reading_res["status"] == "SUCCESS"

    # 7. Test Alerts Retrieval & Acknowledgment
    print("\n[Step 6] Testing Automated Alerts & Acknowledgment Workflow...")
    res = client.get("/api/alerts")
    assert res.status_code == 200
    alerts = res.json()
    print(f"-> Total Alerts in Database: {len(alerts)}")
    if alerts:
        target_alert = alerts[0]
        alert_id = target_alert["alert_id"]
        ack_res = client.post(f"/api/alerts/{alert_id}/acknowledge", json={"acknowledged_by": "Shift Lead Varma"})
        assert ack_res.status_code == 200
        print(f"-> Alert #{alert_id} Acknowledged: {ack_res.json()['status']}")

    # 8. Test Maintenance Creation & Completion Workflow
    print("\n[Step 7] Testing Maintenance Order Creation & Completion Workflow...")
    maint_payload = {
        "machine_id": "MOTOR-004",
        "scheduled_date": "2026-10-05T10:00:00Z",
        "maintenance_type": "CORRECTIVE",
        "description": "Urgent spindle replacement and torque recalibration",
        "technician": "Lead Eng. Alex",
        "notes": "Triggered from high failure risk alert"
    }
    create_maint_res = client.post("/api/maintenance", json=maint_payload)
    if create_maint_res.status_code == 400:
        print("-> Active maintenance order already exists for MOTOR-004.")
    else:
        assert create_maint_res.status_code == 201
        m_rec = create_maint_res.json()
        print(f"-> Maintenance Record #{m_rec['record_id']} Created for {m_rec['machine_id']}")
        
        # Complete Maintenance
        comp_res = client.post(f"/api/maintenance/{m_rec['record_id']}/complete")
        assert comp_res.status_code == 200
        print(f"-> Maintenance Record #{m_rec['record_id']} Completed! Machine Twin Health Reset.")

    # 9. Test What-If Simulation Sandbox (In-Memory Non-Mutating)
    print("\n[Step 8] Testing What-If Simulation Sandbox...")
    what_if_payload = {
        "machine_id": "MOTOR-001",
        "process_temperature_k": 318.5,
        "rotational_speed_rpm": 1200.0,
        "torque_nm": 72.0,
        "tool_wear_min": 215
    }
    res = client.post("/api/simulation/what-if", json=what_if_payload)
    assert res.status_code == 200
    what_if_data = res.json()
    print("-> What-If Current Health:", what_if_data["current_state"]["health_score"])
    print("-> What-If Simulated Health:", what_if_data["simulated_state"]["health_score"])
    print("-> Assessment:", what_if_data["scenario_assessment"])
    assert "MODEL-ESTIMATED" in what_if_data["disclaimer"]

    print("\n" + "=" * 70)
    print("      ALL 8 END-TO-END VERIFICATION CHECKS PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
