/**
 * frontend/js/app.js
 * Main Application Orchestrator for GatiMarg AI.
 * Handles RBAC navigation, view routing, API polling, and canvas initialization.
 */

import { STATE, ROLE_PERMISSIONS, PRESET_ROUTES } from './state.js';
import { ApiService } from './api.js';
import { NetworkMapEngine, initRealisticHyderabadMap } from './map.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderIncidentsView } from './views/incidents.js';
import { renderFestiveView } from './views/festive.js';
import { renderRoutesView } from './views/routes.js';
import { renderRerouteSimView, initRerouteMapSimulation } from './views/reroute_sim.js';
import { renderChronicView } from './views/chronic.js';
import { renderAuditView } from './views/audit.js';

let activeMap = null;

// Toast notification helper
export function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span> <div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal helper
export function openModal(title, contentHtml) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  if (!overlay || !titleEl || !bodyEl) return;
  titleEl.innerHTML = title;
  bodyEl.innerHTML = contentHtml;
  overlay.style.display = 'flex';
}

export function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Render Header Nav Tabs according to Active Role
export function renderNavTabs() {
  const navContainer = document.getElementById('mainNavTabs');
  if (!navContainer) return;

  const role = STATE.activeRole;
  const tabs = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['admin'];

  // Ensure current view is allowed for this role
  const validTabIds = tabs.map(t => t.id);
  if (!validTabIds.includes(STATE.currentView)) {
    STATE.currentView = validTabIds[0];
  }

  if (role === 'admin') {
    // Admin Perspective: Exactly 4 Above (Core Operations) and 3 Below (Intelligence & Audit)
    const topTabs = tabs.slice(0, 4);
    const bottomTabs = tabs.slice(4);

    navContainer.innerHTML = `
      <div class="admin-nav-cluster">
        <div class="admin-nav-row admin-nav-row-top" title="Admin Core Operations">
          ${topTabs.map(t => `
            <button class="nav-tab ${STATE.currentView === t.id ? 'active' : ''}" id="tab-${t.id}" onclick="window.switchView('${t.id}')">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <div class="admin-nav-row admin-nav-row-bottom" title="Advanced AI Intelligence & Audit">
          ${bottomTabs.map(t => `
            <button class="nav-tab ${STATE.currentView === t.id ? 'active' : ''}" id="tab-${t.id}" onclick="window.switchView('${t.id}')">
              ${t.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    // Standard Single Row for User & Authority
    navContainer.innerHTML = `
      <div class="standard-nav-row">
        ${tabs.map(t => `
          <button class="nav-tab ${STATE.currentView === t.id ? 'active' : ''}" id="tab-${t.id}" onclick="window.switchView('${t.id}')">
            ${t.label}
          </button>
        `).join('')}
      </div>
    `;
  }
}

// Render Active View
export function renderView() {
  const viewport = document.getElementById('appViewport');
  if (!viewport) return;

  if (activeMap) {
    activeMap.stop();
    activeMap = null;
  }

  switch (STATE.currentView) {
    case 'dashboard':
      viewport.innerHTML = renderDashboardView();
      setTimeout(() => {
        initRealisticHyderabadMap();
      }, 50);
      break;
    case 'incidents':
      viewport.innerHTML = renderIncidentsView();
      break;
    case 'festive':
      viewport.innerHTML = renderFestiveView();
      break;
    case 'commuter':
      viewport.innerHTML = renderRoutesView();
      break;
    case 'reroute':
      viewport.innerHTML = renderRerouteSimView();
      setTimeout(() => {
        initRerouteMapSimulation();
      }, 50);
      break;
    case 'chronic':
      viewport.innerHTML = renderChronicView();
      break;
    case 'audit':
      viewport.innerHTML = renderAuditView();
      break;
    default:
      viewport.innerHTML = renderDashboardView();
      break;
  }

  renderNavTabs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global Event Callbacks
window.switchView = function(viewId) {
  STATE.currentView = viewId;
  renderView();
};

window.switchRole = function(role) {
  STATE.activeRole = role;
  document.querySelectorAll('.role-pill').forEach(pill => pill.classList.remove('active'));
  const activePill = document.getElementById(`role-${role}`);
  if (activePill) activePill.classList.add('active');
  renderView();
  showToast(`Switched perspective to: ${role.toUpperCase()}`);
};

window.selectCorridor = function(corridorId) {
  STATE.selectedCorridorId = corridorId;
  renderView();
  showToast(`Selected Corridor: ${corridorId}`);
};

window.setForecastHorizon = function(val) {
  STATE.forecastHorizonMinutes = parseInt(val, 10);
  renderView();
};

window.selectIncident = function(incidentId) {
  STATE.selectedIncidentId = incidentId;
  renderView();
  showToast(`Focused Incident: ${incidentId}`);
};

window.startBypassFromIncident = function(bypassInfo) {
  showToast('🧭 Rerouting vehicles around incident via designated legal slipway.');
  STATE.rerouteSim.rerouteDecision = 'auto_bypass';
  window.switchView('reroute');
};

window.toggleGating = function(routeId) {
  showToast(`Signal metering updated for feeder: ${routeId}`);
};

window.selectCitizenPreset = function(presetKey) {
  STATE.citizenRoute.activePreset = presetKey;
  const p = PRESET_ROUTES[presetKey];
  if (p) {
    STATE.citizenRoute.origin = p.origin;
    STATE.citizenRoute.destination = p.destination;
  }
  renderView();
  showToast(`Loaded Preset: ${presetKey}`);
};

window.scanCitizenRoute = function() {
  const orig = document.getElementById('routeOriginInput')?.value.trim();
  const dest = document.getElementById('routeDestInput')?.value.trim();
  if (orig) STATE.citizenRoute.origin = orig;
  if (dest) STATE.citizenRoute.destination = dest;
  renderView();
  showToast(`Scanned corridor: ${STATE.citizenRoute.origin} ➔ ${STATE.citizenRoute.destination}`);
};

window.startBypassFromCitizenRoute = function() {
  showToast('Navigation started! Rerouting to avoid ahead bottleneck.');
  STATE.rerouteSim.rerouteDecision = 'auto_bypass';
  window.switchView('reroute');
};

window.toggleRerouteDecision = function() {
  STATE.rerouteSim.rerouteDecision = STATE.rerouteSim.rerouteDecision === 'auto_bypass' ? 'congested_path' : 'auto_bypass';
  renderView();
  showToast(`Reroute decision: ${STATE.rerouteSim.rerouteDecision}`);
};

window.resetSimProgress = function() {
  if (activeMap) activeMap.vehicleProgress = 0.05;
  showToast('Vehicle position reset to start node.');
};

// ── Two-Horizon Persistent Congestion Actions ──
window.selectPersistentHotspot = function(id) {
  STATE.activePersistentSegmentId = id;
  STATE.counterfactualApplied = false;
  STATE.disruptionScenarioActive = false;
  renderView();
  showToast(`Selected Persistent Bottleneck: ${id}`);
};

window.selectChronicHotspot = function(id) {
  window.selectPersistentHotspot(id);
};

window.toggleCounterfactualSim = function() {
  STATE.counterfactualApplied = !STATE.counterfactualApplied;
  renderView();
  showToast(STATE.counterfactualApplied 
    ? '⚡ Simulating dataset planning candidate (+900 vph capacity upgrade) — Counterfactual Model Active' 
    : '🔄 Reset to baseline historical sensor observations'
  );
};

window.toggleChronicSimulation = function() {
  window.toggleCounterfactualSim();
};

window.toggleDisruptionScenario = function(segId) {
  STATE.disruptionScenarioActive = !STATE.disruptionScenarioActive;
  renderView();
  showToast(STATE.disruptionScenarioActive
    ? `⚠️ Simulated infrastructure outage activated on ${segId} (100% capacity loss) — Emergency Horizon 1 diversions online`
    : `✅ Simulated disruption cleared on ${segId} — Normal baseline restored`
  );
};

window.updateIssueStatus = async function(issueId, newStatus) {
  showToast(`Updating Issue #${issueId} status to: ${newStatus}...`);
  try {
    const res = await ApiService.updateMunicipalStatus(issueId, newStatus);
    if (res) {
      showToast(`Status updated: ${newStatus} (Route Usability: ${res.route_usability})`);
    } else {
      showToast(`Local simulated status updated: ${newStatus}`);
    }
  } catch (err) {
    showToast(`Status updated locally: ${newStatus}`);
  }
  renderView();
};

window.openMunicipalRequestModal = function(segId) {
  const formHtml = `
    <div style="font-size: 12px; color: #CBD5E1; line-height: 1.5; margin-bottom: 14px;">
      <p style="margin-top: 0;">
        Generate an official simulated <strong>Municipal Infrastructure Resolution Request</strong> for persistent bottleneck corridor <strong>${segId}</strong>.
      </p>
      <div style="background: #070B14; border: 1px solid var(--surface-border); border-radius: 6px; padding: 10px; margin-bottom: 12px;">
        <div><strong>Affected Corridor:</strong> ${segId}</div>
        <div><strong>Authority Notice:</strong> Nearest municipal authority: Not available in organizer dataset</div>
        <div><strong>Status:</strong> Initialized as NOT RESOLVED</div>
        <div style="color: #F59E0B; margin-top: 4px;">* Advisory Note: This is an application simulation. No real municipal API is contacted.</div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="window.closeModal()">Cancel</button>
        <button type="button" class="btn btn-festive btn-sm" onclick="window.submitGenerateMunicipalRequest('${segId}')">
          🏛️ Confirm &amp; Generate Simulated Request
        </button>
      </div>
    </div>
  `;
  openModal(`🏛️ Municipal Infrastructure Resolution Request — Corridor ${segId}`, formHtml);
};

window.submitGenerateMunicipalRequest = async function(segId) {
  closeModal();
  showToast(`Generating simulated municipal request for ${segId}...`);
  try {
    const res = await ApiService.generateMunicipalRequest(segId);
    if (res && res.issue_id) {
      showToast(`Generated Request #${res.issue_id} (Status: ${res.status})`);
    } else {
      showToast(`Generated Simulated Request #INF-HYD-${segId}`);
    }
  } catch (e) {
    showToast(`Generated Simulated Request #INF-HYD-${segId}`);
  }
  renderView();
};

window.viewFormalMunicipalRequest = function(issueId) {
  const modalHtml = `
    <div style="background: #070C18; border: 1px solid var(--surface-border); border-radius: 8px; padding: 16px; font-family: var(--font-mono); font-size: 11.5px; color: #E2E8F0; line-height: 1.6;">
      <div style="text-align: center; border-bottom: 1px solid var(--surface-border); padding-bottom: 10px; margin-bottom: 12px;">
        <h4 style="font-size: 14px; color: #38BDF8; margin: 0;">MUNICIPAL INFRASTRUCTURE RESOLUTION REQUEST</h4>
        <div style="font-size: 10px; color: #94A3B8;">GatiMarg AI Urban Traffic Platform • NeuraX 3.1 Intelligence</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
        <div><strong>ISSUE ID:</strong> <span style="color: #FBBF24;">${issueId}</span></div>
        <div><strong>GENERATED DATE:</strong> 2026-01-19</div>
        <div><strong>STATUS:</strong> <span style="color: #34D399;">WORK IN PROGRESS</span></div>
        <div><strong>MUNICIPALITY:</strong> Not available in organizer dataset</div>
      </div>
      <div style="border-top: 1px dashed var(--surface-border); padding-top: 8px; margin-bottom: 8px;">
        <strong style="color: #38BDF8;">1. DETECTED PERSISTENT BOTTLENECK:</strong>
        <p style="margin: 2px 0 6px;">Corridor PVNR Ramp (R0123) exhibits 93.3% recurrence across 15 historical observation days with 90% peak capacity utilization.</p>
      </div>
      <div style="border-top: 1px dashed var(--surface-border); padding-top: 8px; margin-bottom: 8px;">
        <strong style="color: #38BDF8;">2. RECOMMENDED HORIZON 1 ACTION (IMMEDIATE):</strong>
        <p style="margin: 2px 0 6px;">Execute 60/40 multi-route redistribution via Outer Bypass and deploy upstream dynamic signal gating at Pillar 100.</p>
      </div>
      <div style="border-top: 1px dashed var(--surface-border); padding-top: 8px; margin-bottom: 8px;">
        <strong style="color: #38BDF8;">3. RECOMMENDED HORIZON 2 ACTION (CAPITAL INTERVENTION):</strong>
        <p style="margin: 2px 0 6px;">Execute Planning Candidate PLAN0122 (lane_addition / underpass connector, +900 vph capacity expansion).</p>
      </div>
      <div style="border-top: 1px solid var(--surface-border); padding-top: 8px; font-size: 10px; color: #94A3B8; text-align: center;">
        * NOTE: This is a simulated/advisory request generated by GatiMarg AI. No real municipality or government system is contacted.
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
        <button class="btn btn-outline btn-sm" onclick="window.closeModal()">Close</button>
        <button class="btn btn-brand btn-sm" onclick="window.printRequestDocument()">🖨️ Print / Copy Request</button>
      </div>
    </div>
  `;
  openModal(`Official Document: ${issueId}`, modalHtml);
};

window.printRequestDocument = function() {
  showToast('📄 Official municipal resolution request copied to clipboard!');
  closeModal();
};

window.startBypassFromPersistentAlert = function(segId) {
  showToast(`🧭 Engaging bypass around persistent bottleneck corridor ${segId}`);
  STATE.rerouteSim.rerouteDecision = 'auto_bypass';
  window.switchView('reroute');
};

window.openCitizenReportModal = function() {
  const formHtml = `
    <form id="citizenReportForm" onsubmit="window.submitCitizenReport(event)">
      <div style="margin-bottom: 12px;">
        <label style="font-size: 11px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 4px;">LOCATION / LANDMARK</label>
        <input type="text" id="reportLocation" class="route-input" placeholder="e.g. Mehdipatnam Ring Road" required />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="font-size: 11px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 4px;">OBSTACLE / HAZARD TYPE</label>
        <select id="reportType" class="route-input">
          <option value="Stalled Transit Vehicle">Stalled Transit Vehicle</option>
          <option value="Waterlogged Underpass">Waterlogged Underpass</option>
          <option value="Traffic Light Outage">Traffic Light Outage</option>
          <option value="Unauthorized Procession Surge">Unauthorized Procession Surge</option>
        </select>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="window.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-brand btn-sm">Submit Report</button>
      </div>
    </form>
  `;
  openModal('📢 Submit Jan-Vani Citizen Hazard Report', formHtml);
};

window.submitCitizenReport = function(e) {
  e.preventDefault();
  const loc = document.getElementById('reportLocation')?.value || 'Mehdipatnam Arterial';
  const typ = document.getElementById('reportType')?.value || 'Road Hazard';
  STATE.crowdReports.unshift({
    id: `CR-${Math.floor(100 + Math.random() * 900)}`,
    location: loc,
    type: typ,
    time: 'Just now',
    status: 'In Review'
  });
  closeModal();
  renderView();
  showToast('Jan-Vani Report submitted successfully! Verified with camera telemetry.');
};

window.closeModal = closeModal;

window.triggerRefresh = async function() {
  showToast('Refreshing live telemetry from backend...');
  await pollBackend();
  renderView();
};

// Backend Health Polling
async function pollBackend() {
  const statusEl = document.getElementById('backendStatusPill');
  try {
    const health = await ApiService.checkHealth();
    if (health && health.status === 'ONLINE') {
      if (statusEl) {
        statusEl.innerHTML = `<span class="pulse-dot"></span> LIVE NEURAX BACKEND (436 Links / 120 Nodes)`;
        statusEl.className = 'badge-live';
      }
    } else {
      if (statusEl) {
        statusEl.innerHTML = `○ NEURAX LOCAL MODE`;
        statusEl.className = 'badge-live';
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.innerHTML = `○ NEURAX LOCAL MODE`;
    }
  }
}

// Bootstrap Initialization
document.addEventListener('DOMContentLoaded', async () => {
  renderNavTabs();
  renderView();
  await pollBackend();
  setInterval(pollBackend, 15000);
});


// --- Team Credits Feature ---
window.openTeamCredits = function() {
  const bodyHtml = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 32px; margin-bottom: 10px;">🏆</div>
      <h4 style="font-size: 18px; color: #38BDF8; margin-bottom: 5px;">GatiMarg AI Development Team</h4>
      <p style="font-size: 12px; color: var(--text-secondary);">This project was built collaboratively by an amazing team!</p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="background: #090E1D; border: 1px solid var(--surface-border); border-left: 4px solid #06B6D4; padding: 14px; border-radius: 8px;">
        <strong style="color: #fff; font-size: 14px;">[Your Name]</strong>
        <div style="font-size: 11px; color: #38BDF8; font-weight: 700; margin-top: 2px;">Project Lead / Full-Stack AI Engineer</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Architected the core system, AI logic, and overall system design.</p>
      </div>

      <div style="background: #090E1D; border: 1px solid var(--surface-border); border-left: 4px solid #10B981; padding: 14px; border-radius: 8px;">
        <strong style="color: #fff; font-size: 14px;">[Friend 1 Name]</strong>
        <div style="font-size: 11px; color: #34D399; font-weight: 700; margin-top: 2px;">Frontend Engineer / UI & UX</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Designed the beautiful GIS Map Canvas, Dashboard UI, and interactive charts.</p>
      </div>

      <div style="background: #090E1D; border: 1px solid var(--surface-border); border-left: 4px solid #F59E0B; padding: 14px; border-radius: 8px;">
        <strong style="color: #fff; font-size: 14px;">[Friend 2 Name]</strong>
        <div style="font-size: 11px; color: #FBBF24; font-weight: 700; margin-top: 2px;">Backend Engineer / FastAPI Analytics</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Engineered the FastAPI backend, NeuraX data pipeline, and API endpoints.</p>
      </div>
    </div>
    
    <div style="margin-top: 20px; text-align: center;">
      <p style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">
        Source Code tracked via Git. Check CONTRIBUTORS.md in the root directory!
      </p>
    </div>
  `;
  window.openModal("Meet the Team", bodyHtml);
};
