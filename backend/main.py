"""
GatiMarg AI Backend
Team Contributors: [Your Name] (Lead), [Friend 2 Name] (Backend)
"""
"""
backend/main.py
FastAPI High-Performance REST API for GatiMarg AI / NeuraX Urban Traffic Platform.
Powered directly by the official NEURAX Smart Cities Training v2 dataset.
Strict Anti-Hallucination & Provenance Guarantee: [DATA] [DERIVED] [MODEL] [SIMULATION].
"""

import logging
import os
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.data_access.loader import DatasetLoader
from backend.analytics.network_graph import NetworkGraph
from backend.analytics.congestion import CongestionEngine
from backend.analytics.spillback import SpillbackEngine
from backend.analytics.routing import RoutingEngine
from backend.analytics.chronic import ChronicCongestionEngine
from backend.analytics.simulation import SimulationEngine
from backend.models.forecaster import MultiHorizonForecaster

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("GatiMargAPI")

app = FastAPI(
    title="GatiMarg AI — NeuraX Traffic Intelligence API",
    description="Real dataset-backed urban traffic intelligence, multi-horizon forecasting, and counterfactual simulation.",
    version="3.0.0"
)

# Enable CORS for local SPA and file:// access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Singletons on Startup
loader = DatasetLoader.get_instance()
graph = NetworkGraph.get_instance()
congestion = CongestionEngine.get_instance()
spillback = SpillbackEngine.get_instance()
routing = RoutingEngine.get_instance()
chronic = ChronicCongestionEngine.get_instance()
simulation = SimulationEngine.get_instance()
forecaster = MultiHorizonForecaster.get_instance()

# ── Request / Response Schemas ──
class RouteRequest(BaseModel):
    origin_node: str = Field(..., example="N001")
    destination_node: str = Field(..., example="N050")

class SimulationRequest(BaseModel):
    scenario_name: str = Field(..., example="PVNR Ramp Capacity Flare")
    intervention_type: str = Field(..., example="capacity_upgrade") # closure, capacity_upgrade, signal_retiming
    target_segment: str = Field(..., example="R0001")
    parameter_delta: float = Field(0.0, example=600.0)

# ── Root UI & Legacy Endpoints ──
@app.get("/legacy", include_in_schema=False)
def serve_legacy():
    html_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "gatimarg_prototype.html")
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return {"message": "Legacy prototype not found"}

# ── 1. Network & Summary Endpoints ──
@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "platform": "GatiMarg AI NeuraX 3.0",
        "dataset": "NEURAX_SMART_CITIES_TRAINING_V2",
        "segments": len(loader.segments_dict),
        "nodes": len(loader.nodes_dict)
    }

@app.get("/api/network/summary")
def get_network_summary():
    return loader.get_network_summary()

@app.get("/api/network/nodes")
def get_all_nodes():
    return {
        "nodes": list(loader.nodes_dict.values()),
        "total_nodes": len(loader.nodes_dict),
        "_provenance": {"source": "nodes.csv", "classification": "DATA"}
    }

@app.get("/api/network/segments")
def get_all_segments(
    road_class: Optional[str] = None,
    bottleneck_only: bool = False,
    limit: int = 500
):
    segments = loader.get_all_segments()
    if road_class:
        segments = [s for s in segments if s.get("road_class") == road_class]
    if bottleneck_only:
        segments = [s for s in segments if s.get("structural_bottleneck", 0) == 1]
    return {
        "segments": segments[:limit],
        "total_returned": min(len(segments), limit),
        "total_segments": len(loader.segments_dict),
        "_provenance": {"source": "network.csv + traffic_validation.csv", "classification": "DATA"}
    }

def resolve_segment_id(seg_id: str) -> str:
    if not seg_id:
        return seg_id
    if seg_id in loader.segments_dict:
        return seg_id
    if seg_id.upper().startswith("SEG-") or seg_id.upper().startswith("SEG_"):
        num_str = seg_id[4:].strip()
        if num_str.isdigit():
            cand = f"R{int(num_str):04d}"
            if cand in loader.segments_dict:
                return cand
    return seg_id

@app.get("/api/network/segments/{segment_id}")
def get_segment_detail(segment_id: str):
    sid = resolve_segment_id(segment_id)
    data = loader.get_segment_telemetry(sid)
    if not data:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found in network.")
    analysis = congestion.analyze_segment(sid)
    if analysis:
        data.update(analysis)
    return data

# ── 2. Congestion & Telemetry Endpoints ──
@app.get("/api/congestion/ranking")
def get_congestion_ranking(limit: int = 30):
    ranking = congestion.get_network_congestion_ranking(limit=limit)
    return {
        "ranking": ranking,
        "_provenance": {
            "method": "DERIVED: CI = 1 - speed/ff_speed",
            "source": "traffic_validation.csv",
            "classification": "DERIVED"
        }
    }

# ── 3. Incident Intelligence Endpoints ──
@app.get("/api/incidents")
def get_incidents(split: Optional[str] = None):
    incidents = loader.incidents_list
    if split:
        incidents = [inc for inc in incidents if inc.get("split") == split]
    
    # Enrich with segment road details
    enriched = []
    for inc in incidents:
        inc_copy = dict(inc)
        seg_info = loader.segments_dict.get(inc["segment_id"])
        if seg_info:
            inc_copy["road_class"] = seg_info["road_class"]
            inc_copy["free_flow_speed_kmh"] = seg_info["free_flow_speed_kmh"]
            inc_copy["lanes"] = seg_info["lanes"]
        enriched.append(inc_copy)

    return {
        "incidents": enriched,
        "total_incidents": len(enriched),
        "_provenance": {
            "source": "incidents_train.csv + incidents_validation.csv",
            "classification": "DATA"
        }
    }

# ── 4. Multi-Horizon Forecasting Engine (Zero Target Leakage) ──
@app.get("/api/forecast/{segment_id}")
def get_segment_forecast(
    segment_id: str,
    intervention: str = Query("active", pattern="^(active|none)$")
):
    sid = resolve_segment_id(segment_id)
    result = forecaster.predict_multi_horizon(sid, intervention_mode=intervention)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

# ── 5. Spatial-Temporal Spillback & Shockwave Propagation ──
@app.get("/api/spillback/{segment_id}")
def get_spillback_analysis(segment_id: str):
    sid = resolve_segment_id(segment_id)
    result = spillback.analyze_spillback(sid)
    if not result:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found.")
    return result

# ── 6. Constraint-Aware Routing & Bypass Engine ──
@app.post("/api/routes/plan")
def plan_journey(req: RouteRequest):
    result = routing.plan_citizen_journey_with_bypass(req.origin_node, req.destination_node)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# ── 7. Chronic Recurring Bottlenecks ──
@app.get("/api/chronic/hotspots")
def get_chronic_hotspots():
    hotspots = chronic.get_all_chronic_hotspots()
    return {
        "hotspots": hotspots,
        "total_hotspots": len(hotspots),
        "_provenance": {
            "source": "15-day sensor historical analysis + network.csv structural bottlenecks",
            "classification": "DERIVED"
        }
    }

@app.get("/api/chronic/hotspots/{segment_id}")
def get_chronic_hotspot_detail(segment_id: str):
    sid = resolve_segment_id(segment_id)
    detail = chronic.get_hotspot_detail(sid)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Chronic hotspot {segment_id} not found.")
    return detail

# ── 8. Planning Candidates & Counterfactual What-If Sandbox ──
@app.get("/api/planning/candidates")
def get_planning_candidates():
    return {
        "candidates": loader.planning_candidates_list,
        "total_candidates": len(loader.planning_candidates_list),
        "_provenance": {
            "source": "planning_candidates.csv",
            "financial_currency_costs": "UNAVAILABLE (dataset contains cost_index 1-24, not rupee values)",
            "classification": "DATA"
        }
    }

@app.post("/api/simulation/evaluate")
def evaluate_what_if_scenario(req: SimulationRequest):
    result = simulation.evaluate_scenario(
        scenario_name=req.scenario_name,
        intervention_type=req.intervention_type,
        target_segment=req.target_segment,
        parameter_delta=req.parameter_delta
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# ── 9. Context & Event Telemetry ──
@app.get("/api/events")
def get_events():
    events = []
    if loader.context_val_df is not None:
        val_events = loader.context_val_df[loader.context_val_df["event_id"].notnull()].copy()
        val_events["split"] = "validation"
        events.extend(val_events.to_dict(orient="records"))
    if loader.context_train_df is not None:
        tr_events = loader.context_train_df[loader.context_train_df["event_id"].notnull()].copy()
        tr_events["split"] = "train"
        events.extend(tr_events.to_dict(orient="records"))
    return {
        "events": events,
        "total_events": len(events),
        "_provenance": {
            "source": "context_train.csv + context_validation.csv",
            "classification": "DATA"
        }
    }

# ── Mount Modular Frontend Static Directory ──
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
