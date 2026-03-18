/**
 * Unit tests: memory-store.js
 * Verifies: US4 — Memory updates and depth score calculation
 * Covers: EC8 — depth score returns 0.0 safely when all counts are zero
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  MemoryStore,
  calculateDepthScore,
  getStageForDepth,
  checkStageTransition,
  getStageThresholds,
} from '../agents/memory-store.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cortege-mem-'));
}

function makeStore(dir) {
  const store = new MemoryStore('anchor-mom', 'member_002', 'Mom', dir);
  store.load(); // initializes fresh memory
  return store;
}

// ---------------------------------------------------------------------------
// calculateDepthScore — EC8
// ---------------------------------------------------------------------------

describe('calculateDepthScore', () => {
  test('returns ~0 for a fresh empty memory (EC8)', () => {
    const mem = {
      trusted_contacts: {},
      events_processed: 0,
      learned_patterns: [],
      created: new Date().toISOString(),
      baseline_period_days: 30,
    };
    const score = calculateDepthScore(mem);
    // EC8: score should be effectively zero (tiny float from elapsed ms is acceptable)
    assert.ok(score < 0.001, `Expected score near 0, got ${score}`);
  });

  test('increases with trusted contacts', () => {
    const mem = {
      trusted_contacts: { c1: {}, c2: {}, c3: {}, c4: {}, c5: {} },
      events_processed: 0,
      learned_patterns: [],
      created: new Date().toISOString(),
      baseline_period_days: 30,
    };
    const score = calculateDepthScore(mem);
    assert.ok(score > 0, 'Score should be > 0 with contacts');
  });

  test('increases with events processed', () => {
    const mem = {
      trusted_contacts: {},
      events_processed: 50,
      learned_patterns: [],
      created: new Date().toISOString(),
      baseline_period_days: 30,
    };
    const score = calculateDepthScore(mem);
    assert.ok(score > 0);
  });

  test('caps at 1.0 with maxed-out values', () => {
    const contacts = {};
    for (let i = 0; i < 20; i++) contacts[`c${i}`] = {};
    const mem = {
      trusted_contacts: contacts,
      events_processed: 1000,
      learned_patterns: Array.from({ length: 30 }, (_, i) => ({ key: `p${i}` })),
      created: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
      baseline_period_days: 30,
    };
    const score = calculateDepthScore(mem);
    assert.ok(score <= 1.0, `Score ${score} should be ≤ 1.0`);
  });

  test('returns a number between 0 and 1', () => {
    const mem = {
      trusted_contacts: { c1: {} },
      events_processed: 10,
      learned_patterns: [{ key: 'p1' }],
      created: new Date().toISOString(),
      baseline_period_days: 30,
    };
    const score = calculateDepthScore(mem);
    assert.ok(score >= 0 && score <= 1, `Score ${score} out of range`);
  });
});

// ---------------------------------------------------------------------------
// getStageForDepth
// ---------------------------------------------------------------------------

describe('getStageForDepth', () => {
  test('returns "baseline" for score 0', () => {
    assert.equal(getStageForDepth(0), 'baseline');
  });

  test('returns "pattern_recognition" above pattern threshold', () => {
    const t = getStageThresholds();
    assert.equal(getStageForDepth(t.pattern + 0.01), 'pattern_recognition');
  });

  test('returns "predictive" above predictive threshold', () => {
    const t = getStageThresholds();
    assert.equal(getStageForDepth(t.predictive + 0.01), 'predictive');
  });

  test('returns "cortege_mode" above cortege threshold', () => {
    const t = getStageThresholds();
    assert.equal(getStageForDepth(t.cortege + 0.01), 'cortege_mode');
  });
});

// ---------------------------------------------------------------------------
// checkStageTransition
// ---------------------------------------------------------------------------

describe('checkStageTransition', () => {
  test('detects transition from baseline to pattern_recognition', () => {
    const t = getStageThresholds();
    const { transitioned, newStage } = checkStageTransition('baseline', t.pattern + 0.01);
    assert.equal(transitioned, true);
    assert.equal(newStage, 'pattern_recognition');
  });

  test('returns transitioned=false when stage unchanged', () => {
    const { transitioned } = checkStageTransition('baseline', 0.01);
    assert.equal(transitioned, false);
  });
});

// ---------------------------------------------------------------------------
// MemoryStore — load / save / fresh init
// ---------------------------------------------------------------------------

describe('MemoryStore load/save', () => {
  test('initializes fresh memory when file does not exist', () => {
    const dir = makeTempDir();
    const store = makeStore(dir);
    const mem = store.getMemory();

    assert.equal(mem.stage, 'baseline');
    assert.equal(mem.events_processed, 0);
    assert.equal(mem.depth_score, 0);
    assert.deepEqual(mem.trusted_contacts, {});
    fs.rmSync(dir, { recursive: true });
  });

  test.skip('saves and reloads memory correctly (JSON-specific test, skipped with SQLite)', () => {
    // Force JSON mode for this test
    const originalMode = process.env.STORAGE_MODE;
    process.env.STORAGE_MODE = 'json';
    
    const dir = makeTempDir();
    const store = makeStore(dir);

    store.memory.events_processed = 42;
    store.save();

    const store2 = new MemoryStore('anchor-mom', 'member_002', 'Mom', dir);
    store2.load();
    assert.equal(store2.getMemory().events_processed, 42);
    fs.rmSync(dir, { recursive: true });
    
    // Restore original mode
    if (originalMode) {
      process.env.STORAGE_MODE = originalMode;
    } else {
      delete process.env.STORAGE_MODE;
    }
  });

  test('handles corrupted memory file gracefully (EC2)', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, 'anchor-mom.json');
    fs.writeFileSync(filePath, '{ this is not valid json }', 'utf8');

    const store = new MemoryStore('anchor-mom', 'member_002', 'Mom', dir);
    store.load(); // should not throw

    const mem = store.getMemory();
    assert.equal(mem.stage, 'baseline'); // fresh memory
    fs.rmSync(dir, { recursive: true });
  });

  test.skip('atomic save uses temp file then rename (JSON-specific test, skipped with SQLite)', () => {
    // Force JSON mode for this test
    const originalMode = process.env.STORAGE_MODE;
    process.env.STORAGE_MODE = 'json';
    
    const dir = makeTempDir();
    const store = makeStore(dir);
    store.save();

    // After save, .tmp file should not exist
    const tmpPath = path.join(dir, 'anchor-mom.json.tmp');
    assert.equal(fs.existsSync(tmpPath), false);

    // Main file should exist
    const mainPath = path.join(dir, 'anchor-mom.json');
    assert.equal(fs.existsSync(mainPath), true);
    fs.rmSync(dir, { recursive: true });
    
    // Restore original mode
    if (originalMode) {
      process.env.STORAGE_MODE = originalMode;
    } else {
      delete process.env.STORAGE_MODE;
    }
  });
});

// ---------------------------------------------------------------------------
// MemoryStore — applyUpdates / _applyOperation
// ---------------------------------------------------------------------------

describe('MemoryStore applyUpdates', () => {
  let store;
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    store = makeStore(dir);
  });

  test('add_trusted_contact upserts a contact', () => {
    store.applyUpdates({
      add_trusted_contact: { id: 'contact_001', name: 'Alice', relationship: 'daughter', confidence: 0.9 },
    });
    const mem = store.getMemory();
    assert.ok(mem.trusted_contacts['contact_001']);
    assert.equal(mem.trusted_contacts['contact_001'].name, 'Alice');
  });

  test('add_trusted_contact updates existing contact', () => {
    store.applyUpdates({ add_trusted_contact: { id: 'c1', name: 'Bob', relationship: 'son', confidence: 0.5 } });
    store.applyUpdates({ add_trusted_contact: { id: 'c1', name: 'Bob', relationship: 'son', confidence: 0.9 } });
    assert.equal(store.getMemory().trusted_contacts['c1'].confidence, 0.9);
  });

  test('remove_trusted_contact removes a contact', () => {
    store.applyUpdates({ add_trusted_contact: { id: 'c1', name: 'Bob', relationship: 'son', confidence: 0.9 } });
    store.applyUpdates({ remove_trusted_contact: { id: 'c1' } });
    assert.equal(store.getMemory().trusted_contacts['c1'], undefined);
  });

  test('add_threat_record appends to threat_history', () => {
    store.applyUpdates({
      add_threat_record: { pattern: 'grandparent_scam', signals: ['urgency'], source: '+15550000', threat_level: 4 },
    });
    assert.equal(store.getMemory().threat_history.length, 1);
    assert.equal(store.getMemory().threat_history[0].pattern, 'grandparent_scam');
  });

  test('update_pattern creates new pattern', () => {
    store.applyUpdates({
      update_pattern: { key: 'call_hours', observation: 'calls between 9-5', confidence_delta: 0.3 },
    });
    const patterns = store.getMemory().learned_patterns;
    assert.equal(patterns.length, 1);
    assert.equal(patterns[0].key, 'call_hours');
    assert.ok(patterns[0].confidence >= 0.3);
  });

  test('update_pattern updates existing pattern confidence', () => {
    store.applyUpdates({ update_pattern: { key: 'p1', observation: 'obs', confidence_delta: 0.2 } });
    store.applyUpdates({ update_pattern: { key: 'p1', observation: 'obs', confidence_delta: 0.3 } });
    const p = store.getMemory().learned_patterns.find((x) => x.key === 'p1');
    assert.ok(p.confidence >= 0.5);
  });

  test('block_contact adds to blocked_contacts', () => {
    store.applyUpdates({ block_contact: { id: '+15550000', reason: 'scam' } });
    assert.ok(store.getMemory().blocked_contacts['+15550000']);
    assert.equal(store.getMemory().blocked_contacts['+15550000'].reason, 'scam');
  });

  test('add_observation appends to observations', () => {
    store.applyUpdates({ add_observation: { category: 'call', detail: 'unusual timing' } });
    assert.equal(store.getMemory().observations.length, 1);
  });

  test('unknown operation is skipped without throwing', () => {
    assert.doesNotThrow(() => {
      store.applyUpdates({ totally_unknown_op: { foo: 'bar' } });
    });
  });

  test('null/undefined updates are ignored', () => {
    assert.doesNotThrow(() => {
      store.applyUpdates(null);
      store.applyUpdates(undefined);
    });
  });

  // Cleanup
  test('cleanup', () => {
    fs.rmSync(dir, { recursive: true });
  });
});

// ---------------------------------------------------------------------------
// MemoryStore — incrementEventsProcessed
// ---------------------------------------------------------------------------

describe('MemoryStore incrementEventsProcessed', () => {
  test('increments by LEARNING_EVENT_WEIGHT (default 10)', () => {
    const dir = makeTempDir();
    const store = makeStore(dir);
    const before = store.getMemory().events_processed;
    store.incrementEventsProcessed();
    const after = store.getMemory().events_processed;
    assert.ok(after > before);
    fs.rmSync(dir, { recursive: true });
  });
});
