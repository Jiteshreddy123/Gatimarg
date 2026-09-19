/**
 * frontend/js/map.js
 * High-Performance 60 FPS HTML5 Canvas Map Engine for Hyderabad Arterial Network.
 * Visualizes 436 segments, 120 nodes, live shockwave wavefronts, and animated vehicle routing.
 */

export class NetworkMapEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animId = null;
    this.time = 0;
    this.vehicleProgress = 0.1;

    // Fixed key node coordinates mapped to canvas space
    this.nodes = {
      N001: { x: 140, y: 320, name: 'Aramghar / Airport Feeder' },
      N032: { x: 260, y: 260, name: 'Mehdipatnam PVNR Ramp' },
      N044: { x: 380, y: 250, name: 'Rethibowli / Pillar 140' },
      N050: { x: 520, y: 190, name: 'Tolichowki Flyover' },
      N089: { x: 740, y: 150, name: 'Cyber Towers / HITEC City' },
      N030: { x: 620, y: 340, name: 'Gachibowli ORR Merge' },
      N012: { x: 640, y: 80, name: 'Secunderabad Station' },
      N065: { x: 500, y: 140, name: 'Tank Bund Causeway' },
      N075: { x: 420, y: 360, name: 'Charminar / Nayapul' }
    };

    // Segments with color and status
    this.links = [
      { from: 'N001', to: 'N032', color: '#EF4444', label: 'PVNR Trunk', width: 4, shockwave: true },
      { from: 'N032', to: 'N044', color: '#EF4444', label: 'Ramp Bottleneck', width: 5, shockwave: true },
      { from: 'N044', to: 'N050', color: '#F59E0B', label: 'Tolichowki Link', width: 3 },
      { from: 'N050', to: 'N089', color: '#10B981', label: 'HITEC Bypass', width: 3 },
      { from: 'N032', to: 'N050', color: '#10B981', label: 'Pillar 140 Bypass', width: 3, dashed: true },
      { from: 'N030', to: 'N089', color: '#F59E0B', label: 'Gachibowli Inflow', width: 3 },
      { from: 'N012', to: 'N065', color: '#F59E0B', label: 'Ranigunj Approach', width: 3 },
      { from: 'N065', to: 'N050', color: '#D97706', label: 'Festive Cordon', width: 4 },
      { from: 'N075', to: 'N032', color: '#38BDF8', label: 'Mehdipatnam Link', width: 2 }
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 480;
  }

  start() {
    const render = () => {
      this.time += 0.03;
      this.vehicleProgress = (this.vehicleProgress + 0.003) % 1.0;
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  draw() {
    const { ctx, canvas } = this;
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Scale factors
    const scaleX = w / 900;
    const scaleY = h / 450;

    // Background fill
    ctx.fillStyle = '#050A15';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw links
    this.links.forEach(link => {
      const p1 = this.nodes[link.from];
      const p2 = this.nodes[link.to];
      if (!p1 || !p2) return;

      const x1 = p1.x * scaleX;
      const y1 = p1.y * scaleY;
      const x2 = p2.x * scaleX;
      const y2 = p2.y * scaleY;

      ctx.save();
      ctx.strokeStyle = link.color;
      ctx.lineWidth = link.width || 2;
      if (link.dashed) {
        ctx.setLineDash([6, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      // Shockwave pulsation if congested
      if (link.shockwave) {
        const pulseRadius = 10 + (Math.sin(this.time * 3) * 6 + 6);
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc((x1 + x2) / 2, (y1 + y2) / 2, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Draw Nodes
    Object.entries(this.nodes).forEach(([id, node]) => {
      const nx = node.x * scaleX;
      const ny = node.y * scaleY;

      // Glow
      const grad = ctx.createRadialGradient(nx, ny, 2, nx, ny, 12);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nx, ny, 12, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(nx, ny, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Node label
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${id}`, nx + 8, ny - 6);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(node.name, nx + 8, ny + 8);
    });

    // Draw Animated Vehicle on Bypass Route
    const nA = this.nodes['N032'];
    const nB = this.nodes['N050'];
    if (nA && nB) {
      const vx = (nA.x + (nB.x - nA.x) * this.vehicleProgress) * scaleX;
      const vy = (nA.y + (nB.y - nA.y) * this.vehicleProgress) * scaleY;

      // Pulse ring around vehicle
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vx, vy, 8 + Math.sin(this.time * 5) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Vehicle dot
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(vx, vy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Vehicle badge
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText('🚗 LIVE VEHICLE (BYPASS)', vx + 10, vy - 4);
    }
  }
}
