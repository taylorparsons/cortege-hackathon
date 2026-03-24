/**
 * EscalationHandler — Routes agent actions by threat level and processes action types.
 * Implements: FR-025, FR-026, FR-027, FR-028, EC9, NFR-004
 */

import { sanitizeString } from '../privacy/pii.js';

// ---------------------------------------------------------------------------
// Action validation schemas
// ---------------------------------------------------------------------------

/** Required fields per action type. */
const ACTION_REQUIRED_FIELDS = {
  log: [],
  monitor: ['target'],
  soft_block: ['target', 'reason'],
  hard_block: ['target', 'reason'],
  escalate: ['level', 'to', 'summary'],
  log_evidence: ['reason'],
  // WARDEN: CAPTCHA assist escalation
  captcha_assist: ['session_id', 'broker', 'member_id'],
};

// ---------------------------------------------------------------------------
// EscalationHandler
// ---------------------------------------------------------------------------

export class EscalationHandler {
  /**
   * @param {Array}    members  Array of household members from household.json
   * @param {Function} ws       ws(eventName, data) — WebSocket emitter
   */
  constructor(members, ws) {
    this.members = members;
    this.ws = ws;
  }

  // ---------------------------------------------------------------------------
  // Public: handle
  // ---------------------------------------------------------------------------

  /**
   * Processes all actions in agentResponse.actions, routing by threat_level.
   *
   * @param {object} agentResponse  Parsed AgentResponse from Claude
   * @param {object} agentInstance  AgentInstance that produced the response
   * @returns {{ handled: boolean, escalated: boolean, level: number }}
   */
  handle(agentResponse, agentInstance) {
    const level = agentResponse.threat_level ?? 0;
    let escalated = false;

    // Level-based routing
    if (level <= 1) {
      // L0-L1: log only
      console.log(
        `[escalation] L${level} — instance=${agentInstance.id} member=${agentInstance.memberId} assessment="${sanitizeString(agentResponse.assessment)}"`
      );
    } else if (level === 2) {
      // L2: flag for monitoring
      console.log(
        `[escalation] L2 MONITOR — instance=${agentInstance.id} member=${agentInstance.memberId} confidence=${agentResponse.confidence}`
      );
      this.ws('companion:status', {
        instanceId: agentInstance.id,
        memberId: agentInstance.memberId,
        memberName: agentInstance.memberName,
        status: 'monitoring',
        threat_level: level,
        confidence: agentResponse.confidence,
        assessment: agentResponse.assessment,
        timestamp: new Date().toISOString(),
      });
    } else if (level === 3) {
      // L3: notify primary companion
      console.log(
        `[escalation] L3 ESCALATE — instance=${agentInstance.id} notifying primary companion`
      );
      this._emitEscalation(level, agentResponse, agentInstance);
      escalated = true;
    } else if (level >= 4) {
      // L4: emergency relay + evidence capture
      console.log(
        `[escalation] L4 EMERGENCY — instance=${agentInstance.id} capturing evidence and relaying`
      );
      const evidence = this._captureEvidence(agentResponse, agentInstance);
      this._emitEscalation(level, agentResponse, agentInstance, evidence);
      escalated = true;
    }

    // Process individual actions
    const memoryStore = agentInstance.memoryStore ?? null;
    this._processActions(agentResponse.actions ?? [], agentResponse, agentInstance, memoryStore);

    return { handled: true, escalated, level };
  }

  // ---------------------------------------------------------------------------
  // Public: _getPrimaryCompanion
  // ---------------------------------------------------------------------------

  /**
   * Returns the first member with is_primary: true.
   * EC9: first one wins if multiple members have is_primary: true.
   *
   * @param {Array} members
   * @returns {object|null}
   */
  _getPrimaryCompanion(members) {
    return members.find((m) => m.is_primary === true) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Internal: _emitEscalation
  // ---------------------------------------------------------------------------

  /**
   * Emits escalation:fired via WebSocket.
   *
   * @param {number}      level
   * @param {object}      agentResponse
   * @param {object}      agentInstance
   * @param {object|null} evidence
   */
  _emitEscalation(level, agentResponse, agentInstance, evidence = null) {
    this.ws('escalation:fired', {
      level,
      instanceId: agentInstance.id,
      memberId: agentInstance.memberId,
      memberName: agentInstance.memberName,
      threat_level: agentResponse.threat_level,
      confidence: agentResponse.confidence,
      assessment: agentResponse.assessment,
      signals: agentResponse.signals,
      actions: agentResponse.actions,
      primaryCompanion: this._getPrimaryCompanion(this.members),
      evidence,
      timestamp: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // Internal: _captureEvidence
  // ---------------------------------------------------------------------------

  /**
   * Builds an evidence object for L4 escalations.
   *
   * @param {object} agentResponse
   * @param {object} agentInstance
   * @returns {object}
   */
  _captureEvidence(agentResponse, agentInstance) {
    return {
      capturedAt: new Date().toISOString(),
      instanceId: agentInstance.id,
      eventId: agentResponse.event_id,
      assessment: agentResponse.assessment,
      signals: agentResponse.signals,
      actions: agentResponse.actions,
      threat_level: agentResponse.threat_level,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal: _processActions
  // ---------------------------------------------------------------------------

  /**
   * Iterates actions array, validates required fields, and dispatches each action.
   *
   * @param {Array}       actions
   * @param {object}      agentResponse
   * @param {object}      agentInstance
   * @param {object|null} memoryStore   MemoryStore instance (optional)
   * @returns {Array}  Array of processed action result objects
   */
  _processActions(actions, agentResponse, agentInstance, memoryStore = null) {
    const results = [];

    if (!Array.isArray(actions)) {
      console.warn(`[escalation] actions is ${typeof actions}, expected array — skipping action processing`);
      return results;
    }

    for (const action of actions) {
      const type = action.type;

      // Validate action type is known
      if (!(type in ACTION_REQUIRED_FIELDS)) {
        console.warn(`[escalation] Unknown action type "${type}" — skipping`);
        results.push({ type, status: 'skipped', reason: 'unknown_type' });
        continue;
      }

      // Validate required fields
      const missing = ACTION_REQUIRED_FIELDS[type].filter((f) => !action[f]);
      if (missing.length > 0) {
        console.warn(
          `[escalation] Action "${type}" missing required fields: ${missing.join(', ')} — skipping`
        );
        results.push({ type, status: 'skipped', reason: `missing_fields: ${missing.join(', ')}` });
        continue;
      }

      // Dispatch
      switch (type) {
        case 'log': {
          console.log(
            `[escalation] ACTION log — instance=${agentInstance.id}${action.reason ? ` reason="${sanitizeString(action.reason)}"` : ''}`
          );
          results.push({ type, status: 'processed' });
          break;
        }

        case 'monitor': {
          console.log(
            `[escalation] ACTION monitor — target=${sanitizeString(action.target)} instance=${agentInstance.id}${action.reason ? ` reason="${sanitizeString(action.reason)}"` : ''}${action.duration ? ` duration=${action.duration}` : ''}`
          );
          results.push({ type, status: 'processed', target: action.target });
          break;
        }

        case 'soft_block': {
          console.log(
            `[escalation] ACTION soft_block — target=${sanitizeString(action.target)} reason="${sanitizeString(action.reason)}" instance=${agentInstance.id}`
          );
          results.push({ type, status: 'processed', target: action.target });
          break;
        }

        case 'hard_block': {
          console.log(
            `[escalation] ACTION hard_block — target=${sanitizeString(action.target)} reason="${sanitizeString(action.reason)}" instance=${agentInstance.id}`
          );
          if (memoryStore) {
            try {
              memoryStore._applyOperation('block_contact', {
                id: action.target,
                reason: action.reason,
              });
              memoryStore.save();
            } catch (err) {
              console.error(
                `[escalation] hard_block memory operation failed for target=${action.target}: ${err.message}`
              );
            }
          }
          results.push({ type, status: 'processed', target: action.target });
          break;
        }

        case 'escalate': {
          console.log(
            `[escalation] ACTION escalate — level=${action.level} to=${sanitizeString(action.to)} summary="${sanitizeString(action.summary)}" instance=${agentInstance.id}`
          );
          this._emitEscalation(action.level, agentResponse, agentInstance);
          results.push({ type, status: 'processed', level: action.level });
          break;
        }

        case 'log_evidence': {
          console.log(
            `[escalation] ACTION log_evidence — reason="${sanitizeString(action.reason)}"${action.target ? ` target=${sanitizeString(action.target)}` : ''} instance=${agentInstance.id}`
          );
          const evidence = this._captureEvidence(agentResponse, agentInstance);
          results.push({ type, status: 'processed', evidence });
          break;
        }

        case 'captcha_assist': {
          console.log(
            `[escalation] ACTION captcha_assist — session_id=${action.session_id} broker=${action.broker} member=${sanitizeString(action.member_id)}`
          );
          this.ws('warden:captcha_required', {
            sessionId: action.session_id,
            brokerId: action.broker,
            brokerName: action.broker_name ?? action.broker,
            memberId: action.member_id,
            screenshotBase64: action.screenshot_base64 ?? null,
            optOutUrl: action.opt_out_url ?? null,
            expiresAt: action.expires_at ?? null,
            summary: sanitizeString(action.summary ?? 'CAPTCHA assistance required'),
          });
          results.push({ type, status: 'processed', sessionId: action.session_id });
          break;
        }
      }
    }

    return results;
  }
}

export default EscalationHandler;
