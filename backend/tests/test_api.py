import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

client = TestClient(app)

def test_system_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["database_connected"] is True
    assert data["ml_models_loaded"] is True

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_machines" in data
    assert data["total_machines"] >= 5
    assert "machines" in data

def test_list_machines():
    response = client.get("/api/machines")
    assert response.status_code == 200
    machines = response.json()
    assert isinstance(machines, list)
    assert len(machines) >= 5

def test_get_machine_details():
    response = client.get("/api/machines/MOTOR-001")
    assert response.status_code == 200
    data = response.json()
    assert data["machine_id"] == "MOTOR-001"
    assert "current_health" in data

def test_simulation_step():
    response = client.post("/api/simulation/step?machine_id=MOTOR-001")
    assert response.status_code == 200
    data = response.json()
    assert data["machine_id"] == "MOTOR-001"
    assert "telemetry" in data
    assert "machine_state" in data
    assert 0.0 <= data["machine_state"]["current_risk"] <= 1.0
    assert 0.0 <= data["machine_state"]["current_health"] <= 100.0

def test_post_sensor_reading():
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
    response = client.post("/api/readings", json=reading_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["machine_id"] == "MOTOR-001"

def test_list_alerts():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

def test_model_metadata():
    response = client.get("/api/model/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "active_version" in data
    assert "metrics" in data
