import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NEURAX 3.0 - Urban Traffic Intelligence</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
    }

    .header-box {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-left h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.4px;
      line-height: 1.15;
    }

    .header-left .subtitle {
      font-size: 10pt;
      color: #0284c7;
      font-weight: 600;
      margin-top: 2px;
    }

    .header-left .meta {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 3px;
    }

    .badge-header {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 12px;
      border-radius: 5px;
      text-align: right;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .badge-header span {
      display: block;
      font-size: 7.5pt;
      font-weight: 400;
      color: #38bdf8;
    }

    .section-title {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 3.5px solid #0284c7;
      padding-left: 8px;
      margin-top: 10px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .score-badge {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .sub-title {
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 8px;
      margin-bottom: 3px;
    }

    p {
      margin-bottom: 6px;
      text-align: justify;
      color: #334155;
    }

    ul {
      margin-left: 16px;
      margin-bottom: 6px;
    }

    li {
      margin-bottom: 3px;
      color: #334155;
    }

    li strong {
      color: #0f172a;
    }

    .callout-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin: 6px 0;
    }

    .callout-box.festive {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 3.5px solid #f59e0b;
    }

    /* Architecture Visual Diagram */
    .arch-diagram {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 8px 0;
      page-break-inside: avoid;
    }

    .arch-step {
      flex: 1;
      background: #f8fafc;
      border: 1.2px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 6px;
      text-align: center;
    }

    .arch-step.highlight {
      border-color: #0284c7;
      background: #f0f9ff;
    }

    .arch-step-num {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0284c7;
      margin-bottom: 1px;
    }

    .arch-step-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .arch-step-desc {
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.3;
      text-align: left;
    }

    .arch-step-desc li {
      margin-left: 10px;
      margin-bottom: 2px;
    }

    .page-break {
      page-break-before: always;
    }

    /* Approach Grid */
    .approach-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0284c7;
      border-radius: 5px;
      padding: 7px 10px;
      margin-bottom: 7px;
      page-break-inside: avoid;
    }

    .approach-header {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .approach-text {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.35;
    }

    .approach-text strong {
      color: #1e293b;
    }

    .footer-bar {
      margin-top: 14px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="header-box">
    <div class="header-left">
      <h1>NeuraX Urban Traffic Flow &amp; Incident Intelligence</h1>
      <div class="subtitle">Decision-Support &amp; Counterfactual Infrastructure Intelligence</div>
      <div class="meta">Domain 1 · AI in Smart Cities | Target Environment: Hyderabad Metropolitan Corridor</div>
    </div>
    <div class="badge-header">
      NEURAX 3.0
      <span>Urban Traffic Intelligence</span>
    </div>
  </div>

  <!-- SECTION 1: PROBLEM UNDERSTANDING -->
  <div class="section-title">
    <span>1. Problem Understanding</span>
  </div>

  <div class="sub-title">1.1 Operating Reality of the Urban Corridor</div>
  <p>
    Metropolitan road networks like Hyderabad exhibit complex, non-linear traffic dynamics that break standard stationary time-series models. Our system is specifically engineered to address:
  </p>
  <ul>
    <li><strong>Geometric &amp; Network Bottlenecks:</strong> High-speed elevated corridors (e.g., PVNR Expressway, HITEC City flyovers) discharge directly onto restricted-capacity surface roundabouts and signalized grid junctions, causing persistent localized gridlock.</li>
    <li><strong>Mixed Traffic &amp; Commute Surges:</strong> Steep morning (08:30–11:30) and evening (17:30–21:30) commute volume peaks, where a single stalled vehicle creates immediate multi-kilometer queues across feeder links.</li>
    <li><strong>Upstream Congestion Spillback Shockwaves:</strong> An obstruction on one segment chokes outflow capacity, triggering backward-propagating queues into upstream roads within 10–15 minutes.</li>
    <li><strong>Exogenous Weather Impacts:</strong> Monsoon rain downpours severely reduce roadway friction and free-flow speeds, inflating vehicle headways and travel delays across the network.</li>
    <li><strong>Target Leakage Isolation &amp; Field Data Hygiene:</strong> Real-world traffic sensors frequently output frozen readings, impossible negative speeds, and outlier spikes. The system strictly firewalls future target labels to avoid leakage while automatically cleansing raw input data.</li>
  </ul>

  <div class="sub-title">1.2 Telangana Cultural &amp; Festive Mobility Shocks</div>
  <div class="callout-box festive">
    <p style="margin-bottom: 3px; font-weight: 700; color: #92400e;">Massive Recurring Event Congestion (Vinayaka Chavithi &amp; Bonalu):</p>
    <p style="font-size: 8.5pt; margin-bottom: 3px;">
      During regional celebrations such as <em>Vinayaka Chavithi</em> (immersion processions converging at Hussain Sagar / Tank Bund) and <em>Bonalu Jatara</em> (Secunderabad &amp; Old City processions), thousands of idol processions cause complete vehicular barricading of major arterials and massive pedestrian crowd surges (+580% density).
    </p>
    <p style="font-size: 8.5pt; margin-bottom: 0;">
      <strong>The Solution:</strong> Daily commuters entering festive zones have zero prior knowledge of moving processions and temporary street blockades. The system bridges this asymmetry through <strong>Crowdsourced Local Pulse Reporting ("Jan-Vani")</strong> and <strong>Pre-Trip Commuter Inflow Gating</strong> that warns incoming non-local drivers 45 minutes prior to corridor entry.
    </p>
  </div>

  <!-- SECTION 2: SYSTEM ARCHITECTURE -->
  <div class="section-title" style="margin-top: 10px;">
    <span>2. System Architecture</span>
  </div>

  <p style="margin-bottom: 6px;">
    The platform operates as an end-to-end, decoupled four-stage intelligence pipeline translating raw, noisy telemetry into actionable operational advisories:
  </p>

  <div class="arch-diagram">
    <div class="arch-step">
      <div class="arch-step-num">Stage 1</div>
      <div class="arch-step-title">Data Ingestion &amp; Hygiene</div>
      <div class="arch-step-desc">
        <ul>
          <li>Repairs stuck / frozen sensors using spatial neighbor median imputation</li>
          <li>Clamps impossible negative flow &amp; speed values to zero</li>
          <li>Huber quantile ceiling clips spurious sensor outlier spikes</li>
        </ul>
      </div>
    </div>
    <div class="arch-step highlight">
      <div class="arch-step-num">Stage 2</div>
      <div class="arch-step-title">Spatial-Lag Forecasting</div>
      <div class="arch-step-desc">
        <ul>
          <li>Extracts 1-hop &amp; 2-hop topological neighbor lags from network graph</li>
          <li>Historical residual decomposition prevents small-data overfitting</li>
          <li>Calibrated 15, 30, 45 &amp; 60-minute speed/flow forecasts (zero leakage)</li>
        </ul>
      </div>
    </div>
    <div class="arch-step">
      <div class="arch-step-num">Stage 3</div>
      <div class="arch-step-title">Incident &amp; Spillback Engine</div>
      <div class="arch-step-desc">
        <ul>
          <li>Dual-window Bayesian change-point anomaly scoring</li>
          <li>Differentiates genuine disruptions from routine rush-hour slowdowns</li>
          <li>LWR kinematic shockwave tracks upstream queue spillback wavefront</li>
        </ul>
      </div>
    </div>
    <div class="arch-step highlight">
      <div class="arch-step-num">Stage 4</div>
      <div class="arch-step-title">Decision &amp; Advisory Services</div>
      <div class="arch-step-desc">
        <ul>
          <li>Turn-restricted constrained routing provides legal alternate paths</li>
          <li>Festive geofenced pre-trip commuter warning gating (T-45 min)</li>
          <li>Counterfactual What-If infrastructure ROI evaluation</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 2 ================= -->
  <div class="page-break"></div>

  <!-- SECTION 3: APPROACH -->
  <div class="section-title" style="margin-top: 4px;">
    <span>3. Methodological Approach</span>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.1 Spatial-Lag Gradient Boosted Trees (LightGBM) &amp; Residual Decomposition</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> Deep Spatio-Temporal Neural Networks (ST-GNNs) require massive datasets (months of telemetry) and heavily overfit on compact 15-day (4,320 time-step) datasets. LightGBM trains in minutes, natively tolerates noise, and prevents overfitting.<br>
      <strong>How it helps:</strong> Uses topological network graph adjacency to extract 1-hop and 2-hop spatial neighbor lags, predicting residual deviations from historical medians to achieve peak accuracy on 15-day sample sizes.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.2 Robust Outlier-Resilient Loss Function (Huber + WAPE)</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> Real-world traffic sensors frequently experience hardware glitches, sending wild temporary spikes that mislead standard training models.<br>
      <strong>How it helps:</strong> Penalizes extreme sensor glitches smoothly instead of quadratically, keeping forecasting models stable and accurate even with noisy raw field telemetry.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.3 Bayesian Anomaly &amp; Incident Detection</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> Routine peak-hour congestion causes speeds to drop, but real incidents (crashes or stalled buses) cause speeds to collapse while traffic flow sharply plummets and queues surge.<br>
      <strong>How it helps:</strong> Compares real-time conditions against expected baselines and requires persistent anomaly signals, catching genuine emergencies while keeping false alarms near zero.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.4 Kinematic Shockwave &amp; Spillback Analysis</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> When a key corridor or flyover is blocked, congestion doesn't stay stationary; it backs up into upstream feeder roads like a backward-traveling wave.<br>
      <strong>How it helps:</strong> Calculates queue growth speed and accurately predicts which connecting roads will choke 15 to 30 minutes in advance, allowing traffic managers to intervene early.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.5 Turn-Restricted Diversion Routing</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> Generic routing often suggests illegal turns, impractical U-turns, or pushes highway volumes into narrow neighborhood lanes.<br>
      <strong>How it helps:</strong> Enforces physical turn restrictions and intersection signal capacities, providing feasible alternate routes that reduce travel times without causing secondary bottlenecks.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.6 Counterfactual What-If Intervention Evaluator</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> City authorities need to know whether building a flyover, adding a lane, or adjusting signals will genuinely relieve bottlenecks before spending municipal funds.<br>
      <strong>How it helps:</strong> Simulates candidate infrastructure changes on the road network and estimates total vehicle delay saved versus project cost to prioritize high-return improvements.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.7 Festive Geofenced Inflow Gating &amp; Crowdsourced Reporting</div>
    <div class="approach-text">
      <strong>Why we use it:</strong> Major celebrations (such as Vinayaka Chavithi immersion and Bonalu) lead to extensive road closures that trap cross-city commuters unfamiliar with local diversions.<br>
      <strong>How it helps:</strong> Automatically alerts non-local commuters 45 minutes before they reach festive zones with bypass alternatives, while enabling local ward residents to verify active procession blockades in real time.
    </div>
  </div>

  <!-- Document Footer -->
  <div class="footer-bar">
    <span>NeuraX Hackathon 3.0 · Domain 1: AI in Smart Cities</span>
    <span>Author: Jitesh Reddy (mail4y.jitesh@gmail.com)</span>
    <span>GitHub: github.com/Jiteshreddy123/cmrhackathon</span>
  </div>

</body>
</html>
"""

html_path = os.path.abspath("checkpoint1_submission.html")
pdf_path = os.path.abspath("Checkpoint1_NeuraX_Traffic_Intelligence.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_path}",
    "--no-pdf-header-footer",
    html_path
]

result = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", result.returncode)
if os.path.exists(pdf_path):
    print(f"SUCCESS: PDF generated at {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")
