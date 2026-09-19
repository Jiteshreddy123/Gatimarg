/**
 * frontend/js/views/reroute_sim.js
 * Vehicle Rerouting Simulation View (Feature 2).
 * Interactive 60 FPS Canvas Simulation demonstrating dynamic vehicle pivot to legal detour
 * when congestion is detected ahead.
 */

import { STATE } from '../state.js';
import { renderProvenanceBadge } from '../provenance.js';

export function renderRerouteSimView() {
  const isBypass = STATE.rerouteSim.rerouteDecision === 'auto_bypass';

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-live" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border-color: rgba(16, 185, 129, 0.4);">
            SIMULATION ENGINE: DYNAMIC REROUTE
          </span>
          ${renderProvenanceBadge('SIMULATION', 'NetworkX shortest path & counterfactual shockwave diversion')}
        </div>
        <h2 style="font-size: 22px; margin-top: 4px;">Real-Time Vehicle Rerouting Simulation</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          Visualizes real-time vehicle trajectory pivoting away from ahead bottlenecks towards fluid bypass corridors
        </p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn ${isBypass ? 'btn-brand' : 'btn-outline'} btn-sm" onclick="window.toggleRerouteDecision()">
          ${isBypass ? '🔀 Active: Auto-Reroute to Bypass' : '⚠️ Continue Through Congestion'}
        </button>
        <button class="btn btn-outline btn-sm" onclick="window.resetSimProgress()">
          🔄 Reset Vehicle Position
        </button>
      </div>
    </div>

    <!-- Live Telemetry HUD Bar -->
    <div class="grid-4" style="margin-bottom: 20px;">
      <div class="stat-box">
        <div class="stat-label">VEHICLE VELOCITY</div>
        <div class="stat-value" style="color: ${isBypass ? '#10B981' : '#EF4444'};">
          ${isBypass ? '38.0 km/h' : '11.5 km/h'}
        </div>
        <div class="stat-sub">${isBypass ? 'Fluid Detour (LOS B)' : 'Standstill in Queue'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">COMMUTER DELAY</div>
        <div class="stat-value" style="color: ${isBypass ? '#38BDF8' : '#F59E0B'};">
          ${isBypass ? '-21 Mins Saved' : '+24 Mins Delay'}
        </div>
        <div class="stat-sub">Compared to bottleneck arrival</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">AHEAD HAZARD</div>
        <div class="stat-value" style="color: #EF4444;">SEG-042 Choked</div>
        <div class="stat-sub">1.85 km queue detected</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">TURN COMPLIANCE</div>
        <div class="stat-value" style="color: #10B981;">100% Legal</div>
        <div class="stat-sub">Median U-turn prohibited</div>
      </div>
    </div>

    <!-- Canvas Simulation Stage -->
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 16px;">🚗 Live Vehicle Trajectory &amp; Dynamic Detour Sandbox</h3>
        <span class="badge-live">60 FPS Hardware Render</span>
      </div>

      <div class="canvas-map-wrapper">
        <canvas id="rerouteSimCanvas" class="canvas-map"></canvas>
        <div class="canvas-map-overlay">
          <strong>Interactive Vehicle Trajectory:</strong><br>
          ${isBypass
            ? '<span style="color: #34D399;">✓ Vehicle diverted onto Pillar 140 Slipway (Bypassing stalled bus)</span>'
            : '<span style="color: #F87171;">⚠️ Vehicle continuing straight into PVNR Ramp Bottleneck</span>'
          }
        </div>
        <div class="canvas-map-legend">
          <div class="legend-item"><div class="legend-color" style="background: #10B981;"></div> Designated Legal Detour</div>
          <div class="legend-item"><div class="legend-color" style="background: #EF4444;"></div> Choked Primary Link (SEG-042)</div>
          <div class="legend-item"><div class="legend-color" style="background: #38BDF8;"></div> Moving Commuter Marker</div>
        </div>
      </div>
    </div>
  `;
}
