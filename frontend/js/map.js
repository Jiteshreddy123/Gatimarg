/**
 * frontend/js/map.js
 * High-Performance 60 FPS HTML5 Canvas Map Engine for Hyderabad Arterial Network.
 * Visualizes cartographic features: Hussain Sagar, Durgam Cheruvu, Musi River.
 */

import { STATE } from './state.js';

const MAP_CORRIDORS = [
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

const MAP_LANDMARKS = [
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

export class NetworkMapEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animId = null;
    this.hoveredSegment = null;

    this.mapPanX = 0;
    this.mapPanY = 0;
    this.mapZoomScale = 1.0;
    this.timeOffset = 0;

    // Spawn initial vehicle particles
    this.mapParticles = [];
    for (let i = 0; i < 90; i++) {
      const cIdx = Math.floor(Math.random() * MAP_CORRIDORS.length);
      this.mapParticles.push({
        corridorIndex: cIdx,
        progress: Math.random(),
        speedMultiplier: 0.8 + Math.random() * 0.4
      });
    }

    // Spawn rain drops
    this.mapRainDrops = [];
    for (let i = 0; i < 120; i++) {
      this.mapRainDrops.push({
        x: Math.random() * 800,
        y: Math.random() * 500,
        len: 10 + Math.random() * 12,
        speed: 8 + Math.random() * 6
      });
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.onmousemove = (e) => {
      const cRect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - cRect.left - this.mapPanX) / this.mapZoomScale;
      const my = (e.clientY - cRect.top - this.mapPanY) / this.mapZoomScale;

      let closestSeg = null;
      let minDist = 20;

      function sqr(x) { return x * x; }
      function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
      function distToSegment(p, v, w) {
        const l2 = dist2(v, w);
        if (l2 === 0) return Math.sqrt(dist2(p, v));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
      }

      MAP_CORRIDORS.forEach(c => {
      const isHov = this.hoveredSegment && this.hoveredSegment.id === c.id;
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

      this.hoveredSegment = closestSeg;
      const tooltip = document.getElementById('mapTooltip');

      if (closestSeg && tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - cRect.left) + 'px';
        tooltip.style.top = (e.clientY - cRect.top) + 'px';

        document.getElementById('ttTitle').textContent = closestSeg.name;
        document.getElementById('ttSub').textContent = `Segment ID: ${closestSeg.id} · Priority Link`;
        
        let statBadge = '';
        if (closestSeg.status === 'congested') statBadge = '<span style="color: #F87171;">⚠️ Gridlocked: Stalled Transit Bus</span>';
        else if (closestSeg.status === 'shockwave') statBadge = '<span style="color: #F59E0B;">⚡ Upstream Spillback Shockwave (-14.2 km/h)</span>';
        else if (closestSeg.status === 'festive-blocked') statBadge = '<span style="color: #EF4444;">🪔 Festive Cordon (Procession Barricade)</span>';
        else if (closestSeg.status === 'diversion') statBadge = '<span style="color: #34D399;">✓ Active Legal Bypass (Recommended)</span>';
        else statBadge = '<span style="color: #34D399;">✓ Fluid Traffic Flow</span>';

        document.getElementById('ttMetrics').innerHTML = `
          Live Speed: <strong>${closestSeg.speed} km/h</strong> (Free: ${closestSeg.freeSpeed} km/h)<br>
          Discharge Flow: <strong>${closestSeg.flow.toLocaleString()} vph</strong> (Cap: ${closestSeg.cap.toLocaleString()} vph)<br>
          ${statBadge}<br>
          <span style="color: #38BDF8; font-size: 10px; font-weight: 600;">[Click road to inspect segment telemetry]</span>
        `;
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    };

    this.canvas.onmouseleave = () => {
      this.hoveredSegment = null;
      const tooltip = document.getElementById('mapTooltip');
      if (tooltip) tooltip.style.display = 'none';
    };

    this.canvas.onclick = () => {
      if (this.hoveredSegment && window.viewSegmentDetails) {
        window.viewSegmentDetails(this.hoveredSegment.id);
      }
    };

    window._activeMapEngine = this;
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 760;
    this.canvas.height = rect.height || 460;
  }

  start() {
    const render = () => {
      this.drawRealisticMap();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  drawRealisticMap() {
    const { ctx, canvas } = this;
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / 760;
    const scaleY = H / 460;
    const avgScale = (scaleX + scaleY) / 2;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(this.mapPanX, this.mapPanY);
    ctx.scale(this.mapZoomScale * avgScale, this.mapZoomScale * avgScale);

    // 1. Background Cartographic Grid
    ctx.strokeStyle = "rgba(30, 41, 59, 0.45)";
    ctx.lineWidth = 0.6;
    for (let x = 0; x < 960; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 660);
      ctx.stroke();
    }
    for (let y = 0; y < 660; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }

    // 2. Water Bodies (Hussain Sagar, Durgam Cheruvu, Musi River)
    // Musi River (meandering across south)
    ctx.beginPath();
    ctx.moveTo(20, 395);
    ctx.bezierCurveTo(160, 420, 300, 385, 430, 410);
    ctx.bezierCurveTo(570, 435, 680, 400, 760, 410);
    ctx.strokeStyle = "#0B2844";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.font = "italic 9px var(--font-sans, sans-serif)";
    ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    ctx.fillText("Musi River Corridor", 230, 403);

    // Durgam Cheruvu Lake (west)
    ctx.beginPath();
    ctx.ellipse(145, 205, 38, 18, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#0C2339";
    ctx.fill();
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillText("Durgam Cheruvu", 115, 208);

    // Hussain Sagar Lake (organic heart polygon with glowing shoreline)
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

    // Buddha Statue Marker in center of Hussain Sagar
    ctx.beginPath();
    ctx.arc(468, 208, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FDE047";
    ctx.fill();
    ctx.font = "bold 9.5px var(--font-sans, sans-serif)";
    ctx.fillStyle = "#E0F2FE";
    ctx.fillText("Hussain Sagar Lake", 432, 224);
    ctx.font = "8px var(--font-sans, sans-serif)";
    ctx.fillStyle = "#FDE047";
    ctx.fillText("● Buddha Statue", 438, 235);

    // 3. Green Open Spaces (KBR Park, Lumbini Park)
    ctx.beginPath();
    ctx.ellipse(195, 245, 24, 16, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(5, 150, 105, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(5, 150, 105, 0.35)";
    ctx.stroke();
    ctx.fillStyle = "rgba(52, 211, 153, 0.4)";
    ctx.fillText("KBR Park", 175, 248);

    // 4. Render All Road Corridors
    MAP_CORRIDORS.forEach(c => {
      const isHov = this.hoveredSegment && this.hoveredSegment.id === c.id;
      // Road base / casing
      ctx.beginPath();
      ctx.moveTo(c.points[0].x, c.points[0].y);
      for (let i = 1; i < c.points.length; i++) ctx.lineTo(c.points[i].x, c.points[i].y);
      ctx.strokeStyle = isHov ? '#fff' : c.color;
      ctx.lineWidth = isHov ? c.width + 1.5 : c.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (isHov) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(c.points[0].x, c.points[0].y);
        for (let i = 1; i < c.points.length; i++) ctx.lineTo(c.points[i].x, c.points[i].y);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
        ctx.lineWidth = c.width + 8;
        ctx.stroke();
        ctx.restore();
      }

      // Striped hazard line for festive cordons
      if (c.isStriped) {
        ctx.setLineDash([8, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw Incident Marker on PVNR
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

        ctx.font = "bold 9px var(--font-sans, sans-serif)";
        ctx.fillStyle = "#F87171";
        ctx.fillText("🚨 STALL (PVNR Ramp)", c.incidentPoint.x + 8, c.incidentPoint.y - 4);
      }

      // Draw Shockwave Propagation Wave
      if (c.hasShockwave) {
        const wavePhase = (Date.now() / 400) % 1;
        const waveP = getPointAlongPath(c.points, wavePhase);
        ctx.beginPath();
        ctx.arc(waveP.x, waveP.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
        ctx.fill();
      }

      // Draw Directional Chevrons on Recommended Bypass
      if (c.isDiversion) {
        const divP = getPointAlongPath(c.points, (Date.now() / 800) % 1);
        ctx.beginPath();
        ctx.arc(divP.x, divP.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#34D399";
        ctx.fill();
      }
    });

    // 5. Update & Render Moving Vehicle Particles
    this.mapParticles.forEach(p => {
      const corridor = MAP_CORRIDORS[p.corridorIndex];
      if (!corridor) return;

      // Effective speed along path
      let baseStep = 0.003 * p.speedMultiplier;
      if (corridor.status === 'congested') baseStep = 0.0008;
      if (corridor.status === 'festive-blocked') baseStep = 0.0003;

      p.progress += baseStep;
      if (p.progress >= 1) p.progress = 0;

      const pt = getPointAlongPath(corridor.points, p.progress);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);

      // Particle color
      if (corridor.status === 'congested') ctx.fillStyle = "#FCA5A5";
      else if (corridor.status === 'festive-blocked') ctx.fillStyle = "#F87171";
      else if (corridor.status === 'shockwave') ctx.fillStyle = "#FDE68A";
      else if (corridor.status === 'diversion') ctx.fillStyle = "#6EE7B7";
      else ctx.fillStyle = "#E0F2FE";

      ctx.fill();
    });

    // 6. Draw Key Junction Nodes
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

      ctx.font = "600 8px var(--font-mono, monospace)";
      ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
      ctx.fillText(jn.name, jn.x - 7, jn.y - 6);
    });

    // 7. Geographic Landmarks Text
    ctx.font = "bold 9px var(--font-sans, sans-serif)";
    ctx.fillStyle = "rgba(226, 232, 240, 0.65)";
    MAP_LANDMARKS.forEach(lm => {
      ctx.fillText(lm.name, lm.x, lm.y);
    });

    ctx.restore();
  }
}

window.mapZoom = function(factor) {
  if (window._activeMapEngine) {
    window._activeMapEngine.mapZoomScale = Math.max(0.7, Math.min(2.2, window._activeMapEngine.mapZoomScale * factor));
    if (window.showToast) window.showToast(`Map Zoom: ${Math.round(window._activeMapEngine.mapZoomScale * 100)}%`);
  }
};

window.resetMapView = function() {
  if (window._activeMapEngine) {
    window._activeMapEngine.mapZoomScale = 1.0;
    window._activeMapEngine.mapPanX = 0;
    window._activeMapEngine.mapPanY = 0;
    if (window.showToast) window.showToast("Map view reset to default corridor framing.");
  }
};
