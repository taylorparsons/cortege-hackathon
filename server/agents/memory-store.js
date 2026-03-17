/**
 * MemoryStore — Per-agent-instance persistent memory with learning capabilities.
 * Implements: FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, NFR-003, EC2, EC8
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Learning stage helpers (Phase 2.3)
// ---------------------------------------------------------------------------

/**
 * Returns stage transition thresholds based on LEARNING_FAST_MODE env var.
 * FR-044: LEARNING_FAST_MODE=true lowers thresholds for demo acceleration.
 *
 * @returns {{ baseline: number, pattern: number, predictive: number, cortege: number }}
 */
export function getStageThresholds() {
  const fastMode = process.env.LEARNING_FAST_MODE !== 'false'; // default: true
  if (fastMode) {
    return { baseline: 0, pattern: 0.10, predictive: 0.25, cortege: 0.50 };
  }
  return { baseline: 0, pattern: 0.25, predictive: 0.50, cortege: 0.75 };
}

/**
 * Maps a depth score to a stage name.
 *
 * @param {number} depth  0.0 – 1.0
 * @returns {"baseline" | "pattern_recognition" | "predictive" | "cortege_mode"}
 */
export function getStageForDepth(depth) {
  const t = getStageThresholds();
  if (depth >= t.cortege) return 'cortege_mode';
  if (depth >= t.predictive) return 'predictive';
  if (depth >= t.pattern) return 'pattern_recognition';
  return 'baseline';
}

/**
 * Checks whether a depth value crosses into a new stage relative to oldStage.
 *
 * @param {string} oldStage
 * @param {number} newDepth
 * @returns {{ transitioned: boolean, newStage: string }}
 */
export function checkStageTransition(oldStage, newDepth) {
  const newStage = getStageForDepth(newDepth);
  return {
    transitioned: newStage !== oldStage,
    newStage,
  };
}

/**
 * Calculates depth score as a weighted average of four components.
 * EC8: Returns 0.0 safely when all counts are zero.
 *
 * @param {object} memory
 * @returns {number}  0.0 – 1.0
 */
export function calculateDepthScore(memory) {
  const EXPECTED_CONTACTS = 10;
  const EVENTS_FOR_CONFIDENCE = 100;
  const PATTERN_CAPACITY = 20;
  const BASELINE_PERIOD_DAYS = memory.baseline_period_days || 30;

  const contactScore =
    Math.min(Object.keys(memory.trusted_contacts || {}).length / EXPECTED_CONTACTS, 1) * 0.25;

  const daysScore =
    Math.min(daysSinceCreated(memory.created) / BASELINE_PERIOD_DAYS, 1) * 0.25;

  const eventsScore =
    Math.min((memory.events_processed || 0) / EVENTS_FOR_CONFIDENCE, 1) * 0.25;

  const patternsScore =
    Math.min((memory.learned_patterns || []).length / PATTERN_CAPACITY, 1) * 0.25;

  return contactScore + daysScore + eventsScore + patternsScore;
}

/**
 * Returns the number of days elapsed since the memory was created.
 * Respects LEARNING_TIME_MULTIPLIER for accelerated demo time.
 *
 * @param {string} createdIso  ISO timestamp string
 * @returns {number}
 */
function daysSinceCreated(createdIso) {
  const multiplier = parseInt(process.env.LEARNING_TIME_MULTIPLIER ?? '1440', 10);
  const elapsedMs = Date.now() - new Date(createdIso).getTime();
  const realDays = elapsedMs / (1000 * 60 * 60 * 24);
  return realDays * (multiplier / 1440); // 1440 = real-time (1 day = 1 day)
}

// ---------------------------------------------------------------------------
// MemoryStore class
// ---------------------------------------------------------------------------

export class MemoryStore {
  /**
   * @param {string} agentInstanceId  e.g. "anchor-mom"
   * @param {string} memberId         e.g. "member_002"
   * @param {string} memberName       e.g. "Mom"
   * @param {string} [dataDir]        Directory for memory files (default: "data/memories")
   */
  constructor(agentInstanceId, memberId, memberName, dataDir = 'data/memories') {
    this.instanceId = agentInstanceId;
    this.memberId = memberId;
    this.memberName = memberName;
    this.dataDir = dataDir;

    // Derive agent name from instanceId (e.g. "anchor-mom" → "anchor")
    this.agentName = agentInstanceId.split('-')[0];

    this.filePath = path.join(dataDir, `${agentInstanceId}.json`);
    this.memory = null;
  }

  // -------------------------------------------------------------------------
  // load / save
  // -------------------------------------------------------------------------

  /**
   * Loads memory from disk. Initializes fresh if file is missing or corrupted.
   * EC2: Corrupted files are logged and replaced with a fresh store.
   */
  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.memory = JSON.parse(raw);
        return;
      } catch (err) {
        console.error(
          `[memory-store] Corrupted memory file "${this.filePath}", initializing fresh: ${err.message}`
        );
      }
    }

    this.memory = this._freshMemory();
  }

  /**
   * Atomically writes memory to disk.
   * NFR-003: Write to .tmp file first, then fs.renameSync.
   */
  save() {
    // Ensure directory exists
    fs.mkdirSync(this.dataDir, { recursive: true });

    const tmpPath = `${this.filePath}.tmp`;
    const json = JSON.stringify(this.memory, null, 2);

    fs.writeFileSync(tmpPath, json, 'utf8');
    fs.renameSync(tmpPath, this.filePath);
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** @returns {object} Current memory object */
  getMemory() {
    return this.memory;
  }

  /**
   * Serializes memory to a JSON string for Claude prompt injection.
   * FR-019: Memory is injected into the Claude prompt on each call.
   *
   * @returns {string}
   */
  serialize() {
    return JSON.stringify(this.memory, null, 2);
  }

  // -------------------------------------------------------------------------
  // Memory update operations
  // -------------------------------------------------------------------------

  /**
   * Applies all memory update operations from a Claude response.
   * FR-020, FR-021: Supports all defined operation types.
   *
   * @param {object} memoryUpdates  e.g. { add_trusted_contact: {...}, update_pattern: {...} }
   */
  applyUpdates(memoryUpdates) {
    if (!memoryUpdates || typeof memoryUpdates !== 'object') return;

    for (const [operation, data] of Object.entries(memoryUpdates)) {
      try {
        this._applyOperation(operation, data);
      } catch (err) {
        console.error(`[memory-store] Failed to apply operation "${operation}": ${err.message}`);
      }
    }

    this.recalculateDepth();
  }

  /**
   * Dispatches a single memory update operation.
   *
   * @param {string} operation
   * @param {object} data
   */
  _applyOperation(operation, data) {
    switch (operation) {
      case 'add_trusted_contact': {
        // Upsert into trusted_contacts by id
        const { id, name, relationship, confidence, ...rest } = data;
        if (!id) throw new Error('add_trusted_contact requires "id"');
        this.memory.trusted_contacts[id] = {
          ...(this.memory.trusted_contacts[id] ?? {}),
          name,
          relationship,
          confidence,
          ...rest,
          last_updated: new Date().toISOString(),
        };
        break;
      }

      case 'remove_trusted_contact': {
        const { id } = data;
        if (!id) throw new Error('remove_trusted_contact requires "id"');
        delete this.memory.trusted_contacts[id];
        break;
      }

      case 'add_threat_record': {
        const { pattern, signals, source, threat_level } = data;
        this.memory.threat_history.push({
          timestamp: new Date().toISOString(),
          pattern,
          signals,
          source,
          threat_level,
        });
        break;
      }

      case 'update_pattern': {
        const { key, observation, confidence_delta } = data;
        if (!key) throw new Error('update_pattern requires "key"');
        const existing = this.memory.learned_patterns.find((p) => p.key === key);
        if (existing) {
          existing.observation = observation ?? existing.observation;
          existing.confidence = Math.min(
            1,
            (existing.confidence ?? 0) + (confidence_delta ?? 0)
          );
          existing.updated = new Date().toISOString();
        } else {
          this.memory.learned_patterns.push({
            key,
            observation,
            confidence: Math.max(0, confidence_delta ?? 0),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          });
        }
        break;
      }

      case 'update_baseline': {
        const { track, field, value } = data;
        if (!track || !field) throw new Error('update_baseline requires "track" and "field"');
        if (!this.memory[track] || typeof this.memory[track] !== 'object') {
          this.memory[track] = {};
        }
        this.memory[track][field] = value;
        break;
      }

      case 'block_contact': {
        const { id, reason } = data;
        if (!id) throw new Error('block_contact requires "id"');
        this.memory.blocked_contacts[id] = {
          reason,
          blocked_at: new Date().toISOString(),
        };
        break;
      }

      case 'add_observation': {
        const { category, detail } = data;
        this.memory.observations.push({
          category,
          detail,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      default:
        console.warn(`[memory-store] Unknown memory update operation: "${operation}"`);
    }
  }

  // -------------------------------------------------------------------------
  // Learning progression
  // -------------------------------------------------------------------------

  /**
   * Increments events_processed counter, then recalculates depth score.
   * Respects LEARNING_EVENT_WEIGHT multiplier (FR-043).
   */
  incrementEventsProcessed() {
    const weight = parseInt(process.env.LEARNING_EVENT_WEIGHT ?? '10', 10);
    this.memory.events_processed = (this.memory.events_processed || 0) + weight;
    this.recalculateDepth();
  }

  /**
   * Recalculates depth_score and stage. Returns transition info.
   * FR-022, FR-023, FR-024
   *
   * @returns {{ transitioned: boolean, newStage: string, oldStage: string }}
   */
  recalculateDepth() {
    const oldStage = this.memory.stage;
    const newDepth = calculateDepthScore(this.memory);

    this.memory.depth_score = Math.round(newDepth * 10000) / 10000; // 4 decimal places

    const { transitioned, newStage } = checkStageTransition(oldStage, newDepth);
    if (transitioned) {
      this.memory.stage = newStage;
      console.log(
        `[memory-store] Stage transition for "${this.instanceId}": ${oldStage} → ${newStage} (depth: ${this.memory.depth_score})`
      );
    }

    return { transitioned, newStage, oldStage };
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Returns a fresh, empty memory structure.
   *
   * @returns {object}
   */
  _freshMemory() {
    return {
      agent: this.agentName,
      member: this.memberName,
      member_id: this.memberId,
      created: new Date().toISOString(),
      stage: 'baseline',
      events_processed: 0,
      depth_score: 0,
      trusted_contacts: {},
      communication_patterns: {},
      financial_baseline: {},
      blocked_contacts: {},
      threat_history: [],
      learned_patterns: [],
      observations: [],
    };
  }
}

export default MemoryStore;
