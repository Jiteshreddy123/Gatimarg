# EXISTING_FEATURE_INVENTORY.md
## Baseline Feature & UI/UX Inventory of `democmr` (`gatimarg_prototype.html`)

This document establishes the comprehensive functional, visual, and architectural baseline of the current application before any backend integration or mock-data replacement.

---

### 1. Application Overview & Architecture
* **Entrypoint**: `gatimarg_prototype.html` (Standalone Single Page Application).
* **Styling**: Vanilla CSS with curated dark palette (Slate-900 `#0B1120`, Emerald, Cyan, Rose), responsive CSS variables, glassmorphic header, and modal overlays.
* **Rendering Engine**: Dynamic Vanilla JavaScript DOM state-driven view-switcher (`render()`, `switchView()`, `switchRole()`).
* **Graphics & Simulation**: Custom HTML5 Canvas 2D render loops (`drawRealisticMap`, `initRerouteMapSimulation`) rendering road corridors, junction nodes, vehicle particles, weather overlays, and vehicle markers at 60 FPS.

---

### 2. Role-Based Access Control (RBAC) System
The top navigation features a 3-role perspective switcher (`#mainRoleSelector`):

| Role | Accessible Tabs | Intended Persona & Workflow |
| :--- | :--- | :--- |
| **`👑 Admin`** | 7 Tabs (4 Above, 3 Below):<br>1. Command Center<br>2. Incident Radar<br>3. Jan-Vani Control<br>4. Citizen Route Check<br>5. Vehicle Rerouting Sim<br>6. Chronic Congestion AI<br>7. Hygiene & Audit | System supervisor, model monitoring, dataset ingestion, planning evaluation, audit logs. |
| **`👤 User`** | 4 Tabs:<br>1. Command Center<br>2. Incident Radar<br>3. Jan-Vani Control<br>4. Citizen Route Check | Daily commuter, public travel warnings, point-to-point route obstruction lookup, bypass navigation. |
| **`👮 Traffic Authority`** | 3 Tabs:<br>1. Command Center<br>2. Incident Radar<br>3. Jan-Vani Control | Tactical traffic management center, live choke point monitoring, incident mitigation, event cordons. |

---

### 3. Screen-by-Screen Feature Inventory

#### 3.1 Screen 1: Command Center (`dashboard`)
* **KPI Metrics Strip**:
  - Cleaned Readings: 4,320
  - Stuck Sensors Repaired: 84
  - Negative Speeds Clamped: 112
  - Spikes Smoothed: 67
  - Network Segments: 436
  - Network Nodes: 120
* **Interactive 60 FPS Realistic Corridor Map**:
  - Visual coordinates of major Hyderabad corridors: PVNR Elevated Expressway, Gachibowli ORR, Cyber Towers, Tank Bund, NTR Marg, Secunderabad, Necklace Road.
  - Hussain Sagar Lake with Buddha statue marker, Musi River corridor, KBR Park.
  - Interactive hover halos, corridor tooltips (Current Speed, Capacity, Flow, Congestion state).
  - Zoom in/out and Pan controls.
  - Weather simulation toggle (`clear` vs `monsoon_rain`).
* **Calibrated Multi-Horizon Forecasting Engine**:
  - Targeted corridor selector (PVNR Ramp `SEG-042`).
  - Prediction Horizon Pills: `T+0 (Now)`, `T+15 Mins`, `T+30 Mins`, `T+45 Mins`, `T+60 Mins`.
  - Intervention Mode Toggle:
    - *GatiMarg Active Signal Gating*: Managed outflow, faster recovery.
    - *Uncontrolled Spillback*: Severe queue accumulation, gridlock.
  - Metrics displayed: Predicted Speed (km/h), Flow (vph), Queue Length (km), Recovery Horizon, Spillback Risk.
  - Auto-play simulation loop stepping through horizons.
* **Live City Telemetry Corridors & Priority Action Grid**:
  - Filter tabs: `All Segments`, `Congested (>75%)`, `Festive Diversions`, `Smooth Flow`.
  - Table columns: Corridor Segment, Capacity (vph), Observed Speed, Flow, Congestion Risk, Priority Action.
  - "Inspect Telemetry" button triggering segment detail modal.

#### 3.2 Screen 2: Incident Radar (`incidents`)
* **Live Incident Feeds**:
  - Active incidents with severity badges (Critical, Moderate, Low).
  - Incident details: Segment location, incident type (e.g., breakdown, accident, spillback), blocked lanes, detection timestamp.
  - Shockwave propagation speed (km/h), upstream queue growth, diverted flow.
  - Actionable response dispatch recommendations.
* **Interactive Incident Simulation Modal**:
  - Allows selecting segment, incident type, lanes blocked, and triggering real-time incident state injection into the network.

#### 3.3 Screen 3: Jan-Vani Control / Event Mobility (`festive`)
* **High-Density Mobility Orchestration**:
  - Event cordons and festival procession routes (e.g. Tank Bund, Secunderabad Station).
  - Dynamic barricades, lane closures, and pedestrian safety corridors.
  - Citizen advisory broadcasts and crowd inflow monitoring.
  - Alternate diversion routes (e.g. Necklace Road bypass).

#### 3.4 Screen 4: Citizen Route Check (`commuter`)
* **Commuter Pre-Trip Diagnostic**:
  - Origin & Destination input fields with presets (e.g., Mehdipatnam to HITEC City, Secunderabad to Secretariat).
  - Real-time route evaluation: Checks if any segment on the selected journey has active incidents, closures, or severe jams.
  - If obstructed: Warns commuter with exact choke point details, delay estimate, and computes a low-congestion legal bypass.
  - "Start Guided Bypass Navigation" action button that transitions directly into Screen 5.

#### 3.5 Screen 5: Vehicle In-Trip Rerouting Simulator (`reroute`)
* **Dedicated 60 FPS Moving Marker Canvas Map**:
  - Visualizes driver vehicle moving in real time along the highway approach.
  - Ahead Congestion Injection toggle: Simulates sudden stalled bus with flashing hazard lights and hazard cones blocking the ramp.
  - Decision Toggle:
    - *🔀 Divert to Bypass*: Vehicle bifurcates at Node 44 onto Pillar 140 Service Arterial, maintaining free-flow speed (48 km/h) and saving 34 minutes.
    - *🚗 Stay on Route*: Vehicle crawls into the queue behind the stalled bus at 4 km/h with 45-minute delay.
  - Live Telemetry HUD: Real-time speed, journey progress %, time saved, and dynamic status alert banner.

#### 3.6 Screen 6: Chronic Congestion AI & Multi-Tier Remediation (`chronic`)
* **Historical Recurring Congestion Diagnoser**:
  - Multi-day historical sensor analysis (15-day/30-day logs).
  - Identifies recurring bottleneck hotspots vs non-recurring anomalies.
  - Physical Root Cause Diagnoser (merge geometry, upstream metering absence, curb parking).
  - Multi-Tier AI Solutions:
    1. Immediate Operational (0–48h): Coordinated signal gating, VMS diversions.
    2. Adaptive Tactical (1–4w): Tidal lane reversal, automated camera enforcement.
    3. Long-Term Structural (3–6m): Ramp flare geometry redesign, pedestrian skywalks, slip underpasses.
  - Interactive "Simulate AI Solutions" toggle showing predicted network speed recovery (+30.6 km/h) and queue reduction (-85%).

#### 3.7 Screen 7: Data Hygiene & Sensor Quality Audit (`audit`)
* **Telemetry Data Cleansing Metrics**:
  - Audit logs tracking frozen sensor repairs, negative speed clamping, spike smoothing, and row de-duplication.
  - Network summary counts (436 segments, 120 nodes).

---

### 4. Hardcoded Mock Logic to be Replaced with Real Dataset
1. **Network**: Replace hardcoded 7 corridor objects with all 436 segments from `network.csv` and 120 nodes from `nodes.csv`.
2. **Current Telemetry**: Replace static speeds (18, 74, 24 km/h) with real observed values from `traffic_train.csv` and `traffic_validation.csv`.
3. **Multi-Horizon Forecasts**: Replace static forecast cards with a real ML forecasting model (trained on `traffic_train.csv` and validated on `traffic_validation.csv` with zero target leakage from `forecast_targets_*.csv`).
4. **Incidents**: Replace mock incident cards with real historical and validation incidents from `incidents_train.csv` and `incidents_validation.csv`.
5. **Route Checker**: Replace hardcoded path strings with real NetworkX shortest path & constraint-aware graph routing using `nodes.csv`, `network.csv`, and `turn_restrictions.csv`.
6. **Chronic Congestion**: Replace mock chronic hotspot cards with algorithmic historical recurring congestion frequency calculations across the 15-day training period.
7. **Infrastructure Planning & What-If**: Replace mock interventions with real candidates from `planning_candidates.csv` and scenarios from `scenario_examples.csv`.
8. **Events**: Replace hypothetical festivals with real event timestamps and levels from `context_train.csv` (`EVT_101_01`, `EVT_101_02`, etc.) and `context_validation.csv` (`EVT_202_01`, `EVT_202_02`).
9. **Data Provenance**: Add traceable source badges (`DATA`, `DERIVED`, `MODEL`, `SIMULATION`, `UNAVAILABLE`) to every critical card.
