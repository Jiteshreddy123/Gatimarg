/**
 * frontend/js/provenance.js
 * Strict Anti-Hallucination & Provenance Guarantee Tagging.
 * Maps every data item, prediction, or simulation metric to its exact source.
 */

export const ProvenanceClasses = {
  DATA: 'badge-provenance-data',
  DERIVED: 'badge-provenance-derived',
  MODEL: 'badge-provenance-model',
  SIMULATION: 'badge-provenance-simulation',
  UNAVAILABLE: 'badge-provenance-unavailable'
};

export function renderProvenanceBadge(type, source) {
  const t = (type || 'DATA').toUpperCase();
  const cls = ProvenanceClasses[t] || 'badge-provenance-data';
  const cleanSource = (source || '').replace(/"/g, '&quot;');
  return `<span class="badge-provenance ${cls}" title="Provenance: ${cleanSource}">[${t}]</span>`;
}
