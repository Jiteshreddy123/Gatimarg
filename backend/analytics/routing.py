"""
backend/analytics/routing.py
Constraint-Aware Network Routing & Alternate Bypass Navigation Engine.
Respects 61 turn restrictions from turn_restrictions.csv and dynamic telemetry.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
import networkx as nx

from backend.data_access.loader import DatasetLoader
from backend.analytics.network_graph import NetworkGraph
from backend.analytics.congestion import CongestionEngine

logger = logging.getLogger("NeuraXRouting")

class RoutingEngine:
    _instance = None

    def __init__(self, loader: Optional[DatasetLoader] = None, graph: Optional[NetworkGraph] = None):
        self.loader = loader or DatasetLoader.get_instance()
        self.graph = graph or NetworkGraph.get_instance()
        self.congestion = CongestionEngine.get_instance()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = RoutingEngine()
        return cls._instance

    def _path_nodes_to_segments(self, path_nodes: List[str]) -> List[str]:
        """Converts a sequence of node IDs into a list of segment IDs."""
        segs = []
        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i + 1]
            seg_id = self.graph.endpoints_to_segment.get((u, v))
            if seg_id:
                segs.append(seg_id)
        return segs

    def _validate_turn_restrictions(self, segments: List[str], path_nodes: List[str]) -> bool:
        """Verifies that no consecutive segment transition violates turn_restrictions.csv."""
        for i in range(len(segments) - 1):
            from_seg = segments[i]
            to_seg = segments[i + 1]
            via_node = path_nodes[i + 1]
            if self.graph.is_turn_prohibited(from_seg, via_node, to_seg):
                return False
        return True

    def calculate_route(self, origin_node: str, destination_node: str, penalize_segments: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """Calculates optimal path adhering to turn restrictions and dynamic travel times."""
        if origin_node not in self.graph.graph or destination_node not in self.graph.graph:
            return None

        # Build dynamic weight graph
        G = self.graph.graph.copy()
        dynamic_weights = self.graph.get_dynamic_edge_weights()
        for (u, v), w in dynamic_weights.items():
            if G.has_edge(u, v):
                G[u][v]["weight"] = w

        # Penalize obstructed segments if requested (e.g. for alternate bypass routing)
        if penalize_segments:
            for p_seg in penalize_segments:
                endpoints = self.graph.segment_to_endpoints.get(p_seg)
                if endpoints and G.has_edge(endpoints[0], endpoints[1]):
                    G[endpoints[0]][endpoints[1]]["weight"] *= 10.0 # Heavy impedance detour penalty

        # Find shortest path using Dijkstra
        try:
            # Check up to 5 shortest paths to ensure turn restriction satisfaction
            path_generator = nx.shortest_simple_paths(G, origin_node, destination_node, weight="weight")
            chosen_nodes = None
            chosen_segs = None

            for p_nodes in path_generator:
                p_segs = self._path_nodes_to_segments(p_nodes)
                if self._validate_turn_restrictions(p_segs, p_nodes):
                    chosen_nodes = p_nodes
                    chosen_segs = p_segs
                    break
            
            if not chosen_nodes:
                return None

            # Compute route performance metrics
            total_dist_km = 0.0
            total_travel_time_min = 0.0
            total_free_flow_time_min = 0.0
            obstructed_segments = []
            segment_details = []

            # Check active incidents
            active_inc_segs = {inc["segment_id"]: inc for inc in self.loader.incidents_list if inc.get("split") == "validation"}

            for seg_id in chosen_segs:
                analysis = self.congestion.analyze_segment(seg_id)
                if not analysis:
                    continue
                
                total_dist_km += analysis.get("length_km", 1.5)
                total_travel_time_min += analysis["travel_time_min"]
                total_free_flow_time_min += analysis["free_flow_time_min"]

                is_congested = analysis["congestion_index"] >= 0.50
                has_incident = seg_id in active_inc_segs
                
                if is_congested or has_incident:
                    reason = []
                    if has_incident:
                        inc = active_inc_segs[seg_id]
                        reason.append(f"{inc['incident_type'].replace('_', ' ').title()} (Sev {inc['severity']})")
                    if is_congested:
                        reason.append(f"Congestion {round(analysis['congestion_index']*100)}% (Speed {analysis['observed_speed_kmh']} km/h)")
                    
                    obstructed_segments.append({
                        "segment_id": seg_id,
                        "road_class": analysis["road_class"],
                        "reasons": reason,
                        "delay_min": analysis["delay_min"]
                    })

                segment_details.append({
                    "segment_id": seg_id,
                    "speed_kmh": analysis["observed_speed_kmh"],
                    "free_flow_speed_kmh": analysis["free_flow_speed_kmh"],
                    "congestion_index": analysis["congestion_index"],
                    "delay_min": analysis["delay_min"]
                })

            return {
                "origin_node": origin_node,
                "destination_node": destination_node,
                "path_nodes": chosen_nodes,
                "path_segments": chosen_segs,
                "total_distance_km": round(total_dist_km, 2),
                "estimated_travel_time_min": round(total_travel_time_min, 1),
                "free_flow_time_min": round(total_free_flow_time_min, 1),
                "total_delay_min": round(max(0.0, total_travel_time_min - total_free_flow_time_min), 1),
                "has_obstruction": len(obstructed_segments) > 0,
                "obstructed_segments": obstructed_segments,
                "segment_details": segment_details,
                "_provenance": {
                    "method": "DERIVED (Dijkstra Shortest Path on Directed Graph with Turn Restrictions)",
                    "classification": "DERIVED"
                }
            }
        except nx.NetworkXNoPath:
            return None

    def plan_citizen_journey_with_bypass(self, origin_node: str, destination_node: str) -> Dict[str, Any]:
        """Calculates default journey, detects ahead bottlenecks, and offers low-congestion legal bypass."""
        primary_route = self.calculate_route(origin_node, destination_node)
        if not primary_route:
            return {"error": f"No valid route found between {origin_node} and {destination_node}."}

        bypass_route = None
        time_saved_min = 0.0

        if primary_route["has_obstruction"]:
            obstructed_ids = [obs["segment_id"] for obs in primary_route["obstructed_segments"]]
            detour = self.calculate_route(origin_node, destination_node, penalize_segments=obstructed_ids)
            
            if detour and detour["path_segments"] != primary_route["path_segments"]:
                bypass_route = detour
                time_saved_min = round(max(0.0, primary_route["estimated_travel_time_min"] - detour["estimated_travel_time_min"]), 1)

        return {
            "origin_node": origin_node,
            "destination_node": destination_node,
            "primary_route": primary_route,
            "bypass_recommended": bypass_route is not None,
            "bypass_route": bypass_route,
            "time_saved_min": time_saved_min,
            "_provenance": {
                "method": "DERIVED (Dynamic Route Optimization with Turn Restriction Compliance)",
                "classification": "DERIVED"
            }
        }
