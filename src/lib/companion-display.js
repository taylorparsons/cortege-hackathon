/**
 * Maps agent type / profile type to display properties.
 * These are UI constants — they define how each agent TYPE renders,
 * not fake data about agent state.
 */

const AGENT_DISPLAY = {
  scout: {
    color: '#4ECDC4',
    glow: 'rgba(78,205,196,0.18)',
    ring: 'rgba(78,205,196,0.35)',
  },
  anchor: {
    color: '#E8A838',
    glow: 'rgba(232,168,56,0.15)',
    ring: 'rgba(232,168,56,0.3)',
  },
  sentinel: {
    color: '#7B9EC9',
    glow: 'rgba(123,158,201,0.15)',
    ring: 'rgba(123,158,201,0.3)',
  },
};

const DEFAULT_DISPLAY = {
  color: '#8C8272',
  glow: 'rgba(140,130,114,0.15)',
  ring: 'rgba(140,130,114,0.3)',
};

/**
 * Learning stages with display properties.
 * These define the learning model — not fake data.
 */
export const DEPTH_STAGES = [
  { label: 'Baseline', key: 'baseline', days: 'Day 1', color: '#7B9EC9', desc: 'Universal threat signatures active' },
  { label: 'Pattern Recognition', key: 'pattern_recognition', days: 'Day 30', color: '#4ECDC4', desc: 'Behavioral model building' },
  { label: 'Predictive', key: 'predictive', days: 'Day 90', color: '#9B7FD4', desc: 'Anticipating threats before they form' },
  { label: 'Cortege Mode', key: 'cortege_mode', days: 'Day 365', color: '#E8A838', desc: 'Full companion — deepest protection' },
];

/**
 * Returns display properties for an agent by name.
 * @param {string} agentName  e.g. "anchor", "scout", "sentinel"
 * @returns {{ color: string, glow: string, ring: string }}
 */
export function getAgentDisplay(agentName) {
  return AGENT_DISPLAY[agentName] ?? DEFAULT_DISPLAY;
}

/**
 * Returns the stage index (0-3) for a stage key.
 * @param {string} stageKey  e.g. "baseline", "pattern_recognition"
 * @returns {number}
 */
export function getStageIndex(stageKey) {
  const idx = DEPTH_STAGES.findIndex(s => s.key === stageKey);
  return idx >= 0 ? idx : 0;
}

/**
 * Formats a stage key for display.
 * @param {string} stageKey  e.g. "pattern_recognition"
 * @returns {string}  e.g. "Pattern Recognition"
 */
export function formatStageName(stageKey) {
  const stage = DEPTH_STAGES.find(s => s.key === stageKey);
  return stage?.label ?? stageKey?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Unknown';
}
