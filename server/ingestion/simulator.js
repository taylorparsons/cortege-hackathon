/**
 * Event Simulator — reads scenario files and fires events on a timeline.
 * Implements: FR-030, FR-031, FR-045, EC5
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateEventId } from '../orchestrator/event-bus.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// EventSimulator
// ---------------------------------------------------------------------------

export class EventSimulator {
  /**
   * @param {import('../orchestrator/event-bus.js').EventBus} eventBus
   * @param {string} scenariosDir  Path to scenarios directory (default: 'scenarios')
   */
  constructor(eventBus, scenariosDir = 'scenarios') {
    this.eventBus = eventBus;
    this.scenariosDir = path.resolve(scenariosDir);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Run a named scenario: load, validate, then fire events in sequence.
   * @param {string} scenarioName
   * @returns {Promise<{ scenarioName: string, eventsEmitted: number, completed: true }
   *                  | { error: string, status: 400 }>}
   */
  async runScenario(scenarioName) {
    const { valid, scenario, error } = this._loadScenario(scenarioName);

    if (!valid) {
      return { error, status: 400 };
    }

    let eventsEmitted = 0;

    for (const entry of scenario.events) {
      const delayMs = entry.delay_ms ?? 0;

      if (delayMs > 0) {
        await sleep(delayMs);
      }

      // Determine target_member: per-event override or scenario default
      const targetMember = entry.event?.target_member ?? scenario.target_member ?? null;

      // Build CoreEvent — spread entry.event first, then override with normalized fields
      const coreEvent = {
        ...entry.event,
        id: generateEventId(),
        source: 'simulator',
        timestamp: new Date().toISOString(),
        target_member: targetMember,
        metadata: {
          ...(entry.event?.metadata ?? {}),
          learning_boost: scenario.learning_boost ?? 1,
        },
      };

      this.eventBus.emit(coreEvent);
      eventsEmitted++;
    }

    return { scenarioName, eventsEmitted, completed: true };
  }

  /**
   * List available scenario names (filenames without .json, excluding _template).
   * @returns {string[]}
   */
  listScenarios() {
    if (!fs.existsSync(this.scenariosDir)) {
      return [];
    }

    let files;
    try {
      files = fs.readdirSync(this.scenariosDir);
    } catch (err) {
      console.error('[simulator] Could not read scenarios directory:', err.message);
      return [];
    }

    return files
      .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
      .map((f) => f.replace(/\.json$/, ''));
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Load and validate a scenario file.
   * @param {string} scenarioName
   * @returns {{ valid: boolean, scenario: object|null, error: string|null }}
   */
  _loadScenario(scenarioName) {
    const filepath = path.join(this.scenariosDir, `${scenarioName}.json`);

    // Read file
    let raw;
    try {
      raw = fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      return {
        valid: false,
        scenario: null,
        error: `Scenario file not found: ${scenarioName}.json`,
      };
    }

    // Parse JSON (EC5)
    let scenario;
    try {
      scenario = JSON.parse(raw);
    } catch (err) {
      return {
        valid: false,
        scenario: null,
        error: `Invalid JSON in scenario file "${scenarioName}.json": ${err.message}`,
      };
    }

    // Validate required fields (EC5)
    if (!scenario.name || typeof scenario.name !== 'string') {
      return {
        valid: false,
        scenario: null,
        error: `Scenario "${scenarioName}" is missing required field: name`,
      };
    }

    if (!Array.isArray(scenario.events)) {
      return {
        valid: false,
        scenario: null,
        error: `Scenario "${scenarioName}" is missing required field: events (must be an array)`,
      };
    }

    return { valid: true, scenario, error: null };
  }
}

export default EventSimulator;
