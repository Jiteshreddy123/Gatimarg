"""
backend/analytics/network_graph.py
Network Graph Model for NeuraX Smart Cities.
Builds directed graph of 120 nodes and 436 edges with turn restriction enforcement.
"""

import logging
from typing import Dict, List, Tuple, Set, Optional, Any
import networkx as nx
from backend.data_access.loader import DatasetLoader

logger = logging.getLogger("NeuraXGraph")

class NetworkGraph:
    _instance = None

    def __init__(self, loader: Optional[DatasetLoader] = None):
        self.loader = loader or DatasetLoader.get_instance()
        self.graph = nx.DiGraph()
        self.turn_restrictions: Set[Tuple[str, str, str]] = set() # (node_id, from_seg, to_seg)
        self.segment_to_endpoints: Dict[str, Tuple[str, str]] = {}
        self.endpoints_to_segment: Dict[Tuple[str, str], str] = {}
        self.build_graph()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = NetworkGraph()
        return cls._instance

    def build_graph(self):
        logger.info("Building NetworkX directed graph from nodes and network edges...")
        
        # 1. Add Vertices
        for node_id, n_data in self.loader.nodes_dict.items():
            self.graph.add_node(
                node_id,
                x=n_data["x"],
                y=n_data["y"],
                lat=n_data["lat"],
                lon=n_data["lon"]
            )

        # 2. Add Directed Edges
        for seg_id, s_data in self.loader.segments_dict.items():
            u = s_data["source_node"]
            v = s_data["target_node"]
            length_km = s_data["length_km"]
            ff_speed = s_data["free_flow_speed_kmh"]
            ff_time_min = (length_km / ff_speed) * 60.0

            self.segment_to_endpoints[seg_id] = (u, v)
            self.endpoints_to_segment[(u, v)] = seg_id

            self.graph.add_edge(
                u, v,
                segment_id=seg_id,
                length_km=length_km,
                lanes=s_data["lanes"],
                capacity_vph=s_data["capacity_vph"],
                free_flow_speed_kmh=ff_speed,
                free_flow_time_min=ff_time_min,
                weight=ff_time_min, # Default static edge weight
                road_class=s_data["road_class"],
                structural_bottleneck=s_data["structural_bottleneck"],
                importance=s_data["importance"]
            )

        # 3. Register Turn Restrictions
        if self.loader.turn_restrictions_df is not None:
            for _, row in self.loader.turn_restrictions_df.iterrows():
                node_id = str(row["node_id"])
                from_seg = str(row["from_segment"])
                to_seg = str(row["to_segment"])
                self.turn_restrictions.add((node_id, from_seg, to_seg))

        logger.info(
            f"Graph built: {self.graph.number_of_nodes()} nodes, "
            f"{self.graph.number_of_edges()} directed edges, "
            f"{len(self.turn_restrictions)} turn restrictions."
        )

    def is_turn_prohibited(self, from_segment: str, via_node: str, to_segment: str) -> bool:
        """Checks if moving from from_segment into to_segment via via_node is prohibited."""
        return (via_node, from_segment, to_segment) in self.turn_restrictions

    def get_upstream_segments(self, segment_id: str) -> List[str]:
        """Returns all direct upstream segments feeding into segment_id."""
        endpoints = self.segment_to_endpoints.get(segment_id)
        if not endpoints:
            return []
        source_node, _ = endpoints
        # Upstream edges are in-edges of source_node
        upstream_segs = []
        for u, _ in self.graph.in_edges(source_node):
            up_seg = self.endpoints_to_segment.get((u, source_node))
            if up_seg and up_seg != segment_id:
                upstream_segs.append(up_seg)
        return upstream_segs

    def get_downstream_segments(self, segment_id: str) -> List[str]:
        """Returns all direct downstream segments flowing out of segment_id."""
        endpoints = self.segment_to_endpoints.get(segment_id)
        if not endpoints:
            return []
        _, target_node = endpoints
        # Downstream edges are out-edges of target_node
        downstream_segs = []
        for _, v in self.graph.out_edges(target_node):
            dn_seg = self.endpoints_to_segment.get((target_node, v))
            if dn_seg and dn_seg != segment_id:
                downstream_segs.append(dn_seg)
        return downstream_segs

    def get_dynamic_edge_weights(self) -> Dict[Tuple[str, str], float]:
        """Calculates current dynamic travel times for all edges based on latest speed telemetry."""
        weights = {}
        for (u, v), seg_id in self.endpoints_to_segment.items():
            edge_data = self.graph[u][v]
            length_km = edge_data["length_km"]
            ff_speed = edge_data["free_flow_speed_kmh"]
            
            # Check latest telemetry
            live_data = self.loader.latest_traffic_by_segment.get(seg_id)
            if live_data and live_data.get("speed_kmh", 0) > 1.0:
                speed = live_data["speed_kmh"]
            else:
                speed = ff_speed
            
            travel_time_min = (length_km / max(2.0, speed)) * 60.0
            weights[(u, v)] = round(travel_time_min, 3)
        return weights
