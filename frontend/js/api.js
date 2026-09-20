/*
 * GatiMarg AI API Client
 * Team Contributors: [Your Name] (Lead), [Friend 1 Name] (Frontend)
 */
/**
 * frontend/js/api.js
 * Asynchronous REST Client for GatiMarg AI / NeuraX Urban Traffic Engine.
 * Communicates with FastAPI on /api endpoints.
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

  // Live Congestion & Incidents
  static async getLiveCongestion(sortBy = 'congestion_index', limit = 50) {
    return await this.request(`/congestion/ranking?limit=${limit}`);
  }

  static async getIncidents() {
    return await this.request('/incidents');
  }

  static async getSpillback(segmentId) {
    return await this.request(`/spillback/${segmentId}`);
  }

  // Multi-Horizon Forecasting (Zero Target Leakage)
  static async getForecast(segmentId, intervention = 'active') {
    return await this.request(`/forecast/${segmentId}?intervention=${intervention}`);
  }

  // Routing with 61 Turn Restrictions Enforced
  static async planRoute(originNode, destinationNode) {
    return await this.request('/routes/plan', {
      method: 'POST',
      body: JSON.stringify({ origin_node: originNode, destination_node: destinationNode })
    });
  }

  // Two-Horizon Persistent Congestion & Resolution Intelligence
  static async getPersistentHotspots() {
    return await this.request('/persistent/hotspots');
  }

  static async getPersistentHotspotDetail(segmentId) {
    return await this.request(`/persistent/hotspots/${segmentId}`);
  }

  static async evaluateDiversion(payload) {
    return await this.request('/persistent/diversion/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async simulateCounterfactual(payload) {
    return await this.request('/persistent/counterfactual/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async simulateDisruption(payload) {
    return await this.request('/persistent/disruption/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Simulated Municipal Resolution Requests & Issue Lifecycle
  static async getMunicipalRequests() {
    return await this.request('/persistent/municipal/requests');
  }

  static async generateMunicipalRequest(segmentId) {
    return await this.request('/persistent/municipal/requests/generate', {
      method: 'POST',
      body: JSON.stringify({ segment_id: segmentId })
    });
  }

  static async updateMunicipalStatus(issueId, status) {
    return await this.request(`/persistent/municipal/requests/${issueId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status })
    });
  }

  // Commuter Early Warning Alerts
  static async getPersistentAlerts() {
    return await this.request('/persistent/alerts');
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
