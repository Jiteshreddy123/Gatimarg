/**
 * frontend/js/views/reroute_sim.js
 * Vehicle Rerouting Simulation View (Feature 2) — Full GatiMarg Prototype Design.
 *
 * Includes:
 *  - Simulation Control Bar (Play/Pause, Reset, Congestion toggle, Driver decision toggle)
 *  - Live Telemetry Chips (speed, progress, time saved) with real-time DOM updates
 *  - Status Alert Banner driven by simulation narrative
 *  - 60 FPS Canvas Engine (initRerouteMapSimulation):
 *      • Straight highway + curved bypass geometry with animated centerline dashes
 *      • Stalled-bus breakdown scene: hazard flashing, queue cars, safety cones
 *      • Node 44 junction marker with animated VMS electronic sign
 *      • User vehicle: headlight cone, radar pulse rings, car body, driver badge
 *      • Ambient background traffic flow particles on both corridors
 *      • High-DPI canvas scaling (devicePixelRatio)
 *  - Interactive floating HUD overlay with quick decision buttons
 */

import { STATE } from '../state.js';
import { renderProvenanceBadge } from '../provenance.js';

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE-LEVEL ANIMATION STATE
// ─────────────────────────────────────────────────────────────────────────────
let rerouteAnimId = null;
let rerouteFlowParticles = [];

// ─────────────────────────────────────────────────────────────────────────────
//  VIEW RENDERER
// ─────────────────────────────────────────────────────────────────────────────
export function renderRerouteSimView() {
  const s = STATE.rerouteSim;

  return `
    <!-- Header Row -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-live" style="background: rgba(16, 185, 129, 0.2); color: #34D399;">
            LIVE IN-TRIP REROUTING SIMULATION
          </span>
          <span class="badge-live" style="background: rgba(6, 182, 212, 0.2); color: #06B6D4;">60 FPS Moving Marker</span>
          ${renderProvenanceBadge('SIMULATION', 'NetworkX shortest path & counterfactual shockwave diversion')}
        </div>
        <h2 style="font-size: 22px; margin-top: 4px;">Dynamic Vehicle In-Trip Rerouting Simulator</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          Driver perspective: When ahead congestion strikes, choose to divert onto the low-congestion legal bypass or remain in the gridlock.
        </p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm" onclick="window.switchView('dashboard')">← Command Center</button>
        <button class="btn btn-brand btn-sm" onclick="window.resetRerouteSim()">🔄 Reset Journey</button>
      </div>
    </div>

    <!-- Simulation Control Bar -->
    <div class="card" style="margin-bottom: 14px; padding: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn ${s.running ? 'btn-outline' : 'btn-brand'} btn-sm" onclick="window.toggleRerouteSimPlay()">
            ${s.running ? '⏸ Pause Journey' : '▶ Start Journey'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.resetRerouteSim()">
            🔄 Reset
          </button>

          <div style="width: 1px; height: 24px; background: var(--surface-border); margin: 0 4px;"></div>

          <!-- Toggle Ahead Congestion -->
          <button class="btn ${s.hasCongestionAhead ? 'btn-danger' : 'btn-outline'} btn-sm"
                  onclick="window.toggleRerouteCongestion()"
                  title="Toggle whether the ahead highway has a severe breakdown">
            ${s.hasCongestionAhead ? '🚨 Ahead Congestion: ACTIVE (Stalled Bus)' : '🟢 Ahead Congestion: CLEAR'}
          </button>

          <!-- Driver Decision Toggle -->
          <button class="btn ${s.rerouteDecision === 'auto_bypass' ? 'btn-festive' : 'btn-outline'} btn-sm"
                  onclick="window.toggleRerouteDecision()"
                  title="Choose route decision at Node 44">
            ${s.rerouteDecision === 'auto_bypass' ? '🔀 Decision: Redirect to Low-Congestion Bypass' : '🚗 Decision: Stay on Same Path (Gridlock)'}
          </button>
        </div>

        <!-- Telemetry Chips -->
        <div style="display: flex; gap: 10px; font-size: 11px;">
          <div style="background: #090E1D; border: 1px solid var(--surface-border); border-radius: 6px; padding: 6px 10px;">
            Speed: <strong id="rSimSpeed" style="color: ${s.currentSpeedKmh < 20 ? '#EF4444' : '#34D399'}; font-size: 14px;">${s.currentSpeedKmh} km/h</strong>
          </div>
          <div style="background: #090E1D; border: 1px solid var(--surface-border); border-radius: 6px; padding: 6px 10px;">
            Progress: <strong id="rSimProgress" style="color: #38BDF8; font-size: 14px;">${Math.round(s.vehicleProgress * 100)}%</strong>
          </div>
          <div style="background: #090E1D; border: 1px solid var(--surface-border); border-radius: 6px; padding: 6px 10px;">
            Time Saved: <strong style="color: ${s.rerouteDecision === 'auto_bypass' ? '#34D399' : '#EF4444'}; font-size: 14px;">
              ${s.rerouteDecision === 'auto_bypass' ? '+34 Mins' : '0 Mins (Delayed)'}
            </strong>
          </div>
        </div>
      </div>

      <!-- Status Alert Banner -->
      <div style="background: #060A14; border-left: 3px solid ${s.hasCongestionAhead && s.rerouteDecision === 'stay_straight' && s.vehicleProgress > 0.38 ? '#EF4444' : '#06B6D4'}; padding: 8px 12px; border-radius: 4px; margin-top: 10px; font-size: 11.5px;">
        <span id="rSimStatus" style="color: #E2E8F0;">${s.statusText}</span>
      </div>
    </div>

    <!-- Dedicated Interactive Rerouting Simulation Canvas -->
    <div class="card" style="padding: 10px; position: relative; overflow: hidden; margin-bottom: 16px;">
      <canvas id="rerouteCanvas" style="width: 100%; height: 420px; display: block; border-radius: 6px;"></canvas>

      <!-- Interactive Floating HUD Overlay -->
      <div style="position: absolute; top: 20px; right: 20px; background: rgba(9, 14, 29, 0.88); backdrop-filter: blur(8px); border: 1px solid var(--surface-border); border-radius: 8px; padding: 12px; width: 280px; font-size: 11.5px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">LIVE IN-TRIP GUIDANCE</div>
        <div style="margin-top: 6px; line-height: 1.4;">
          <div>• <strong>Current Path:</strong> ${s.rerouteDecision === 'auto_bypass' && s.vehicleProgress > 0.38
            ? '<span style="color:#34D399;">Pillar 140 Slip Road Bypass</span>'
            : (s.vehicleProgress > 0.38
              ? '<span style="color:#EF4444;">PVNR Elevated Ramp (Jam)</span>'
              : '<span style="color:#38BDF8;">Mehdipatnam Trunk</span>')}</div>
          <div>• <strong>Ahead Condition:</strong> ${s.hasCongestionAhead
            ? '<span style="color:#EF4444;">🚨 Severe Jam (Stalled Bus)</span>'
            : '<span style="color:#34D399;">🟢 Free Flow</span>'}</div>
          <div>• <strong>Reroute Policy:</strong> ${s.rerouteDecision === 'auto_bypass'
            ? '<span style="color:#34D399;">Dynamic Bypass Engaged</span>'
            : '<span style="color:#EF4444;">Force Stay on Route</span>'}</div>
        </div>

        <div style="margin-top: 10px; display: flex; gap: 6px;">
          <button class="btn btn-festive btn-sm" style="flex: 1; font-size: 10px; justify-content: center;" onclick="window.setRerouteDecision('auto_bypass')">
            🔀 Divert to Bypass
          </button>
          <button class="btn btn-outline btn-sm" style="flex: 1; font-size: 10px; justify-content: center;" onclick="window.setRerouteDecision('stay_straight')">
            🚗 Stay on Route
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GEOMETRY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
//  60 FPS CANVAS ENGINE  — called by app.js after DOM injection
// ─────────────────────────────────────────────────────────────────────────────
export function initRerouteMapSimulation() {
  const canvas = document.getElementById('rerouteCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (rerouteAnimId) cancelAnimationFrame(rerouteAnimId);

  // High-DPI scaling
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = rect.width || 800;
  const H = rect.height || 420;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Seed ambient background vehicles on first load
  if (rerouteFlowParticles.length === 0) {
    for (let i = 0; i < 24; i++) {
      rerouteFlowParticles.push({
        route:    Math.random() > 0.4 ? 'straight' : 'bypass',
        progress: Math.random(),
        speed:    0.0012 + Math.random() * 0.0015,
        color:    ['#38BDF8', '#818CF8', '#FDE047', '#E2E8F0'][Math.floor(Math.random() * 4)],
        size:     4 + Math.random() * 2
      });
    }
  }

  // ── Road geometry ──────────────────────────────────────────────────────────
  const startPt    = { x: 70,  y: 150 };
  const decisionPt = { x: 300, y: 150 };
  const jamStartPt = { x: 440, y: 150 };
  const jamStallPt = { x: 570, y: 150 };
  const straightEnd = { x: 760, y: 150 };

  const bypassPts = [
    decisionPt,
    { x: 370, y: 280 },
    { x: 520, y: 310 },
    { x: 670, y: 260 },
    straightEnd
  ];

  const getBypassPoint   = t => getPointAlongPath(bypassPts, t);
  const getStraightPoint = t => ({
    x: startPt.x + (straightEnd.x - startPt.x) * t,
    y: startPt.y + (straightEnd.y - startPt.y) * t
  });

  let frameCounter = 0;

  function renderSimulationFrame() {
    if (STATE.currentView !== 'reroute') {
      if (rerouteAnimId) cancelAnimationFrame(rerouteAnimId);
      return;
    }

    frameCounter++;
    const s = STATE.rerouteSim;

    // ── 1. Vehicle Movement Logic ──────────────────────────────────────────
    if (s.running) {
      const isBypass = s.rerouteDecision === 'auto_bypass';

      if (s.vehicleProgress < 0.33) {
        s.currentSpeedKmh = 50;
        s.vehicleProgress += 0.0018;
        s.statusText = s.hasCongestionAhead
          ? (isBypass
            ? '⚠️ Congestion Alert: PVNR Ramp blocked ahead. Telemetry will divert vehicle onto Pillar 140 Bypass at Node 44.'
            : '⚠️ Congestion Alert: PVNR Ramp blocked ahead. Vehicle will hold course straight into queue.')
          : '🟢 Telemetry Normal: Highway clear. Approaching Node 44 junction.';

      } else if (isBypass) {
        s.currentSpeedKmh = 48 + Math.floor(Math.sin(frameCounter / 15) * 3);
        s.vehicleProgress += 0.0022;
        s.statusText = '🔀 ACTIVE BYPASS: Vehicle successfully diverted via Pillar 140 Service Arterial. Unobstructed free flow at 48 km/h. Saving 34 minutes!';

      } else {
        if (s.hasCongestionAhead && s.vehicleProgress >= 0.52) {
          s.currentSpeedKmh = 4 + Math.floor(Math.sin(frameCounter / 20) * 2);
          s.vehicleProgress += 0.0003;
          s.statusText = "🚨 TRAPPED IN GRIDLOCK: Behind stalled TSRTC bus on PVNR Ramp! Crawling at 4 km/h with 2.4 km spillback. Click 'Divert to Bypass' to redirect!";
        } else {
          s.currentSpeedKmh = 52;
          s.vehicleProgress += 0.002;
          s.statusText = s.hasCongestionAhead
            ? '⚠️ Warning: Stalled bus reported 600m ahead. Rapidly decelerating towards shockwave queue.'
            : '🟢 PVNR Express corridor clear: cruising at 52 km/h.';
        }
      }

      if (s.vehicleProgress >= 1.0) {
        s.vehicleProgress = 1.0;
        s.running = false;
        s.statusText = isBypass
          ? '🏁 JOURNEY COMPLETE: Reached destination via Pillar 140 Bypass on time! Total delay avoided: 34 minutes.'
          : '🏁 JOURNEY FINISHED: Arrived at destination with severe 45-minute spillback delay.';
      }

      // Lightweight DOM-only updates (no full re-render)
      const speedEl = document.getElementById('rSimSpeed');
      const progEl  = document.getElementById('rSimProgress');
      const statEl  = document.getElementById('rSimStatus');
      if (speedEl) { speedEl.textContent = `${s.currentSpeedKmh} km/h`; speedEl.style.color = s.currentSpeedKmh < 20 ? '#EF4444' : '#34D399'; }
      if (progEl)  progEl.textContent = `${Math.round(s.vehicleProgress * 100)}%`;
      if (statEl)  statEl.textContent = s.statusText;
    }

    // ── 2. Clear & Background Grid ────────────────────────────────────────
    ctx.fillStyle = '#070B16';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // ── 3. Road Corridors ─────────────────────────────────────────────────
    // Straight highway
    ctx.beginPath(); ctx.moveTo(startPt.x, startPt.y); ctx.lineTo(straightEnd.x, straightEnd.y);
    ctx.lineWidth = 26; ctx.strokeStyle = '#131C31'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 20; ctx.strokeStyle = '#1E293B'; ctx.stroke();

    // Bypass corridor (curved)
    ctx.beginPath(); ctx.moveTo(bypassPts[0].x, bypassPts[0].y);
    for (let i = 1; i < bypassPts.length; i++) ctx.lineTo(bypassPts[i].x, bypassPts[i].y);
    ctx.lineWidth = 24; ctx.strokeStyle = 'rgba(6,78,59,0.35)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.lineWidth = 18; ctx.strokeStyle = '#064E3B'; ctx.stroke();

    // Animated highlighted bypass stripe when active
    if (s.rerouteDecision === 'auto_bypass') {
      ctx.beginPath(); ctx.moveTo(bypassPts[0].x, bypassPts[0].y);
      for (let i = 1; i < bypassPts.length; i++) ctx.lineTo(bypassPts[i].x, bypassPts[i].y);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(52,211,153,0.7)';
      ctx.setLineDash([8, 6]); ctx.lineDashOffset = -frameCounter * 1.5; ctx.stroke(); ctx.setLineDash([]);
    }

    // Animated road centerline dashes
    ctx.beginPath(); ctx.moveTo(startPt.x, startPt.y); ctx.lineTo(straightEnd.x, straightEnd.y);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([10, 10]); ctx.lineDashOffset = -frameCounter * 0.8; ctx.stroke(); ctx.setLineDash([]);

    // ── 4. Ahead Congestion Zone ──────────────────────────────────────────
    if (s.hasCongestionAhead) {
      const glowGrad = ctx.createLinearGradient(jamStartPt.x, 150, jamStallPt.x + 40, 150);
      glowGrad.addColorStop(0,   'rgba(239,68,68,0.1)');
      glowGrad.addColorStop(0.5, 'rgba(239,68,68,0.45)');
      glowGrad.addColorStop(1,   'rgba(239,68,68,0.8)');
      ctx.beginPath(); ctx.moveTo(jamStartPt.x, 150); ctx.lineTo(jamStallPt.x + 30, 150);
      ctx.lineWidth = 20; ctx.strokeStyle = glowGrad; ctx.stroke();

      // Stalled TSRTC bus
      ctx.save(); ctx.translate(jamStallPt.x, jamStallPt.y);
      const flash = Math.floor(frameCounter / 15) % 2 === 0;
      if (flash) { ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = 'rgba(239,68,68,0.35)'; ctx.fill(); }
      ctx.fillStyle = '#B91C1C'; ctx.fillRect(-14, -7, 28, 14);
      ctx.strokeStyle = '#FCA5A5'; ctx.lineWidth = 1.5; ctx.strokeRect(-14, -7, 28, 14);
      ctx.fillStyle = flash ? '#FDE047' : '#78350F';
      ctx.fillRect(-13, -7, 4, 3); ctx.fillRect(-13,  4, 4, 3);
      ctx.fillRect(  9, -7, 4, 3); ctx.fillRect(  9,  4, 4, 3);
      ctx.font = 'bold 9px var(--font-sans)'; ctx.fillStyle = '#F87171';
      ctx.fillText('🚨 STALLED BUS (4 km/h)', -45, -16);
      ctx.restore();

      // Queue of 4 trapped cars
      for (let c = 1; c <= 4; c++) {
        const cx = jamStallPt.x - (c * 24);
        ctx.fillStyle = '#475569'; ctx.fillRect(cx - 7, 145, 14, 10);
        ctx.fillStyle = '#EF4444'; ctx.fillRect(cx - 7, 146, 2, 8);
      }

      // Safety cones
      ctx.fillStyle = '#F97316';
      [-22, 0, 22].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(jamStallPt.x + ox,     164);
        ctx.lineTo(jamStallPt.x + ox + 3, 158);
        ctx.lineTo(jamStallPt.x + ox + 6, 164);
        ctx.closePath(); ctx.fill();
      });
    }

    // ── 5. Node 44 Junction Marker + VMS Sign ─────────────────────────────
    ctx.beginPath(); ctx.arc(decisionPt.x, decisionPt.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A'; ctx.fill();
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.font = 'bold 10px var(--font-mono)'; ctx.fillStyle = '#38BDF8';
    ctx.fillText('NODE 44 (PVNR Split)', decisionPt.x - 48, decisionPt.y - 18);

    ctx.fillStyle = '#0B132B'; ctx.fillRect(decisionPt.x - 70, decisionPt.y + 14, 140, 28);
    ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 1; ctx.strokeRect(decisionPt.x - 70, decisionPt.y + 14, 140, 28);
    ctx.font = 'bold 8px var(--font-mono)';
    ctx.fillStyle = s.hasCongestionAhead ? '#EF4444' : '#34D399';
    ctx.fillText(s.hasCongestionAhead ? 'VMS: PVNR RAMP BLOCKED' : 'VMS: STRAIGHT ALL CLEAR', decisionPt.x - 64, decisionPt.y + 26);
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('PILLAR 140 BYPASS ➔ 48 KM/H', decisionPt.x - 64, decisionPt.y + 37);

    // Origin / Destination markers
    ctx.beginPath(); ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#0284C7'; ctx.fill();
    ctx.font = 'bold 9px var(--font-sans)'; ctx.fillStyle = '#E0F2FE';
    ctx.fillText('📍 ORIGIN: Mehdipatnam', startPt.x - 45, startPt.y - 12);

    ctx.beginPath(); ctx.arc(straightEnd.x, straightEnd.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#10B981'; ctx.fill();
    ctx.fillText('🏁 DESTINATION: Airport Hub', straightEnd.x - 70, straightEnd.y - 12);

    ctx.font = 'bold 9.5px var(--font-sans)'; ctx.fillStyle = '#34D399';
    ctx.fillText('🟢 Pillar 140 Service Arterial (Low Congestion Legal Bypass)', 380, 335);

    // ── 6. User Vehicle ───────────────────────────────────────────────────
    let userPos, carAngle = 0;
    if (s.rerouteDecision === 'auto_bypass') {
      if (s.vehicleProgress <= 0.33) {
        const normT = s.vehicleProgress / 0.33;
        userPos = { x: startPt.x + (decisionPt.x - startPt.x) * normT, y: startPt.y };
      } else {
        const normT = (s.vehicleProgress - 0.33) / (1.0 - 0.33);
        userPos = getBypassPoint(normT);
        const nxt = getBypassPoint(Math.min(1.0, normT + 0.02));
        carAngle = Math.atan2(nxt.y - userPos.y, nxt.x - userPos.x);
      }
    } else {
      userPos = getStraightPoint(s.vehicleProgress);
    }

    ctx.save(); ctx.translate(userPos.x, userPos.y);

    // Headlight cone
    ctx.save(); ctx.rotate(carAngle);
    const hl = ctx.createRadialGradient(8, 0, 2, 45, 0, 30);
    hl.addColorStop(0, 'rgba(254,240,138,0.65)'); hl.addColorStop(1, 'rgba(254,240,138,0)');
    ctx.beginPath(); ctx.moveTo(8,-4); ctx.lineTo(45,-18); ctx.lineTo(45,18); ctx.lineTo(8,4);
    ctx.closePath(); ctx.fillStyle = hl; ctx.fill(); ctx.restore();

    // Radar pulse ring
    const pulse = (frameCounter % 40) / 40;
    ctx.beginPath(); ctx.arc(0, 0, 12 + pulse * 18, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(6,182,212,${1 - pulse})`; ctx.lineWidth = 1.5; ctx.stroke();

    // Car body
    ctx.save(); ctx.rotate(carAngle);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-10, -5, 20, 12);
    ctx.fillStyle = '#06B6D4';         ctx.fillRect(-9, -6, 18, 12);
    ctx.strokeStyle = '#E0F2FE'; ctx.lineWidth = 1; ctx.strokeRect(-9, -6, 18, 12);
    ctx.fillStyle = '#0F172A';  ctx.fillRect(0, -4, 4, 8);
    ctx.fillStyle = '#FEF08A';  ctx.fillRect(7, -5, 2, 3); ctx.fillRect(7,  2, 2, 3);
    ctx.fillStyle = s.currentSpeedKmh < 20 ? '#EF4444' : '#F87171';
    ctx.fillRect(-9, -5, 2, 3); ctx.fillRect(-9, 2, 2, 3);
    ctx.restore();

    // Driver badge
    ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fillRect(-45, -34, 90, 18);
    ctx.strokeStyle = s.currentSpeedKmh < 20 ? '#EF4444' : '#38BDF8';
    ctx.lineWidth = 1; ctx.strokeRect(-45, -34, 90, 18);
    ctx.font = 'bold 9px var(--font-sans)'; ctx.fillStyle = '#E0F2FE';
    ctx.textAlign = 'center'; ctx.fillText(`YOU • ${s.currentSpeedKmh} km/h`, 0, -22); ctx.textAlign = 'start';
    ctx.restore();

    // ── 7. Ambient Flow Particles ─────────────────────────────────────────
    rerouteFlowParticles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1.0) p.progress = 0;
      let pt;
      if (p.route === 'bypass') {
        pt = getBypassPoint(p.progress);
      } else {
        if (s.hasCongestionAhead && p.progress > 0.45 && p.progress < 0.8) p.progress = 0.48;
        pt = getStraightPoint(p.progress);
      }
      ctx.beginPath(); ctx.arc(pt.x, pt.y + 3, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
    });

    rerouteAnimId = requestAnimationFrame(renderSimulationFrame);
  }

  renderSimulationFrame();
}

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL WINDOW CALLBACKS  (consumed by HTML onclick attributes & app.js)
// ─────────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // Play / Pause
  window.toggleRerouteSimPlay = function () {
    STATE.rerouteSim.running = !STATE.rerouteSim.running;
    if (STATE.rerouteSim.running && STATE.rerouteSim.vehicleProgress >= 1.0) {
      STATE.rerouteSim.vehicleProgress = 0.05;
    }
    const btn = document.querySelector('[onclick="window.toggleRerouteSimPlay()"]');
    if (btn) btn.textContent = STATE.rerouteSim.running ? '⏸ Pause Journey' : '▶ Start Journey';
  };

  // Reset
  window.resetRerouteSim = function () {
    STATE.rerouteSim.vehicleProgress = 0.05;
    STATE.rerouteSim.running = false;
    STATE.rerouteSim.currentSpeedKmh = 52;
    STATE.rerouteSim.statusText = 'Journey reset to Mehdipatnam Start Node. Click Start Journey to simulate!';
    rerouteFlowParticles = [];
    window.switchView('reroute');
  };

  // Kept for backward-compatibility with app.js
  window.resetSimProgress = function () {
    window.resetRerouteSim();
  };

  // Congestion toggle
  window.toggleRerouteCongestion = function () {
    STATE.rerouteSim.hasCongestionAhead = !STATE.rerouteSim.hasCongestionAhead;
    window.switchView('reroute');
  };

  // Explicit decision setter (from HUD buttons)
  window.setRerouteDecision = function (d) {
    STATE.rerouteSim.rerouteDecision = d;
    window.switchView('reroute');
  };

  // Toggle between bypass / stay_straight (control bar button & app.js)
  window.toggleRerouteDecision = function () {
    STATE.rerouteSim.rerouteDecision =
      STATE.rerouteSim.rerouteDecision === 'auto_bypass' ? 'stay_straight' : 'auto_bypass';
    window.switchView('reroute');
  };
}
