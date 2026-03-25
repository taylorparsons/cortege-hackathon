/**
 * BrokerScanStore tests
 * Implements: FR-005 (20260323-warden-agent)
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BrokerScanStore, VALID_STATUSES } from '../warden/broker-scan-store.js';

let store;
let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'broker-scan-test-'));
  store = new BrokerScanStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('BrokerScanStore', () => {
  test('returns null for unknown household', () => {
    assert.equal(store.getScanStatus('hh_unknown'), null);
  });

  test('updateBrokerStatus creates household doc on first write', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'listed');
    const doc = store.getScanStatus('hh_001');
    assert.ok(doc);
    assert.equal(doc.household_id, 'hh_001');
    assert.equal(doc.members.mem_1.brokers.whitepages.status, 'listed');
  });

  test('sets first_found when status transitions to listed', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'listed');
    const doc = store.getScanStatus('hh_001');
    assert.ok(doc.members.mem_1.brokers.spokeo.first_found);
  });

  test('sets removal_requested when status transitions to removal_pending', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'listed');
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'removal_pending');
    const doc = store.getScanStatus('hh_001');
    assert.ok(doc.members.mem_1.brokers.spokeo.removal_requested);
  });

  test('sets removal_confirmed when status transitions to removal_confirmed', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'listed');
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'removal_pending');
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'removal_confirmed');
    const doc = store.getScanStatus('hh_001');
    assert.ok(doc.members.mem_1.brokers.spokeo.removal_confirmed);
  });

  test('rejects invalid status', () => {
    assert.throws(() => {
      store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'invalid_status');
    }, /Invalid broker status/);
  });

  test('all VALID_STATUSES are accepted', () => {
    let i = 0;
    for (const status of VALID_STATUSES) {
      store.updateBrokerStatus('hh_001', `mem_${i}`, 'whitepages', status);
      i++;
    }
    const doc = store.getScanStatus('hh_001');
    assert.ok(doc);
  });

  test('getMemberScans returns null for unknown member', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'listed');
    assert.equal(store.getMemberScans('hh_001', 'mem_unknown'), null);
  });

  test('getMemberScans returns brokers for known member', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'listed');
    const member = store.getMemberScans('hh_001', 'mem_1');
    assert.ok(member);
    assert.ok(member.brokers.whitepages);
  });

  test('aggregate recalculates correctly', () => {
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'removal_confirmed');
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'listed');
    store.updateBrokerStatus('hh_001', 'mem_1', 'mylife', 'removal_pending');
    const agg = store.getAggregateStats('hh_001');
    assert.equal(agg.total_brokers, 3);
    assert.equal(agg.removal_confirmed, 1);
    assert.equal(agg.listed, 1);
    assert.equal(agg.removal_pending, 1);
  });

  test('markFullScan sets last_full_scan timestamp', () => {
    store.markFullScan('hh_001');
    const doc = store.getScanStatus('hh_001');
    assert.ok(doc.last_full_scan);
  });

  test('upsertAssociate adds new associate', () => {
    store.upsertAssociate('hh_001', { name: 'Jane Doe', relationship: 'relative', brokerId: 'whitepages', foundViaMemberId: 'mem_1' });
    const associates = store.getAssociates('hh_001');
    assert.equal(associates.length, 1);
    assert.equal(associates[0].name, 'Jane Doe');
    assert.deepEqual(associates[0].found_on, ['whitepages']);
  });

  test('upsertAssociate deduplicates by name (case-insensitive)', () => {
    store.upsertAssociate('hh_001', { name: 'Jane Doe', relationship: 'relative', brokerId: 'whitepages', foundViaMemberId: 'mem_1' });
    store.upsertAssociate('hh_001', { name: 'jane doe', relationship: 'relative', brokerId: 'spokeo', foundViaMemberId: 'mem_1' });
    const associates = store.getAssociates('hh_001');
    assert.equal(associates.length, 1);
    assert.deepEqual(associates[0].found_on, ['whitepages', 'spokeo']);
  });

  test('dismissAssociate hides associate from getAssociates', () => {
    const assoc = store.upsertAssociate('hh_001', { name: 'Jane Doe', relationship: 'relative', brokerId: 'whitepages', foundViaMemberId: 'mem_1' });
    store.dismissAssociate('hh_001', assoc.id);
    const associates = store.getAssociates('hh_001');
    assert.equal(associates.length, 0);
  });

  test('dismissAssociate returns false for unknown id', () => {
    store.upsertAssociate('hh_001', { name: 'Jane Doe', relationship: 'relative', brokerId: 'whitepages', foundViaMemberId: 'mem_1' });
    const result = store.dismissAssociate('hh_001', 'assoc_nonexistent');
    assert.equal(result, false);
  });

  test('stores mode in scan history', () => {
    store.updateBrokerStatus('hh_test', 'mem_test', 'spokeo', 'not_found', { mode: 'headed' });
    
    const scans = store.getMemberScans('hh_test', 'mem_test');
    assert.equal(scans.brokers.spokeo.last_scan_mode, 'headed');
    assert.ok(scans.brokers.spokeo.scan_history);
    assert.equal(scans.brokers.spokeo.scan_history.length, 1);
    assert.equal(scans.brokers.spokeo.scan_history[0].mode, 'headed');
  });

  test('defaults to headless when mode not provided', () => {
    store.updateBrokerStatus('hh_test', 'mem_test', 'spokeo', 'not_found', {});
    
    const scans = store.getMemberScans('hh_test', 'mem_test');
    assert.equal(scans.brokers.spokeo.last_scan_mode, 'headless');
    assert.equal(scans.brokers.spokeo.scan_history[0].mode, 'headless');
  });
});
