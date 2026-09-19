"""
backend/analytics/simulation.py
Counterfactual What-If Simulation Engine.
Evaluates scenario interventions (segment closure, capacity upgrade, signal retiming).
Computes baseline vs scenario delay deltas across network graph.
"""

import logging
from typing import Dict, List, Any, Optional
import networkx as nx

from backend.data_access.loader import DatasetLoader
from backend.analytics.network_graph import NetworkGraph
from backend.analytics.congestion import CongestionEngine

logger = logging.getLogger("NeuraXSimulation")

class SimulationEngine:
    _instance = None

    def __init__(self, loader: Optional[DatasetLoader] = None, graph: Optional[NetworkGraph] = None):
        self.loader = loader or DatasetLoader.get_instance()
        self.graph = graph or NetworkGraph.get_instance()
        self.congestion = CongestionEngine.get_instance()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SimulationEngine()
        return cls._instance

    def evaluate_scenario(
        self,
        scenario_name: str,
        intervention_type: str, # 'closure', 'capacity_upgrade', 'signal_retiming', 'lane_addition'
        target_segment: str,
        parameter_delta: float = 0.0 # e.g. capacity delta vph, closure fraction
    ) -> Dict[str, Any]:
        """
        Simulates counterfactual network state:
        Calculates baseline vs scenario travel times, delay change, and affected corridors.
        """
        target_info = self.loader.get_segment_telemetry(target_segment)
        if not target_info:
            return {"error": f"Target segment {target_segment} not found in network."}

        baseline_speed = target_info.get("speed_kmh", target_info["free_flow_speed_kmh"])
        ff_speed = target_info["free_flow_speed_kmh"]
        baseline_capacity = target_info["capacity_vph"]
        baseline_flow = target_info.get("flow_vph", 1200.0)
        length_km = target_info["length_km"]

        # 1. Baseline Metrics
        baseline_t_min = (length_km / max(2.0, baseline_speed)) * 60.0
        baseline_delay_min = max(0.0, baseline_t_min - (length_km / ff_speed * 60.0))

        # 2. Scenario Execution
        scenario_capacity = baseline_capacity
        scenario_speed = baseline_speed
        assumptions = []

        if intervention_type == "closure":
            closure_fraction = max(0.2, min(1.0, parameter_delta or 0.5))
            scenario_capacity = baseline_capacity * (1.0 - closure_fraction)
            # Speed drop proportional to capacity loss
            scenario_speed = max(4.0, baseline_speed * (1.0 - (closure_fraction * 0.75)))
            assumptions.append(f"Carriageway capacity reduced by {round(closure_fraction * 100)}% due to closure/incident.")
            assumptions.append("Diverting vehicles re-distribute across parallel feeder corridors.")

        elif intervention_type in ["capacity_upgrade", "lane_addition"]:
            cap_delta = parameter_delta if parameter_delta > 0 else 600.0
            scenario_capacity = baseline_capacity + cap_delta
            # Speed recovery towards free-flow
            scenario_speed = min(ff_speed, baseline_speed + ((cap_delta / max(1.0, baseline_capacity)) * 25.0))
            assumptions.append(f"Carriageway capacity augmented by +{int(cap_delta)} vph via physical expansion.")
            assumptions.append("Bottleneck friction eliminated, restoring near free-flow operating conditions.")

        elif intervention_type == "signal_retiming":
            scenario_capacity = baseline_capacity * 1.15
            scenario_speed = min(ff_speed, baseline_speed * 1.35)
            assumptions.append("Optimized green phase split allocates +15% dynamic discharge capacity.")
            assumptions.append("Platoon progression coordinated along upstream feeder corridor.")

        scenario_t_min = (length_km / max(2.0, scenario_speed)) * 60.0
        scenario_delay_min = max(0.0, scenario_t_min - (length_km / ff_speed * 60.0))
        
        speed_delta = round(scenario_speed - baseline_speed, 1)
        travel_time_saved_min = round(baseline_t_min - scenario_t_min, 2)
        total_veh_hours_saved = round((travel_time_saved_min / 60.0) * baseline_flow * 4.0, 1) # 4 peak hours

        # Affected network corridors
        upstream_feeders = self.graph.get_upstream_segments(target_segment)

        return {
            "scenario_name": scenario_name,
            "target_segment": target_segment,
            "intervention_type": intervention_type,
            "assumptions": assumptions,
            "baseline": {
                "speed_kmh": round(baseline_speed, 1),
                "capacity_vph": round(baseline_capacity, 0),
                "travel_time_min": round(baseline_t_min, 2),
                "delay_min": round(baseline_delay_min, 2)
            },
            "simulated_outcome": {
                "speed_kmh": round(scenario_speed, 1),
                "capacity_vph": round(scenario_capacity, 0),
                "travel_time_min": round(scenario_t_min, 2),
                "delay_min": round(scenario_delay_min, 2),
                "speed_change_kmh": speed_delta,
                "travel_time_saved_min": travel_time_saved_min,
                "projected_peak_delay_hours_saved": max(0.0, total_veh_hours_saved)
            },
            "affected_network_corridors": upstream_feeders,
            "_provenance": {
                "method": "SIMULATION (Counterfactual Network Graph Re-computation)",
                "assumptions_disclosed": True,
                "classification": "SIMULATION"
            }
        }
