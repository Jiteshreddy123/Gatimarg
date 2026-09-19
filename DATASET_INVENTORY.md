# DATASET_INVENTORY.md
## Machine-Readable Dataset Inventory: `NEURAX_SMART_CITIES_TRAINING_V2`

This document records the exact schema, volume, temporal boundaries, missingness, relational integrity, and analytical roles for all 19 files in the organizer dataset.

---

### File Inventory Summary Table

| File Name | File Purpose | Rows | Columns | Time Range | Key Columns | Safe for Features? | Safe for Targets? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATASET_MANIFEST.json` | Manifest & dataset noise metadata | 40 lines | N/A | 15d train, 4d val | `version`, `segments`, `nodes` | Metadata only | No |
| `network.csv` | Graph edges & physical corridor attributes | 436 | 13 | Static | `segment_id`, `source_node`, `target_node` | **YES** | No |
| `nodes.csv` | Graph vertices & spatial coordinates | 120 | 5 | Static | `node_id`, `x`, `y`, `lat`, `lon` | **YES** | No |
| `turn_restrictions.csv` | Topological movement constraints | 61 | 4 | Static | `node_id`, `from_segment`, `to_segment` | **YES** | No |
| `signal_plans.csv` | Traffic signal timing & cycle splits | 89 | 5 | Static | `signal_id`, `node_id` | **YES** | No |
| `od_demand_profiles.csv` | Origin-Destination travel demand priors | 1,500 | 5 | Static | `od_id`, `origin_node`, `destination_node` | **YES** | No |
| `planning_candidates.csv` | Infrastructure capital improvement candidates | 90 | 6 | Static | `candidate_id`, `target_segment` | **YES** (Planning) | No |
| `traffic_train.csv` | 5-min sensor telemetry (Training) | 1,883,520 | 13 | 2026-01-01 to 2026-01-15 | `timestamp`, `segment_id` | **YES** (Historical) | No |
| `traffic_validation.csv` | 5-min sensor telemetry (Validation) | 502,272 | 13 | 2026-01-16 to 2026-01-19 | `timestamp`, `segment_id` | **YES** (Eval input) | No |
| `forecast_targets_train.csv` | Ground truth forecast labels (Training) | 1,883,520 | 14 | 2026-01-01 to 2026-01-15 | `timestamp`, `segment_id` | **NO (Target Leakage!)** | **YES (Labels only)** |
| `forecast_targets_validation.csv` | Ground truth forecast labels (Validation) | 502,272 | 14 | 2026-01-16 to 2026-01-19 | `timestamp`, `segment_id` | **NO (Target Leakage!)** | **YES (Eval only)** |
| `incidents_train.csv` | Incident logs (Training) | 49 | 7 | 2026-01-01 to 2026-01-15 | `incident_id`, `segment_id` | **YES** (Historical) | No |
| `incidents_validation.csv` | Incident logs (Validation) | 11 | 7 | 2026-01-16 to 2026-01-19 | `incident_id`, `segment_id` | **YES** (Eval input) | No |
| `roadworks_train.csv` | Scheduled work zone lane closures (Training) | 8 | 6 | 2026-01-02 to 2026-01-12 | `work_id`, `segment_id` | **YES** | No |
| `roadworks_validation.csv` | Scheduled work zone lane closures (Validation) | 3 | 6 | 2026-01-16 to 2026-01-18 | `work_id`, `segment_id` | **YES** | No |
| `context_train.csv` | Weather, calendar & event context (Training) | 4,320 | 8 | 2026-01-01 to 2026-01-15 | `timestamp`, `event_id` | **YES** | No |
| `context_validation.csv` | Weather, calendar & event context (Validation) | 1,152 | 8 | 2026-01-16 to 2026-01-19 | `timestamp`, `event_id` | **YES** | No |
| `scenario_examples.csv` | What-if disaster/incident evaluation scenarios | 30 | 8 | 2026-01-01 to 2026-01-15 | `scenario_id`, `target_segment` | **YES** (Simulation) | No |
| `README.md` | Dataset documentation notes | 7 lines | N/A | N/A | N/A | Metadata only | No |

---

### Detailed File Specifications

#### 1. `network.csv`
* **Purpose**: Primary directed topology of the urban road network.
* **Rows / Columns**: 436 rows, 13 columns.
* **Schema**:
  - `segment_id`: `str` (Unique identifier, `R0001` to `R0436`). Primary Key.
  - `source_node`: `str` (Foreign Key -> `nodes.csv.node_id`).
  - `target_node`: `str` (Foreign Key -> `nodes.csv.node_id`).
  - `road_class`: `str` (`arterial`: 182, `collector`: 254).
  - `lanes`: `int64` (Range: 1 to 4 lanes).
  - `free_flow_speed_kmh`: `float64` (Range: 40.0 to 65.0 km/h).
  - `capacity_vph`: `float64` (Range: 900 to 3,600 vph).
  - `length_km`: `float64` (Range: 0.8 to 3.2 km).
  - `grade_pct`: `float64` (Road incline percentage, -4.0% to +4.0%).
  - `signal_id`: `str` (Nullable. 325 linked to `signal_plans.csv`, 111 null/uncontrolled).
  - `structural_bottleneck`: `int64` (Binary flag: 16 bottlenecks flagged).
  - `importance`: `float64` (Network centrality score, 0.12 to 0.98).
  - `peak_capacity_factor`: `float64` (Dynamic capacity derating factor, 0.70 to 1.00).
* **Missingness**: `signal_id` has 111 nulls (valid: represents unsignalized segments).

#### 2. `nodes.csv`
* **Purpose**: Spatial junction vertices forming the topological grid.
* **Rows / Columns**: 120 rows, 5 columns.
* **Schema**:
  - `node_id`: `str` (Primary Key: `N001` to `N120`).
  - `x`: `int64` (Grid X-coordinate: 0 to 11).
  - `y`: `int64` (Grid Y-coordinate: 0 to 9).
  - `lat`: `float64` (Geographic latitude: 17.3000 to 17.4620 °N — Hyderabad metropolitan area).
  - `lon`: `float64` (Geographic longitude: 78.3500 to 78.5480 °E — Hyderabad metropolitan area).
* **Missingness**: 0 nulls.

#### 3. `traffic_train.csv` & `traffic_validation.csv`
* **Purpose**: Ground truth 5-minute interval sensor readings across all 436 road segments.
* **Rows / Columns**:
  - `traffic_train.csv`: 1,883,520 rows, 13 columns (15 days * 288 steps/day * 436 segments).
  - `traffic_validation.csv`: 502,272 rows, 13 columns (4 days * 288 steps/day * 436 segments).
* **Schema**:
  - `timestamp`: `str` (`YYYY-MM-DD HH:MM:SS`, 5-minute resolution).
  - `segment_id`: `str` (Foreign Key -> `network.csv`).
  - `source_node`: `str` (Foreign Key -> `nodes.csv`).
  - `target_node`: `str` (Foreign Key -> `nodes.csv`).
  - `speed_kmh`: `float64` (Observed vehicle speed).
  - `flow_vph`: `float64` (Observed volume in vehicles per hour).
  - `occupancy_pct`: `float64` (Loop detector occupancy percentage, 0.0% to 100.0%).
  - `travel_time_min`: `float64` (Estimated segment traversal time).
  - `free_flow_time_min`: `float64` (Baseline free-flow traversal time).
  - `delay_min`: `float64` (Traversal delay = `travel_time_min - free_flow_time_min`).
  - `queue_length_veh`: `float64` (Queue length in passenger car units).
  - `congestion_index`: `float64` (Normalized congestion index: 0.0 to 1.0).
  - `sensor_quality`: `float64` (Reliability indicator: 1.0 = clean, <1.0 = noisy/degraded).
* **Missingness**: 0 nulls.

#### 4. `forecast_targets_train.csv` & `forecast_targets_validation.csv`
* **Purpose**: Supervised ground-truth labels for multi-horizon traffic state prediction.
* **WARNING**: STRICTLY PROHIBITED FROM USE AS INPUT FEATURES (PREVENTS TARGET LEAKAGE).
* **Rows / Columns**:
  - Train: 1,883,520 rows, 14 columns.
  - Validation: 502,272 rows, 14 columns.
* **Schema**:
  - `timestamp`: Prediction trigger timestamp.
  - `segment_id`: Target corridor.
  - Horizons: T+15m, T+30m, T+45m, T+60m.
  - Targets for each horizon: `target_speed_Xm`, `target_flow_Xm`, `target_congestion_Xm`.

#### 5. `incidents_train.csv` & `incidents_validation.csv`
* **Purpose**: Documented tactical roadway incidents causing non-recurrent congestion.
* **Rows / Columns**:
  - Train: 49 incidents (`INC_501_00001` to `INC_501_00049`).
  - Validation: 11 incidents (`INC_601_00001` to `INC_601_00011`).
* **Schema**:
  - `incident_id`: `str`.
  - `start_time`, `end_time`: `str` timestamps.
  - `segment_id`: `str` (Impacted segment).
  - `incident_type`: `str` (`stalled_vehicle`, `demand_surge`, `accident_like`, `road_closure`, `lane_blockage`).
  - `severity`: `int64` (Scale: 1 = Minor, 2 = Severe, 3 = Critical).
  - `lanes_blocked`: `int64` (1 or 2 lanes).

#### 6. `context_train.csv` & `context_validation.csv`
* **Purpose**: City-level environmental and event telemetry synchronized to 5-minute intervals.
* **Rows / Columns**: Train: 4,320 rows; Validation: 1,152 rows.
* **Schema**:
  - `timestamp`: 5-minute interval timestamp.
  - `temperature_c`: `float64` (Ambient temperature).
  - `rain_intensity`: `float64` (Precipitation rate mm/h).
  - `event_level`: `int64` (0 = Regular, 1 = Minor, 2 = Major, 3 = Mega-event).
  - `event_id`: `str` (Nullable. Train: `EVT_101_01`, `EVT_101_02`; Val: `EVT_202_01`, `EVT_202_02`).
  - `holiday_flag`: `int64` (0 or 1).
  - `day_of_week`: `int64` (0=Monday to 6=Sunday).
  - `hour`: `float64` (Fractional hour of day).

#### 7. `planning_candidates.csv`
* **Purpose**: Infrastructure capital intervention candidates for counterfactual planning.
* **Rows / Columns**: 90 rows, 6 columns.
* **Schema**:
  - `candidate_id`: `str` (`PLAN0001` to `PLAN0090`).
  - `target_segment`: `str` (Segment targeted for modification).
  - `intervention_type`: `str` (`capacity_upgrade`, `turn_lane`, `signal_retiming`, `connector`, `lane_addition`).
  - `capacity_delta_vph`: `int64` (Net capacity increase, e.g. +300 to +1,200 vph).
  - `cost_index`: `int64` (Relative financial cost index: 2 to 24).
  - `feasibility_band`: `str` (`low`, `medium`, `high`).

#### 8. `turn_restrictions.csv`
* **Purpose**: Physical and regulatory junction turning prohibitions.
* **Rows / Columns**: 61 rows, 4 columns.
* **Schema**:
  - `node_id`: Junction node.
  - `from_segment`: Ingress corridor.
  - `to_segment`: Egress corridor.
  - `restriction`: `str` (`no_left_turn`, `no_u_turn`, `no_right_turn`).

#### 9. `signal_plans.csv`
* **Purpose**: Actuated signal controller timing allocations.
* **Rows / Columns**: 89 rows, 5 columns.
* **Schema**:
  - `signal_id`: Signal identifier (`SIG0001` to `SIG0089`).
  - `node_id`: Intersecting vertex.
  - `cycle_s`: Total cycle duration in seconds (e.g., 90s, 120s, 140s).
  - `green_ratio`: Green phase fraction (0.35 to 0.65).
  - `offset_s`: Coordinated arterial coordination offset in seconds.

#### 10. `roadworks_train.csv` & `roadworks_validation.csv`
* **Purpose**: Scheduled maintenance zones causing temporary capacity derating.
* **Rows / Columns**: Train: 8 work orders; Validation: 3 work orders.
* **Schema**:
  - `work_id`: Work order identifier.
  - `segment_id`: Impacted corridor.
  - `start_time`, `end_time`: Schedule window.
  - `closure_fraction`: Proportion of carriageway closed (0.25 to 0.50).
  - `work_type`: `str` (`lane_maintenance`, `resurfacing`, `utility_work`).

#### 11. `od_demand_profiles.csv`
* **Purpose**: Baseline travel demand matrix across 1,500 Origin-Destination pairs.
* **Rows / Columns**: 1,500 rows, 5 columns.
* **Schema**:
  - `od_id`: `str` (`OD0001` to `OD1500`).
  - `origin_node`, `destination_node`: `str` node IDs.
  - `base_demand_vph`: `int64` (Trip rate in vehicles per hour).
  - `purpose`: `str` (`commercial`: 384, `commute`: 384, `school`: 377, `mixed`: 355).

#### 12. `scenario_examples.csv`
* **Purpose**: Counterfactual what-if simulation evaluation benchmarks.
* **Rows / Columns**: 30 rows, 8 columns.
* **Schema**:
  - `scenario_id`: `str` (`TRAIN_SC_001` to `TRAIN_SC_030`).
  - `scenario_type`: `incident`.
  - `start_time`, `end_time`: Window.
  - `target_segment`: Segment under evaluation.
  - `incident_type`, `severity`: Incident attributes.
  - `candidate_interventions`: Guidelines linking to planning candidates.
