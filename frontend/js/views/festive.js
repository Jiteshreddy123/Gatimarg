/**
 * frontend/js/views/festive.js
 * Jan-Vani Control View: Telangana Cultural Mobility, Pre-Trip Perimeter Gating,
 * and Real-Time Crowdsourced Hazard Ingestion.
 */

import { STATE } from '../state.js';
import { renderProvenanceBadge } from '../provenance.js';

export function renderFestiveView() {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-live" style="background: rgba(245, 158, 11, 0.2); color: #F59E0B; border-color: rgba(245, 158, 11, 0.4);">
            🪔 TELANGANA CULTURAL MOBILITY RADAR
          </span>
          ${renderProvenanceBadge('DATA', 'events_calendar.csv & context_train.csv')}
        </div>
        <h2 style="font-size: 22px; margin-top: 4px;">Jan-Vani: Festive Corridor &amp; Crowd Intelligence</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          Pre-trip perimeter gating (T-45 mins), procession barricade management, and verified citizen crowdsourcing
        </p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-festive btn-sm" onclick="window.openCitizenReportModal()">
          📢 Submit Road Obstacle Report
        </button>
      </div>
    </div>

    <!-- Active Festive Cordon Alert -->
    <div class="card card-festive" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div>
          <span class="badge-live" style="background: rgba(245, 158, 11, 0.25); color: #FBBF24;">
            ACTIVE CORDON: TANK BUND WATERFRONT CAUSEWAY
          </span>
          <h3 style="font-size: 18px; margin-top: 6px; color: #fff;">
            Vinayaka Nimajjanam &amp; Lashkar Bonalu Procession Protocol
          </h3>
          <p style="font-size: 12px; color: #FDE68A; margin-top: 4px; max-width: 800px;">
            100% vehicle barricade active between Ranigunj and Secretariat. All private traffic is automatically diverted via Necklace Road loop.
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #FDE68A;">Gating Horizon:</div>
          <div style="font-size: 20px; font-weight: 700; color: #fff; font-family: var(--font-mono);">
            T - 45 Mins Active
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px;">
        <div style="background: rgba(0, 0, 0, 0.35); padding: 10px 14px; border-radius: 8px;">
          <div style="font-size: 10.5px; color: #FDE68A;">THROUGHPUT DIVERTED</div>
          <div style="font-size: 18px; font-weight: 700; color: #fff; font-family: var(--font-mono);">1,400 vph</div>
          <div style="font-size: 10px; color: #94A3B8;">Absorbed by Necklace Road</div>
        </div>
        <div style="background: rgba(0, 0, 0, 0.35); padding: 10px 14px; border-radius: 8px;">
          <div style="font-size: 10.5px; color: #FDE68A;">ESTIMATED DELAY AVOIDED</div>
          <div style="font-size: 18px; font-weight: 700; color: #34D399; font-family: var(--font-mono);">-42 Mins / Trip</div>
          <div style="font-size: 10px; color: #94A3B8;">Per vehicle diverted</div>
        </div>
        <div style="background: rgba(0, 0, 0, 0.35); padding: 10px 14px; border-radius: 8px;">
          <div style="font-size: 10.5px; color: #FDE68A;">RTC TRANSIT PRIORITY</div>
          <div style="font-size: 18px; font-weight: 700; color: #38BDF8; font-family: var(--font-mono);">Dedicated Lane</div>
          <div style="font-size: 10px; color: #94A3B8;">Lower Tank Bund Shuttle Lane</div>
        </div>
      </div>
    </div>

    <!-- Crowdsourced Citizen Hazard Reports Table -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 16px;">Jan-Vani Crowdsourced Road Obstacle Reports</h3>
          <p style="font-size: 11.5px; color: var(--text-secondary);">
            Real-time citizen hazard logs verified through automated camera &amp; telemetry matching
          </p>
        </div>
        ${renderProvenanceBadge('DATA', 'crowdsourced_reports.json')}
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--surface-border); color: var(--text-muted); text-align: left;">
              <th style="padding: 8px 12px;">REPORT ID</th>
              <th style="padding: 8px 12px;">LOCATION / ARTERIAL</th>
              <th style="padding: 8px 12px;">OBSTACLE TYPE</th>
              <th style="padding: 8px 12px;">DETECTED</th>
              <th style="padding: 8px 12px;">VERIFICATION STATUS</th>
              <th style="padding: 8px 12px; text-align: right;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${STATE.crowdReports.map(rep => `
              <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.4);">
                <td style="padding: 10px 12px; font-family: var(--font-mono); color: #38BDF8; font-weight: 700;">${rep.id}</td>
                <td style="padding: 10px 12px; font-weight: 600;">${rep.location}</td>
                <td style="padding: 10px 12px;">${rep.type}</td>
                <td style="padding: 10px 12px; color: var(--text-muted);">${rep.time}</td>
                <td style="padding: 10px 12px;">
                  <span class="badge-live" style="font-size: 9.5px; ${rep.status === 'Verified' ? 'background: rgba(16, 185, 129, 0.2); color: #34D399;' : 'background: rgba(245, 158, 11, 0.2); color: #F59E0B;'}">
                    ${rep.status.toUpperCase()}
                  </span>
                </td>
                <td style="padding: 10px 12px; text-align: right;">
                  <button class="btn btn-outline btn-sm" onclick="window.viewReportLocation('${rep.location}')">Locate</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
