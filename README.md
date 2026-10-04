# MACHINEGUARD — Predictive Maintenance Digital Twin Platform

**MACHINEGUARD** is a full-stack **Software Digital Twin platform** for industrial machine health monitoring, operational anomaly detection, failure risk prediction, and maintenance management.

The platform ingests machine sensor telemetry, engineers domain-specific physical features, executes dual-model machine learning inference (**Isolation Forest** for unsupervised anomaly detection and **XGBoost** for failure risk prediction, alongside a separate diagnosis model for failure type identification), provides an interactive **What-If simulation lab**, and manages automated alert-to-maintenance workflows.

---

## 🎯 Resume Summary Alignment

This codebase directly supports the following project description:

> **MACHINEGUARD – Predictive Maintenance | Python, FastAPI, XGBoost, Isolation Forest, SQLite, React**
> - Built a **Digital Twin platform** for machine health monitoring, anomaly detection, and predictive maintenance.
> - Implemented **Isolation Forest and XGBoost** with feature engineering, achieving **97.47% accuracy and 94.12% recall**.
> - Developed **What-If simulation, automated alerts, and maintenance workflows** using FastAPI and SQLite.

---

## 🔄 End-to-End System Architecture

```text
Machine Sensor Data
        ↓
     FastAPI
        ↓
Feature Engineering (Thermal Delta ΔT, Mechanical Power P)
        ↓
  Isolation Forest (Unsupervised Anomaly Detection: NORMAL / ABNORMAL)
        ↓
    XGBoost (Supervised Failure Risk Prediction: 0–100%)
        ↓
  Diagnosis Model (Failure Type / Mode Identification)
        ↓
Machine Health Score (0–100%)
        ↓
Automated Alerts & Maintenance Workflows
        ↓
Relational Database (SQLite)
        ↓
React / TypeScript Dashboard
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | Python 3.11, TypeScript | Core backend and frontend development |
| **Backend API** | FastAPI, Uvicorn, Pydantic | High-performance asynchronous REST API |
| **Machine Learning** | XGBoost, Scikit-learn, Pandas, NumPy | Anomaly detection, risk classification & feature engineering |
| **Database** | SQLite, SQLAlchemy ORM | Zero-setup relational storage for machine twin state, sensor logs, alerts, & work orders |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts | Interactive real-time dashboard & What-If simulation sandbox |

---

## 🧠 Machine Learning & Feature Engineering

### 1. Sensor Inputs
- **Air Temperature ($K$)**
- **Process Temperature ($K$)**
- **Rotational Speed ($RPM$)**
- **Torque ($Nm$)**
- **Tool Wear ($min$)**

### 2. Derived Physical Features
- **Temperature Difference ($\Delta T$)**:
  $$\Delta T = \text{Process Temperature} - \text{Air Temperature}$$
  *Captures thermal accumulation and heat dissipation inefficiency.*

- **Mechanical Power ($P$)**:
  $$P = \text{Speed} \times \text{Torque} \times \frac{2\pi}{60}$$
  *Quantifies mechanical strain under operational workload.*

### 3. Model Pipeline & Validated Benchmark Metrics
Dataset: **AI4I 2020 Predictive Maintenance Dataset** ($10,000$ machine operating records).

| Model | Purpose | Metrics (Test Set) |
| :--- | :--- | :--- |
| **Isolation Forest** | Unsupervised Anomaly Detection (`NORMAL` / `ABNORMAL`) | Contamination $\alpha = 0.034$ |
| **XGBoost Classifier** | Supervised Failure Risk Prediction (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) | **Accuracy: 97.47%** \| **Recall: 94.12%** \| ROC-AUC: 0.9886 \| PR-AUC: 0.9277 |
| **Diagnosis Model** | Multi-Label Failure Type / Mode Identification (`TWF`, `HDF`, `PWF`, `OSF`, `RNF`) | Random Forest / Rule-Based Diagnostic Classifier |

---

## 🌟 Key Application Features

1. **Software Digital Twin Engine**: Maintains live health score ($0 - 100\%$), failure risk probability, anomaly state, operating hours, and maintenance status for machine assets in SQLite.
2. **What-If Simulation Sandbox**: Isolated in-memory scenario engine allowing operators to test hypothetical sensor shifts (temperature, RPM, torque, tool wear) and observe predicted health impact **without modifying actual database records**.
3. **Automated Alerts**: Triggers real-time alerts when failure risk is HIGH/CRITICAL, anomaly is ABNORMAL, or health drops below thresholds, with deduplication and acknowledgment workflows.
4. **Maintenance Management**: Closed-loop workflow (Alert → Review → Schedule Work Order → Complete Maintenance → Restore Machine to Healthy Baseline State).

---

## 💻 Setup & Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Environment Setup
No external database installation required. SQLite initializes automatically upon backend launch (`machineguard.db`).

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI application
python -m uvicorn backend.app.main:app --reload --port 8000
```
FastAPI Interactive Docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node packages
npm install

# Start Vite development server
npm run dev
```
Frontend Web Dashboard: `http://localhost:3000`

### 4. Automated Verification
Run the end-to-end system verification test suite:
```bash
python -m scratch.verify_all
```

---

## 🎤 Interview Explanation & Viva Defense (2–3 Minutes)

> "MACHINEGUARD is a software-based Digital Twin platform for predictive maintenance built with Python, FastAPI, XGBoost, Isolation Forest, SQLite, and React.
>
> When machine sensor data—such as temperature, speed, torque, and tool wear—is ingested, FastAPI processes the telemetry and engineers two key domain features: Temperature Difference ($\Delta T$) and Mechanical Power ($P$).
>
> **Isolation Forest is used for unsupervised anomaly detection, while XGBoost predicts machine failure risk (achieving 97.47% accuracy and 94.12% recall on the AI4I dataset). A separate diagnosis model helps identify the possible failure type.**
>
> From these outputs, a consolidated Machine Health Score ($0-100\%$) is computed and updated on the machine's software Digital Twin in SQLite. If health degrades or high risk is predicted, automated alerts are generated. Operators can run isolated **What-If simulations** to test hypothetical operating conditions without altering database records, and trigger maintenance workflows that restore the machine to a healthy baseline state once completed."

---

## 📁 Clean Repository Structure

```text
MACHINEGUARD/
├── backend/
│   ├── app/
│   │   ├── ml/
│   │   │   ├── train.py          # XGBoost & Isolation Forest model training script
│   │   │   └── inference.py      # Real-time ML inference & health score calculation
│   │   ├── api.py                # All FastAPI REST endpoints
│   │   ├── config.py             # Global settings & CORS configuration
│   │   ├── database.py           # SQLite database connection & fleet seed
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── models.py             # SQLAlchemy ORM database models
│   │   ├── schemas.py            # Pydantic data schemas
│   │   ├── services.py           # Combined state engine & alert rule engine
│   │   └── simulation.py         # Telemetry stream simulator
│   └── tests/
│       └── test_api.py           # Pytest test suite (8/8 passing)
├── frontend/                     # React 18 + TypeScript + Vite frontend
├── models/                       # Trained ML models & model registry
├── screenshots/                  # Clean application UI screenshots
├── requirements.txt              # Python dependencies list
├── .gitignore                    # Excludes machineguard.db, .env, node_modules/
└── README.md                     # Project documentation
```
