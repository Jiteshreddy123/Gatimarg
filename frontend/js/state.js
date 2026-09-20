/**
 * frontend/js/state.js
 * Central Reactive State Store & Role-Based Access Control (RBAC) Matrix.
 */

export const ROLE_PERMISSIONS = {
  admin: [
    { id: 'dashboard', label: '📊 Command Center' },
    { id: 'incidents', label: '🚨 Incident Radar' },
    { id: 'festive', label: '🪔 Jan-Vani Control' },
    { id: 'commuter', label: '🔍 Citizen Route Check' },
    { id: 'reroute', label: '🔀 Vehicle Rerouting Sim' },
    { id: 'chronic', label: '🏛️ Persistent Congestion & Resolution' },
    { id: 'audit', label: '🛡️ Hygiene & Audit' }
  ],
  user: [
    { id: 'dashboard', label: '📊 Command Center' },
    { id: 'incidents', label: '🚨 Incident Radar' },
    { id: 'festive', label: '🪔 Jan-Vani Control' },
    { id: 'commuter', label: '🔍 Citizen Route Check' },
    { id: 'chronic', label: '🏛️ Congestion Resolution & Alerts' }
  ],
  authority: [
    { id: 'dashboard', label: '📊 Command Center' },
    { id: 'incidents', label: '🚨 Incident Radar' },
    { id: 'festive', label: '🪔 Jan-Vani Control' },
    { id: 'chronic', label: '🏛️ Persistent Congestion Operations' }
  ]
};

export const HYDERABAD_CORRIDORS = [
  { id: 'R0123', name: 'PVNR Elevated Expressway (Mehdipatnam Exit Ramp)', capacity: 3105, freeFlowSpeed: 40, currentSpeed: 11.4, flow: 2795, status: 'choked', shockwaveRisk: 'critical' },
  { id: 'R0293', name: 'HITEC City - Cyber Towers Junction Corridor', capacity: 2070, freeFlowSpeed: 50, currentSpeed: 14.2, flow: 1965, status: 'heavy', shockwaveRisk: 'high' },
  { id: 'R0254', name: 'Secunderabad Station Arterial Connector', capacity: 1035, freeFlowSpeed: 30, currentSpeed: 8.5, flow: 980, status: 'choked', shockwaveRisk: 'critical' },
  { id: 'R0042', name: 'Tank Bund / Hussain Sagar Waterfront Arterial', capacity: 2200, freeFlowSpeed: 45, currentSpeed: 6.0, flow: 450, status: 'festive-blocked', shockwaveRisk: 'critical' },
  { id: 'R0089', name: 'Gachibowli Outer Ring Road (ORR) Interchange Merge', capacity: 3600, freeFlowSpeed: 65, currentSpeed: 24.0, flow: 3200, status: 'heavy', shockwaveRisk: 'medium' },
  { id: 'R0205', name: 'Necklace Road Alternate Diversion Loop', capacity: 1900, freeFlowSpeed: 50, currentSpeed: 42.0, flow: 1400, status: 'diversion', shockwaveRisk: 'low' }
];

export const PRESET_ROUTES = {
  mehdipatnam_hitec: {
    origin: 'N032',
    destination: 'N044',
    title: 'Mehdipatnam Ramp ➔ HITEC City Cyber Towers',
    hazard: 'Persistent Recurrent Bottleneck & Geometric Constriction (R0123)',
    hazardSummary: 'Severe Queue Spillback: 1.85 km Tailback',
    delayTime: '+24 Mins Delay',
    status: 'severe',
    bypass: {
      title: 'Pillar 140 Ground Underpass Slipway',
      desc: 'Diverts light motor vehicles to Pillar 140 underpass slip road, avoiding turning prohibition at Node 44.',
      timeSaved: 'Saves 21 Mins',
      travelTime: '18 Mins (vs 39 Mins choked)',
      turnCompliance: 'Mandatory straight transit through Node 44 median; NO U-turn across flyover descent.'
    },
    segmentsTimeline: [
      { name: 'PVNR Expressway Pillar 110-140', speed: '14.2 km/h', status: 'danger', note: 'Shockwave backed up from bus stall' },
      { name: 'Mehdipatnam Rotary Merge', speed: '16.0 km/h', status: 'warning', note: 'Surface weaving conflict' },
      { name: 'Tolichowki Flyover Trunk', speed: '38.0 km/h', status: 'clear', note: 'Free flowing elevated deck' },
      { name: 'Shaikpet - Gachibowli Link', speed: '44.0 km/h', status: 'clear', note: 'Normal LOS B flow' }
    ],
    wardPulse: [
      { text: 'Tow truck deployed to Pillar 142 off-ramp; clearance in progress.', time: '4m ago' },
      { text: 'Traffic police enforcing slip road diversion at Rethibowli.', time: '11m ago' }
    ]
  },
  secunderabad_tankbund: {
    origin: 'N012',
    destination: 'N065',
    title: 'Secunderabad Station ➔ Lakdikapul via Tank Bund',
    hazard: 'Vinayaka Procession Cordon at Tank Bund (R0042)',
    hazardSummary: 'Waterfront Causeway 100% Sealed',
    delayTime: '+45 Mins Delay',
    status: 'critical',
    bypass: {
      title: 'Necklace Road - Lower Tank Bund Bypass Link',
      desc: 'Designated festival relief bypass operating with coordinated signal green-wave.',
      timeSaved: 'Saves 42 Mins',
      travelTime: '16 Mins (vs 58 Mins choked)',
      turnCompliance: 'Direct left turn at Ranigunj signal; Causeway barricaded for pedestrian safety.'
    },
    segmentsTimeline: [
      { name: 'Bible House - Ranigunj Approach', speed: '18.0 km/h', status: 'warning', note: 'Pre-trip perimeter warning active' },
      { name: 'Tank Bund Waterfront Causeway', speed: '0 km/h', status: 'danger', note: '100% Cordoned for religious procession' },
      { name: 'Necklace Road Bypass Artery', speed: '42.0 km/h', status: 'clear', note: 'Fluid detour carrying 1,400 vph' },
      { name: 'Secretariat - Lakdikapul Flyover', speed: '35.0 km/h', status: 'clear', note: 'Open and moving' }
    ],
    wardPulse: [
      { text: 'Tank Bund causeway closed to non-emergency motor vehicles.', time: '15m ago' },
      { text: 'RTC shuttle feeder buses operating smoothly along Necklace Road.', time: '20m ago' }
    ]
  }
};

export class AppState {
  constructor() {
    this.activeRole = 'admin'; // 'admin' | 'user' | 'authority'
    this.currentView = 'dashboard';
    this.selectedCorridorId = 'R0123';
    this.forecastHorizonMinutes = 15;
    this.selectedIncidentId = 'INC-901';
    
    // Two-Horizon Persistent Congestion State
    this.activePersistentSegmentId = 'R0123';
    this.counterfactualApplied = false;
    this.disruptionScenarioActive = false;
    this.selectedMunicipalIssueId = 'INF-HYD-0042';
    this.cachedHotspotsList = [];
    this.twoHorizonDossier = null;
    this.municipalRequestsList = [];
    this.activeAlertsList = [];
    this.activeDisruptionMetrics = null;

    this.network = {
      totalSegments: 436,
      totalNodes: 120,
      cleanedReadings: 4320,
      stuckSensorsRepaired: 84,
      negativeSpeedsClamped: 112,
      spikesSmoothed: 67
    };
    this.simulatedWeather = 'clear';
    this.selectedForecastSegmentId = 'SEG-042';
    this.selectedHorizonIndex = 1;
    this.interventionMode = 'active';
    this.forecastPlaying = false;
    this.forecastPlayTimer = null;
    this.tableFilter = 'all';

    this.segments = [
      { id: "SEG-042", name: "PVNR Expressway Ramp (Mehdipatnam Exit)", capacity: 2400, freeFlowSpeed: 65, currentSpeed: 18, flow: 2310, status: "congested", shockwaveRisk: "high", festivalImpact: "normal" },
      { id: "SEG-118", name: "Gachibowli Outer Ring Road Feeder", capacity: 3200, freeFlowSpeed: 80, currentSpeed: 74, flow: 1850, status: "smooth", shockwaveRisk: "low", festivalImpact: "normal" },
      { id: "SEG-089", name: "HITEC City Cyber Towers Junction", capacity: 2800, freeFlowSpeed: 50, currentSpeed: 24, flow: 2680, status: "moderate", shockwaveRisk: "medium", festivalImpact: "normal" },
      { id: "SEG-205", name: "Tank Bund / Hussain Sagar Arterial", capacity: 2200, freeFlowSpeed: 45, currentSpeed: 6, flow: 450, status: "festive-blocked", shockwaveRisk: "critical", festivalImpact: "severe_barricade" },
      { id: "SEG-206", name: "NTR Marg - Secretariat Bypass", capacity: 2000, freeFlowSpeed: 45, currentSpeed: 8, flow: 520, status: "festive-blocked", shockwaveRisk: "critical", festivalImpact: "severe_barricade" },
      { id: "SEG-301", name: "Secunderabad Station Road (Lashkar Bonalu Route)", capacity: 1800, freeFlowSpeed: 40, currentSpeed: 12, flow: 800, status: "festive-blocked", shockwaveRisk: "high", festivalImpact: "procession_cordon" },
      { id: "SEG-150", name: "Necklace Road Alternate Diversion Loop", capacity: 1900, freeFlowSpeed: 50, currentSpeed: 42, flow: 1400, status: "diversion", shockwaveRisk: "low", festivalImpact: "open_bypass" }
    ];

    this.citizenRoute = {
      origin: 'Mehdipatnam',
      destination: 'HITEC City',
      activePreset: 'mehdipatnam_hitec'
    };
    this.rerouteSim = {
      running: true,
      vehicleProgress: 0.05,
      hasCongestionAhead: true,
      rerouteDecision: 'auto_bypass',
      currentSpeedKmh: 52,
      statusText: 'Vehicle cruising smoothly toward Decision Point Node 44',
      fps: 60
    };
    this.liveTelemetry = null;
    this.liveForecast = null;
    this.liveCitizenRoute = null;
    this.liveSpillback = null;
    this.liveHotspots = null;
    this.crowdReports = [
      { id: 'CR-101', location: 'Mehdipatnam PVNR Ramp', type: 'Stalled Transit Bus', time: '10m ago', status: 'Verified' },
      { id: 'CR-102', location: 'Cyber Towers Junction', type: 'Pedestrian Signal Malfunction', time: '18m ago', status: 'In Review' },
      { id: 'CR-103', location: 'Tank Bund Causeway', type: 'Festive Idol Convoy Inflow', time: '25m ago', status: 'Enforced' }
    ];
  }
}

export const STATE = new AppState();
