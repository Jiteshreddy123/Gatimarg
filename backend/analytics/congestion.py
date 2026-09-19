"""
backend/analytics/congestion.py
Congestion & Performance Metrics Engine for NeuraX Smart Cities.
Calculates mathematical congestion indices, capacity utilization, and delays.
"""

from typing import Dict, List, Any, Optional
from backend.data_access.loader import DatasetLoader

class CongestionEngine:
    _instance = None

    def __init__(self, loader: Optional[DatasetLoader] = None):
        self.loader = loader or DatasetLoader.get_instance()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = CongestionEngine()
        return cls._instance

    @staticmethod
    def classify_congestion(ci: float) -> str:
        if ci < 0.25:
            return "FREE"
        elif ci < 0.50:
            return "MODERATE"
        elif ci < 0.75:
            return "CONGESTED"
        else:
            return "SEVERE"

    def analyze_segment(self, segment_id: str) -> Optional[Dict[str, Any]]:
        telemetry = self.loader.get_segment_telemetry(segment_id)
        if not telemetry:
            return None

        speed = telemetry.get("speed_kmh", telemetry["free_flow_speed_kmh"])
        ff_speed = telemetry["free_flow_speed_kmh"]
        capacity = telemetry["capacity_vph"]
        flow = telemetry.get("flow_vph", 0.0)
        length_km = telemetry["length_km"]

        # 1. Congestion Index (Formula: 1 - speed/ff_speed clamped to [0, 1])
        ci = max(0.0, min(1.0, 1.0 - (speed / max(1.0, ff_speed))))
        status = self.classify_congestion(ci)

        # 2. Travel Time and Delay
        t_actual = (length_km / max(2.0, speed)) * 60.0
        t_ff = (length_km / max(2.0, ff_speed)) * 60.0
        delay_min = max(0.0, t_actual - t_ff)

        # 3. Capacity Utilization (V/C ratio)
        vc_ratio = round(flow / max(1.0, capacity), 2)

        return {
            "segment_id": segment_id,
            "source_node": telemetry["source_node"],
            "target_node": telemetry["target_node"],
            "road_class": telemetry["road_class"],
            "observed_speed_kmh": speed,
            "free_flow_speed_kmh": ff_speed,
            "flow_vph": flow,
            "capacity_vph": capacity,
            "vc_ratio": vc_ratio,
            "congestion_index": round(ci, 3),
            "status": status,
            "travel_time_min": round(t_actual, 2),
            "free_flow_time_min": round(t_ff, 2),
            "delay_min": round(delay_min, 2),
            "queue_length_veh": telemetry.get("queue_length_veh", 0.0),
            "structural_bottleneck": bool(telemetry.get("structural_bottleneck", 0)),
            "_provenance": {
                "method": "DERIVED (ci = 1 - speed/ff_speed, delay = t_actual - t_ff)",
                "classification": "DERIVED"
            }
        }

    def get_network_congestion_ranking(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns all segments ranked by congestion index descending."""
        results = []
        for seg_id in self.loader.segments_dict.keys():
            analysis = self.analyze_segment(seg_id)
            if analysis:
                results.append(analysis)
        results.sort(key=lambda x: x["congestion_index"], reverse=True)
        return results[:limit]
