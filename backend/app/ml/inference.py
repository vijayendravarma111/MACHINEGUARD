import os
import json
import joblib
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
MODELS_DIR = os.path.join(BASE_DIR, "models")

class MLInferenceEngine:
    def __init__(self):
        self.scaler = None
        self.iso_forest = None
        self.xgb_model = None
        self.diagnosis_model = None
        self.metadata = {}
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
            iso_path = os.path.join(MODELS_DIR, "isolation_forest.joblib")
            xgb_path = os.path.join(MODELS_DIR, "xgb_failure_risk.joblib")
            diag_path = os.path.join(MODELS_DIR, "diagnosis_model.joblib")
            meta_path = os.path.join(MODELS_DIR, "model_registry.json")

            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            if os.path.exists(iso_path):
                self.iso_forest = joblib.load(iso_path)
            if os.path.exists(xgb_path):
                self.xgb_model = joblib.load(xgb_path)
            if os.path.exists(diag_path):
                self.diagnosis_model = joblib.load(diag_path)
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    self.metadata = json.load(f)

            if self.xgb_model and self.iso_forest:
                self.is_loaded = True
                print("[ML Inference Engine] All models loaded successfully.")
            else:
                print("[ML Inference Engine] Warning: Models not found in models directory.")
        except Exception as e:
            print(f"[ML Inference Engine] Error loading models: {e}")
            self.is_loaded = False

    def predict(self, reading_dict: dict) -> dict:
        """
        Input dictionary contains:
        type_code (0,1,2), air_temperature_k, process_temperature_k,
        rotational_speed_rpm, torque_nm, tool_wear_min, temp_difference_k, power_w
        """
        if not self.is_loaded:
            # Fallback heuristic if models fail to load
            return self._fallback_prediction(reading_dict)

        # Map input features into ordered numpy array
        feature_cols = [
            'type_code', 'air_temperature_k', 'process_temperature_k',
            'temp_difference_k', 'rotational_speed_rpm', 'torque_nm',
            'tool_wear_min', 'power_w'
        ]
        
        # Calculate derived if missing
        type_code = reading_dict.get('type_code', 1)
        air_temp = reading_dict['air_temperature_k']
        proc_temp = reading_dict['process_temperature_k']
        speed = reading_dict['rotational_speed_rpm']
        torque = reading_dict['torque_nm']
        tool_wear = reading_dict['tool_wear_min']
        temp_diff = proc_temp - air_temp
        power = speed * torque * (2 * np.pi / 60.0)

        X_raw = np.array([[
            type_code, air_temp, proc_temp, temp_diff, speed, torque, tool_wear, power
        ]])

        # 1. Isolation Forest: Detect unusual or abnormal machine operating conditions
        X_scaled = self.scaler.transform(X_raw) if self.scaler else X_raw
        iso_pred = self.iso_forest.predict(X_scaled)[0] # 1 = normal, -1 = abnormal
        iso_score = float(self.iso_forest.decision_function(X_scaled)[0])
        
        anomaly_state = "NORMAL" if iso_pred == 1 else "ABNORMAL"
        norm_anomaly_score = round(float(np.clip(-iso_score, -1.0, 1.0)), 4)

        # 2. XGBoost Classifier: Predict probability of machine failure
        risk_prob = float(self.xgb_model.predict_proba(X_raw)[0, 1])
        risk_prob = round(float(np.clip(risk_prob, 0.0, 1.0)), 4)

        # Assign Risk Level category
        if risk_prob < 0.20:
            risk_level = "LOW"
        elif risk_prob < 0.50:
            risk_level = "MEDIUM"
        elif risk_prob < 0.75:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        # 3. Machine Health Score (0–100%): Combine anomaly state and predicted failure risk
        penalty = (risk_prob * 60.0) + (25.0 if anomaly_state == "ABNORMAL" else 0.0)
        if temp_diff > 12.0:
            penalty += (temp_diff - 12.0) * 3.0
        if tool_wear > 200:
            penalty += (tool_wear - 200) * 0.2
            
        health_score = max(0.0, min(100.0, round(100.0 - penalty, 1)))


        # 4. Probable Failure Diagnosis
        probable_fault = "Normal Operation"
        if risk_prob > 0.35 or anomaly_state == "ABNORMAL":
            diag_preds = self.diagnosis_model.predict(X_raw)[0]
            diag_labels = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
            active_faults = [label for label, flag in zip(diag_labels, diag_preds) if flag == 1]
            
            fault_map = {
                'TWF': 'Tool Wear Failure',
                'HDF': 'Heat Dissipation Failure',
                'PWF': 'Power Failure',
                'OSF': 'Overstrain Failure',
                'RNF': 'Random Failure'
            }
            if active_faults:
                probable_fault = " / ".join([fault_map.get(f, f) for f in active_faults])
            else:
                # Rule fallback if multi-label model didn't trigger specific flag
                if tool_wear > 200:
                    probable_fault = "Tool Wear Failure Risk"
                elif temp_diff > 11.5 and speed < 1350:
                    probable_fault = "Heat Dissipation Failure Risk"
                elif torque > 65.0 or power > 9000:
                    probable_fault = "Overstrain / Power Failure Risk"
                else:
                    probable_fault = "General Operational Anomaly"

        # 5. Explainability & Factor Contribution Attribution
        contributing_factors = self._explain_attributions(
            X_raw[0], feature_cols, risk_prob, speed, torque, tool_wear, temp_diff, proc_temp
        )

        return {
            "anomaly_score": norm_anomaly_score,
            "anomaly_state": anomaly_state,
            "failure_risk": risk_prob,
            "risk_level": risk_level,
            "health_score": health_score,
            "probable_fault": probable_fault,
            "contributing_factors": contributing_factors,
            "model_version": self.metadata.get("active_version", "v1.0.0")
        }

    def _explain_attributions(self, X_row, feature_cols, risk_prob, speed, torque, tool_wear, temp_diff, proc_temp):
        importances = self.metadata.get("feature_importances", {})
        
        # Calculate deviation attributions
        attributions = []
        
        # Speed impact
        if speed > 2200 or speed < 1250:
            attributions.append({
                "factor_name": "Rotational Speed",
                "impact_level": "HIGH" if speed < 1200 or speed > 2500 else "MODERATE",
                "human_explanation": f"Rotational speed ({speed:.0f} RPM) is operating outside optimal operational window.",
                "attribution_score": float(importances.get("rotational_speed_rpm", 0.33))
            })
            
        # Torque impact
        if torque > 55.0 or torque < 15.0:
            attributions.append({
                "factor_name": "Motor Torque",
                "impact_level": "HIGH" if torque > 65.0 else "MODERATE",
                "human_explanation": f"Torque output ({torque:.1f} Nm) is abnormally elevated under load.",
                "attribution_score": float(importances.get("torque_nm", 0.16))
            })

        # Tool Wear impact
        if tool_wear > 150:
            attributions.append({
                "factor_name": "Tool Wear",
                "impact_level": "HIGH" if tool_wear > 200 else "MODERATE",
                "human_explanation": f"Cumulative tool wear ({tool_wear} min) approaching replacement threshold.",
                "attribution_score": float(importances.get("tool_wear_min", 0.18))
            })

        # Temperature Difference impact
        if temp_diff > 10.5:
            attributions.append({
                "factor_name": "Heat Dissipation",
                "impact_level": "HIGH" if temp_diff > 12.0 else "MODERATE",
                "human_explanation": f"Temperature difference ({temp_diff:.1f} K) between process and ambient indicates thermal strain.",
                "attribution_score": float(importances.get("temp_difference_k", 0.06))
            })

        if not attributions:
            attributions.append({
                "factor_name": "Nominal Operation",
                "impact_level": "LOW",
                "human_explanation": "All monitored operating parameters are within expected baseline limits.",
                "attribution_score": 0.05
            })

        return attributions

    def _fallback_prediction(self, reading_dict):
        return {
            "anomaly_score": 0.0,
            "anomaly_state": "NORMAL",
            "failure_risk": 0.05,
            "risk_level": "LOW",
            "health_score": 95.0,
            "probable_fault": "Normal Operation",
            "contributing_factors": [],
            "model_version": "v1.0.0-fallback"
        }

ml_engine = MLInferenceEngine()
