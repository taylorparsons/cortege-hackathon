/**
 * Twilio Webhook Stub — POST /ingest/twilio/voice
 * Implements: FR-033, EC10, NFR-014
 *
 * TODO: Wire to eventBus.emit() when Twilio account is configured.
 */

import { Router } from 'express';
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
export function createTwilioRouter() {
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

    // Log the incoming payload
    console.log('[twilio-webhook] Inbound voice call received:', {
      CallSid: payload.CallSid,
      From: payload.From ? aliasFromValue('phone', normalizePhone(payload.From)) : null,
      To: payload.To ? aliasFromValue('phone', normalizePhone(payload.To)) : null,
      CallStatus: payload.CallStatus,
      Direction: payload.Direction,
    });

    // TODO: Wire to eventBus.emit() when Twilio account is configured.
    // Example:
    //   eventBus.emit({
    //     type: 'inbound_call',
    //     source: 'twilio',
    //     payload: {
    //       caller_id: payload.From,
    //       caller_name: null,
    //       twilio_call_sid: payload.CallSid,
    //     },
    //     metadata: { twilio_call_sid: payload.CallSid },
    //   });

    // Respond with empty TwiML to acknowledge the webhook
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(TWIML_EMPTY_RESPONSE);
  });

  return router;
}

export default createTwilioRouter;
