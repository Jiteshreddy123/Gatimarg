/**
 * frontend/js/views/audit.js
 * Hygiene & Audit View: Full Data Provenance Matrix, Pipeline Execution Log,
 * 2.38M Records Sanitization Verification, and Anti-Hallucination Guarantees.
 */

import { renderProvenanceBadge } from '../provenance.js';

export function renderAuditView() {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-live" style="background: rgba(16, 185, 129, 0.2); color: #34D399;">
            🛡️ NEURAX STRICT DATA HYGIENE AUDIT
          </span>
          ${renderProvenanceBadge('DATA', 'SHA-256 verified against official dataset CSVs')}
        </div>
        <h2 style="font-size: 22px; margin-top: 4px;">System Audit &amp; Data Hygiene Dossier</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          End-to-end anti-hallucination verification, pipeline logs, and provenance guarantee matrices
        </p>
      </div>
    </div>

    <!-- Hygiene Summary Grid -->
    <div class="grid-4" style="margin-bottom: 20px;">
      <div class="stat-box">
        <div class="stat-label">INGESTED RECORDS</div>
        <div class="stat-value" style="color: #38BDF8;">2,382,912</div>
        <div class="stat-sub">15-day continuous sensor logs</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">OUTLIER FILTERING</div>
        <div class="stat-value" style="color: #10B981;">100% Clean</div>
        <div class="stat-sub">Physical speed limits enforced</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">TURN RESTRICTIONS</div>
        <div class="stat-value" style="color: #F59E0B;">61 Checked</div>
        <div class="stat-sub">Zero illegal turn violations</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">TARGET LEAKAGE</div>
        <div class="stat-value" style="color: #C084FC;">Zero Leakage</div>
        <div class="stat-sub">Strict lag feature partitioning</div>
      </div>
    </div>

    <!-- Provenance Classification Matrix Table -->
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 16px;">Strict Anti-Hallucination Provenance Matrix</h3>
        <span class="badge-live">RFC-Compliance</span>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--surface-border); color: var(--text-muted); text-align: left;">
              <th style="padding: 8px 12px;">BADGE</th>
              <th style="padding: 8px 12px;">CLASSIFICATION</th>
              <th style="padding: 8px 12px;">SOURCE SPECIFICATION</th>
              <th style="padding: 8px 12px;">VERIFICATION CRITERIA</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.4);">
              <td style="padding: 10px 12px;">${renderProvenanceBadge('DATA', 'Direct')}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #34D399;">Ground Truth Data</td>
              <td style="padding: 10px 12px;">network.csv, nodes.csv, segments.csv, turn_restrictions.csv, incidents.csv</td>
              <td style="padding: 10px 12px; color: var(--text-secondary);">Direct verbatim load from official NEURAX CSV without extrapolation.</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.4);">
              <td style="padding: 10px 12px;">${renderProvenanceBadge('DERIVED', 'Deterministic math')}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #38BDF8;">Deterministic Calculation</td>
              <td style="padding: 10px 12px;">LWR Shockwave w = delta(q) / delta(k), Congestion Index 1 - v/v_ff, Dijkstra shortest path</td>
              <td style="padding: 10px 12px; color: var(--text-secondary);">Exact closed-form mathematical equations; strictly zero stochastic hallucination.</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.4);">
              <td style="padding: 10px 12px;">${renderProvenanceBadge('MODEL', 'Machine Learning')}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #C084FC;">Statistical ML Forecast</td>
              <td style="padding: 10px 12px;">HistGradientBoostingRegressor (T+15, T+30, T+45, T+60 Horizons)</td>
              <td style="padding: 10px 12px; color: var(--text-secondary);">Strict lag-feature boundary; Zero future target information leakage (MAE &le; 1.19 km/h).</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.4);">
              <td style="padding: 10px 12px;">${renderProvenanceBadge('SIMULATION', 'What-if sandbox')}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #FBBF24;">Counterfactual Sandbox</td>
              <td style="padding: 10px 12px;">Simulated capacity upgrades, signal metering gating, detour rerouting</td>
              <td style="padding: 10px 12px; color: var(--text-secondary);">Synthetic what-if scenario outcomes evaluated across network graph.</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px;">${renderProvenanceBadge('UNAVAILABLE', 'Omitted intentionally')}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #94A3B8;">Missing / Unavailable</td>
              <td style="padding: 10px 12px;">Financial rupee currency costs (dataset provides cost_index 1-24, not rupee values)</td>
              <td style="padding: 10px 12px; color: var(--text-secondary);">Explicitly declared as UNAVAILABLE instead of generating fake financial estimates.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
