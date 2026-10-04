import random
import datetime
from typing import Dict, Any

class SensorSimulatorEngine:
    def __init__(self):
        self.states: Dict[str, Dict[str, Any]] = {}

    def get_or_create_state(self, machine_id: str, quality_tier: str = "M") -> dict:
        if machine_id not in self.states:
            self.states[machine_id] = {
                "machine_id": machine_id,
                "scenario": "NORMAL",
                "quality_tier": quality_tier,
                "air_temperature_k": 298.15,
                "process_temperature_k": 308.25,
                "rotational_speed_rpm": 1550.0,
                "torque_nm": 42.5,
                "tool_wear_min": 15,
                "step_count": 0,
                "is_running": False,
                "speed_multiplier": 1.0
            }
        return self.states[machine_id]

    def set_scenario(self, machine_id: str, scenario: str):
        state = self.get_or_create_state(machine_id)
        state["scenario"] = scenario
        state["step_count"] = 0
        
        if scenario == "RESET":
            state["air_temperature_k"] = 298.15
            state["process_temperature_k"] = 308.25
            state["rotational_speed_rpm"] = 1550.0
            state["torque_nm"] = 42.5
            state["tool_wear_min"] = 10
            state["scenario"] = "NORMAL"
            print(f"[Simulator] Machine {machine_id} state reset to nominal baseline.")

    def generate_next_reading(self, machine_id: str, quality_tier: str = "M") -> dict:
        state = self.get_or_create_state(machine_id, quality_tier)
        state["step_count"] += 1
        scenario = state["scenario"]

        # Base physical noise
        air_noise = random.uniform(-0.1, 0.1)
        proc_noise = random.uniform(-0.15, 0.15)
        speed_noise = random.uniform(-8.0, 8.0)
        torque_noise = random.uniform(-0.4, 0.4)

        if scenario == "NORMAL":
            air_temp = round(298.15 + air_noise, 2)
            proc_temp = round(308.25 + proc_noise, 2)
            speed = round(1550.0 + speed_noise, 1)
            torque = round(42.5 + torque_noise, 1)
            state["tool_wear_min"] += random.choice([0, 1])

        elif scenario == "HIGH_LOAD":
            air_temp = round(298.8 + air_noise, 2)
            proc_temp = round(310.2 + proc_noise, 2)
            speed = round(1420.0 + speed_noise, 1)
            torque = round(56.4 + torque_noise, 1)
            state["tool_wear_min"] += random.choice([1, 2])

        elif scenario == "DEGRADATION":
            # Continuous progressive degradation loop over steps
            steps = min(state["step_count"], 35)
            air_temp = round(298.5 + (steps * 0.15) + air_noise, 2)
            proc_temp = round(308.5 + (steps * 0.22) + proc_noise, 2)
            speed = max(1160.0, round(1550.0 - (steps * 11.0) + speed_noise, 1))
            torque = min(76.0, round(42.5 + (steps * 1.0) + torque_noise, 1))
            state["tool_wear_min"] += random.choice([3, 5, 6])

        else: # Default fallback to NORMAL
            air_temp = round(298.15 + air_noise, 2)
            proc_temp = round(308.25 + proc_noise, 2)
            speed = round(1550.0 + speed_noise, 1)
            torque = round(42.5 + torque_noise, 1)
            state["tool_wear_min"] += 1

        state["air_temperature_k"] = air_temp
        state["process_temperature_k"] = proc_temp
        state["rotational_speed_rpm"] = speed
        state["torque_nm"] = torque

        return {
            "machine_id": machine_id,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "air_temperature_k": air_temp,
            "process_temperature_k": proc_temp,
            "rotational_speed_rpm": speed,
            "torque_nm": torque,
            "tool_wear_min": state["tool_wear_min"],
            "quality_tier": state["quality_tier"],
            "is_simulated": True
        }

simulator_engine = SensorSimulatorEngine()
