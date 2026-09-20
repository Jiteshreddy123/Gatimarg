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
from fastapi import FastAPI, HTTPException, Query, Body
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
from backend.analytics.persistent_congestion import (
    PersistentCongestionDetector,
    CongestionRootCauseAgent,
    TemporaryCongestionResponseAgent,
    PermanentCongestionResolutionAgent,
    MunicipalResolutionRequestManager,
    PersistentCongestionAlertGenerator
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("GatiMargAPI")

app = FastAPI(
    title="GatiMarg AI — NeuraX Traffic Intelligence API",
    description="Real dataset-backed urban traffic intelligence, multi-horizon forecasting, two-horizon persistent congestion resolution, and counterfactual simulation.",
    version="3.1.0"
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
persistent_detector = PersistentCongestionDetector.get_instance()
municipal_mgr = MunicipalResolutionRequestManager.get_instance()

# ── Request / Response Schemas ──
class RouteRequest(BaseModel):
    origin_node: str = Field(..., example="N001")
    destination_node: str = Field(..., example="N050")

class SimulationRequest(BaseModel):
    scenario_name: str = Field(..., example="PVNR Ramp Capacity Flare")
    intervention_type: str = Field(..., example="capacity_upgrade")
    target_segment: str = Field(..., example="R0001")
    parameter_delta: float = Field(0.0, example=600.0)

class DiversionEvalRequest(BaseModel):
    target_segment: str = Field(..., example="R0123")
    split_ratio_bypass: float = Field(0.60, example=0.60)
    split_ratio_secondary: float = Field(0.40, example=0.40)

class CounterfactualSimRequest(BaseModel):
    target_segment: str = Field(..., example="R0123")
    candidate_id: Optional[str] = Field(None, example="PLAN0122")
    capacity_delta_vph: Optional[float] = Field(None, example=900.0)

class DisruptionSimRequest(BaseModel):
    target_segment: str = Field(..., example="R0123")
    closure_fraction: float = Field(1.0, example=1.0)
    incident_type: str = Field("simulated_damage", example="simulated_damage")

class MunicipalStatusUpdateRequest(BaseModel):
    status: str = Field(..., example="WORK IN PROGRESS")

class MunicipalGenerateRequest(BaseModel):
    segment_id: str = Field(..., example="R0123")

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
        "platform": "GatiMarg AI NeuraX 3.1",
        "dataset": "NEURAX_SMART_CITIES_TRAINING_V2",
        "segments": len(loader.segments_dict),
        "nodes": len(loader.nodes_dict),
        "persistent_hotspots_detected": len(persistent_detector.get_all_hotspots()),
        "active_municipal_requests": len(municipal_mgr.get_all_requests())
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

# ── 4. Multi-Horizon Forecasting Engine ──
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

# ── 5. Spatial-Temporal Spillback ──
@app.get("/api/spillback/{segment_id}")
def get_spillback_analysis(segment_id: str):
    sid = resolve_segment_id(segment_id)
    result = spillback.analyze_spillback(sid)
    if not result:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found.")
    return result

# ── 6. Constraint-Aware Routing ──
@app.post("/api/routes/plan")
def plan_journey(req: RouteRequest):
    result = routing.plan_citizen_journey_with_bypass(req.origin_node, req.destination_node)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# ── 7. Two-Horizon Persistent Congestion Intelligence ──
@app.get("/api/persistent/hotspots")
@app.get("/api/chronic/hotspots")
def get_persistent_hotspots():
    hotspots = persistent_detector.get_all_hotspots()
    return {
        "hotspots": hotspots,
        "total_hotspots": len(hotspots),
        "_provenance": {
            "source": "15-day sensor historical analysis + network.csv structural bottlenecks",
            "classification": "DERIVED"
        }
    }

@app.get("/api/persistent/hotspots/{segment_id}")
@app.get("/api/chronic/hotspots/{segment_id}")
def get_persistent_hotspot_detail(segment_id: str):
    sid = resolve_segment_id(segment_id)
    dossier = chronic.get_two_horizon_dossier(sid)
    if "error" in dossier:
        raise HTTPException(status_code=404, detail=dossier["error"])
    return dossier

@app.post("/api/persistent/diversion/evaluate")
def evaluate_horizon_1_diversion(req: DiversionEvalRequest):
    sid = resolve_segment_id(req.target_segment)
    result = TemporaryCongestionResponseAgent.evaluate(sid, loader=loader, graph=graph, routing=routing, forecaster=forecaster)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.post("/api/persistent/counterfactual/simulate")
def evaluate_horizon_2_counterfactual(req: CounterfactualSimRequest):
    sid = resolve_segment_id(req.target_segment)
    result = PermanentCongestionResolutionAgent.evaluate(sid, loader=loader, graph=graph)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.post("/api/persistent/disruption/simulate")
def simulate_infrastructure_disruption(req: DisruptionSimRequest):
    sid = resolve_segment_id(req.target_segment)
    target_info = loader.get_segment_telemetry(sid)
    if not target_info:
        raise HTTPException(status_code=404, detail=f"Segment {req.target_segment} not found")
    
    # Counterfactual simulation for road damage/outage
    res = simulation.evaluate_scenario(
        scenario_name=f"Simulated Disruption on {sid}",
        intervention_type="closure",
        target_segment=sid,
        parameter_delta=req.closure_fraction
    )
    
    # Compute emergency diversion & long-term restoration plan
    temp_plan = TemporaryCongestionResponseAgent.evaluate(sid, loader=loader, graph=graph, routing=routing, forecaster=forecaster)
    perm_plan = PermanentCongestionResolutionAgent.evaluate(sid, loader=loader, graph=graph)

    return {
        "scenario_type": "SIMULATED INFRASTRUCTURE DISRUPTION",
        "status_notice": "COUNTERFACTUAL MODEL ONLY - NOT AN ACTUAL HISTORICAL EVENT",
        "affected_segment": sid,
        "closure_fraction": req.closure_fraction,
        "simulation_metrics": res,
        "emergency_temporary_diversion": temp_plan,
        "long_term_restoration_intervention": perm_plan,
        "_provenance": {
            "method": "SIMULATION (Counterfactual Outage Sandbox)",
            "classification": "SIMULATION"
        }
    }

# ── 8. Simulated Municipal Request & Lifecycle Tracking ──
@app.get("/api/persistent/municipal/requests")
def get_all_municipal_requests():
    reqs = municipal_mgr.get_all_requests()
    return {
        "requests": reqs,
        "total_requests": len(reqs),
        "disclaimer": "This is a simulated/advisory workflow. No real municipality or government system is contacted."
    }

@app.post("/api/persistent/municipal/requests/generate")
def generate_municipal_request(req: MunicipalGenerateRequest):
    sid = resolve_segment_id(req.segment_id)
    new_req = municipal_mgr.generate_request_for_segment(sid, loader=loader)
    if "error" in new_req:
        raise HTTPException(status_code=404, detail=new_req["error"])
    return new_req

@app.patch("/api/persistent/municipal/requests/{issue_id}/status")
def update_municipal_status(issue_id: str, payload: MunicipalStatusUpdateRequest):
    updated = municipal_mgr.update_request_status(issue_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Request {issue_id} not found or invalid status {payload.status}")
    return updated

# ── 9. Commuter Early Warning Alerts ──
@app.get("/api/persistent/alerts")
def get_persistent_alerts():
    alerts = PersistentCongestionAlertGenerator.get_active_alerts(loader=loader)
    return {
        "alerts": alerts,
        "total_alerts": len(alerts),
        "_provenance": {
            "source": "15-day recurrence & multi-horizon forecast lookahead",
            "classification": "DERIVED"
        }
    }

# ── 10. Planning Candidates & Legacy Simulation Sandbox ──
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

# ── 11. Context & Event Telemetry ──
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

# ── Decoupled API Root & Standalone Frontend Architecture ──
@app.get("/")
def api_root():
    return {
        "platform": "GatiMarg AI — NeuraX Traffic Intelligence API",
        "status": "ONLINE",
        "version": "3.1.0",
        "dataset": "NEURAX_SMART_CITIES_TRAINING_V2",
        "endpoints": {
            "swagger_docs": "/docs",
            "redoc": "/redoc",
            "health": "/api/health",
            "network_summary": "/api/network/summary",
            "persistent_hotspots": "/api/persistent/hotspots",
            "incidents": "/api/incidents",
            "congestion_ranking": "/api/congestion/ranking",
            "planning_candidates": "/api/planning/candidates",
            "municipal_requests": "/api/persistent/municipal/requests"
        },
        "frontend": {
            "mode": "Decoupled / Independent Server",
            "instructions": "Run frontend independently (e.g. 'python -m http.server 3000 --directory frontend' or run_frontend.bat) and visit http://localhost:3000",
            "fallback_url": "/app"
        }
    }

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend_app")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

