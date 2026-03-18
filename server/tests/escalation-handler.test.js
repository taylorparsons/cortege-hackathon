/**
 * Unit tests: escalation-handler.js
 * Verifies: US5 — Escalation routing by threat level
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EscalationHandler } from '../escalation/escalation-handler.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEMBERS = [
  { id: 'member_001', name: 'Alex', profile_type: 'child', is_primary: false },
  { id: 'member_002', name: 'Mom', profile_type: 'senior', is_primary: false },
  { id: 'member_003', name: 'Taylor', profile_type: 'adult', is_primary: true },
];

function makeInstance(overrides = {}) {
  return {
    id: 'anchor-mom',
    memberId: 'member_002',
    memberName: 'Mom',
    memoryStore: null,
    ...overrides,
  };
}

function makeResponse(overrides = {}) {
  return {
    event_id: 'evt_test_001',
    agent: 'anchor',
    instance: 'anchor-mom',
    threat_level: 0,
    confidence: 0.9,
    assessment: 'Test assessment',
    signals: [],
    actions: [],
    memory_updates: {},
    ...overrides,
  };
}

function makeWs() {
  const emitted = [];
  const ws = (eventName, data) => emitted.push({ eventName, data });
  ws.emitted = emitted;
  return ws;
}

// ---------------------------------------------------------------------------
// Level routing
// ---------------------------------------------------------------------------

describe('EscalationHandler level routing', () => {
  test('L0 — does not emit WebSocket events', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const result = handler.handle(makeResponse({ threat_level: 0 }), makeInstance());

    assert.equal(result.handled, true);
    assert.equal(result.escalated, false);
    assert.equal(result.level, 0);
    assert.equal(ws.emitted.length, 0);
  });

  test('L1 — does not emit WebSocket events', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const result = handler.handle(makeResponse({ threat_level: 1 }), makeInstance());

    assert.equal(result.escalated, false);
    assert.equal(ws.emitted.length, 0);
  });

  test('L2 — emits companion:status with monitoring status', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const result = handler.handle(makeResponse({ threat_level: 2, confidence: 0.7 }), makeInstance());

    assert.equal(result.escalated, false);
    const statusEvent = ws.emitted.find((e) => e.eventName === 'companion:status');
    assert.ok(statusEvent, 'Expected companion:status event');
    assert.equal(statusEvent.data.status, 'monitoring');
    assert.equal(statusEvent.data.threat_level, 2);
  });

  test('L3 — emits escalation:fired and sets escalated=true', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const result = handler.handle(makeResponse({ threat_level: 3 }), makeInstance());

    assert.equal(result.escalated, true);
    const escalationEvent = ws.emitted.find((e) => e.eventName === 'escalation:fired');
    assert.ok(escalationEvent, 'Expected escalation:fired event');
    assert.equal(escalationEvent.data.level, 3);
    assert.equal(escalationEvent.data.memberId, 'member_002');
  });

  test('L4 — emits escalation:fired with evidence and sets escalated=true', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const result = handler.handle(makeResponse({ threat_level: 4 }), makeInstance());

    assert.equal(result.escalated, true);
    const escalationEvent = ws.emitted.find((e) => e.eventName === 'escalation:fired');
    assert.ok(escalationEvent, 'Expected escalation:fired event');
    assert.ok(escalationEvent.data.evidence, 'Expected evidence in L4 escalation');
    assert.equal(escalationEvent.data.level, 4);
  });

  test('L4+ (e.g. 5) — treated as emergency', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const result = handler.handle(makeResponse({ threat_level: 5 }), makeInstance());
    assert.equal(result.escalated, true);
  });
});

// ---------------------------------------------------------------------------
// Primary companion resolution (EC9)
// ---------------------------------------------------------------------------

describe('EscalationHandler primary companion (EC9)', () => {
  test('_getPrimaryCompanion returns first member with is_primary=true', () => {
    const handler = new EscalationHandler(MEMBERS, () => {});
    const primary = handler._getPrimaryCompanion(MEMBERS);
    assert.equal(primary.id, 'member_003');
    assert.equal(primary.name, 'Taylor');
  });

  test('_getPrimaryCompanion returns null when no primary member', () => {
    const members = [
      { id: 'm1', name: 'A', is_primary: false },
      { id: 'm2', name: 'B', is_primary: false },
    ];
    const handler = new EscalationHandler(members, () => {});
    assert.equal(handler._getPrimaryCompanion(members), null);
  });

  test('L3 escalation includes primaryCompanion in payload', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    handler.handle(makeResponse({ threat_level: 3 }), makeInstance());

    const event = ws.emitted.find((e) => e.eventName === 'escalation:fired');
    assert.ok(event.data.primaryCompanion);
    assert.equal(event.data.primaryCompanion.id, 'member_003');
  });
});

// ---------------------------------------------------------------------------
// Action processing
// ---------------------------------------------------------------------------

describe('EscalationHandler action processing', () => {
  test('processes "log" action without error', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const response = makeResponse({
      threat_level: 1,
      actions: [{ type: 'log', reason: 'test log' }],
    });
    assert.doesNotThrow(() => handler.handle(response, makeInstance()));
  });

  test('processes "monitor" action', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const response = makeResponse({
      threat_level: 2,
      actions: [{ type: 'monitor', target: '+15550000', reason: 'suspicious' }],
    });
    assert.doesNotThrow(() => handler.handle(response, makeInstance()));
  });

  test('skips "monitor" action missing required "target" field', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const response = makeResponse({
      threat_level: 1,
      actions: [{ type: 'monitor' }], // missing target
    });
    // Should not throw — just skip
    assert.doesNotThrow(() => handler.handle(response, makeInstance()));
  });

  test('processes "hard_block" and writes to memoryStore', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);

    const blocked = {};
    const mockMemoryStore = {
      _applyOperation: (op, data) => { blocked[data.id] = data.reason; },
      save: () => {},
    };

    const response = makeResponse({
      threat_level: 4,
      actions: [{ type: 'hard_block', target: '+15550000', reason: 'confirmed scam' }],
    });

    handler.handle(response, makeInstance({ memoryStore: mockMemoryStore }));
    assert.equal(blocked['+15550000'], 'confirmed scam');
  });

  test('skips unknown action type', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const response = makeResponse({
      threat_level: 0,
      actions: [{ type: 'not_a_real_action' }],
    });
    assert.doesNotThrow(() => handler.handle(response, makeInstance()));
  });

  test('processes "log_evidence" action', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const response = makeResponse({
      threat_level: 4,
      actions: [{ type: 'log_evidence', reason: 'scam confirmed' }],
    });
    assert.doesNotThrow(() => handler.handle(response, makeInstance()));
  });
});
