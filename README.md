# MACHINEGUARD — Predictive Maintenance Digital Twin Platform

**MACHINEGUARD** is a full-stack **Software Digital Twin platform** for industrial machine health monitoring, operational anomaly detection, failure risk prediction, and maintenance management.

The platform ingests machine sensor telemetry, engineers domain-specific physical features, executes dual-model machine learning inference (**Isolation Forest** for anomaly detection and **XGBoost** for failure risk prediction), provides an interactive **What-If simulation lab**, and manages automated alert-to-maintenance workflows.

---

## 🎯 Resume Summary Alignment

This codebase directly supports the following project description:

> **MACHINEGUARD – Predictive Maintenance | Python, FastAPI, XGBoost, Isolation Forest, SQLite, React**
> - Built a **Digital Twin platform** for machine health monitoring, anomaly detection, and predictive maintenance.
> - Implemented **Isolation Forest and XGBoost** with feature engineering, achieving **97.47% accuracy and 94.12% recall**.
> - Developed **What-If simulation, automated alerts, and maintenance workflows** using FastAPI and a relational database.

---

## 🔄 End-to-End System Architecture

```text
Machine Sensor Data
        ↓
     FastAPI
        ↓
Feature Engineering (Thermal Delta ΔT, Mechanical Power P)
        ↓
  Isolation Forest (Anomaly Detection: NORMAL / ABNORMAL)
        ↓
    XGBoost (Failure Risk Prediction: 0–100%)
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
| **XGBoost Classifier** | Supervised Failure Risk Classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) | **Accuracy: 97.47%** \| **Recall: 94.12%** \| ROC-AUC: 0.9886 \| PR-AUC: 0.9277 |

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
No external database installation required. SQLite initializes automatically upon backend launch.

### 2. Backend Setup
```bash
# Navigate to project directory
cd backend

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
> We employ a dual-model ML approach:
> 1. An unsupervised **Isolation Forest** model detects operational anomalies (`NORMAL` or `ABNORMAL`).
> 2. A supervised **XGBoost Classifier** predicts failure risk probability, achieving **97.47% accuracy and 94.12% recall** on the AI4I dataset.
>
> From these outputs, a consolidated Machine Health Score ($0-100\%$) is computed and updated on the machine's software Digital Twin in SQLite. If health degrades or high risk is predicted, automated alerts are generated. Operators can run isolated **What-If simulations** to test hypothetical operating conditions without altering database records, and trigger maintenance workflows that restore the machine to a healthy baseline state once completed."

---

## 📁 Clean Repository Structure

```text
MACHINEGUARD/
├── backend/
│   ├── app/
│   │   ├── api/v1/api.py       # REST API Endpoints
│   │   ├── core/               # Database & Settings Config
│   │   ├── ml/                 # Training & Inference Engines
│   │   ├── models/             # SQLAlchemy Database Models
│   │   ├── schemas/            # Pydantic Request/Response Models
│   │   ├── services/           # Alert & State Engines
│   │   └── simulation/         # Sensor Generator
│   ├── main.py                 # FastAPI Application Entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI Elements
│   │   ├── pages/              # Dashboard, Machines, What-If, Alerts, Maintenance
│   │   ├── api/client.ts       # API Client
│   │   └── App.tsx
│   └── package.json
├── models/                     # Saved Models & Registry JSON
├── data/                       # AI4I 2020 Dataset
├── .env                        # Local Environment Config
├── .env.example                # Template Environment File
├── .gitignore
└── README.md
```
