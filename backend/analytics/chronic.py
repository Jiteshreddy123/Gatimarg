"""
backend/analytics/chronic.py
Two-Horizon Persistent Congestion Engine Wrapper & Adapter.
Refactored to delegate to PersistentCongestionDetector and Two-Horizon Agents
while preserving backward compatibility.
"""

import os
import logging
from typing import Dict, List, Any, Optional

from backend.analytics.persistent_congestion import (
    PersistentCongestionDetector,
    CongestionRootCauseAgent,
    TemporaryCongestionResponseAgent,
    PermanentCongestionResolutionAgent,
    MunicipalResolutionRequestManager,
    PersistentCongestionAlertGenerator
)

logger = logging.getLogger("NeuraXChronic")

class ChronicCongestionEngine:
    _instance = None

    def __init__(self, loader=None):
        self.detector = PersistentCongestionDetector.get_instance()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ChronicCongestionEngine()
        return cls._instance

    def get_all_chronic_hotspots(self) -> List[Dict[str, Any]]:
        return self.detector.get_all_hotspots()

    def get_hotspot_detail(self, segment_id: str) -> Optional[Dict[str, Any]]:
        return self.detector.get_hotspot(segment_id)

    def get_two_horizon_dossier(self, segment_id: str) -> Dict[str, Any]:
        hotspot = self.detector.get_hotspot(segment_id)
        if not hotspot:
            return {"error": f"Segment {segment_id} not found in persistent hotspot registry."}

        root_causes = CongestionRootCauseAgent.diagnose(hotspot)
        temp_response = TemporaryCongestionResponseAgent.evaluate(segment_id)
        perm_resolution = PermanentCongestionResolutionAgent.evaluate(segment_id)
        
        req_mgr = MunicipalResolutionRequestManager.get_instance()
        requests = [r for r in req_mgr.get_all_requests() if r["segment_id"] == segment_id]
        active_request = requests[0] if requests else None

        return {
            "segment_id": segment_id,
            "hotspot_profile": hotspot,
            "root_cause_analysis": root_causes,
            "horizon_1_temporary_response": temp_response,
            "horizon_2_permanent_resolution": perm_resolution,
            "municipal_request": active_request,
            "_provenance": {
                "source": "NEURAX_SMART_CITIES_TRAINING_V2",
                "classification": "DERIVED & SIMULATION",
                "zero_target_leakage": True
            }
        }
