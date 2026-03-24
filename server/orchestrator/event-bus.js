/**
 * Event Bus — Typed EventEmitter with CoreEvent schema, JSONL persistence, and replay.
 * Implements: FR-007, FR-008, FR-009, FR-010, FR-011, NFR-007, NFR-008
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import StorageAdapter from '../storage/storage-adapter.js';

const adapter = new StorageAdapter();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXTERNAL_EVENT_TYPES = new Set([
  'inbound_call',
  'inbound_sms',
  'inbound_email',
  'financial_transaction',
  'contact_request',
  'login_attempt',
]);

const INTERNAL_EVENT_TYPES = new Set([
  'scheduled_review',
  'baseline_update',
  'escalation',
  'household_signal',
  'memory_snapshot',
  'stage_transition',
  // WARDEN data broker removal events
  'broker_scan_started',
  'broker_scan_completed',
  'broker_status_change',
  'captcha_required',
  'captcha_resolved',
  'associate_discovered',
]);

const ALL_EVENT_TYPES = new Set([...EXTERNAL_EVENT_TYPES, ...INTERNAL_EVENT_TYPES]);

const EVENTS_DIR = path.resolve('data/events');

// ---------------------------------------------------------------------------
// ID generation  evt_YYYYMMDD_HHmmss_xxxx
// ---------------------------------------------------------------------------

function generateEventId() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const date =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time =
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `evt_${date}_${time}_${rand}`;
}

// ---------------------------------------------------------------------------
// CoreEvent validation
// ---------------------------------------------------------------------------

/**
 * Validates a CoreEvent object.
 * @param {object} event
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCoreEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object') {
    return { valid: false, errors: ['Event must be a non-null object'] };
  }

  // id — optional at validation time; emit() will assign one if missing
  if (event.id !== undefined && typeof event.id !== 'string') {
    errors.push('id must be a string');
  }

  // type — required, must be a known event type
  if (!event.type) {
    errors.push('type is required');
  } else if (!ALL_EVENT_TYPES.has(event.type)) {
    errors.push(`type "${event.type}" is not a valid event type`);
  }

  // source — required string
  if (!event.source || typeof event.source !== 'string') {
    errors.push('source is required and must be a string');
  }

  // timestamp — required, ISO string or Date
  if (!event.timestamp) {
    errors.push('timestamp is required');
  }

  // target_member — optional string
  if (event.target_member !== undefined && event.target_member !== null &&
      typeof event.target_member !== 'string') {
    errors.push('target_member must be a string or null');
  }

  // payload — required object
  if (!event.payload || typeof event.payload !== 'object') {
    errors.push('payload is required and must be an object');
  }

  // metadata — optional object
  if (event.metadata !== undefined && event.metadata !== null &&
      typeof event.metadata !== 'object') {
    errors.push('metadata must be an object or null');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// JSONL helpers
// ---------------------------------------------------------------------------

function dateToFilename(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.jsonl`;
}

function ensureEventsDir() {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

function persistEvent(event) {
  adapter.writeEvent(event);
}

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

export class EventBus extends EventEmitter {
  constructor() {
    super();
    // Map<eventType, Map<agentInstanceId, handler>>
    this._handlers = new Map();
    // Map<agentInstanceId, Set<eventType>> — for reverse lookup on unsubscribe
    this._agentSubscriptions = new Map();
    // Map<agentInstanceId, memberId> — for target_member routing
    this._agentMemberMap = new Map();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Emit a CoreEvent. Validates, assigns id/timestamp if missing, persists,
   * then routes to subscribed handlers.
   * @param {object} event  CoreEvent (id and timestamp are optional — assigned if absent)
   * @returns {CoreEvent}   The fully-formed event that was emitted
   */
  emit(event) {
    // Assign defaults before validation
    const normalized = {
      id: event.id || generateEventId(),
      timestamp: event.timestamp || new Date().toISOString(),
      target_member: event.target_member ?? null,
      metadata: event.metadata ?? {},
      ...event,
    };

    const { valid, errors } = validateCoreEvent(normalized);
    if (!valid) {
      throw new Error(`Invalid CoreEvent: ${errors.join('; ')}`);
    }

    // Persist to JSONL (FR-010, NFR-007)
    persistEvent(normalized);

    // Route to subscribed handlers (FR-007, FR-008)
    this._route(normalized);

    // Also emit on the Node.js EventEmitter for any raw listeners
    super.emit(normalized.type, normalized);
    super.emit('*', normalized);

    return normalized;
  }

  /**
   * Subscribe an agent instance to an event type.
   * @param {string} eventType
   * @param {string} agentInstanceId
   * @param {function} handler  Called with (CoreEvent)
   * @param {string|null} memberId  The household member this instance is paired with
   */
  subscribe(eventType, agentInstanceId, handler, memberId = null) {
    if (!ALL_EVENT_TYPES.has(eventType)) {
      throw new Error(`Cannot subscribe to unknown event type: "${eventType}"`);
    }
    if (typeof handler !== 'function') {
      throw new Error('handler must be a function');
    }

    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, new Map());
    }
    this._handlers.get(eventType).set(agentInstanceId, handler);

    // Track reverse mapping
    if (!this._agentSubscriptions.has(agentInstanceId)) {
      this._agentSubscriptions.set(agentInstanceId, new Set());
    }
    this._agentSubscriptions.get(agentInstanceId).add(eventType);

    // Track member pairing for target_member routing
    if (memberId) {
      this._agentMemberMap.set(agentInstanceId, memberId);
    }
  }

  /**
   * Unsubscribe an agent instance from an event type.
   * @param {string} eventType
   * @param {string} agentInstanceId
   */
  unsubscribe(eventType, agentInstanceId) {
    const typeHandlers = this._handlers.get(eventType);
    if (typeHandlers) {
      typeHandlers.delete(agentInstanceId);
      if (typeHandlers.size === 0) {
        this._handlers.delete(eventType);
      }
    }

    const agentSubs = this._agentSubscriptions.get(agentInstanceId);
    if (agentSubs) {
      agentSubs.delete(eventType);
      if (agentSubs.size === 0) {
        this._agentSubscriptions.delete(agentInstanceId);
        this._agentMemberMap.delete(agentInstanceId);
      }
    }
  }

  /**
   * Unsubscribe an agent instance from all event types.
   * @param {string} agentInstanceId
   */
  unsubscribeAll(agentInstanceId) {
    const agentSubs = this._agentSubscriptions.get(agentInstanceId);
    if (!agentSubs) return;

    for (const eventType of agentSubs) {
      const typeHandlers = this._handlers.get(eventType);
      if (typeHandlers) {
        typeHandlers.delete(agentInstanceId);
        if (typeHandlers.size === 0) {
          this._handlers.delete(eventType);
        }
      }
    }

    this._agentSubscriptions.delete(agentInstanceId);
    this._agentMemberMap.delete(agentInstanceId);
  }

  /**
   * Replay events from JSONL files in chronological order.
   * Re-emits each event through the bus (including persistence + routing).
   * @param {Date|null} fromDate  Start of range (inclusive). Defaults to all files.
   * @param {Date|null} toDate    End of range (inclusive). Defaults to all files.
   */
  replay(fromDate = null, toDate = null) {
    ensureEventsDir();

    let files;
    try {
      files = fs.readdirSync(EVENTS_DIR)
        .filter((f) => f.endsWith('.jsonl'))
        .sort(); // lexicographic = chronological for YYYY-MM-DD.jsonl
    } catch {
      return;
    }

    for (const filename of files) {
      const fileDate = this._parseDateFromFilename(filename);
      if (!fileDate) continue;

      if (fromDate && fileDate < this._startOfDay(fromDate)) continue;
      if (toDate && fileDate > this._startOfDay(toDate)) continue;

      const filepath = path.join(EVENTS_DIR, filename);
      let content;
      try {
        content = fs.readFileSync(filepath, 'utf8');
      } catch {
        console.warn(`[event-bus] Could not read ${filepath}, skipping`);
        continue;
      }

      const lines = content.split('\n').filter((l) => l.trim());
      for (const line of lines) {
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          console.warn(`[event-bus] Skipping malformed JSONL line in ${filename}`);
          continue;
        }

        // Re-emit: route to handlers but skip re-persisting to avoid duplicates
        this._route(event);
        super.emit(event.type, event);
        super.emit('*', event);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Introspection helpers
  // -------------------------------------------------------------------------

  /** Returns all event types a given agent instance is subscribed to. */
  getSubscriptions(agentInstanceId) {
    return [...(this._agentSubscriptions.get(agentInstanceId) ?? [])];
  }

  /** Returns the member ID paired with an agent instance. */
  getMemberId(agentInstanceId) {
    return this._agentMemberMap.get(agentInstanceId) ?? null;
  }

  // -------------------------------------------------------------------------
  // Internal routing
  // -------------------------------------------------------------------------

  _route(event) {
    const typeHandlers = this._handlers.get(event.type);
    if (!typeHandlers || typeHandlers.size === 0) return;

    for (const [agentInstanceId, handler] of typeHandlers) {
      // If event has a target_member, only route to agents paired with that member
      if (event.target_member) {
        const pairedMember = this._agentMemberMap.get(agentInstanceId);
        if (pairedMember && pairedMember !== event.target_member) {
          continue;
        }
      }

      try {
        handler(event);
      } catch (err) {
        console.error(
          `[event-bus] Handler error for agent "${agentInstanceId}" on event type "${event.type}":`,
          err
        );
      }
    }
  }

  _parseDateFromFilename(filename) {
    const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})\.jsonl$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  _startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { EXTERNAL_EVENT_TYPES, INTERNAL_EVENT_TYPES, ALL_EVENT_TYPES, validateCoreEvent, generateEventId };

export default new EventBus();
