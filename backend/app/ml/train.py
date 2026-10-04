import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc, confusion_matrix
)
from xgboost import XGBClassifier
import shap

# --- Configuration & Paths ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_PATH = os.path.join(BASE_DIR, "data", "ai4i2020.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
DOCS_DIR = os.path.join(BASE_DIR, "docs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

FEATURE_COLS = [
    'type_code',
    'air_temperature_k',
    'process_temperature_k',
    'temp_difference_k',
    'rotational_speed_rpm',
    'torque_nm',
    'tool_wear_min',
    'power_w'
]

TARGET_COL = 'machine_failure'
DIAGNOSIS_COLS = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']

def load_and_preprocess_data(csv_path):
    df = pd.read_csv(csv_path)
    
    # Rename columns for standard pythonic access
    rename_map = {
        'Air temperature [K]': 'air_temperature_k',
        'Process temperature [K]': 'process_temperature_k',
        'Rotational speed [rpm]': 'rotational_speed_rpm',
        'Torque [Nm]': 'torque_nm',
        'Tool wear [min]': 'tool_wear_min',
        'Machine failure': 'machine_failure'
    }
    df = df.rename(columns=rename_map)
    
    # Ordinal encode Type
    type_map = {'L': 0, 'M': 1, 'H': 2}
    df['type_code'] = df['Type'].map(type_map)
    
    # Derived physical features (Feature Engineering)
    # 1. Temperature difference between process temperature and ambient air temperature
    df['temp_difference_k'] = df['process_temperature_k'] - df['air_temperature_k']
    
    # 2. Convert rotational speed and torque into mechanical power (Watts)
    df['power_w'] = df['rotational_speed_rpm'] * df['torque_nm'] * (2 * np.pi / 60.0)
    
    return df


def calculate_pr_auc(y_true, y_probs):
    precision_pts, recall_pts, _ = precision_recall_curve(y_true, y_probs)
    return float(auc(recall_pts, precision_pts))

def train_and_evaluate():
    print(f"Loading data from {DATA_PATH}...")
    df = load_and_preprocess_data(DATA_PATH)
    
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    y_diag = df[DIAGNOSIS_COLS]
    
    # Train / Val / Test Split (70/15/15) with stratification
    X_train_val, X_test, y_train_val, y_test, y_diag_train_val, y_diag_test = train_test_split(
        X, y, y_diag, test_size=0.15, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1765, random_state=42, stratify=y_train_val
    )
    
    print(f"Data Split Sizes -> Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    # Save Scaler
    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    joblib.dump(scaler, scaler_path)
    
    # -------------------------------------------------------------
    # 1. Anomaly Detection Engine (Isolation Forest on Normal samples)
    # -------------------------------------------------------------
    print("Training Isolation Forest Anomaly Detector...")
    X_train_normal = X_train_scaled[y_train == 0]
    iso_forest = IsolationForest(n_estimators=150, contamination=0.034, random_state=42)
    iso_forest.fit(X_train_normal)
    iso_path = os.path.join(MODELS_DIR, "isolation_forest.joblib")
    joblib.dump(iso_forest, iso_path)
    
    # -------------------------------------------------------------
    # 2. Failure Risk Models
    # -------------------------------------------------------------
    models = {}
    metrics_summary = {}
    
    # A. Baseline 1: Logistic Regression
    print("Training Baseline 1: Logistic Regression...")
    lr = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train)
    models['Logistic Regression'] = (lr, True)
    
    # B. Baseline 2: Random Forest Classifier
    print("Training Baseline 2: Random Forest Classifier...")
    rf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
    rf.fit(X_train, y_train) # Tree models work directly on unscaled X or scaled X
    models['Random Forest'] = (rf, False)
    
    # C. Production Model: XGBoost Classifier
    print("Training Production Model: XGBoost...")
    scale_pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)
    xgb = XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        base_score=0.5,
        random_state=42,
        eval_metric='logloss'
    )
    xgb.fit(X_train, y_train)
    models['XGBoost (Production)'] = (xgb, False)
    
    # Save Production XGBoost model
    xgb_path = os.path.join(MODELS_DIR, "xgb_failure_risk.joblib")
    joblib.dump(xgb, xgb_path)
    
    # Evaluate all models on Test set
    for model_name, (model_obj, is_scaled) in models.items():
        X_eval = X_test_scaled if is_scaled else X_test
        y_pred = model_obj.predict(X_eval)
        y_prob = model_obj.predict_proba(X_eval)[:, 1]
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_prob)
        pr_auc_val = calculate_pr_auc(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        metrics_summary[model_name] = {
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'roc_auc': round(float(roc), 4),
            'pr_auc': round(float(pr_auc_val), 4),
            'confusion_matrix': cm
        }
    
    # -------------------------------------------------------------
    # 3. Diagnosis Multi-Label Classifier
    # -------------------------------------------------------------
    print("Training Diagnosis Multi-Label Classifier...")
    diag_clf = MultiOutputClassifier(RandomForestClassifier(n_estimators=100, random_state=42))
    diag_clf.fit(X_train, y_diag_train_val.iloc[:len(X_train)])
    diag_path = os.path.join(MODELS_DIR, "diagnosis_model.joblib")
    joblib.dump(diag_clf, diag_path)
    
    # -------------------------------------------------------------
    # 4. Feature Importance & SHAP / Contribution Explainer
    # -------------------------------------------------------------
    print("Computing feature importance baseline...")
    feature_importances = xgb.feature_importances_.tolist()
    feature_importance_dict = {
        col: round(float(imp), 4) for col, imp in zip(FEATURE_COLS, feature_importances)
    }
    
    try:
        explainer = shap.Explainer(xgb)
        print("SHAP Explainer initialized successfully.")
    except Exception as e:
        print(f"SHAP Explainer fallback notice: {e}")

    
    # -------------------------------------------------------------
    # 5. Model Registry JSON
    # -------------------------------------------------------------
    model_version = "v1.0.0"
    registry_data = {
        "active_version": model_version,
        "trained_at": datetime.now().isoformat(),
        "dataset_name": "ai4i2020.csv",
        "dataset_size": len(df),
        "features": FEATURE_COLS,
        "target": TARGET_COL,
        "diagnosis_targets": DIAGNOSIS_COLS,
        "production_model": "XGBoost (Production)",
        "feature_importances": feature_importance_dict,
        "metrics": metrics_summary
    }
    
    registry_path = os.path.join(MODELS_DIR, "model_registry.json")
    with open(registry_path, "w") as f:
        json.dump(registry_data, f, indent=2)
    print(f"Model registry written to {registry_path}")
    
    # -------------------------------------------------------------
    # 6. Generate docs/model_evaluation.md
    # -------------------------------------------------------------
    doc_content = f"""# Model Evaluation & Benchmark Report — MACHINEGUARD

Generated automatically on: `{registry_data['trained_at']}`  
Dataset: `ai4i2020.csv` ({registry_data['dataset_size']} rows)  
Active Model Version: `{model_version}`

---

## 1. Evaluation Methodology

- **Train / Validation / Test Split**: 70% Train (7,000), 15% Validation (1,500), 15% Test (1,500)
- **Stratification**: Preserved 3.39% failure class ratio across all splits.
- **Data Leakage Safeguards**: Excluded sequential ID (`UDI`), Serial (`Product ID`), and concurrent breakdown flags (`TWF`, `HDF`, `PWF`, `OSF`, `RNF`) from feature set $X$.
- **Scaler Isolation**: `StandardScaler` fit solely on training data $X_{{\\text{{train}}}}$.

---

## 2. Comparative Model Metrics (Test Set)

| Model Name | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|---|
"""
    for model_name, m in metrics_summary.items():
        doc_content += f"| **{model_name}** | {m['accuracy']} | {m['precision']} | {m['recall']} | {m['f1_score']} | {m['roc_auc']} | {m['pr_auc']} |\n"
        
    doc_content += """
---

## 3. Detailed Model Metrics & Confusion Matrices

"""
    for model_name, m in metrics_summary.items():
        cm = m['confusion_matrix']
        doc_content += f"""### {model_name}
- **Accuracy**: `{m['accuracy']}`
- **Precision**: `{m['precision']}`
- **Recall**: `{m['recall']}`
- **F1-Score**: `{m['f1_score']}`
- **ROC-AUC**: `{m['roc_auc']}`
- **PR-AUC**: `{m['pr_auc']}`

```
Confusion Matrix (Test Set):
               Predicted Normal (0)   Predicted Failure (1)
Actual Normal         {cm[0][0]:<20} {cm[0][1]}
Actual Failure        {cm[1][0]:<20} {cm[1][1]}
```

"""

    doc_content += """## 4. Production Feature Importances (XGBoost)

"""
    for col, imp in sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True):
        doc_content += f"- **`{col}`**: `{imp}`\n"
        
    eval_doc_path = os.path.join(DOCS_DIR, "model_evaluation.md")
    with open(eval_doc_path, "w") as f:
        f.write(doc_content)
    print(f"Evaluation report generated at {eval_doc_path}")

if __name__ == "__main__":
    train_and_evaluate()
