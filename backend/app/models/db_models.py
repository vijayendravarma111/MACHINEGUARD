import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class DBMachine(Base):
    __tablename__ = "machines"
    
    machine_id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    machine_type = Column(String(64), nullable=False, default="Rotating Machine")
    quality_tier = Column(String(8), nullable=False, default="M")
    operating_status = Column(String(32), nullable=False, default="ONLINE")
    current_health = Column(Float, nullable=False, default=100.0)
    current_risk = Column(Float, nullable=False, default=0.0)
    current_anomaly_state = Column(String(16), nullable=False, default="NORMAL")
    operating_hours = Column(Float, nullable=False, default=0.0)
    installation_date = Column(String(32), nullable=False)
    maintenance_status = Column(String(64), nullable=False, default="NORMAL")
    last_reading_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    readings = relationship("DBSensorReading", back_populates="machine", cascade="all, delete-orphan")
    predictions = relationship("DBPrediction", back_populates="machine", cascade="all, delete-orphan")
    alerts = relationship("DBAlert", back_populates="machine", cascade="all, delete-orphan")
    maintenance_records = relationship("DBMaintenanceRecord", back_populates="machine", cascade="all, delete-orphan")

class DBSensorReading(Base):
    __tablename__ = "sensor_readings"
    
    reading_id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(64), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    air_temperature_k = Column(Float, nullable=False)
    process_temperature_k = Column(Float, nullable=False)
    rotational_speed_rpm = Column(Float, nullable=False)
    torque_nm = Column(Float, nullable=False)
    tool_wear_min = Column(Integer, nullable=False)
    temp_difference_k = Column(Float, nullable=False)
    power_w = Column(Float, nullable=False)
    is_simulated = Column(Boolean, nullable=False, default=True)

    machine = relationship("DBMachine", back_populates="readings")

class DBPrediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(64), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    anomaly_score = Column(Float, nullable=False)
    anomaly_state = Column(String(16), nullable=False)
    failure_risk = Column(Float, nullable=False)
    risk_level = Column(String(16), nullable=False)
    probable_fault = Column(String(64), nullable=True)
    contributing_factors = Column(Text, nullable=True)
    model_version = Column(String(32), nullable=False, default="v1.0.0")

    machine = relationship("DBMachine", back_populates="predictions")

class DBAlert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(64), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    severity = Column(String(16), nullable=False)
    reason = Column(String(255), nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="OPEN")
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(64), nullable=True)

    machine = relationship("DBMachine", back_populates="alerts")

class DBMaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    record_id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(64), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    completion_date = Column(DateTime, nullable=True)
    maintenance_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    technician = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False, default="SCHEDULED")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    machine = relationship("DBMachine", back_populates="maintenance_records")

class DBSimulationSession(Base):
    __tablename__ = "simulation_sessions"
    
    session_id = Column(String(64), primary_key=True)
    machine_id = Column(String(64), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False)
    scenario = Column(String(64), nullable=False, default="NORMAL")
    is_active = Column(Boolean, nullable=False, default=True)
    speed_multiplier = Column(Float, nullable=False, default=1.0)
    start_time = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    readings_count = Column(Integer, nullable=False, default=0)

class DBModelMetadata(Base):
    __tablename__ = "model_metadata"
    
    version = Column(String(32), primary_key=True)
    model_name = Column(String(128), nullable=False)
    dataset_name = Column(String(128), nullable=False)
    trained_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    roc_auc = Column(Float, nullable=False)
    pr_auc = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
