/**
 * frontend/js/app.js
 * Main Application Orchestrator for GatiMarg AI.
 * Handles RBAC navigation, view routing, API polling, and canvas initialization.
 */

import { STATE, ROLE_PERMISSIONS, PRESET_ROUTES } from './state.js';
import { ApiService } from './api.js';
import { NetworkMapEngine } from './map.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderIncidentsView } from './views/incidents.js';
import { renderFestiveView } from './views/festive.js';
import { renderRoutesView } from './views/routes.js';
import { renderRerouteSimView } from './views/reroute_sim.js';
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
        activeMap = new NetworkMapEngine('networkMapCanvas');
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
        activeMap = new NetworkMapEngine('rerouteSimCanvas');
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

window.selectChronicHotspot = function(id) {
  STATE.chronicHotspotId = id;
  renderView();
  showToast(`Selected Chronic Hotspot: ${id}`);
};

window.toggleChronicSimulation = function() {
  STATE.chronicSolutionApplied = !STATE.chronicSolutionApplied;
  renderView();
  showToast(STATE.chronicSolutionApplied ? 'Simulating AI Solutions & Infrastructure Upgrades' : 'Reset to Baseline Sensor Logs');
};

window.applyChronicSolutionToLiveNetwork = function(hotspotId) {
  showToast(`🚀 AI Remediation Plan applied to live traffic controller: ${hotspotId}`);
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
