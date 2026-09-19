/**
 * frontend/js/views/routes.js
 * Citizen Route Check View: Turn-Restricted Dijkstra Route Planning, Lookahead Hazard Radar,
 * Corridor Stepper Timeline, and Smartphone Traveler Companion Simulator.
 */

import { STATE, PRESET_ROUTES } from '../state.js';
import { renderProvenanceBadge } from '../provenance.js';

export function renderRoutesView() {
  const currentPreset = PRESET_ROUTES[STATE.citizenRoute.activePreset] || PRESET_ROUTES['mehdipatnam_hitec'];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-live" style="background: rgba(14, 165, 233, 0.2); color: #38BDF8; border-color: rgba(14, 165, 233, 0.4);">
            CITIZEN NAVIGATION INTELLIGENCE
          </span>
          ${renderProvenanceBadge('DERIVED', 'Dijkstra shortest path with 61 turn_restrictions.csv')}
        </div>
        <h2 style="font-size: 22px; margin-top: 4px;">Citizen Route Check: Lookahead Radar &amp; Smart Detours</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          Pre-trip corridor hazard detection, bottleneck bypasses, and 100% legal turn compliance
        </p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-brand btn-sm" onclick="window.startBypassFromCitizenRoute()">
          🔀 Start Reroute Sim →
        </button>
      </div>
    </div>

    <!-- Quick Corridor Preset Chips -->
    <div class="preset-chips-container">
      <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center;">
        POPULAR CORRIDORS:
      </div>
      <button class="preset-chip ${STATE.citizenRoute.activePreset === 'mehdipatnam_hitec' ? 'active' : ''}" onclick="window.selectCitizenPreset('mehdipatnam_hitec')">
        Mehdipatnam ➔ HITEC City
      </button>
      <button class="preset-chip ${STATE.citizenRoute.activePreset === 'secunderabad_tankbund' ? 'active' : ''}" onclick="window.selectCitizenPreset('secunderabad_tankbund')">
        Secunderabad ➔ Lakdikapul (Tank Bund)
      </button>
    </div>

    <div class="grid-2" style="margin-bottom: 20px;">
      <!-- Left Column: Route Details & Corridor Timeline Stepper -->
      <div>
        <!-- Search Form Card -->
        <div class="card" style="margin-bottom: 16px;">
          <div class="route-input-group">
            <label class="route-input-label">Origin Point (Node or Landmark)</label>
            <input type="text" id="routeOriginInput" class="route-input" value="${STATE.citizenRoute.origin}" placeholder="e.g. Mehdipatnam or N032" />
          </div>
          <div class="route-input-group">
            <label class="route-input-label">Destination (Node or Landmark)</label>
            <input type="text" id="routeDestInput" class="route-input" value="${STATE.citizenRoute.destination}" placeholder="e.g. HITEC City or N089" />
          </div>
          <button class="btn btn-brand" style="width: 100%; justify-content: center;" onclick="window.scanCitizenRoute()">
            🔍 Scan Corridor Ahead
          </button>
        </div>

        <!-- Corridor Segments Ahead Stepper -->
        <div class="card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 15px;">🛣️ Corridor Segments Ahead</h3>
            ${renderProvenanceBadge('DATA', 'network.csv directed segments')}
          </div>
          <div class="corridor-timeline">
            ${currentPreset.segmentsTimeline.map((seg, idx) => {
              const dotCls = seg.status === 'danger' ? 'dot-danger' : (seg.status === 'warning' ? 'dot-warning' : 'dot-clear');
              return `
                <div class="timeline-node">
                  <div class="timeline-dot ${dotCls}"></div>
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <strong style="color: #fff; font-size: 13px;">${idx + 1}. ${seg.name}</strong>
                    <span style="font-size: 11px; font-family: var(--font-mono); font-weight: 700; color: ${seg.status === 'danger' ? '#EF4444' : '#10B981'};">
                      ${seg.speed}
                    </span>
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                    ${seg.note}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Recommended Legal Bypass Card -->
        <div class="card" style="border: 1px solid rgba(16, 185, 129, 0.4); background: linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-card) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 14px; color: #34D399;">✓ ${currentPreset.bypass.title}</strong>
            <span class="badge-live" style="background: rgba(16, 185, 129, 0.2); color: #34D399;">${currentPreset.bypass.timeSaved}</span>
          </div>
          <p style="font-size: 12px; color: #E2E8F0; margin-bottom: 10px;">
            ${currentPreset.bypass.desc}
          </p>
          <div style="background: #070B14; border-left: 3px solid #F59E0B; padding: 8px 12px; border-radius: 4px; font-size: 11px; color: #FDE68A; margin-bottom: 12px;">
            ⚠️ <strong>Turn Compliance Rule:</strong> ${currentPreset.bypass.turnCompliance}
          </div>
          <button class="btn btn-brand btn-sm" style="width: 100%; justify-content: center;" onclick="window.startBypassFromCitizenRoute()">
            🚀 Start Navigation via Bypass
          </button>
        </div>
      </div>

      <!-- Right Column: Smartphone Companion Simulator -->
      <div>
        <div style="text-align: center; margin-bottom: 12px;">
          <strong style="color: #38BDF8; font-size: 13px;">📲 Smartphone Traveler Companion HUD</strong>
          <div style="font-size: 11px; color: var(--text-muted);">Real-time cockpit radar pushed to approaching motorists</div>
        </div>

        <div class="phone-frame">
          <div class="phone-notch"></div>
          <div class="phone-body">
            <!-- Top App Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 8px;">
              <div>
                <strong style="color: #38BDF8; font-size: 13px;">GatiMarg Citizen</strong>
                <div style="font-size: 9.5px; color: var(--text-muted);">Lookahead Radar</div>
              </div>
              <span class="badge-live" style="font-size: 9px;">GPS: ACTIVE</span>
            </div>

            <!-- Warning Card inside Phone -->
            <div style="background: rgba(239, 68, 68, 0.12); border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px;">
              <strong style="font-size: 12px; color: #F87171;">⚠️ ${currentPreset.hazardSummary}</strong>
              <p style="font-size: 11px; color: #CBD5E1; margin-top: 4px;">
                Obstruction on primary route: ${currentPreset.delayTime}.
              </p>
            </div>

            <!-- Bypass Card inside Phone -->
            <div style="background: #090E1D; border: 1px solid var(--surface-border); border-radius: 10px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 11.5px; color: #34D399;">Recommended Detour:</strong>
                <span style="font-size: 10px; color: #34D399; font-weight: 700;">${currentPreset.bypass.timeSaved}</span>
              </div>
              <div style="font-size: 11px; color: #94A3B8; margin: 4px 0 8px;">
                Est. Time: ${currentPreset.bypass.travelTime}
              </div>
              <button class="btn btn-brand btn-sm" style="width: 100%; justify-content: center; font-size: 11px;" onclick="window.startBypassFromCitizenRoute()">
                Start Detour Navigation →
              </button>
            </div>

            <!-- Ward Pulse Updates -->
            <div style="background: #090E1D; border: 1px solid var(--surface-border); border-radius: 10px; padding: 10px;">
              <div style="font-size: 10.5px; font-weight: 700; color: #38BDF8; margin-bottom: 6px;">Jan-Vani Live Ground Notes:</div>
              ${currentPreset.wardPulse.map(w => `
                <div style="font-size: 10px; color: #CBD5E1; background: #070B14; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                  • ${w.text} <span style="color: var(--text-muted);">(${w.time})</span>
                </div>
              `).join('')}
            </div>

            <button class="btn btn-outline btn-sm" style="width: 100%; justify-content: center; font-size: 10px;" onclick="window.openCitizenReportModal()">
              📢 Submit Obstacle Report
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
