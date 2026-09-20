/**
 * frontend/js/map.js
 * High-Performance HTML5 Canvas 2D Engine (60 FPS) for GatiMarg AI.
 * 
 * Includes:
 * 1. Realistic Hyderabad Cartographic GIS Map & Particle Flow Engine
 * 2. Dedicated In-Trip Vehicle Rerouting Simulation Engine
 */

import { STATE } from './state.js';

// ──── 1. REALISTIC HYDERABAD GIS ENGINE & PARTICLE SIMULATOR (60 FPS) ────
let mapAnimId = null;
let mapZoomScale = 1.0;
let mapPanX = 0;
let mapPanY = 0;
let hoveredSegment = null;
let mapParticles = [];
let mapRainDrops = [];

export const MAP_CORRIDORS = [
  {
    id: "SEG-042",
    name: "PVNR Expressway Ramp (Mehdipatnam Exit)",
    status: "congested",
    speed: 18,
    freeSpeed: 65,
    flow: 2310,
    cap: 2400,
    color: "#EF4444",
    width: 4.5,
    points: [{x: 280, y: 300}, {x: 250, y: 340}, {x: 210, y: 390}, {x: 160, y: 440}],
    hasIncident: true,
    incidentPoint: {x: 265, y: 320},
    label: "PVNR Ramp [Incident Stall]"
  },
  {
    id: "SEG-041",
    name: "Attapur Inflow Feeder Link",
    status: "shockwave",
    speed: 22,
    freeSpeed: 60,
    flow: 2150,
    cap: 2200,
    color: "#F59E0B",
    width: 3.5,
    points: [{x: 160, y: 440}, {x: 210, y: 390}, {x: 250, y: 340}],
    hasShockwave: true,
    label: "Attapur Feeder (-14 km/h Wave)"
  },
  {
    id: "SEG-118",
    name: "Outer Ring Road (ORR Expressway)",
    status: "smooth",
    speed: 74,
    freeSpeed: 80,
    flow: 1850,
    cap: 3200,
    color: "#10B981",
    width: 5,
    points: [{x: 35, y: 40}, {x: 45, y: 140}, {x: 55, y: 250}, {x: 75, y: 350}, {x: 115, y: 445}],
    label: "Outer Ring Road (Expressway)"
  },
  {
    id: "SEG-089",
    name: "HITEC City - Cyber Towers Arterial",
    status: "moderate",
    speed: 38,
    freeSpeed: 50,
    flow: 2680,
    cap: 2800,
    color: "#06B6D4",
    width: 4,
    points: [{x: 45, y: 140}, {x: 95, y: 160}, {x: 145, y: 175}, {x: 195, y: 190}, {x: 275, y: 230}],
    label: "Cyber Towers - Cable Bridge - Jubilee Hills"
  },
  {
    id: "SEG-090",
    name: "Inner Ring Road (Panjagutta - Begumpet)",
    status: "smooth",
    speed: 52,
    freeSpeed: 60,
    flow: 2100,
    cap: 2600,
    color: "#06B6D4",
    width: 4,
    points: [{x: 275, y: 230}, {x: 335, y: 205}, {x: 400, y: 175}, {x: 460, y: 135}, {x: 545, y: 105}, {x: 645, y: 85}],
    label: "Panjagutta - Begumpet - Paradise"
  },
  {
    id: "SEG-205",
    name: "Tank Bund Arterial (Festive Cordon)",
    status: "festive-blocked",
    speed: 6,
    freeSpeed: 45,
    flow: 450,
    cap: 2200,
    color: "#DC2626",
    width: 6,
    isStriped: true,
    points: [{x: 500, y: 155}, {x: 520, y: 205}, {x: 510, y: 250}, {x: 460, y: 275}],
    label: "Tank Bund [CLOSED: Ganesh Nimajjanam Cordon]"
  },
  {
    id: "SEG-206",
    name: "NTR Marg - Secretariat Bypass Link",
    status: "festive-blocked",
    speed: 8,
    freeSpeed: 45,
    flow: 520,
    cap: 2000,
    color: "#DC2626",
    width: 5,
    isStriped: true,
    points: [{x: 460, y: 275}, {x: 420, y: 280}, {x: 380, y: 270}],
    label: "NTR Marg [Closed for Crowd Safety]"
  },
  {
    id: "SEG-150",
    name: "✓ Necklace Road Alternate Bypass",
    status: "diversion",
    speed: 42,
    freeSpeed: 50,
    flow: 1400,
    cap: 1900,
    color: "#10B981",
    width: 4.5,
    isDiversion: true,
    points: [{x: 380, y: 270}, {x: 390, y: 220}, {x: 410, y: 175}, {x: 450, y: 145}, {x: 500, y: 155}],
    label: "✓ Necklace Road Legal Bypass (Saves 42 min)"
  },
  {
    id: "SEG-043",
    name: "Masab Tank - Lakdikapul Corridor",
    status: "moderate",
    speed: 28,
    freeSpeed: 50,
    flow: 1980,
    cap: 2200,
    color: "#F59E0B",
    width: 3.5,
    points: [{x: 280, y: 300}, {x: 320, y: 285}, {x: 350, y: 275}, {x: 380, y: 270}],
    label: "Masab Tank - Lakdikapul Corridor"
  },
  {
    id: "SEG-301",
    name: "Secunderabad Station Arterial",
    status: "festive-blocked",
    speed: 12,
    freeSpeed: 40,
    flow: 800,
    cap: 1800,
    color: "#DC2626",
    width: 4.5,
    isStriped: true,
    points: [{x: 545, y: 105}, {x: 605, y: 100}, {x: 665, y: 115}],
    label: "Secunderabad Station [Lashkar Bonalu Cordon]"
  },
  {
    id: "SEG-020",
    name: "Charminar - Nayapul Old City Link",
    status: "moderate",
    speed: 24,
    freeSpeed: 40,
    flow: 1600,
    cap: 1800,
    color: "#F59E0B",
    width: 3.5,
    points: [{x: 405, y: 360}, {x: 420, y: 400}, {x: 425, y: 440}],
    label: "Nayapul - Charminar Old City Corridor"
  }
];

export const MAP_LANDMARKS = [
  { name: "HITEC City / Cyber Towers", x: 95, y: 145 },
  { name: "Gachibowli Financial Dist", x: 40, y: 280 },
  { name: "Jubilee Hills", x: 200, y: 175 },
  { name: "Banjara Hills", x: 255, y: 255 },
  { name: "Mehdipatnam", x: 280, y: 320 },
  { name: "Panjagutta", x: 340, y: 190 },
  { name: "Begumpet Airport", x: 445, y: 115 },
  { name: "Secunderabad Station", x: 655, y: 130 },
  { name: "Charminar / Old City", x: 430, y: 450 }
];

export function initRealisticHyderabadMap() {
  const canvas = document.getElementById('hyderabadMapCanvas') || document.getElementById('networkMapCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  const tooltip = document.getElementById('mapTooltip');

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || 760;
  canvas.height = rect.height || 460;

  mapParticles = [];
  for (let i = 0; i < 90; i++) {
    const cIdx = Math.floor(Math.random() * MAP_CORRIDORS.length);
    mapParticles.push({
      corridorIndex: cIdx,
      progress: Math.random(),
      speedMultiplier: 0.8 + Math.random() * 0.4
    });
  }

  mapRainDrops = [];
  for (let i = 0; i < 120; i++) {
    mapRainDrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 10 + Math.random() * 12,
      speed: 8 + Math.random() * 6
    });
  }

  canvas.onmousemove = function(e) {
    const cRect = canvas.getBoundingClientRect();
    const mx = (e.clientX - cRect.left - mapPanX) / mapZoomScale;
    const my = (e.clientY - cRect.top - mapPanY) / mapZoomScale;

    let closestSeg = null;
    let minDist = 20;

    MAP_CORRIDORS.forEach(c => {
      for (let i = 0; i < c.points.length - 1; i++) {
        const p1 = c.points[i];
        const p2 = c.points[i + 1];
        const d = distToSegment({x: mx, y: my}, p1, p2);
        if (d < minDist) {
          minDist = d;
          closestSeg = c;
        }
      }
    });

    hoveredSegment = closestSeg;

    if (closestSeg && tooltip) {
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - cRect.left) + 'px';
      tooltip.style.top = (e.clientY - cRect.top) + 'px';

      const ttTitle = document.getElementById('ttTitle');
      const ttSub = document.getElementById('ttSub');
      const ttMetrics = document.getElementById('ttMetrics');
      if (ttTitle) ttTitle.textContent = closestSeg.name;
      if (ttSub) ttSub.textContent = `Segment ID: ${closestSeg.id} · Priority Link`;
      
      let statBadge = '';
      if (closestSeg.status === 'congested') statBadge = '<span style="color: #F87171;">⚠️ Gridlocked: Stalled Transit Bus</span>';
      else if (closestSeg.status === 'shockwave') statBadge = '<span style="color: #F59E0B;">⚡ Upstream Spillback Shockwave (-14.2 km/h)</span>';
      else if (closestSeg.status === 'festive-blocked') statBadge = '<span style="color: #EF4444;">🪔 Festive Cordon (Procession Barricade)</span>';
      else if (closestSeg.status === 'diversion') statBadge = '<span style="color: #34D399;">✓ Active Legal Bypass (Recommended)</span>';
      else statBadge = '<span style="color: #34D399;">✓ Fluid Traffic Flow</span>';

      if (ttMetrics) {
        ttMetrics.innerHTML = `
          Live Speed: <strong>${closestSeg.speed} km/h</strong> (Free: ${closestSeg.freeSpeed} km/h)<br>
          Discharge Flow: <strong>${closestSeg.flow.toLocaleString()} vph</strong> (Cap: ${closestSeg.cap.toLocaleString()} vph)<br>
          ${statBadge}<br>
          <span style="color: #38BDF8; font-size: 10px; font-weight: 600;">[Click road to inspect segment telemetry]</span>
        `;
      }
    } else if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  canvas.onmouseleave = function() {
    hoveredSegment = null;
    if (tooltip) tooltip.style.display = 'none';
  };

  canvas.onclick = function() {
    if (hoveredSegment && window.viewSegmentDetails) {
      window.viewSegmentDetails(hoveredSegment.id);
    }
  };

  if (mapAnimId) cancelAnimationFrame(mapAnimId);

  function loop() {
    if (STATE.currentView !== 'dashboard') return;
    drawRealisticMap(canvas, ctx);
    mapAnimId = requestAnimationFrame(loop);
  }
  loop();
}

function drawRealisticMap(canvas, ctx) {
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(mapPanX, mapPanY);
  ctx.scale(mapZoomScale, mapZoomScale);

  // 1. Background Cartographic Grid
  ctx.strokeStyle = "rgba(30, 41, 59, 0.45)";
  ctx.lineWidth = 0.6;
  for (let x = 0; x < W + 200; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H + 200);
    ctx.stroke();
  }
  for (let y = 0; y < H + 200; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W + 200, y);
    ctx.stroke();
  }

  // 2. Musi River
  ctx.beginPath();
  ctx.moveTo(20, 395);
  ctx.bezierCurveTo(160, 420, 300, 385, 430, 410);
  ctx.bezierCurveTo(570, 435, 680, 400, 760, 410);
  ctx.strokeStyle = "#0B2844";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.font = "italic 9px var(--font-sans)";
  ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
  ctx.fillText("Musi River Corridor", 230, 403);

  // Durgam Cheruvu Lake
  ctx.beginPath();
  ctx.ellipse(145, 205, 38, 18, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = "#0C2339";
  ctx.fill();
  ctx.strokeStyle = "#0284C7";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillText("Durgam Cheruvu", 115, 208);

  // Hussain Sagar Lake
  ctx.beginPath();
  ctx.moveTo(415, 175);
  ctx.bezierCurveTo(445, 135, 505, 145, 525, 185);
  ctx.bezierCurveTo(540, 225, 515, 270, 470, 275);
  ctx.bezierCurveTo(430, 280, 400, 240, 415, 175);
  ctx.closePath();
  ctx.fillStyle = "#0D2B48";
  ctx.fill();
  ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Buddha Statue Marker
  ctx.beginPath();
  ctx.arc(468, 208, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#FDE047";
  ctx.fill();
  ctx.font = "bold 9.5px var(--font-sans)";
  ctx.fillStyle = "#E0F2FE";
  ctx.fillText("Hussain Sagar Lake", 432, 224);
  ctx.font = "8px var(--font-sans)";
  ctx.fillStyle = "#FDE047";
  ctx.fillText("● Buddha Statue", 438, 235);

  // KBR Park
  ctx.beginPath();
  ctx.ellipse(195, 245, 24, 16, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(5, 150, 105, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(5, 150, 105, 0.35)";
  ctx.stroke();
  ctx.fillStyle = "rgba(52, 211, 153, 0.4)";
  ctx.fillText("KBR Park", 175, 248);

  // 3. Render All Road Corridors
  MAP_CORRIDORS.forEach(c => {
    const isHov = hoveredSegment && hoveredSegment.id === c.id;

    if (isHov) {
      ctx.beginPath();
      ctx.moveTo(c.points[0].x, c.points[0].y);
      for (let i = 1; i < c.points.length; i++) ctx.lineTo(c.points[i].x, c.points[i].y);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = c.width + 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(c.points[0].x, c.points[0].y);
    for (let i = 1; i < c.points.length; i++) ctx.lineTo(c.points[i].x, c.points[i].y);
    ctx.strokeStyle = isHov ? "#fff" : c.color;
    ctx.lineWidth = isHov ? c.width + 1.5 : c.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (c.isStriped) {
      ctx.setLineDash([8, 6]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (c.hasIncident && c.incidentPoint) {
      const now = Date.now() / 300;
      const pulseR = 7 + Math.sin(now) * 3;
      ctx.beginPath();
      ctx.arc(c.incidentPoint.x, c.incidentPoint.y, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(c.incidentPoint.x, c.incidentPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#EF4444";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "bold 9px var(--font-sans)";
      ctx.fillStyle = "#F87171";
      ctx.fillText("🚨 STALL (PVNR Ramp)", c.incidentPoint.x + 8, c.incidentPoint.y - 4);
    }

    if (c.hasShockwave) {
      const wavePhase = (Date.now() / 400) % 1;
      const waveP = getPointAlongPath(c.points, wavePhase);
      ctx.beginPath();
      ctx.arc(waveP.x, waveP.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
      ctx.fill();
    }

    if (c.isDiversion) {
      const divP = getPointAlongPath(c.points, (Date.now() / 800) % 1);
      ctx.beginPath();
      ctx.arc(divP.x, divP.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#34D399";
      ctx.fill();
    }
  });

  // 4. Vehicle Particles
  mapParticles.forEach(p => {
    const corridor = MAP_CORRIDORS[p.corridorIndex];
    if (!corridor) return;

    let baseStep = 0.003 * p.speedMultiplier;
    if (corridor.status === 'congested') baseStep = 0.0008;
    if (corridor.status === 'festive-blocked') baseStep = 0.0003;
    if (STATE.simulatedWeather === 'monsoon_rain') baseStep *= 0.75;

    p.progress += baseStep;
    if (p.progress >= 1) p.progress = 0;

    const pt = getPointAlongPath(corridor.points, p.progress);

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);

    if (corridor.status === 'congested') ctx.fillStyle = "#FCA5A5";
    else if (corridor.status === 'festive-blocked') ctx.fillStyle = "#F87171";
    else if (corridor.status === 'shockwave') ctx.fillStyle = "#FDE68A";
    else if (corridor.status === 'diversion') ctx.fillStyle = "#6EE7B7";
    else ctx.fillStyle = "#E0F2FE";

    ctx.fill();
  });

  // 5. Key Junction Nodes
  const JUNC_NODES = [
    { name: "N44", x: 280, y: 300 },
    { name: "N12", x: 45, y: 140 },
    { name: "N89", x: 460, y: 275 },
    { name: "N90", x: 500, y: 155 },
    { name: "N102", x: 380, y: 270 },
    { name: "N77", x: 545, y: 105 }
  ];
  JUNC_NODES.forEach(jn => {
    ctx.beginPath();
    ctx.arc(jn.x, jn.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "600 8px var(--font-mono)";
    ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
    ctx.fillText(jn.name, jn.x - 7, jn.y - 6);
  });

  // 6. Landmarks Text
  ctx.font = "bold 9px var(--font-sans)";
  ctx.fillStyle = "rgba(226, 232, 240, 0.65)";
  MAP_LANDMARKS.forEach(lm => {
    ctx.fillText(lm.name, lm.x, lm.y);
  });

  // 7. Monsoon Rain Overlay
  if (STATE.simulatedWeather === 'monsoon_rain') {
    ctx.strokeStyle = "rgba(186, 230, 253, 0.35)";
    ctx.lineWidth = 1;
    mapRainDrops.forEach(r => {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 3, r.y + r.len);
      ctx.stroke();
      r.y += r.speed;
      r.x -= 1.5;
      if (r.y > H) {
        r.y = -10;
        r.x = Math.random() * W;
      }
    });
  }

  ctx.restore();
}

export function mapZoom(factor) {
  mapZoomScale = Math.max(0.7, Math.min(2.2, mapZoomScale * factor));
}

export function resetMapView() {
  mapZoomScale = 1.0;
  mapPanX = 0;
  mapPanY = 0;
}

// ──── 2. DEDICATED IN-TRIP VEHICLE REROUTING SIMULATION ENGINE (FEATURE 2) ────
let rerouteAnimId = null;
let rerouteFlowParticles = [];

export function initRerouteMapSimulation() {
  const canvas = document.getElementById('rerouteCanvas') || document.getElementById('rerouteSimCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (rerouteAnimId) cancelAnimationFrame(rerouteAnimId);

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = rect.width || 800;
  const H = rect.height || 420;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  if (rerouteFlowParticles.length === 0) {
    for (let i = 0; i < 24; i++) {
      rerouteFlowParticles.push({
        route: Math.random() > 0.4 ? 'straight' : 'bypass',
        progress: Math.random(),
        speed: 0.0012 + Math.random() * 0.0015,
        color: ['#38BDF8', '#818CF8', '#FDE047', '#E2E8F0'][Math.floor(Math.random() * 4)],
        size: 4 + Math.random() * 2
      });
    }
  }

  const startPt = { x: 70, y: 150 };
  const decisionPt = { x: 300, y: 150 };
  const jamStartPt = { x: 440, y: 150 };
  const jamStallPt = { x: 570, y: 150 };
  const straightEndPt = { x: 760, y: 150 };

  const bypassPts = [
    decisionPt,
    { x: 370, y: 280 },
    { x: 520, y: 310 },
    { x: 670, y: 260 },
    straightEndPt
  ];

  function getBypassPoint(t) {
    return getPointAlongPath(bypassPts, t);
  }

  function getStraightPoint(t) {
    return {
      x: startPt.x + (straightEndPt.x - startPt.x) * t,
      y: startPt.y + (straightEndPt.y - startPt.y) * t
    };
  }

  let frameCounter = 0;

  function renderSimulationFrame() {
    if (STATE.currentView !== 'reroute') {
      if (rerouteAnimId) cancelAnimationFrame(rerouteAnimId);
      return;
    }

    frameCounter++;
    const s = STATE.rerouteSim;

    if (s.running) {
      const isBypass = (s.rerouteDecision === 'auto_bypass');

      if (s.vehicleProgress < 0.33) {
        s.currentSpeedKmh = 50;
        s.vehicleProgress += 0.0018;
        if (s.hasCongestionAhead) {
          s.statusText = isBypass ?
            "⚠️ Congestion Alert: PVNR Ramp blocked ahead. Automatic telemetry scheduled to divert car onto Pillar 140 Bypass at Node 44." :
            "⚠️ Congestion Alert: PVNR Ramp blocked ahead. Vehicle scheduled to hold course straight into queue.";
        } else {
          s.statusText = "🟢 Telemetry Normal: Highway clear. Approaching Node 44 junction.";
        }
      } else if (isBypass) {
        s.currentSpeedKmh = 48 + Math.floor(Math.sin(frameCounter / 15) * 3);
        s.vehicleProgress += 0.0022;
        s.statusText = "🔀 ACTIVE BYPASS: Vehicle successfully diverted via Pillar 140 Service Arterial. Unobstructed free flow at 48 km/h. Saving 34 minutes!";
      } else {
        if (s.hasCongestionAhead && s.vehicleProgress >= 0.52) {
          s.currentSpeedKmh = 4 + Math.floor(Math.sin(frameCounter / 20) * 2);
          s.vehicleProgress += 0.0003;
          s.statusText = "🚨 TRAPPED IN GRIDLOCK: Behind stalled TSRTC bus on PVNR Ramp! Crawling at 4 km/h with 2.4 km spillback. Click 'Divert to Bypass' to redirect!";
        } else {
          s.currentSpeedKmh = 52;
          s.vehicleProgress += 0.002;
          s.statusText = s.hasCongestionAhead ?
            "⚠️ Warning: Stalled bus reported 600m ahead. Rapidly decelerating towards shockwave queue." :
            "🟢 PVNR Express corridor clear: cruising at 52 km/h.";
        }
      }

      if (s.vehicleProgress >= 1.0) {
        s.vehicleProgress = 1.0;
        s.running = false;
        s.statusText = isBypass ?
          "🏁 JOURNEY COMPLETE: Reached destination via Pillar 140 Bypass on time! Total delay avoided: 34 minutes." :
          "🏁 JOURNEY FINISHED: Arrived at destination with severe 45-minute spillback delay.";
      }

      const speedEl = document.getElementById('rSimSpeed');
      const progEl = document.getElementById('rSimProgress');
      const statEl = document.getElementById('rSimStatus');
      if (speedEl) {
        speedEl.textContent = `${s.currentSpeedKmh} km/h`;
        speedEl.style.color = s.currentSpeedKmh < 20 ? '#EF4444' : '#34D399';
      }
      if (progEl) {
        progEl.textContent = `${Math.round(s.vehicleProgress * 100)}%`;
      }
      if (statEl) {
        statEl.textContent = s.statusText;
      }
    }

    ctx.fillStyle = "#070B16";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Straight Road
    ctx.beginPath();
    ctx.moveTo(startPt.x, startPt.y);
    ctx.lineTo(straightEndPt.x, straightEndPt.y);
    ctx.lineWidth = 26;
    ctx.strokeStyle = "#131C31";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.lineWidth = 20;
    ctx.strokeStyle = "#1E293B";
    ctx.stroke();

    // Bypass Road
    ctx.beginPath();
    ctx.moveTo(bypassPts[0].x, bypassPts[0].y);
    for (let i = 1; i < bypassPts.length; i++) {
      ctx.lineTo(bypassPts[i].x, bypassPts[i].y);
    }
    ctx.lineWidth = 24;
    ctx.strokeStyle = "rgba(6, 78, 59, 0.35)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.lineWidth = 18;
    ctx.strokeStyle = "#064E3B";
    ctx.stroke();

    if (s.rerouteDecision === 'auto_bypass') {
      ctx.beginPath();
      ctx.moveTo(bypassPts[0].x, bypassPts[0].y);
      for (let i = 1; i < bypassPts.length; i++) {
        ctx.lineTo(bypassPts[i].x, bypassPts[i].y);
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -frameCounter * 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Centerline
    ctx.beginPath();
    ctx.moveTo(startPt.x, startPt.y);
    ctx.lineTo(straightEndPt.x, straightEndPt.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -frameCounter * 0.8;
    ctx.stroke();
    ctx.setLineDash([]);

    // Ahead Congestion
    if (s.hasCongestionAhead) {
      const glowGrad = ctx.createLinearGradient(jamStartPt.x, 150, jamStallPt.x + 40, 150);
      glowGrad.addColorStop(0, "rgba(239, 68, 68, 0.1)");
      glowGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.45)");
      glowGrad.addColorStop(1, "rgba(239, 68, 68, 0.8)");

      ctx.beginPath();
      ctx.moveTo(jamStartPt.x, 150);
      ctx.lineTo(jamStallPt.x + 30, 150);
      ctx.lineWidth = 20;
      ctx.strokeStyle = glowGrad;
      ctx.stroke();

      ctx.save();
      ctx.translate(jamStallPt.x, jamStallPt.y);
      const flash = Math.floor(frameCounter / 15) % 2 === 0;
      if (flash) {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
        ctx.fill();
      }
      ctx.fillStyle = "#B91C1C";
      ctx.fillRect(-14, -7, 28, 14);
      ctx.strokeStyle = "#FCA5A5";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -7, 28, 14);

      ctx.fillStyle = flash ? "#FDE047" : "#78350F";
      ctx.fillRect(-13, -7, 4, 3);
      ctx.fillRect(-13, 4, 4, 3);
      ctx.fillRect(9, -7, 4, 3);
      ctx.fillRect(9, 4, 4, 3);

      ctx.font = "bold 9px var(--font-sans)";
      ctx.fillStyle = "#F87171";
      ctx.fillText("🚨 STALLED BUS (4 km/h)", -45, -16);
      ctx.restore();

      for (let c = 1; c <= 4; c++) {
        const cx = jamStallPt.x - (c * 24);
        ctx.fillStyle = "#475569";
        ctx.fillRect(cx - 7, 145, 14, 10);
        ctx.fillStyle = "#EF4444";
        ctx.fillRect(cx - 7, 146, 2, 8);
      }

      ctx.fillStyle = "#F97316";
      [-22, 0, 22].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(jamStallPt.x + ox, 164);
        ctx.lineTo(jamStallPt.x + ox + 3, 158);
        ctx.lineTo(jamStallPt.x + ox + 6, 164);
        ctx.closePath();
        ctx.fill();
      });
    }

    // Node 44 Marker
    ctx.beginPath();
    ctx.arc(decisionPt.x, decisionPt.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = "bold 10px var(--font-mono)";
    ctx.fillStyle = "#38BDF8";
    ctx.fillText("NODE 44 (PVNR Split)", decisionPt.x - 48, decisionPt.y - 18);

    // VMS Gantry sign
    ctx.fillStyle = "#0B132B";
    ctx.fillRect(decisionPt.x - 70, decisionPt.y + 14, 140, 28);
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 1;
    ctx.strokeRect(decisionPt.x - 70, decisionPt.y + 14, 140, 28);
    ctx.font = "bold 8px var(--font-mono)";
    ctx.fillStyle = s.hasCongestionAhead ? "#EF4444" : "#34D399";
    ctx.fillText(s.hasCongestionAhead ? "VMS: PVNR RAMP BLOCKED" : "VMS: STRAIGHT ALL CLEAR", decisionPt.x - 64, decisionPt.y + 26);
    ctx.fillStyle = "#38BDF8";
    ctx.fillText("PILLAR 140 BYPASS ➔ 48 KM/H", decisionPt.x - 64, decisionPt.y + 37);

    // Origin and Destination
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0284C7";
    ctx.fill();
    ctx.font = "bold 9px var(--font-sans)";
    ctx.fillStyle = "#E0F2FE";
    ctx.fillText("📍 ORIGIN: Mehdipatnam", startPt.x - 45, startPt.y - 12);

    ctx.beginPath();
    ctx.arc(straightEndPt.x, straightEndPt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#10B981";
    ctx.fill();
    ctx.fillText("🏁 DESTINATION: Airport Hub", straightEndPt.x - 70, straightEndPt.y - 12);

    ctx.font = "bold 9.5px var(--font-sans)";
    ctx.fillStyle = "#34D399";
    ctx.fillText("🟢 Pillar 140 Service Arterial (Low Congestion Legal Bypass)", 380, 335);

    // User Vehicle Position
    let userPos;
    let carHeadingAngle = 0;

    if (s.rerouteDecision === 'auto_bypass') {
      if (s.vehicleProgress <= 0.33) {
        const normT = s.vehicleProgress / 0.33;
        userPos = {
          x: startPt.x + (decisionPt.x - startPt.x) * normT,
          y: startPt.y + (decisionPt.y - startPt.y) * normT
        };
        carHeadingAngle = 0;
      } else {
        const normT = (s.vehicleProgress - 0.33) / (1.0 - 0.33);
        userPos = getBypassPoint(normT);
        const deltaT = Math.min(1.0, normT + 0.02);
        const nextPos = getBypassPoint(deltaT);
        carHeadingAngle = Math.atan2(nextPos.y - userPos.y, nextPos.x - userPos.x);
      }
    } else {
      userPos = getStraightPoint(s.vehicleProgress);
      carHeadingAngle = 0;
    }

    ctx.save();
    ctx.translate(userPos.x, userPos.y);

    // Headlight cone
    ctx.save();
    ctx.rotate(carHeadingAngle);
    const headLight = ctx.createRadialGradient(8, 0, 2, 45, 0, 30);
    headLight.addColorStop(0, "rgba(254, 240, 138, 0.65)");
    headLight.addColorStop(1, "rgba(254, 240, 138, 0.0)");
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(45, -18);
    ctx.lineTo(45, 18);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fillStyle = headLight;
    ctx.fill();
    ctx.restore();

    // Radar pulse
    const pulse = (frameCounter % 40) / 40;
    ctx.beginPath();
    ctx.arc(0, 0, 12 + pulse * 18, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(6, 182, 212, ${1 - pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Car Body
    ctx.save();
    ctx.rotate(carHeadingAngle);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(-10, -5, 20, 12);
    ctx.fillStyle = "#06B6D4";
    ctx.fillRect(-9, -6, 18, 12);
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 1;
    ctx.strokeRect(-9, -6, 18, 12);
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, -4, 4, 8);
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(7, -5, 2, 3);
    ctx.fillRect(7, 2, 2, 3);
    ctx.fillStyle = s.currentSpeedKmh < 20 ? "#EF4444" : "#F87171";
    ctx.fillRect(-9, -5, 2, 3);
    ctx.fillRect(-9, 2, 2, 3);
    ctx.restore();

    // Driver Indicator
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(-45, -34, 90, 18);
    ctx.strokeStyle = s.currentSpeedKmh < 20 ? "#EF4444" : "#38BDF8";
    ctx.lineWidth = 1;
    ctx.strokeRect(-45, -34, 90, 18);

    ctx.font = "bold 9px var(--font-sans)";
    ctx.fillStyle = "#E0F2FE";
    ctx.textAlign = "center";
    ctx.fillText(`YOU • ${s.currentSpeedKmh} km/h`, 0, -22);
    ctx.textAlign = "start";

    ctx.restore();

    // Ambient traffic
    rerouteFlowParticles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1.0) p.progress = 0;
      let pt;
      if (p.route === 'bypass') {
        pt = getBypassPoint(p.progress);
      } else {
        if (s.hasCongestionAhead && p.progress > 0.45 && p.progress < 0.8) {
          p.progress = 0.48;
        }
        pt = getStraightPoint(p.progress);
      }
      ctx.beginPath();
      ctx.arc(pt.x, pt.y + 3, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    rerouteAnimId = requestAnimationFrame(renderSimulationFrame);
  }

  renderSimulationFrame();
}

// Map Engine Adapter Class for compatibility
export class NetworkMapEngine {
  constructor(canvasId) {
    if (canvasId === 'rerouteSimCanvas' || canvasId === 'rerouteCanvas') {
      initRerouteMapSimulation();
    } else {
      initRealisticHyderabadMap();
    }
  }

  stop() {
    if (mapAnimId) cancelAnimationFrame(mapAnimId);
    if (rerouteAnimId) cancelAnimationFrame(rerouteAnimId);
  }
}

function getPointAlongPath(pts, t) {
  if (pts.length === 1) return pts[0];
  const totalSegs = pts.length - 1;
  const segIndex = Math.min(Math.floor(t * totalSegs), totalSegs - 1);
  const segT = (t * totalSegs) - segIndex;
  const p1 = pts[segIndex];
  const p2 = pts[segIndex + 1];
  return {
    x: p1.x + (p2.x - p1.x) * segT,
    y: p1.y + (p2.y - p1.y) * segT
  };
}

function distToSegment(p, v, w) {
  function sqr(x) { return x * x; }
  function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
  const l2 = dist2(v, w);
  if (l2 === 0) return Math.sqrt(dist2(p, v));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
}
