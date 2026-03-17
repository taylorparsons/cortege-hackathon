/**
 * Manual Injection API — Express router for direct event submission.
 * Implements: FR-032, EC3
 */

import { Router } from 'express';
import { ALL_EVENT_TYPES, generateEventId } from '../orchestrator/event-bus.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create and return an Express Router for manual event injection.
 * @param {import('../orchestrator/event-bus.js').EventBus} eventBus
 * @returns {Router}
 */
export function createManualRouter(eventBus) {
  const router = Router();

  /**
   * POST /
   * Accepts a CoreEvent body, validates, normalizes, and emits it.
   */
  router.post('/', (req, res) => {
    const body = req.body;

    // Validate: type is required and must be a valid event type (FR-009)
    if (!body.type) {
      return res.status(400).json({ error: 'type is required' });
    }

    if (!ALL_EVENT_TYPES.has(body.type)) {
      return res.status(400).json({
        error: `"${body.type}" is not a valid event type. Valid types: ${[...ALL_EVENT_TYPES].join(', ')}`,
      });
    }

    // Warn if target_member is missing but still emit (EC3)
    if (!body.target_member) {
      console.warn('[manual] Event submitted without target_member — emitting to all subscribed agents');
    }

    // Normalize: assign id and timestamp if missing
    const coreEvent = {
      ...body,
      id: body.id || generateEventId(),
      source: body.source || 'manual',
      timestamp: body.timestamp || new Date().toISOString(),
      target_member: body.target_member ?? null,
      payload: body.payload ?? {},
      metadata: body.metadata ?? {},
    };

    try {
      eventBus.emit(coreEvent);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(200).json({ success: true, event: coreEvent });
  });

  return router;
}

export default createManualRouter;
