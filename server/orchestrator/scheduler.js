/**
 * Scheduler — Fires internal events on a time-based schedule.
 * Implements: FR-046, FR-047, FR-048, FR-042, NFR-009
 *
 * Uses node-cron when the interval maps to a clean cron expression,
 * otherwise falls back to setInterval.
 */

import cron from 'node-cron';
import { generateEventId } from './event-bus.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the real-world interval in minutes for one simulated period.
 *
 * @param {number} simulatedHours   How many simulated hours per period
 * @param {number} multiplier       LEARNING_TIME_MULTIPLIER (simulated minutes per real minute)
 * @returns {number}  Real-world minutes per period
 */
function realMinutes(simulatedHours, multiplier) {
  const simulatedMinutes = simulatedHours * 60;
  return simulatedMinutes / multiplier;
}

/**
 * Build a cron expression for a given real-world interval in minutes.
 * Returns null if the interval doesn't map to a clean cron expression.
 *
 * @param {number} intervalMinutes
 * @returns {string|null}
 */
function cronExpression(intervalMinutes) {
  if (intervalMinutes < 1) {
    // Sub-minute — can't express in cron; caller should use setInterval
    return null;
  }
  if (Number.isInteger(intervalMinutes) && intervalMinutes <= 59) {
    return `*/${intervalMinutes} * * * *`;
  }
  if (Number.isInteger(intervalMinutes) && intervalMinutes % 60 === 0) {
    const hours = intervalMinutes / 60;
    if (hours <= 23) return `0 */${hours} * * *`;
    if (hours === 24) return `0 0 * * *`;
  }
  // Non-clean interval — use setInterval
  return null;
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

export class Scheduler {
  /**
   * @param {Map<string, import('../agents/agent-instance.js').AgentInstance>} agentInstances
   * @param {import('./event-bus.js').EventBus} eventBus
   * @param {object} [options]
   * @param {Array<{ type: string, cron: string }>} [options.customSchedules]  Extra schedules
   */
  constructor(agentInstances, eventBus, options = {}) {
    this.agentInstances = agentInstances;
    this.eventBus = eventBus;
    this.options = options;

    /** @type {Array<cron.ScheduledTask>} */
    this._cronTasks = [];
    /** @type {Array<ReturnType<typeof setInterval>>} */
    this._intervals = [];

    this._running = false;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Start all scheduled tasks. */
  start() {
    if (this._running) return;
    this._running = true;

    const multiplier = Number(process.env.LEARNING_TIME_MULTIPLIER ?? 1440);

    // baseline_update — every 24 simulated hours
    this._schedule('baseline_update', 24, multiplier);

    // memory_snapshot — every 12 simulated hours
    this._schedule('memory_snapshot', 12, multiplier);

    // Custom schedules from agent template frontmatter
    const customSchedules = this.options.customSchedules ?? [];
    for (const { type, cron: cronExpr } of customSchedules) {
      if (!type || !cronExpr) {
        console.warn('[scheduler] Custom schedule missing type or cron — skipping:', { type, cronExpr });
        continue;
      }
      this._scheduleCron(type, cronExpr);
    }

    console.log('[scheduler] Started');
  }

  /** Stop all scheduled tasks and clear intervals. */
  stop() {
    for (const task of this._cronTasks) {
      try { task.stop(); } catch { /* ignore */ }
    }
    for (const id of this._intervals) {
      clearInterval(id);
    }
    this._cronTasks = [];
    this._intervals = [];
    this._running = false;
    console.log('[scheduler] Stopped');
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * Schedule an internal event type based on simulated hours + multiplier.
   * Prefers cron; falls back to setInterval for non-clean intervals.
   *
   * @param {string} eventType
   * @param {number} simulatedHours
   * @param {number} multiplier
   */
  _schedule(eventType, simulatedHours, multiplier) {
    const intervalMinutes = realMinutes(simulatedHours, multiplier);
    const expr = cronExpression(intervalMinutes);

    if (expr) {
      this._scheduleCron(eventType, expr);
    } else {
      // setInterval fallback (handles sub-minute or fractional intervals)
      const intervalMs = intervalMinutes * 60 * 1000;
      console.log(
        `[scheduler] Scheduling "${eventType}" via setInterval every ${intervalMs}ms ` +
        `(${simulatedHours}h simulated @ multiplier=${multiplier})`
      );
      const id = setInterval(() => this._fire(eventType), intervalMs);
      this._intervals.push(id);
    }
  }

  /**
   * Schedule an event type using a cron expression.
   *
   * @param {string} eventType
   * @param {string} expr  node-cron expression
   */
  _scheduleCron(eventType, expr) {
    if (!cron.validate(expr)) {
      console.error(`[scheduler] Invalid cron expression for "${eventType}": "${expr}" — skipping`);
      return;
    }

    console.log(`[scheduler] Scheduling "${eventType}" via cron "${expr}"`);

    const task = cron.schedule(expr, () => this._fire(eventType));
    this._cronTasks.push(task);
  }

  /**
   * Emit an internal event on the event bus.
   *
   * @param {string} eventType
   */
  _fire(eventType) {
    console.log(`[scheduler] Firing "${eventType}"`);
    try {
      this.eventBus.emit({
        id: generateEventId(),
        type: eventType,
        source: 'scheduler',
        timestamp: new Date().toISOString(),
        target_member: null,
        payload: { triggered_by: 'scheduler' },
        metadata: {},
      });
    } catch (err) {
      console.error(`[scheduler] Failed to emit "${eventType}": ${err.message}`);
    }
  }
}

export default Scheduler;
