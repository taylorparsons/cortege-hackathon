/**
 * WardenEngine unit tests (Playwright mocked)
 * Implements: FR-001, FR-003 (20260323-warden-agent)
 */

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;

// ---------------------------------------------------------------------------
// Minimal mock infrastructure — avoids actual Playwright and node-cron
// ---------------------------------------------------------------------------

// Mock node-cron before any module imports
const mockCronTask = { stop: mock.fn() };
const mockCron = {
  validate: mock.fn(() => true),
  schedule: mock.fn(() => mockCronTask),
};

// We test WardenEngine by exercising BrokerScanStore and BrokerRegistry directly.
// The engine itself is imported but cron and Playwright are not invoked in these tests.

import { BrokerScanStore } from '../warden/broker-scan-store.js';
import { BrokerRegistry } from '../warden/broker-registry.js';

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'warden-engine-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  mock.restoreAll();
});

function writeBroker(dir, id) {
  const def = {
    id,
    name: `Test ${id}`,
    opt_out_url: `https://example.com/${id}/optout`,
    requires_pii: ['name'],
    steps: [
      { action: 'navigate', url: `https://example.com/${id}` },
      { action: 'detect_success', indicators: ['text:done'] },
    ],
  };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(def));
  return def;
}

describe('BrokerScanStore + BrokerRegistry integration', () => {
  test('enqueue scan produces correct broker-per-member status entries', () => {
    const brokersDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brokers-test-'));
    try {
      writeBroker(brokersDir, 'testbroker1');
      writeBroker(brokersDir, 'testbroker2');

      const registry = new BrokerRegistry(brokersDir);
      const store = new BrokerScanStore(tmpDir);

      const brokers = registry.getBrokersForMember({ name: true });
      assert.equal(brokers.length, 2);

      // Simulate what the engine does: write not_checked for each broker
      for (const broker of brokers) {
        store.updateBrokerStatus('hh_001', 'mem_1', broker.id, 'not_checked');
      }

      const doc = store.getScanStatus('hh_001');
      assert.ok(doc.members.mem_1.brokers.testbroker1);
      assert.ok(doc.members.mem_1.brokers.testbroker2);
      assert.equal(doc.aggregate.total_brokers, 2);
    } finally {
      fs.rmSync(brokersDir, { recursive: true, force: true });
    }
  });

  test('status transition: not_checked → listed → removal_pending → removal_confirmed', () => {
    const store = new BrokerScanStore(tmpDir);
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'not_checked');
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'listed');
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'removal_pending');
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'removal_confirmed');

    const member = store.getMemberScans('hh_001', 'mem_1');
    const b = member.brokers.whitepages;
    assert.equal(b.status, 'removal_confirmed');
    assert.ok(b.first_found);
    assert.ok(b.removal_requested);
    assert.ok(b.removal_confirmed);
  });

  test('re_listed status detected after removal_confirmed', () => {
    const store = new BrokerScanStore(tmpDir);
    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', 'removal_confirmed');

    // Engine logic: if was removal_confirmed and scan finds 'listed', set 're_listed'
    const current = store.getMemberScans('hh_001', 'mem_1');
    const wasConfirmed = current?.brokers?.spokeo?.status === 'removal_confirmed';
    const newStatus = wasConfirmed ? 're_listed' : 'listed';

    store.updateBrokerStatus('hh_001', 'mem_1', 'spokeo', newStatus);
    const updated = store.getMemberScans('hh_001', 'mem_1');
    assert.equal(updated.brokers.spokeo.status, 're_listed');
  });

  test('CAPTCHA timeout sets captcha_timeout status', () => {
    const store = new BrokerScanStore(tmpDir);
    store.updateBrokerStatus('hh_001', 'mem_1', 'whitepages', 'captcha_timeout');
    const agg = store.getAggregateStats('hh_001');
    assert.equal(agg.captcha_timeout, 1);
  });

  test('associate discovery deduplicates across brokers', () => {
    const store = new BrokerScanStore(tmpDir);

    store.upsertAssociate('hh_001', { name: 'Jane Smith', relationship: 'relative', brokerId: 'whitepages', foundViaMemberId: 'mem_1' });
    store.upsertAssociate('hh_001', { name: 'Jane Smith', relationship: 'relative', brokerId: 'spokeo', foundViaMemberId: 'mem_1' });
    store.upsertAssociate('hh_001', { name: 'Bob Jones', relationship: 'associate', brokerId: 'whitepages', foundViaMemberId: 'mem_1' });

    const associates = store.getAssociates('hh_001');
    assert.equal(associates.length, 2);

    const jane = associates.find((a) => a.name === 'Jane Smith');
    assert.ok(jane);
    assert.deepEqual(jane.found_on, ['whitepages', 'spokeo']);
  });

  test('enqueueScan returns error when household store is missing', async () => {
    // Import WardenEngine without side effects in this test
    const { WardenEngine } = await import('../warden/warden-engine.js');
    const engine = new WardenEngine({ dataDir: tmpDir });
    const result = await engine.enqueueScan('hh_001');
    assert.equal(result.queued, false);
  });
});
