/**
 * Unit tests: event-bus.js
 * Verifies: US2 — Events are routed correctly to subscribed agents
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus, ALL_EVENT_TYPES, validateCoreEvent, generateEventId } from '../orchestrator/event-bus.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides = {}) {
  return {
    type: 'inbound_call',
    source: 'test',
    timestamp: new Date().toISOString(),
    payload: { caller_id: '+15551234567' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateEventId
// ---------------------------------------------------------------------------

describe('generateEventId', () => {
  test('returns a string starting with "evt_"', () => {
    const id = generateEventId();
    assert.ok(typeof id === 'string');
    assert.ok(id.startsWith('evt_'));
  });

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateEventId()));
    assert.ok(ids.size > 90, 'Expected mostly unique IDs');
  });
});

// ---------------------------------------------------------------------------
// validateCoreEvent
// ---------------------------------------------------------------------------

describe('validateCoreEvent', () => {
  test('accepts a valid event', () => {
    const { valid, errors } = validateCoreEvent(makeEvent());
    assert.equal(valid, true);
    assert.deepEqual(errors, []);
  });

  test('rejects null', () => {
    const { valid } = validateCoreEvent(null);
    assert.equal(valid, false);
  });

  test('rejects missing type', () => {
    const { valid, errors } = validateCoreEvent({ source: 'x', timestamp: new Date().toISOString(), payload: {} });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('type')));
  });

  test('rejects unknown event type', () => {
    const { valid, errors } = validateCoreEvent(makeEvent({ type: 'not_real' }));
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('not_real')));
  });

  test('rejects missing source', () => {
    const { valid, errors } = validateCoreEvent({ type: 'inbound_call', timestamp: new Date().toISOString(), payload: {} });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('source')));
  });

  test('rejects missing payload', () => {
    const { valid, errors } = validateCoreEvent({ type: 'inbound_call', source: 'x', timestamp: new Date().toISOString() });
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('payload')));
  });

  test('accepts all known event types', () => {
    for (const type of ALL_EVENT_TYPES) {
      const { valid } = validateCoreEvent(makeEvent({ type }));
      assert.equal(valid, true, `Expected valid for type "${type}"`);
    }
  });
});

// ---------------------------------------------------------------------------
// EventBus — subscription and routing
// ---------------------------------------------------------------------------

describe('EventBus routing', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  test('routes event to subscribed handler', () => {
    let received = null;
    bus.subscribe('inbound_call', 'agent-1', (e) => { received = e; }, 'member_001');

    bus.emit(makeEvent({ target_member: 'member_001' }));
    assert.ok(received !== null);
    assert.equal(received.type, 'inbound_call');
  });

  test('does not route to unsubscribed event type', () => {
    let received = null;
    bus.subscribe('inbound_sms', 'agent-1', (e) => { received = e; }, 'member_001');

    bus.emit(makeEvent({ type: 'inbound_call', target_member: 'member_001' }));
    assert.equal(received, null);
  });

  test('routes broadcast event (no target_member) to all subscribers', () => {
    const received = [];
    bus.subscribe('inbound_call', 'agent-1', (e) => received.push('agent-1'), 'member_001');
    bus.subscribe('inbound_call', 'agent-2', (e) => received.push('agent-2'), 'member_002');

    bus.emit(makeEvent({ target_member: null }));
    assert.ok(received.includes('agent-1'));
    assert.ok(received.includes('agent-2'));
  });

  test('routes targeted event only to matching member agent', () => {
    const received = [];
    bus.subscribe('inbound_call', 'agent-1', () => received.push('agent-1'), 'member_001');
    bus.subscribe('inbound_call', 'agent-2', () => received.push('agent-2'), 'member_002');

    bus.emit(makeEvent({ target_member: 'member_001' }));
    assert.deepEqual(received, ['agent-1']);
  });

  test('does not route to wrong member', () => {
    let received = false;
    bus.subscribe('inbound_call', 'agent-2', () => { received = true; }, 'member_002');

    bus.emit(makeEvent({ target_member: 'member_001' }));
    assert.equal(received, false);
  });

  test('unsubscribe removes handler', () => {
    let count = 0;
    bus.subscribe('inbound_call', 'agent-1', () => count++, 'member_001');
    bus.emit(makeEvent({ target_member: 'member_001' }));
    assert.equal(count, 1);

    bus.unsubscribe('inbound_call', 'agent-1');
    bus.emit(makeEvent({ target_member: 'member_001' }));
    assert.equal(count, 1); // no second increment
  });

  test('unsubscribeAll removes all subscriptions for an agent', () => {
    let count = 0;
    bus.subscribe('inbound_call', 'agent-1', () => count++, 'member_001');
    bus.subscribe('inbound_sms', 'agent-1', () => count++, 'member_001');

    bus.unsubscribeAll('agent-1');

    bus.emit(makeEvent({ type: 'inbound_call', target_member: 'member_001' }));
    bus.emit(makeEvent({ type: 'inbound_sms', target_member: 'member_001' }));
    assert.equal(count, 0);
  });

  test('getSubscriptions returns subscribed event types', () => {
    bus.subscribe('inbound_call', 'agent-1', () => {}, 'member_001');
    bus.subscribe('inbound_sms', 'agent-1', () => {}, 'member_001');

    const subs = bus.getSubscriptions('agent-1');
    assert.ok(subs.includes('inbound_call'));
    assert.ok(subs.includes('inbound_sms'));
  });

  test('throws on unknown event type subscription', () => {
    assert.throws(
      () => bus.subscribe('not_real', 'agent-1', () => {}, 'member_001'),
      /unknown event type/i
    );
  });

  test('emit throws on invalid event', () => {
    assert.throws(
      () => bus.emit({ type: 'not_real', source: 'x', timestamp: new Date().toISOString(), payload: {} }),
      /Invalid CoreEvent/
    );
  });

  test('emit assigns id and timestamp if missing', () => {
    let received = null;
    bus.subscribe('inbound_call', 'agent-1', (e) => { received = e; }, 'member_001');

    bus.emit({ type: 'inbound_call', source: 'test', payload: {}, target_member: 'member_001' });
    assert.ok(received.id.startsWith('evt_'));
    assert.ok(typeof received.timestamp === 'string');
  });

  test('multiple agents on same event type all receive it (broadcast)', () => {
    const received = new Set();
    bus.subscribe('financial_transaction', 'agent-a', () => received.add('a'));
    bus.subscribe('financial_transaction', 'agent-b', () => received.add('b'));

    bus.emit(makeEvent({ type: 'financial_transaction', target_member: null }));
    assert.ok(received.has('a'));
    assert.ok(received.has('b'));
  });
});
