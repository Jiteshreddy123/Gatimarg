/**
 * frontend/js/api.js
 * Asynchronous REST Client for GatiMarg AI / NeuraX Urban Traffic Engine.
 * Automatically communicates with FastAPI on http://127.0.0.1:8000/api.
 */

const API_BASE = window.location.origin.includes('8000')
  ? `${window.location.origin}/api`
  : 'http://127.0.0.1:8000/api';

export class ApiService {
  static isOnline = false;
  static telemetry = null;

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    try {
      const resp = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${resp.status}`);
      }
      this.isOnline = true;
      return await resp.json();
    } catch (err) {
      console.warn(`[GatiMarg API] Request to ${url} failed:`, err.message);
      this.isOnline = false;
      return null;
    }
  }

  // Health & System Summary
  static async checkHealth() {
    const data = await this.request('/health');
    this.isOnline = !!(data && data.status === 'ONLINE');
    return data;
  }

  static async getNetworkSummary() {
    return await this.request('/network/summary');
  }

  static async getNodes() {
    return await this.request('/network/nodes');
  }

  static async getSegments(params = {}) {
    const q = new URLSearchParams(params).toString();
    return await this.request(`/network/segments${q ? '?' + q : ''}`);
  }

  static async getTurnRestrictions() {
    return await this.request('/network/turn-restrictions');
  }

  // Live Congestion & Incidents
  static async getLiveCongestion(sortBy = 'congestion_index', limit = 50) {
    return await this.request(`/congestion/live?sort_by=${sortBy}&limit=${limit}`);
  }

  static async getIncidents() {
    return await this.request('/incidents');
  }

  static async getSpillback(incidentId) {
    return await this.request(`/spillback/${incidentId}`);
  }

  // Multi-Horizon Forecasting (Zero Target Leakage)
  static async getForecast(segmentId) {
    return await this.request(`/forecast/${segmentId}`);
  }

  // Routing with 61 Turn Restrictions Enforced
  static async planRoute(originNode, destinationNode) {
    return await this.request('/routes/plan', {
      method: 'POST',
      body: JSON.stringify({ origin_node: originNode, destination_node: destinationNode })
    });
  }

  // Chronic Recurring Bottlenecks
  static async getChronicHotspots() {
    return await this.request('/chronic/hotspots');
  }

  static async getChronicHotspotDetail(segmentId) {
    return await this.request(`/chronic/hotspots/${segmentId}`);
  }

  // Planning Candidates & Counterfactual Sandbox
  static async getPlanningCandidates() {
    return await this.request('/planning/candidates');
  }

  static async evaluateSimulation(scenario) {
    return await this.request('/simulation/evaluate', {
      method: 'POST',
      body: JSON.stringify(scenario)
    });
  }

  static async getEvents() {
    return await this.request('/events');
  }
}
