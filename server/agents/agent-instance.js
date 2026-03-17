/**
 * AgentInstance — Represents a single agent instance paired to one household member.
 * Implements: FR-001, FR-004, FR-012, FR-013, FR-015, FR-021, FR-041, EC1, EC4, NFR-004, NFR-005
 */

import { callClaude } from '../claude/claude-client.js';
import { parseAgentResponse, SUBMIT_ASSESSMENT_TOOL } from '../claude/response-schema.js';
import { MemoryStore } from './memory-store.js';

export class AgentInstance {
  /**
   * @param {object} opts
   * @param {string} opts.id           Instance ID (e.g. "anchor-mom")
   * @param {string} opts.agentName    Agent type name (e.g. "anchor")
   * @param {string} opts.memberId     Household member ID (e.g. "member_002")
   * @param {string} opts.memberName   Household member display name (e.g. "Mom")
   * @param {object} opts.config       Parsed frontmatter config
   * @param {string} opts.systemPrompt Markdown body (Claude system prompt)
   */
  constructor({ id, agentName, memberId, memberName, config, systemPrompt }) {
    this.id = id;
    this.agentName = agentName;
    this.memberId = memberId;
    this.memberName = memberName;
    this.config = config;
    this.systemPrompt = systemPrompt;
    this.memory = null;
    this.memoryStore = null;
    this.processingQueue = [];
    this._processing = false;
  }

  // ---------------------------------------------------------------------------
  // Identity / status
  // ---------------------------------------------------------------------------

  /** @returns {string} */
  getId() {
    return this.id;
  }

  /** @returns {string} */
  getMemberId() {
    return this.memberId;
  }

  /**
   * Returns current status snapshot.
   * Reads from this.memoryStore when available, otherwise returns defaults.
   * @returns {{ id, agentName, memberId, memberName, stage, depthScore, eventsProcessed }}
   */
  getStatus() {
    const mem = this.memoryStore?.getMemory();
    return {
      id: this.id,
      agentName: this.agentName,
      memberId: this.memberId,
      memberName: this.memberName,
      stage: mem?.stage ?? 'baseline',
      depthScore: mem?.depth_score ?? 0,
      eventsProcessed: mem?.events_processed ?? 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Memory initialisation
  // ---------------------------------------------------------------------------

  /**
   * Creates and loads a MemoryStore for this instance.
   *
   * @param {string} [dataDir]  Directory for memory files (default: "data/memories")
   */
  initMemory(dataDir = 'data/memories') {
    this.memoryStore = new MemoryStore(this.id, this.memberId, this.memberName, dataDir);
    this.memoryStore.load();
    // Keep legacy this.memory reference in sync
    this.memory = this.memoryStore.getMemory();
  }

  // ---------------------------------------------------------------------------
  // Event processing loop
  // ---------------------------------------------------------------------------

  /**
   * Enqueues an event for sequential processing (EC1).
   * If the queue is already draining, returns immediately — the loop will pick it up.
   *
   * @param {object}        event  CoreEvent
   * @param {Function|null} ws     ws(eventName, data) — WebSocket emitter, or null
   * @returns {Promise<object|null>}  AgentResponse, or null if processing was deferred
   */
  async processEvent(event, ws) {
    this.processingQueue.push(event);

    if (this._processing) {
      return null; // queue will drain
    }

    this._processing = true;
    let lastResponse = null;

    while (this.processingQueue.length > 0) {
      const currentEvent = this.processingQueue.shift();

      try {
        lastResponse = await this._processOne(currentEvent, ws);
      } catch (err) {
        // Unexpected errors in the loop should not crash the queue
        console.error(`[agent-instance] Unhandled error processing event ${currentEvent?.id}: ${err.message}`);
        _emit(ws, 'agent:error', { instanceId: this.id, eventId: currentEvent?.id, error: err.message });
      }
    }

    this._processing = false;
    return lastResponse;
  }

  // ---------------------------------------------------------------------------
  // Internal: process a single event
  // ---------------------------------------------------------------------------

  /**
   * @param {object}        event
   * @param {Function|null} ws
   * @returns {Promise<object>}  AgentResponse
   */
  async _processOne(event, ws) {
    _emit(ws, 'agent:processing', { instanceId: this.id, eventId: event.id });

    // Ensure memory is loaded
    if (!this.memoryStore) {
      this.initMemory();
    }

    // Build Claude prompt
    const fullSystemPrompt =
      this.systemPrompt + '\n\n## Current Memory\n' + this.memoryStore.serialize();

    const userMessage = JSON.stringify({
      event_type: event.type,
      event_id: event.id,
      payload: event.payload,
      timestamp: event.timestamp,
    });

    // Model override from agent template frontmatter
    const model = this.config?.model ?? undefined;

    // Call Claude with retry logic
    let apiResponse;
    try {
      apiResponse = await this._callClaudeWithRetry({ fullSystemPrompt, userMessage, model, event, ws });
    } catch (err) {
      // After all retries exhausted — treat as L1 / unprocessed
      console.error(`[agent-instance] Claude call failed for event ${event.id}: ${err.message}`);
      _emit(ws, 'agent:error', { instanceId: this.id, eventId: event.id, error: err.message });
      // Return a minimal L1 response so the caller can continue
      return _fallbackResponse(event, this.agentName, this.id, err.message);
    }

    // Parse structured response
    let agentResponse;
    try {
      agentResponse = parseAgentResponse(apiResponse);
    } catch (parseErr) {
      // Malformed response → treat as L1, emit agent:error
      console.error(`[agent-instance] Malformed response for event ${event.id}: ${parseErr.message}`);
      _emit(ws, 'agent:error', { instanceId: this.id, eventId: event.id, error: parseErr.message });
      return _fallbackResponse(event, this.agentName, this.id, parseErr.message);
    }

    // Apply memory updates
    this.memoryStore.applyUpdates(agentResponse.memory_updates);
    this.memoryStore.incrementEventsProcessed();

    // Keep legacy reference in sync
    this.memory = this.memoryStore.getMemory();

    // Persist
    this.memoryStore.save();

    // Check for stage transition
    const mem = this.memoryStore.getMemory();
    const prevStage = mem.stage;
    const { transitioned, newStage } = this.memoryStore.recalculateDepth();
    if (transitioned) {
      _emit(ws, 'stage:transition', {
        instanceId: this.id,
        fromStage: prevStage,
        toStage: newStage,
        depthScore: this.memoryStore.getMemory().depth_score,
      });
      // Re-save after recalculation
      this.memoryStore.save();
    }

    // Emit agent:response
    _emit(ws, 'agent:response', { instanceId: this.id, eventId: event.id, response: agentResponse });

    return agentResponse;
  }

  // ---------------------------------------------------------------------------
  // Internal: Claude call with retry logic
  // ---------------------------------------------------------------------------

  /**
   * Calls Claude with the retry strategy defined in the spec:
   *   - Timeout: retry once after 2s, then throw
   *   - Rate limit: exponential backoff 2s → 4s → 8s (max 3 retries), then throw
   *
   * @returns {Promise<object>}  Raw Anthropic API response
   */
  async _callClaudeWithRetry({ fullSystemPrompt, userMessage, model, event, ws }) {
    const tools = [SUBMIT_ASSESSMENT_TOOL];

    // --- First attempt ---
    try {
      return await callClaude({ systemPrompt: fullSystemPrompt, userMessage, tools, model });
    } catch (err) {
      if (_isTimeout(err)) {
        // Timeout: retry once after 2s
        console.warn(`[agent-instance] Timeout on event ${event.id}, retrying in 2s…`);
        await _sleep(2000);
        try {
          return await callClaude({ systemPrompt: fullSystemPrompt, userMessage, tools, model });
        } catch (retryErr) {
          _emit(ws, 'agent:error', { instanceId: this.id, eventId: event.id, error: retryErr.message });
          throw retryErr;
        }
      }

      if (_isRateLimit(err)) {
        // Rate limit: exponential backoff 2s, 4s, 8s
        const delays = [2000, 4000, 8000];
        for (let i = 0; i < delays.length; i++) {
          console.warn(`[agent-instance] Rate limit on event ${event.id}, retry ${i + 1}/3 in ${delays[i]}ms…`);
          await _sleep(delays[i]);
          try {
            return await callClaude({ systemPrompt: fullSystemPrompt, userMessage, tools, model });
          } catch (retryErr) {
            if (!_isRateLimit(retryErr)) throw retryErr;
            // still rate-limited — continue loop
          }
        }
        // All retries exhausted
        console.error(`[agent-instance] Rate limit exhausted for event ${event.id}, logging as unprocessed_event`);
        throw new Error('Claude API rate limit');
      }

      // Any other error — propagate immediately
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _emit(ws, eventName, data) {
  if (typeof ws === 'function') {
    try {
      ws(eventName, data);
    } catch (err) {
      console.error(`[agent-instance] ws emit error (${eventName}): ${err.message}`);
    }
  }
}

function _isTimeout(err) {
  return err?.message?.includes('timeout') || err?.message?.includes('Claude API timeout');
}

function _isRateLimit(err) {
  return err?.message?.includes('rate limit') || err?.status === 429;
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Minimal L1 fallback response when Claude is unavailable or returns garbage.
 */
function _fallbackResponse(event, agentName, instanceId, reason) {
  return {
    event_id: event.id,
    agent: agentName,
    instance: instanceId,
    threat_level: 1,
    confidence: 0,
    assessment: `Unable to assess — Claude unavailable: ${reason}`,
    signals: [],
    actions: [{ type: 'log', reason }],
    memory_updates: {},
    stage_check: { current_depth: 0, stage_transition: null },
  };
}

export default AgentInstance;
