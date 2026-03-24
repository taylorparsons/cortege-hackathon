/**
 * CaptchaManager — Tracks active CAPTCHA escalation sessions.
 * Implements: FR-004 (20260323-warden-agent)
 *
 * When a BrowserSession pauses for CAPTCHA, a session record is created here.
 * A timeout timer auto-closes the session if the household member doesn't respond.
 */

import { randomUUID } from 'node:crypto';
import { sanitizeString } from '../privacy/pii.js';

const DEFAULT_TIMEOUT_MS = parseInt(process.env.WARDEN_CAPTCHA_TIMEOUT_MINUTES ?? '10', 10) * 60 * 1000;

export class CaptchaManager {
  constructor({ timeoutMs = DEFAULT_TIMEOUT_MS, ws } = {}) {
    this.timeoutMs = timeoutMs;
    this.ws = ws ?? (() => {});
    this._sessions = new Map(); // sessionId → session record
    this._screenshots = new Map(); // sessionId → base64 string
  }

  // ---------------------------------------------------------------------------
  // Session lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Create a CAPTCHA session for a paused browser session.
   *
   * @param {object} opts
   * @param {object} opts.browserSession  BrowserSession instance (paused)
   * @param {string} opts.brokerId
   * @param {string} opts.brokerName
   * @param {string} opts.memberId
   * @param {string} opts.householdId
   * @param {string} opts.screenshot       base64 PNG
   * @param {string} opts.optOutUrl
   * @returns {object} session record
   */
  createSession({ browserSession, brokerId, brokerName, memberId, householdId, screenshot, optOutUrl }) {
    const id = `captcha_${randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.timeoutMs).toISOString();

    if (screenshot) {
      this._screenshots.set(id, screenshot);
    }

    const timer = setTimeout(() => {
      this._handleTimeout(id);
    }, this.timeoutMs);

    const session = {
      id,
      brokerId,
      brokerName,
      memberId,
      householdId,
      optOutUrl,
      createdAt,
      expiresAt,
      screenshot_at: createdAt,
      status: 'pending',
      _browserSession: browserSession,
      _timer: timer,
    };

    this._sessions.set(id, session);
    console.log(`[captcha-manager] Created session=${id} broker=${brokerId} member=${sanitizeString(memberId)} expires=${expiresAt}`);

    return this._publicRecord(session);
  }

  /**
   * Resolve a CAPTCHA session — resume the browser.
   * @returns {boolean} true if found and resolved
   */
  resolveSession(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session || session.status !== 'pending') return false;

    clearTimeout(session._timer);
    session.status = 'resolved';

    if (session._browserSession) {
      session._browserSession.resume();
    }

    this._sessions.delete(sessionId);
    this._screenshots.delete(sessionId);
    console.log(`[captcha-manager] Resolved session=${sessionId}`);
    return true;
  }

  /**
   * Get a public-safe session record.
   */
  getActiveSession(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) return null;
    return this._publicRecord(session);
  }

  /**
   * List undismissed sessions for a household.
   */
  listActiveSessions(householdId) {
    const results = [];
    for (const session of this._sessions.values()) {
      if (!householdId || session.householdId === householdId) {
        results.push(this._publicRecord(session));
      }
    }
    return results;
  }

  /**
   * Get the latest screenshot for a session.
   */
  getScreenshot(sessionId) {
    return this._screenshots.get(sessionId) ?? null;
  }

  /**
   * Update screenshot for a session (called periodically by browser session).
   */
  updateScreenshot(sessionId, screenshot) {
    if (!this._sessions.has(sessionId)) return;
    this._screenshots.set(sessionId, screenshot);
    const session = this._sessions.get(sessionId);
    if (session) session.screenshot_at = new Date().toISOString();
  }

  // ---------------------------------------------------------------------------
  // Timeout
  // ---------------------------------------------------------------------------

  _handleTimeout(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) return;

    session.status = 'expired';
    if (session._browserSession) {
      // Signal the browser session to close (resolves waitForResume with false)
      session._browserSession.close().catch(() => {});
    }

    this._sessions.delete(sessionId);
    this._screenshots.delete(sessionId);

    console.log(`[captcha-manager] Session=${sessionId} expired`);
    this.ws('warden:captcha_expired', {
      sessionId,
      brokerId: session.brokerId,
      memberId: session.memberId,
      householdId: session.householdId,
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  _publicRecord(session) {
    return {
      id: session.id,
      brokerId: session.brokerId,
      brokerName: session.brokerName,
      memberId: session.memberId,
      householdId: session.householdId,
      optOutUrl: session.optOutUrl,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      screenshot_at: session.screenshot_at,
      status: session.status,
    };
  }
}

export default CaptchaManager;
