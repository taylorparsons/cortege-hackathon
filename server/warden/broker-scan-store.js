/**
 * BrokerScanStore — File-based storage for WARDEN broker scan results.
 * Implements: FR-005
 *
 * Storage: data/broker-scans/{householdId}.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const VALID_STATUSES = new Set([
  'not_checked',
  'listed',
  'removal_pending',
  'removal_confirmed',
  're_listed',
  'not_found',
  'captcha_timeout',
  'error',
]);

export class BrokerScanStore {
  constructor(dataDir = 'data/broker-scans') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // ---------------------------------------------------------------------------
  // File helpers
  // ---------------------------------------------------------------------------

  _filePath(householdId) {
    return path.join(this.dataDir, `${householdId}.json`);
  }

  _read(householdId) {
    const fp = this._filePath(householdId);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  }

  _write(doc) {
    fs.writeFileSync(this._filePath(doc.household_id), JSON.stringify(doc, null, 2));
  }

  // ---------------------------------------------------------------------------
  // Initialise a household scan doc (idempotent)
  // ---------------------------------------------------------------------------

  _ensureDoc(householdId) {
    const existing = this._read(householdId);
    if (existing) return existing;
    const doc = {
      household_id: householdId,
      last_full_scan: null,
      next_scheduled_scan: null,
      members: {},
      aggregate: {
        total_brokers: 0,
        listed: 0,
        removal_pending: 0,
        removal_confirmed: 0,
        re_listed: 0,
        not_found: 0,
        captcha_timeout: 0,
        error: 0,
        not_checked: 0,
      },
      discovered_associates: [],
    };
    this._write(doc);
    return doc;
  }

  // ---------------------------------------------------------------------------
  // Aggregate recalculation
  // ---------------------------------------------------------------------------

  _recalcAggregate(doc) {
    const agg = {
      total_brokers: 0,
      listed: 0,
      removal_pending: 0,
      removal_confirmed: 0,
      re_listed: 0,
      not_found: 0,
      captcha_timeout: 0,
      error: 0,
      not_checked: 0,
    };
    for (const member of Object.values(doc.members)) {
      for (const broker of Object.values(member.brokers ?? {})) {
        agg.total_brokers++;
        const s = broker.status ?? 'not_checked';
        if (s in agg) agg[s]++;
      }
    }
    doc.aggregate = agg;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Get full scan status document for a household. Returns null if none.
   */
  getScanStatus(householdId) {
    return this._read(householdId);
  }

  /**
   * Get per-broker status for a single member.
   */
  getMemberScans(householdId, memberId) {
    const doc = this._read(householdId);
    if (!doc) return null;
    return doc.members[memberId] ?? null;
  }

  /**
   * Update the broker status for one member+broker.
   *
   * @param {string} householdId
   * @param {string} memberId
   * @param {string} brokerId
   * @param {string} status  One of VALID_STATUSES
   * @param {object} extra   Optional extra fields (removal_requested, error, attempts, etc.)
   * @returns {object} Updated broker record
   */
  updateBrokerStatus(householdId, memberId, brokerId, status, extra = {}) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`Invalid broker status: ${status}`);
    }

    const doc = this._ensureDoc(householdId);

    if (!doc.members[memberId]) {
      doc.members[memberId] = { brokers: {} };
    }
    const member = doc.members[memberId];

    const now = new Date().toISOString();
    const existing = member.brokers[brokerId] ?? {
      status: 'not_checked',
      first_found: null,
      removal_requested: null,
      removal_confirmed: null,
      last_checked: null,
      last_scan_mode: null,
      scan_history: [],
      attempts: 0,
      error: null,
    };

    const updated = {
      ...existing,
      ...extra,
      status,
      last_checked: now,
      last_scan_mode: extra.mode || 'headless',  // Track mode
    };

    if (status === 'listed' && !updated.first_found) {
      updated.first_found = now;
    }
    if (status === 'removal_pending' && !updated.removal_requested) {
      updated.removal_requested = now;
    }
    if (status === 'removal_confirmed' && !updated.removal_confirmed) {
      updated.removal_confirmed = now;
    }

    // Add to scan history
    if (!updated.scan_history) {
      updated.scan_history = [];
    }
    updated.scan_history.push({
      timestamp: now,
      status,
      mode: extra.mode || 'headless',
    });

    member.brokers[brokerId] = updated;
    this._recalcAggregate(doc);
    this._write(doc);

    return updated;
  }

  /**
   * Mark last_full_scan timestamp.
   */
  markFullScan(householdId, nextScheduled = null) {
    const doc = this._ensureDoc(householdId);
    doc.last_full_scan = new Date().toISOString();
    if (nextScheduled) doc.next_scheduled_scan = nextScheduled;
    this._write(doc);
  }

  /**
   * Add or update a discovered associate.
   * Deduplicates by name (case-insensitive). Returns the associate record.
   */
  upsertAssociate(householdId, { name, relationship, brokerId, foundViaMemberId }) {
    const doc = this._ensureDoc(householdId);

    const nameLower = name.toLowerCase();
    let assoc = doc.discovered_associates.find(
      (a) => a.name.toLowerCase() === nameLower
    );

    if (assoc) {
      if (!assoc.found_on.includes(brokerId)) {
        assoc.found_on.push(brokerId);
      }
    } else {
      assoc = {
        id: `assoc_${randomUUID().slice(0, 8)}`,
        name,
        relationship: relationship ?? 'unknown',
        found_on: [brokerId],
        found_via_member: foundViaMemberId,
        first_seen: new Date().toISOString(),
        status: 'pending_review',
        dismissed: false,
      };
      doc.discovered_associates.push(assoc);
    }

    this._write(doc);
    return assoc;
  }

  /**
   * Dismiss a discovered associate by ID.
   */
  dismissAssociate(householdId, associateId) {
    const doc = this._read(householdId);
    if (!doc) return false;
    const assoc = doc.discovered_associates.find((a) => a.id === associateId);
    if (!assoc) return false;
    assoc.dismissed = true;
    this._write(doc);
    return true;
  }

  /**
   * List undismissed discovered associates for a household.
   */
  getAssociates(householdId) {
    const doc = this._read(householdId);
    if (!doc) return [];
    return doc.discovered_associates.filter((a) => !a.dismissed);
  }

  /**
   * Get aggregate stats for a household.
   */
  getAggregateStats(householdId) {
    const doc = this._read(householdId);
    if (!doc) return null;
    return doc.aggregate;
  }
}

export default BrokerScanStore;
