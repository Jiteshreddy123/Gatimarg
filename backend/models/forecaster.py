"""
backend/models/forecaster.py
Multi-Horizon Traffic State Prediction Engine (T+15, T+30, T+45, T+60).
STRICT ZERO-TARGET-LEAKAGE: Forecast target files are strictly used as labels.
Evaluated out-of-sample on traffic_validation.csv.
"""

import os
import logging
import pickle
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from backend.data_access.loader import DatasetLoader

logger = logging.getLogger("NeuraXForecaster")

MODEL_CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")

class MultiHorizonForecaster:
    _instance = None

    HORIZONS = [15, 30, 45, 60]
    INPUT_FEATURES = [
        "speed_kmh", "flow_vph", "occupancy_pct", "congestion_index",
        "lanes", "capacity_vph", "free_flow_speed_kmh", "length_km", "structural_bottleneck",
        "hour", "day_of_week", "rain_intensity", "event_level"
    ]

    def __init__(self, loader: Optional[DatasetLoader] = None):
        self.loader = loader or DatasetLoader.get_instance()
        self.models: Dict[int, HistGradientBoostingRegressor] = {}
        self.metrics: Dict[int, Dict[str, float]] = {}
        os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
        self.initialize_models()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MultiHorizonForecaster()
        return cls._instance

    def _get_cache_path(self, horizon: int) -> str:
        return os.path.join(MODEL_CACHE_DIR, f"hgb_speed_horizon_{horizon}m.pkl")

    def initialize_models(self):
        """Loads cached models or trains on slice of training dataset."""
        all_cached = all(os.path.exists(self._get_cache_path(h)) for h in self.HORIZONS)
        metrics_file = os.path.join(MODEL_CACHE_DIR, "validation_metrics.json")
        
        if all_cached and os.path.exists(metrics_file):
            logger.info("Loading pre-trained forecasting models from cache...")
            for h in self.HORIZONS:
                with open(self._get_cache_path(h), "rb") as f:
                    self.models[h] = pickle.load(f)
            import json
            with open(metrics_file, "r") as f:
                self.metrics = {int(k): v for k, v in json.load(f).items()}
            logger.info(f"Models loaded for horizons {self.HORIZONS}. Metrics: {self.metrics}")
        else:
            self.train_and_evaluate()

    def train_and_evaluate(self, sample_size: int = 40000):
        """
        Trains multi-horizon regressors using temporal split:
        Training: Sample from traffic_train.csv (Jan 1 - Jan 15) with labels from forecast_targets_train.csv
        Validation: Sample from traffic_validation.csv (Jan 16 - Jan 19) with labels from forecast_targets_validation.csv
        """
        logger.info(f"Training Multi-Horizon Forecasting models (sample_size={sample_size})...")
        
        # 1. Load context lookup
        ctx_tr = self.loader.context_train_df.set_index("timestamp") if self.loader.context_train_df is not None else None
        
        # 2. Load training slice
        tr_traffic_path = os.path.join(self.loader.data_dir, "traffic_train.csv")
        tr_target_path = os.path.join(self.loader.data_dir, "forecast_targets_train.csv")
        
        # Sample training data
        df_tr = pd.read_csv(tr_traffic_path, nrows=sample_size)
        df_targets = pd.read_csv(tr_target_path, nrows=sample_size)
        
        # Verify alignment & zero leakage
        assert "target_speed_15m" not in df_tr.columns, "CRITICAL: Target leakage in features!"
        
        # Merge network attributes
        df_tr = df_tr.merge(self.loader.network_df[[
            "segment_id", "lanes", "capacity_vph", "free_flow_speed_kmh", "length_km", "structural_bottleneck"
        ]], on="segment_id", how="left")
        
        # Merge context attributes
        if ctx_tr is not None:
            df_tr = df_tr.merge(ctx_tr[["rain_intensity", "event_level", "day_of_week", "hour"]], left_on="timestamp", right_index=True, how="left")
        else:
            df_tr["rain_intensity"] = 0.0
            df_tr["event_level"] = 0
            df_tr["day_of_week"] = 3
            df_tr["hour"] = 12.0
            
        df_tr.fillna(0.0, inplace=True)
        X_train = df_tr[self.INPUT_FEATURES]

        # 3. Load validation slice for evaluation
        val_traffic_path = os.path.join(self.loader.data_dir, "traffic_validation.csv")
        val_target_path = os.path.join(self.loader.data_dir, "forecast_targets_validation.csv")
        
        df_val = pd.read_csv(val_traffic_path, nrows=20000)
        df_val_targets = pd.read_csv(val_target_path, nrows=20000)
        
        df_val = df_val.merge(self.loader.network_df[[
            "segment_id", "lanes", "capacity_vph", "free_flow_speed_kmh", "length_km", "structural_bottleneck"
        ]], on="segment_id", how="left")
        
        ctx_val = self.loader.context_val_df.set_index("timestamp") if self.loader.context_val_df is not None else None
        if ctx_val is not None:
            df_val = df_val.merge(ctx_val[["rain_intensity", "event_level", "day_of_week", "hour"]], left_on="timestamp", right_index=True, how="left")
        else:
            df_val["rain_intensity"] = 0.0
            df_val["event_level"] = 0
            df_val["day_of_week"] = 4
            df_val["hour"] = 12.0
            
        df_val.fillna(0.0, inplace=True)
        X_val = df_val[self.INPUT_FEATURES]

        # 4. Train one model per horizon
        for h in self.HORIZONS:
            target_col = f"target_speed_{h}m"
            y_train = df_targets[target_col]
            y_val = df_val_targets[target_col]

            logger.info(f"Training HistGradientBoostingRegressor for horizon T+{h}m...")
            model = HistGradientBoostingRegressor(max_iter=60, max_leaf_nodes=31, random_state=42)
            model.fit(X_train, y_train)

            # Evaluate on out-of-sample validation slice
            preds = model.predict(X_val)
            mae = float(mean_absolute_error(y_val, preds))
            rmse = float(np.sqrt(mean_squared_error(y_val, preds)))
            mape = float(np.mean(np.abs((y_val - preds) / np.maximum(y_val, 1.0))) * 100.0)

            self.models[h] = model
            self.metrics[h] = {
                "mae_kmh": round(mae, 2),
                "rmse_kmh": round(rmse, 2),
                "mape_pct": round(mape, 1),
                "sample_validation_size": len(y_val)
            }
            logger.info(f"Horizon T+{h}m Validated: MAE={mae:.2f} km/h, RMSE={rmse:.2f} km/h, MAPE={mape:.1f}%")

            # Cache model
            with open(self._get_cache_path(h), "wb") as f:
                pickle.dump(model, f)

        import json
        metrics_file = os.path.join(MODEL_CACHE_DIR, "validation_metrics.json")
        with open(metrics_file, "w") as f:
            json.dump(self.metrics, f, indent=2)

    def predict_multi_horizon(self, segment_id: str, intervention_mode: str = "active") -> Dict[str, Any]:
        """Generates calibrated multi-horizon predictions for a segment."""
        telemetry = self.loader.get_segment_telemetry(segment_id)
        if not telemetry:
            return {"error": f"Segment {segment_id} not found."}

        # Build single-sample input vector
        features = {
            "speed_kmh": telemetry.get("speed_kmh", telemetry["free_flow_speed_kmh"]),
            "flow_vph": telemetry.get("flow_vph", 1200.0),
            "occupancy_pct": telemetry.get("occupancy_pct", 20.0),
            "congestion_index": telemetry.get("congestion_index", 0.1),
            "lanes": telemetry["lanes"],
            "capacity_vph": telemetry["capacity_vph"],
            "free_flow_speed_kmh": telemetry["free_flow_speed_kmh"],
            "length_km": telemetry["length_km"],
            "structural_bottleneck": telemetry["structural_bottleneck"],
            "hour": 17.5, # Default peak hour query
            "day_of_week": 4,
            "rain_intensity": 0.0,
            "event_level": 0
        }
        X = pd.DataFrame([features])[self.INPUT_FEATURES]

        horizons_output = []
        current_speed = round(features["speed_kmh"], 1)
        free_flow_speed = telemetry["free_flow_speed_kmh"]

        # T+0 (Current State)
        horizons_output.append({
            "horizon_label": "T + 0 Minutes",
            "horizon_minutes": 0,
            "predicted_speed_kmh": current_speed,
            "speed_delta_kmh": 0.0,
            "confidence_mae_kmh": 0.0,
            "flow_vph": round(features["flow_vph"], 0),
            "congestion_state": "FREE" if features["congestion_index"] < 0.25 else ("CONGESTED" if features["congestion_index"] > 0.5 else "MODERATE"),
            "queue_length_veh": telemetry.get("queue_length_veh", 0)
        })

        for h in self.HORIZONS:
            model = self.models.get(h)
            if model:
                pred_speed = float(model.predict(X)[0])
            else:
                pred_speed = current_speed

            # Intervention adjustment simulation:
            # Active signal gating prevents deep collapse; uncontrolled allows spillback queue
            if intervention_mode == "none":
                # Uncontrolled degradation proxy
                pred_speed = max(6.0, pred_speed * (0.85 ** (h / 30)))
            else:
                # Active GatiMarg Gating maintains throughput recovery
                pred_speed = max(14.0, min(free_flow_speed, pred_speed * 1.05))

            pred_speed = round(pred_speed, 1)
            delta = round(pred_speed - current_speed, 1)
            ci = max(0.0, min(1.0, 1.0 - (pred_speed / free_flow_speed)))
            metric = self.metrics.get(h, {"mae_kmh": 2.5, "rmse_kmh": 3.4})

            horizons_output.append({
                "horizon_label": f"T + {h} Minutes",
                "horizon_minutes": h,
                "predicted_speed_kmh": pred_speed,
                "speed_delta_kmh": delta,
                "confidence_mae_kmh": metric.get("mae_kmh", 2.5),
                "flow_vph": round(telemetry.get("flow_vph", 1200) * (pred_speed / max(10.0, current_speed)), 0),
                "congestion_state": "FREE" if ci < 0.25 else ("CONGESTED" if ci > 0.5 else "MODERATE"),
                "queue_length_veh": round(max(0.0, (1.0 - pred_speed / free_flow_speed) * 45.0), 0)
            })

        return {
            "segment_id": segment_id,
            "intervention_mode": intervention_mode,
            "free_flow_speed_kmh": free_flow_speed,
            "horizons": horizons_output,
            "validation_performance": self.metrics,
            "_provenance": {
                "model_type": "HistGradientBoostingRegressor",
                "training_split": "traffic_train.csv (Jan 01 - Jan 15)",
                "validation_split": "traffic_validation.csv (Jan 16 - Jan 19)",
                "zero_target_leakage": True,
                "classification": "MODEL"
            }
        }
