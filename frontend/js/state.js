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
    { id: 'chronic', label: '🧠 Chronic Congestion AI' },
    { id: 'audit', label: '🛡️ Hygiene & Audit' }
  ],
  user: [
    { id: 'dashboard', label: '📊 Command Center' },
    { id: 'incidents', label: '🚨 Incident Radar' },
    { id: 'festive', label: '🪔 Jan-Vani Control' },
    { id: 'commuter', label: '🔍 Citizen Route Check' }
  ],
  authority: [
    { id: 'dashboard', label: '📊 Command Center' },
    { id: 'incidents', label: '🚨 Incident Radar' },
    { id: 'festive', label: '🪔 Jan-Vani Control' }
  ]
};

export const HYDERABAD_CORRIDORS = [
  { id: 'SEG-042', name: 'PVNR Elevated Expressway (Mehdipatnam Exit Ramp)', capacity: 2400, freeFlowSpeed: 65, currentSpeed: 14.2, flow: 2410, status: 'choked', shockwaveRisk: 'critical' },
  { id: 'SEG-089', name: 'HITEC City - Cyber Towers Junction Corridor', capacity: 2600, freeFlowSpeed: 50, currentSpeed: 18.5, flow: 2490, status: 'heavy', shockwaveRisk: 'high' },
  { id: 'SEG-118', name: 'Gachibowli Outer Ring Road (ORR) Interchange Merge', capacity: 2800, freeFlowSpeed: 70, currentSpeed: 24.0, flow: 2620, status: 'heavy', shockwaveRisk: 'medium' },
  { id: 'SEG-004', name: 'Charminar - Nayapul Heritage Arterial', capacity: 1500, freeFlowSpeed: 35, currentSpeed: 12.0, flow: 1450, status: 'congested', shockwaveRisk: 'medium' },
  { id: 'SEG-205', name: 'Tank Bund / Hussain Sagar Waterfront Arterial', capacity: 2200, freeFlowSpeed: 45, currentSpeed: 6.0, flow: 450, status: 'festive-blocked', shockwaveRisk: 'critical' },
  { id: 'SEG-150', name: 'Necklace Road Alternate Diversion Loop', capacity: 1900, freeFlowSpeed: 50, currentSpeed: 42.0, flow: 1400, status: 'diversion', shockwaveRisk: 'low' }
];

export const PRESET_ROUTES = {
  mehdipatnam_hitec: {
    origin: 'N032',
    destination: 'N044',
    title: 'Mehdipatnam Ramp ➔ HITEC City Cyber Towers',
    hazard: 'Stalled Heavy Transit Bus at PVNR Ramp (SEG-042)',
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
    hazard: 'Vinayaka Procession Cordon at Tank Bund (SEG-205)',
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
    this.selectedCorridorId = 'SEG-042';
    this.forecastHorizonMinutes = 15;
    this.selectedIncidentId = 'INC-901';
    this.chronicHotspotId = 'SEG-042';
    this.chronicSolutionApplied = false;
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
