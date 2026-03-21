/**
 * Twilio Webhook Stub — POST /ingest/twilio/voice
 * Implements: FR-033, EC10, NFR-014
 *
 * TODO: Wire to eventBus.emit() when Twilio account is configured.
 */

import { Router } from 'express';
import { getPrimaryMember } from '../agents/household.js';
import { aliasFromValue, normalizePhone } from '../privacy/pii.js';

// Required Twilio fields for an inbound voice call
const REQUIRED_TWILIO_FIELDS = ['CallSid', 'From', 'To'];

// TwiML response for an empty acknowledgement
const TWIML_EMPTY_RESPONSE =
  '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create and return an Express Router for the Twilio voice webhook.
 * @returns {Router}
 */
export function createTwilioRouter({ householdStore = null, eventBus = null } = {}) {
  const router = Router();

  /**
   * POST /voice
   * Validates required Twilio fields, logs the payload, and returns empty TwiML.
   * EC10: returns 400 if required fields are missing.
   * NFR-014: TODO — validate Twilio request signature when account is configured.
   */
  router.post('/voice', (req, res) => {
    const payload = req.body;

    // Validate required Twilio fields (EC10)
    const missingFields = REQUIRED_TWILIO_FIELDS.filter((f) => !payload[f]);
    if (missingFields.length > 0) {
      console.warn('[twilio-webhook] Missing required fields:', missingFields.join(', '));
      return res.status(400).json({
        error: `Missing required Twilio fields: ${missingFields.join(', ')}`,
      });
    }

    const normalizedFrom = normalizePhone(payload.From);
    const normalizedTo = normalizePhone(payload.To);

    // Log the incoming payload
    console.log('[twilio-webhook] Inbound voice call received:', {
      CallSid: payload.CallSid,
      From: normalizedFrom ? aliasFromValue('phone', normalizedFrom) : null,
      To: normalizedTo ? aliasFromValue('phone', normalizedTo) : null,
      CallStatus: payload.CallStatus,
      Direction: payload.Direction,
    });

    if (!householdStore || !eventBus) {
      return res.status(501).json({ error: 'Twilio routing is not configured' });
    }

    const routeInboundCall = async () => {
      const household = await householdStore.findHouseholdByTwilioNumber(normalizedTo);
      if (!household) {
        console.warn('[twilio-webhook] Unknown household Twilio number:', {
          To: normalizedTo ? aliasFromValue('phone', normalizedTo) : null,
          CallSid: payload.CallSid,
        });
        return res.status(404).json({ error: 'No household is assigned to this Twilio number' });
      }

      const fullHousehold = await householdStore.getHousehold(household.household_id);
      const primaryMember = getPrimaryMember(fullHousehold.members ?? []);
      const fallbackMember = primaryMember ?? fullHousehold.members?.[0] ?? null;

      eventBus.emit({
        type: 'inbound_call',
        source: 'twilio',
        household_id: household.household_id,
        target_member: fallbackMember?.id ?? null,
        payload: {
          from: normalizedFrom,
          to: normalizedTo,
          twilio_call_sid: payload.CallSid,
          call_status: payload.CallStatus ?? null,
          direction: payload.Direction ?? null,
        },
        metadata: {
          household_id: household.household_id,
          twilio_call_sid: payload.CallSid,
        },
      });

      res.set('Content-Type', 'text/xml');
      return res.status(200).send(TWIML_EMPTY_RESPONSE);
    };

    return routeInboundCall().catch((error) => {
      console.error('[twilio-webhook] Failed to process inbound voice call:', error);
      return res.status(500).json({ error: 'Failed to process Twilio webhook' });
    });
  });

  return router;
}

export default createTwilioRouter;
