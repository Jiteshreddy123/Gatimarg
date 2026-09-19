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
          <li>Corrects stuck / frozen sensors using spatial neighbor consensus</li>
          <li>Clamps impossible negative flow &amp; speed readings to zero</li>
          <li>Filters spurious outlier spikes with robust sensor ceilings</li>
        </ul>
      </div>
    </div>
    <div class="arch-step highlight">
      <div class="arch-step-num">Stage 2</div>
      <div class="arch-step-title">Near-Term Forecasting</div>
      <div class="arch-step-desc">
        <ul>
          <li>Captures spatial dependencies across connected road junctions</li>
          <li>Combines baseline commute profiles with live road conditions</li>
          <li>Generates 15, 30, 45 &amp; 60-min speed/flow forecasts (zero leakage)</li>
        </ul>
      </div>
    </div>
    <div class="arch-step">
      <div class="arch-step-num">Stage 3</div>
      <div class="arch-step-title">Incident &amp; Spillback Engine</div>
      <div class="arch-step-desc">
        <ul>
          <li>Monitors real-time drops against normal baseline traffic curves</li>
          <li>Distinguishes genuine disruptions from regular peak-hour slowdowns</li>
          <li>Tracks upstream queue growth to forecast secondary choke points</li>
        </ul>
      </div>
    </div>
    <div class="arch-step highlight">
      <div class="arch-step-num">Stage 4</div>
      <div class="arch-step-title">Decision &amp; Advisory Services</div>
      <div class="arch-step-desc">
        <ul>
          <li>Generates feasible alternate routes honoring legal turn rules</li>
          <li>Triggers pre-trip warning alerts (T-45 min) for cultural festivals</li>
          <li>Simulates candidate road infrastructure upgrades to evaluate ROI</li>
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
    <div class="approach-header">3.1 Network Modeling &amp; Field Sensor Data Cleansing</div>
    <div class="approach-text">
      <strong>How it works:</strong> Connects all 436 road segments and 120 junctions into a unified digital road network. Automatically identifies and cleans corrupted sensor readings—correcting frozen values, negative speeds, and artificial spikes by checking consensus across neighboring road links.<br>
      <strong>Why it matters:</strong> Ensures all downstream forecasts, emergency alerts, and traffic decisions are built upon reliable, verified ground-truth data.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.2 Baseline Traffic Profiling &amp; Multi-Horizon Forecasting (15–60 Mins)</div>
    <div class="approach-text">
      <strong>How it works:</strong> Analyzes historical daily commute patterns to establish baseline speeds for each road across different times of day. Forecasts expected vehicle speeds, volumes, and congestion levels 15, 30, 45, and 60 minutes ahead without leaking future target information.<br>
      <strong>Why it matters:</strong> Gives traffic operators and commuters early visibility into impending bottlenecks well before roads lock up into standstill traffic.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.3 Real-Time Incident &amp; Emergency Disruption Detection</div>
    <div class="approach-text">
      <strong>How it works:</strong> Continuously monitors real-time speeds and vehicle flow against expected normal conditions. Distinguishes genuine disruptions (crashes, stalled vehicles, lane hazards) from normal rush-hour slowdowns by requiring persistent, sharp drops in roadway performance.<br>
      <strong>Why it matters:</strong> Triggers immediate incident alerts for emergency responders while eliminating false alarms that waste city resources.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.4 Queue Growth &amp; Upstream Spillback Tracking</div>
    <div class="approach-text">
      <strong>How it works:</strong> When a key road or flyover becomes choked, the system tracks how congestion backs up into connected upstream roads over time. It calculates queue propagation speed and identifies which feeding junctions will be blocked next.<br>
      <strong>Why it matters:</strong> Enables traffic police to intervene at upstream junctions 15 to 30 minutes in advance, halting the chain reaction before entire corridors paralyze.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.5 Practical &amp; Turn-Restricted Diversion Routing</div>
    <div class="approach-text">
      <strong>How it works:</strong> Generates feasible alternate routes that strictly honor real-world road geometry—respecting one-ways, median dividers, prohibited turns, and intersection signal limits instead of pushing highway traffic into narrow residential lanes.<br>
      <strong>Why it matters:</strong> Delivers practical, lawful detours that redistribute traffic smoothly without triggering secondary gridlocks on side roads.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.6 Cultural &amp; Festive Mobility Coordination</div>
    <div class="approach-text">
      <strong>How it works:</strong> Handles major public celebrations (such as Vinayaka Chavithi processions and Bonalu jatara) by pairing crowdsourced ground updates from local ward residents with pre-trip alerts sent to incoming commuters 45 minutes before reaching festive zones.<br>
      <strong>Why it matters:</strong> Solves information asymmetry by warning unfamiliar drivers early, routing them around active procession blockades seamlessly.
    </div>
  </div>

  <div class="approach-item">
    <div class="approach-header">3.7 Digital Sandbox for Infrastructure Planning ("What-If" Evaluation)</div>
    <div class="approach-text">
      <strong>How it works:</strong> Provides a simulation environment for urban planners to test proposed road upgrades (e.g., adding a lane, constructing a flyover, or retiming traffic signals) under simulated traffic demand, estimating total vehicle delay saved versus estimated project cost.<br>
      <strong>Why it matters:</strong> Empowers municipal authorities to justify infrastructure spending with concrete return-on-investment metrics before breaking ground.
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
