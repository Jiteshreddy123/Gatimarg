"""
backend/analytics/spillback.py
Spatial-Temporal Spillback & Shockwave Propagation Engine.
Analyzes upstream corridor degradation and shockwave speeds on real network graph.
"""

from typing import Dict, List, Any, Optional
from backend.data_access.loader import DatasetLoader
from backend.analytics.network_graph import NetworkGraph
from backend.analytics.congestion import CongestionEngine

class SpillbackEngine:
    _instance = None

    def __init__(self, loader: Optional[DatasetLoader] = None, graph: Optional[NetworkGraph] = None):
        self.loader = loader or DatasetLoader.get_instance()
        self.graph = graph or NetworkGraph.get_instance()
        self.congestion = CongestionEngine.get_instance()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SpillbackEngine()
        return cls._instance

    def analyze_spillback(self, segment_id: str) -> Optional[Dict[str, Any]]:
        """Analyzes downstream bottleneck and estimates upstream propagation."""
        primary = self.congestion.analyze_segment(segment_id)
        if not primary:
            return None

        upstream_seg_ids = self.graph.get_upstream_segments(segment_id)
        upstream_impacts = []
        
        # Primary corridor speed and queue
        v_primary = primary["observed_speed_kmh"]
        ff_primary = primary["free_flow_speed_kmh"]
        q_primary = primary["flow_vph"]
        queue_veh = primary["queue_length_veh"]

        # Calculate shockwave speed (w = delta_q / delta_k)
        # Approximate density k = flow / speed
        k_down = q_primary / max(5.0, v_primary)
        
        for up_id in upstream_seg_ids:
            up_analysis = self.congestion.analyze_segment(up_id)
            if not up_analysis:
                continue
            
            v_up = up_analysis["observed_speed_kmh"]
            q_up = up_analysis["flow_vph"]
            k_up = q_up / max(5.0, v_up)
            
            # Shockwave velocity
            delta_q = q_primary - q_up
            delta_k = k_down - k_up
            if abs(delta_k) > 0.01:
                w_kmh = round(delta_q / delta_k, 1)
            else:
                w_kmh = 0.0

            # Distance to upstream junction
            up_length = up_analysis.get("length_km", 1.5)
            # Estimated time to shockwave arrival (min)
            if w_kmh < -1.0: # Backward-forming shockwave
                eta_min = round((up_length / abs(w_kmh)) * 60.0, 1)
            else:
                eta_min = None

            upstream_impacts.append({
                "upstream_segment_id": up_id,
                "road_class": up_analysis["road_class"],
                "current_speed_kmh": v_up,
                "free_flow_speed_kmh": up_analysis["free_flow_speed_kmh"],
                "congestion_index": up_analysis["congestion_index"],
                "status": up_analysis["status"],
                "shockwave_speed_kmh": w_kmh,
                "time_to_impact_min": eta_min,
                "risk_level": "CRITICAL" if (eta_min and eta_min < 15.0) else ("HIGH" if up_analysis["congestion_index"] > 0.4 else "MODERATE")
            })

        # Suggest alternate diversion feeders (parallel outgoing segments from same upstream source)
        endpoints = self.graph.segment_to_endpoints.get(segment_id)
        alternate_diversions = []
        if endpoints:
            source_node, _ = endpoints
            for _, alt_v in self.graph.graph.out_edges(source_node):
                alt_seg = self.graph.endpoints_to_segment.get((source_node, alt_v))
                if alt_seg and alt_seg != segment_id:
                    alt_data = self.congestion.analyze_segment(alt_seg)
                    if alt_data and alt_data["congestion_index"] < 0.4:
                        alternate_diversions.append({
                            "segment_id": alt_seg,
                            "speed_kmh": alt_data["observed_speed_kmh"],
                            "congestion_index": alt_data["congestion_index"],
                            "status": alt_data["status"]
                        })

        return {
            "choke_point_segment": segment_id,
            "choke_status": primary["status"],
            "observed_speed_kmh": v_primary,
            "congestion_index": primary["congestion_index"],
            "queue_length_veh": queue_veh,
            "upstream_feeder_count": len(upstream_impacts),
            "upstream_affected_routes": upstream_impacts,
            "recommended_alternate_diversions": alternate_diversions,
            "_provenance": {
                "method": "DERIVED (LWR Shockwave w = delta_q / delta_k, Upstream Graph Traversal)",
                "classification": "DERIVED"
            }
        }
