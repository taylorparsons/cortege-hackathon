/**
 * BrokerRegistry tests
 * Implements: FR-002 (20260323-warden-agent)
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrokerRegistry } from '../warden/broker-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_BROKERS_DIR = path.join(__dirname, '../warden/brokers');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'broker-registry-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeBroker(dir, id, overrides = {}) {
  const def = {
    id,
    name: `Test ${id}`,
    opt_out_url: `https://example.com/${id}/optout`,
    requires_pii: ['name', 'address'],
    steps: [
      { action: 'navigate', url: `https://example.com/${id}/optout` },
      { action: 'detect_success', indicators: ['text:done'] },
    ],
    ...overrides,
  };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(def));
  return def;
}

describe('BrokerRegistry', () => {
  test('loads real broker definitions without errors', () => {
    const registry = new BrokerRegistry(REAL_BROKERS_DIR);
    registry.load();
    assert.ok(registry.size >= 10, `Expected at least 10 brokers, got ${registry.size}`);
  });

  test('getBroker returns definition by id', () => {
    const registry = new BrokerRegistry(REAL_BROKERS_DIR);
    const wp = registry.getBroker('whitepages');
    assert.ok(wp);
    assert.equal(wp.id, 'whitepages');
    assert.equal(wp.name, 'WhitePages');
  });

  test('getBroker returns null for unknown id', () => {
    const registry = new BrokerRegistry(REAL_BROKERS_DIR);
    assert.equal(registry.getBroker('nonexistent_broker'), null);
  });

  test('listBrokers returns all brokers', () => {
    const registry = new BrokerRegistry(REAL_BROKERS_DIR);
    const brokers = registry.listBrokers();
    assert.ok(Array.isArray(brokers));
    assert.ok(brokers.length >= 10);
  });

  test('getBrokersForMember filters by available PII', () => {
    writeBroker(tmpDir, 'requires_phone', { requires_pii: ['name', 'phone'] });
    writeBroker(tmpDir, 'requires_address', { requires_pii: ['name', 'address'] });
    writeBroker(tmpDir, 'requires_both', { requires_pii: ['name', 'phone', 'address'] });

    const registry = new BrokerRegistry(tmpDir);

    // Has name + phone but not address
    const phoneOnly = registry.getBrokersForMember({ name: true, phone: true, address: false });
    const phoneIds = phoneOnly.map((b) => b.id);
    assert.ok(phoneIds.includes('requires_phone'));
    assert.ok(!phoneIds.includes('requires_address'));
    assert.ok(!phoneIds.includes('requires_both'));

    // Has all three
    const all = registry.getBrokersForMember({ name: true, phone: true, address: true });
    const allIds = all.map((b) => b.id);
    assert.ok(allIds.includes('requires_phone'));
    assert.ok(allIds.includes('requires_address'));
    assert.ok(allIds.includes('requires_both'));
  });

  test('skips broker with missing required field', () => {
    // Missing 'name'
    fs.writeFileSync(path.join(tmpDir, 'bad.json'), JSON.stringify({
      id: 'bad',
      opt_out_url: 'https://example.com',
      requires_pii: ['name'],
      steps: [],
    }));
    const registry = new BrokerRegistry(tmpDir);
    registry.load();
    assert.equal(registry.getBroker('bad'), null);
  });

  test('skips broker with unknown step action', () => {
    writeBroker(tmpDir, 'bad_step', {
      steps: [{ action: 'teleport', destination: 'moon' }],
    });
    const registry = new BrokerRegistry(tmpDir);
    registry.load();
    assert.equal(registry.getBroker('bad_step'), null);
  });

  test('skips malformed JSON file', () => {
    fs.writeFileSync(path.join(tmpDir, 'broken.json'), '{ not valid json ');
    const registry = new BrokerRegistry(tmpDir);
    registry.load(); // should not throw
    assert.equal(registry.getBroker('broken'), null);
  });

  test('validates requires_headed_mode is boolean', () => {
    // Invalid: string instead of boolean
    fs.writeFileSync(path.join(tmpDir, 'invalid_mode.json'), JSON.stringify({
      id: 'invalid_mode',
      name: 'Invalid Mode Broker',
      opt_out_url: 'https://example.com',
      requires_pii: ['name'],
      requires_headed_mode: 'yes', // Invalid: should be boolean
      steps: [],
    }));
    const registry = new BrokerRegistry(tmpDir);
    registry.load();
    assert.equal(registry.getBroker('invalid_mode'), null);
  });

  test('accepts valid requires_headed_mode true', () => {
    writeBroker(tmpDir, 'headed_broker', { requires_headed_mode: true });
    const registry = new BrokerRegistry(tmpDir);
    registry.load();
    const broker = registry.getBroker('headed_broker');
    assert.ok(broker);
    assert.equal(broker.requires_headed_mode, true);
  });

  test('accepts valid requires_headed_mode false', () => {
    writeBroker(tmpDir, 'headless_broker', { requires_headed_mode: false });
    const registry = new BrokerRegistry(tmpDir);
    registry.load();
    const broker = registry.getBroker('headless_broker');
    assert.ok(broker);
    assert.equal(broker.requires_headed_mode, false);
  });

  test('accepts missing requires_headed_mode', () => {
    writeBroker(tmpDir, 'no_mode_broker', {});
    const registry = new BrokerRegistry(tmpDir);
    registry.load();
    const broker = registry.getBroker('no_mode_broker');
    assert.ok(broker);
    assert.equal(broker.requires_headed_mode, undefined);
  });
});
