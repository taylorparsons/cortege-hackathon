/**
 * WardenEngine — WARDEN data broker removal orchestrator.
 * Implements: FR-001, FR-003, FR-004, FR-005, FR-008, FR-010 (20260323-warden-agent)
 *
 * Architecture:
 *   - Own node-cron schedule (real-world time, not simulated)
 *   - Scan queue: { householdId, memberId, brokerId, priority }
 *   - Session pool: max WARDEN_MAX_CONCURRENT_SESSIONS (default 2)
 *   - On CAPTCHA: CaptchaManager creates session → EscalationHandler fires L3 → WebSocket notifies UI
 */

import cron from 'node-cron';
import { randomUUID } from 'node:crypto';
import { BrokerScanStore } from './broker-scan-store.js';
import { BrokerRegistry } from './broker-registry.js';
import { BrowserSession } from './browser-session.js';
import { ScanExecutor } from './scan-executor.js';
import { AssociateDiscovery } from './associate-discovery.js';
import { sanitizeString, decryptMemberFromStorage } from '../privacy/pii.js';
import { CaptchaManager } from './captcha-manager.js';
import { ModeResolver } from './mode-resolver.js';

const DEFAULT_CRON = process.env.WARDEN_SCAN_CRON ?? '0 12 * * *'; // noon — user is available to solve CAPTCHAs
const MAX_SESSIONS = parseInt(process.env.WARDEN_MAX_CONCURRENT_SESSIONS ?? '2', 10);
const WARDEN_ENABLED = process.env.WARDEN_ENABLED !== 'false';
const HEADED_MODE = process.env.WARDEN_HEADED_MODE === 'true';

export class WardenEngine {
  /**
   * @param {object} opts
   * @param {object} opts.eventBus         EventBus instance
   * @param {object} opts.escalationHandler EscalationHandler instance
   * @param {Function} opts.ws             ws(eventName, data) WebSocket emitter
   * @param {object} opts.householdStore   HouseholdStore instance
   * @param {object} opts.locationStore    LocationStore instance
   * @param {string} opts.dataDir          Base dir for broker-scans storage
   */
  constructor({ eventBus, escalationHandler, ws, householdStore, locationStore, dataDir = 'data/broker-scans' } = {}) {
    this.eventBus = eventBus;
    this.escalationHandler = escalationHandler;
    this.ws = ws ?? (() => {});
    this.householdStore = householdStore;
    this.locationStore = locationStore;

    this.brokerScanStore = new BrokerScanStore(dataDir);
    this.brokerRegistry = new BrokerRegistry();
    this.captchaManager = new CaptchaManager({ ws: this.ws });

    this._queue = [];          // Array of ScanJob
    this._activeSessions = 0;
    this._activeHeadedSessions = 0;  // Track headed sessions separately
    this._cronTask = null;
    this._running = false;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start() {
    if (!WARDEN_ENABLED) {
      console.log('[warden] WARDEN_ENABLED=false — skipping start');
      return;
    }

    this.brokerRegistry.load();
    this._running = true;

    if (cron.validate(DEFAULT_CRON)) {
      this._cronTask = cron.schedule(DEFAULT_CRON, () => {
        console.log('[warden] Cron triggered — scanning all active households');
        this._scanAllHouseholds().catch((err) =>
          console.error('[warden] Cron scan error:', sanitizeString(err.message))
        );
      });
      console.log(`[warden] Scheduled daily scan: ${DEFAULT_CRON}`);
    } else {
      console.warn(`[warden] Invalid cron expression: ${DEFAULT_CRON}`);
    }

    console.log('[warden] WardenEngine started');
  }

  stop() {
    this._running = false;
    if (this._cronTask) {
      this._cronTask.stop();
      this._cronTask = null;
    }
    console.log('[warden] WardenEngine stopped');
  }

  // ---------------------------------------------------------------------------
  // Scan triggering
  // ---------------------------------------------------------------------------

  /**
   * Enqueue a scan for a household. Optionally narrow by memberId / brokerId.
   *
   * @param {string} householdId
   * @param {object} options
   * @param {string} options.memberId - Optional member ID to scan
   * @param {string} options.brokerId - Optional broker ID to scan
   * @param {boolean} options.headed - Optional override for headed mode
   * @returns {{ queued: true, jobs: number }}
   */
  async enqueueScan(householdId, { memberId, brokerId, headed } = {}) {
    if (!this.householdStore) {
      return { queued: false, error: 'No household store' };
    }

    const household = await this.householdStore.getHousehold(householdId).catch(() => null);
    if (!household) return { queued: false, error: 'Household not found' };

    const members = memberId
      ? (household.members ?? []).filter((m) => m.id === memberId)
      : (household.members ?? []);

    let jobCount = 0;
    for (const member of members) {
      const piiAvailable = this._checkPiiAvailability(member, household);
      const brokers = brokerId
        ? [this.brokerRegistry.getBroker(brokerId)].filter(Boolean)
        : this.brokerRegistry.getBrokersForMember(piiAvailable);

      for (const broker of brokers) {
        this._queue.push({
          id: `job_${randomUUID().slice(0, 8)}`,
          householdId,
          memberId: member.id,
          memberData: member,
          householdData: household,
          brokerId: broker.id,
          brokerDef: broker,
          priority: 1,
          enqueuedAt: new Date().toISOString(),
          headedOverride: headed,  // Store override
        });
        jobCount++;
      }
    }

    console.log(`[warden] Enqueued ${jobCount} scan jobs for household=${sanitizeString(householdId)}`);
    this._drainQueue();

    return { queued: true, jobs: jobCount };
  }

  // ---------------------------------------------------------------------------
  // CAPTCHA resolution
  // ---------------------------------------------------------------------------

  /**
   * Called when a household member resolves a CAPTCHA.
   * @param {string} sessionId
   * @returns {boolean} true if session found and resumed
   */
  async resolveCaptcha(sessionId) {
    if (!this.captchaManager) return false;
    return this.captchaManager.resolveSession(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Internal — queue drain
  // ---------------------------------------------------------------------------

  _drainQueue() {
    if (!this._running) return;

    while (this._activeSessions < MAX_SESSIONS && this._queue.length > 0) {
      const job = this._queue.shift();
      this._activeSessions++;
      this._executeJob(job)
        .catch((err) => console.error(`[warden] Job ${job.id} uncaught error: ${sanitizeString(err.message)}`))
        .finally(() => {
          this._activeSessions--;
          this._drainQueue();
        });
    }
  }

  // ---------------------------------------------------------------------------
  // Internal — single job execution
  // ---------------------------------------------------------------------------

  async _executeJob(job) {
    const { householdId, memberId, brokerId, brokerDef, memberData, householdData } = job;

    // Resolve browser mode
    const mode = ModeResolver.resolve(
      job,
      brokerDef,
      HEADED_MODE
    );
    const headless = mode === 'headless';

    // Store resolved mode in job for audit
    job.resolvedMode = mode;

    console.log(`[warden] Starting scan job=${job.id} broker=${brokerId} member=${sanitizeString(memberId)} mode=${mode}`);

    this._emitEvent('broker_scan_started', { householdId, memberId, brokerId, mode });
    this.ws('warden:scan_started', { householdId, memberId, brokerId, mode });

    // Decrypt member PII — held only in this local scope
    let memberPii;
    try {
      memberPii = await this._buildMemberPii(memberData, householdData);
    } catch (err) {
      console.error(`[warden] PII decrypt failed for member=${sanitizeString(memberId)}: ${sanitizeString(err.message)}`);
      this.brokerScanStore.updateBrokerStatus(householdId, memberId, brokerId, 'error', { error: 'pii_decrypt_failed' });
      return;
    }

    // Launch browser session
    const session = new BrowserSession();
    try {
      await session.launch({ headless });
      
      // Track headed sessions
      if (!headless) {
        this._activeHeadedSessions++;
      }
    } catch (err) {
      console.error(`[warden] Browser launch failed (mode=${mode}): ${sanitizeString(err.message)}`);
      this.brokerScanStore.updateBrokerStatus(
        householdId,
        memberId,
        brokerId,
        'error',
        { error: 'browser_launch_failed', mode }
      );
      this.ws('warden:scan_error', { householdId, memberId, brokerId, error: 'browser_launch_failed', mode });
      return;
    }

    try {
      let result = await ScanExecutor.execute(session, brokerDef, memberPii);

      // Handle CAPTCHA
      if (result.status === 'captcha_detected') {
        result = await this._handleCaptcha(session, job, result);
      }

      // Process associates
      if (result.associates?.length > 0) {
        const existingNames = (householdData.members ?? [])
          .map((m) => m.name ?? '')
          .filter(Boolean);
        const newAssociates = AssociateDiscovery.filterExistingMembers(result.associates, existingNames);

        for (const assoc of newAssociates) {
          const stored = this.brokerScanStore.upsertAssociate(householdId, {
            name: assoc.name,
            relationship: assoc.relationship,
            brokerId,
            foundViaMemberId: memberId,
          });
          this._emitEvent('associate_discovered', { householdId, memberId, associate: stored });
          this.ws('warden:associate_discovered', { householdId, memberId, associate: stored });
        }
      }

      // Persist broker status
      const finalStatus = result.status === 'captcha_detected' ? 'captcha_timeout' : result.status;
      const current = this.brokerScanStore.getMemberScans(householdId, memberId);
      const existingBroker = current?.brokers?.[brokerId];
      const wasListed = existingBroker?.status === 'removal_confirmed';
      const isReListed = wasListed && finalStatus === 'listed';

      this.brokerScanStore.updateBrokerStatus(
        householdId,
        memberId,
        brokerId,
        isReListed ? 're_listed' : finalStatus,
        { ...result.error ? { error: result.error } : {}, mode }
      );

      this._emitEvent('broker_status_change', { householdId, memberId, brokerId, status: finalStatus, mode });
      this.ws('warden:status_update', { householdId, memberId, brokerId, status: finalStatus, previousStatus: existingBroker?.status, mode });

      this._emitEvent('broker_scan_completed', { householdId, memberId, brokerId, status: finalStatus, mode });
      console.log(`[warden] Job ${job.id} completed: broker=${brokerId} status=${finalStatus}`);

    } finally {
      // Track headed sessions
      if (!headless) {
        this._activeHeadedSessions--;
      }
      
      // Always close the browser — PII in memberPii is GC'd when this scope exits
      await session.close();
      memberPii = null; // explicit release
    }
  }

  // ---------------------------------------------------------------------------
  // Internal — CAPTCHA handling
  // ---------------------------------------------------------------------------

  async _handleCaptcha(session, job, result) {
    const { householdId, memberId, brokerId, brokerDef } = job;
    const screenshot = session._screenshot;

    console.log(`[warden] CAPTCHA detected for broker=${brokerId} member=${sanitizeString(memberId)}`);

    // Emit L3 escalation if escalation handler is wired
    if (this.escalationHandler && this.captchaManager) {
      const captchaSession = this.captchaManager.createSession({
        browserSession: session,
        brokerId,
        brokerName: brokerDef.name,
        memberId,
        householdId,
        screenshot,
        optOutUrl: brokerDef.opt_out_url,
      });

      // Fire L3 via escalation handler using a synthetic agent-like context
      const captchaAction = {
        type: 'captcha_assist',
        session_id: captchaSession.id,
        broker: brokerId,
        broker_name: brokerDef.name,
        member_id: memberId,
        summary: `CAPTCHA detected on ${brokerDef.name} — member assistance required`,
        opt_out_url: brokerDef.opt_out_url,
        screenshot_base64: screenshot,
        expires_at: captchaSession.expiresAt,
      };

      // Emit directly on WebSocket (escalation handler adds to event bus)
      this.ws('warden:captcha_required', {
        sessionId: captchaSession.id,
        brokerId,
        brokerName: brokerDef.name,
        memberId,
        householdId,
        screenshotBase64: screenshot,
        optOutUrl: brokerDef.opt_out_url,
        expiresAt: captchaSession.expiresAt,
      });

      this._emitEvent('captcha_required', { householdId, memberId, brokerId, sessionId: captchaSession.id });

      // Wait for resolution or timeout
      const resolved = await session.waitForResume();

      if (resolved) {
        console.log(`[warden] CAPTCHA resolved for session=${captchaSession.id}, resuming scan`);
        this._emitEvent('captcha_resolved', { householdId, memberId, brokerId, sessionId: captchaSession.id });
        this.ws('warden:captcha_resolved', { sessionId: captchaSession.id, brokerId, memberId });

        // Retry the full scan after CAPTCHA is resolved
        return await ScanExecutor.execute(session, job.brokerDef, await this._buildMemberPii(job.memberData, job.householdData));
      }
    } else {
      // No captcha manager — just log and mark timeout
      console.warn(`[warden] CAPTCHA detected but no CaptchaManager installed — marking captcha_timeout`);
    }

    return { status: 'captcha_timeout', associates: result.associates ?? [] };
  }

  // ---------------------------------------------------------------------------
  // Internal — household scanning
  // ---------------------------------------------------------------------------

  async _scanAllHouseholds() {
    if (!this.householdStore) return;
    const households = await this.householdStore.listHouseholds().catch(() => []);
    for (const hh of households) {
      await this.enqueueScan(hh.household_id);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal — PII helpers
  // ---------------------------------------------------------------------------

  /**
   * Build a decrypted PII object for a member + household.
   * PII is decrypted fresh here and should be GC'd after use.
   */
  async _buildMemberPii(memberData, householdData) {
    const decrypted = decryptMemberFromStorage(memberData);
    const name = decrypted.name ?? '';
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '';

    let city = '';
    let state = '';
    let address = '';

    // Try to get location from household
    const locationId = householdData.location_id;
    if (locationId && this.locationStore) {
      try {
        const loc = await this.locationStore.getLocation(locationId);
        city = loc.address?.city ?? '';
        state = loc.address?.region ?? '';
        address = [loc.address?.line1, loc.address?.city, loc.address?.region, loc.address?.postal_code]
          .filter(Boolean).join(', ');
      } catch {
        // location not available — continue with partial PII
      }
    }

    return {
      name,
      first_name: firstName,
      last_name: lastName,
      phone: decrypted.phone ?? '',
      city,
      state,
      city_state: [city, state].filter(Boolean).join(', '),
      address,
    };
  }

  /**
   * Determine which PII fields are available for a member.
   */
  _checkPiiAvailability(memberData, householdData) {
    const decrypted = decryptMemberFromStorage(memberData);
    return {
      name: Boolean(decrypted.name),
      phone: Boolean(decrypted.phone),
      address: Boolean(householdData.location_id || householdData.address),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal — event bus
  // ---------------------------------------------------------------------------

  _emitEvent(type, payload) {
    if (!this.eventBus) return;
    try {
      this.eventBus.emit({
        type,
        source: 'warden',
        target_member: payload.memberId ?? null,
        payload,
      });
    } catch {
      // non-fatal — event bus may reject unknown types before our update lands
    }
  }
}

export default WardenEngine;
