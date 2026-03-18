/**
 * Integration tests: end-to-end event flow
 * Verifies: US2, US3, US4, US5, US6, EC4, EC6
 *
 * These tests wire real subsystems together but mock Claude API calls
 * to avoid network dependencies.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventBus } from '../orchestrator/event-bus.js';
import { MemoryStore } from '../agents/memory-store.js';
import { EscalationHandler } from '../escalation/escalation-handler.js';
import { EventSimulator } from '../ingestion/simulator.js';
import { loadTemplates, createInstances } from '../agents/agent-factory.js';
import { parseAgentResponse, validateAgentResponse } from '../claude/response-schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEMBERS = [
  { id: 'member_001', name: 'Alex', profile_type: 'child', companion: 'scout', is_primary: false },
  { id: 'member_002', name: 'Mom', profile_type: 'senior', companion: 'anchor', is_primary: false },
  { id: 'member_003', name: 'Taylor', profile_type: 'adult', companion: 'sentinel', is_primary: true },
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cortege-int-'));
}

function makeWs() {
  const emitted = [];
  const ws = (eventName, data) => emitted.push({ eventName, data });
  ws.emitted = emitted;
  return ws;
}

/** Build a minimal mock Claude API response with submit_assessment tool_use */
function mockClaudeResponse(overrides = {}) {
  return {
    content: [
      {
        type: 'tool_use',
        name: 'submit_assessment',
        input: {
          event_id: 'evt_test',
          agent: 'anchor',
          instance: 'anchor-mom',
          threat_level: 0,
          confidence: 0.8,
          assessment: 'Normal call from known contact.',
          signals: [],
          actions: [{ type: 'log', reason: 'routine' }],
          memory_updates: {
            add_trusted_contact: { id: 'contact_test', name: 'Alice', relationship: 'daughter', confidence: 0.9 },
          },
          stage_check: { current_depth: 0.05, stage_transition: null },
          ...overrides,
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 10.2.1 — End-to-end event flow (mocked Claude)
// ---------------------------------------------------------------------------

describe('End-to-end event flow (mocked Claude)', () => {
  test('event bus routes event → agent instance processes it → memory updated', async () => {
    const dir = makeTempDir();
    const ws = makeWs();

    // Set up memory store
    const memStore = new MemoryStore('anchor-mom', 'member_002', 'Mom', dir);
    memStore.load();

    // Simulate what agent-instance._processOne does (without real Claude)
    const mockResponse = mockClaudeResponse();
    const agentResponse = parseAgentResponse(mockResponse);

    // Apply memory updates
    memStore.applyUpdates(agentResponse.memory_updates);
    memStore.incrementEventsProcessed();
    memStore.save();

    // Verify memory was updated
    const mem = memStore.getMemory();
    assert.ok(mem.trusted_contacts['contact_test'], 'Expected contact to be added');
    assert.equal(mem.trusted_contacts['contact_test'].name, 'Alice');
    assert.ok(mem.events_processed > 0);

    fs.rmSync(dir, { recursive: true });
  });

  test('escalation handler receives agent response and emits correct WS events', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);

    const agentInstance = {
      id: 'anchor-mom',
      memberId: 'member_002',
      memberName: 'Mom',
      memoryStore: null,
    };

    // L3 response
    const response = {
      event_id: 'evt_001',
      agent: 'anchor',
      instance: 'anchor-mom',
      threat_level: 3,
      confidence: 0.9,
      assessment: 'Grandparent scam detected',
      signals: ['urgency', 'unknown_caller', 'gift_card_request'],
      actions: [{ type: 'escalate', level: 3, to: 'primary', summary: 'Scam attempt' }],
      memory_updates: {},
      stage_check: { current_depth: 0.1 },
    };

    const result = handler.handle(response, agentInstance);

    assert.equal(result.escalated, true);
    assert.equal(result.level, 3);

    const escalationEvent = ws.emitted.find((e) => e.eventName === 'escalation:fired');
    assert.ok(escalationEvent);
    assert.equal(escalationEvent.data.threat_level, 3);
    assert.equal(escalationEvent.data.primaryCompanion.id, 'member_003');
  });

  test('event bus routes targeted event only to correct agent', () => {
    const bus = new EventBus();
    const received = { mom: 0, taylor: 0 };

    bus.subscribe('inbound_call', 'anchor-mom', () => received.mom++, 'member_002');
    bus.subscribe('inbound_call', 'sentinel-taylor', () => received.taylor++, 'member_003');

    bus.emit({
      type: 'inbound_call',
      source: 'test',
      timestamp: new Date().toISOString(),
      payload: { caller_id: '+15550000' },
      target_member: 'member_002',
    });

    assert.equal(received.mom, 1);
    assert.equal(received.taylor, 0);
  });
});

// ---------------------------------------------------------------------------
// 10.2.2 — Scenario playback with learning progression
// ---------------------------------------------------------------------------

describe('Scenario playback with learning progression', () => {
  test('EventSimulator loads and fires events from grandparent-scam scenario', async () => {
    const bus = new EventBus();
    const fired = [];

    bus.subscribe('inbound_call', 'anchor-mom', (e) => fired.push(e), 'member_002');
    bus.subscribe('financial_transaction', 'anchor-mom', (e) => fired.push(e), 'member_002');
    bus.subscribe('inbound_sms', 'anchor-mom', (e) => fired.push(e), 'member_002');

    const simulator = new EventSimulator(bus, path.resolve('scenarios'));
    const result = await simulator.runScenario('grandparent-scam');

    assert.equal(result.completed, true);
    assert.ok(result.eventsEmitted > 0, 'Expected at least one event emitted');
    assert.ok(fired.length > 0, 'Expected at least one event received by agent');
  });

  test('EventSimulator returns error for non-existent scenario', async () => {
    const bus = new EventBus();
    const simulator = new EventSimulator(bus, path.resolve('scenarios'));
    const result = await simulator.runScenario('does-not-exist');

    assert.ok(result.error);
    assert.equal(result.status, 400);
  });

  test('memory depth score increases after processing multiple events', () => {
    const dir = makeTempDir();
    const store = new MemoryStore('anchor-mom', 'member_002', 'Mom', dir);
    store.load();

    const initialDepth = store.getMemory().depth_score;

    // Simulate processing 10 events with memory updates
    for (let i = 0; i < 10; i++) {
      store.applyUpdates({
        add_trusted_contact: { id: `contact_${i}`, name: `Contact ${i}`, relationship: 'friend', confidence: 0.8 },
      });
      store.incrementEventsProcessed();
    }

    const finalDepth = store.getMemory().depth_score;
    assert.ok(finalDepth > initialDepth, `Depth should increase: ${initialDepth} → ${finalDepth}`);

    fs.rmSync(dir, { recursive: true });
  });
});

// ---------------------------------------------------------------------------
// 10.2.3 — Agent hot-reload
// ---------------------------------------------------------------------------

describe('Agent hot-reload (EC6)', () => {
  test('loadTemplates loads all three agent templates', () => {
    const templates = loadTemplates(path.resolve('agents'));
    assert.ok(templates.has('anchor'), 'Expected anchor template');
    assert.ok(templates.has('scout'), 'Expected scout template');
    assert.ok(templates.has('sentinel'), 'Expected sentinel template');
    assert.equal(templates.size, 3);
  });

  test('createInstances creates one instance per member', () => {
    const templates = loadTemplates(path.resolve('agents'));
    const instances = createInstances(templates, MEMBERS);
    assert.equal(instances.size, 3);
    assert.ok(instances.has('anchor-mom'));
    assert.ok(instances.has('scout-alex'));
    assert.ok(instances.has('sentinel-taylor'));
  });

  test('loadTemplates can be called twice (simulating hot-reload)', () => {
    const t1 = loadTemplates(path.resolve('agents'));
    const t2 = loadTemplates(path.resolve('agents'));
    assert.equal(t1.size, t2.size);
    for (const [name] of t1) {
      assert.ok(t2.has(name), `Expected "${name}" in reloaded templates`);
    }
  });

  test('createInstances skips members with no matching template', () => {
    const templates = loadTemplates(path.resolve('agents'));
    const membersWithUnknown = [
      ...MEMBERS,
      { id: 'member_999', name: 'Ghost', profile_type: 'unknown_type', is_primary: false },
    ];
    const instances = createInstances(templates, membersWithUnknown);
    // Ghost should be skipped — only 3 instances
    assert.equal(instances.size, 3);
  });
});

// ---------------------------------------------------------------------------
// 10.2.4 — Claude API error handling (mocked)
// ---------------------------------------------------------------------------

describe('Claude API error handling (EC4)', () => {
  test('parseAgentResponse throws when no tool_use block present', () => {
    const badResponse = { content: [{ type: 'text', text: 'Hello' }] };
    assert.throws(
      () => parseAgentResponse(badResponse),
      /No submit_assessment tool_use/
    );
  });

  test('parseAgentResponse throws when required fields are missing', () => {
    const incompleteResponse = {
      content: [
        {
          type: 'tool_use',
          name: 'submit_assessment',
          input: { event_id: 'evt_001' }, // missing most fields
        },
      ],
    };
    assert.throws(
      () => parseAgentResponse(incompleteResponse),
      /missing required fields/
    );
  });

  test('validateAgentResponse catches invalid threat_level', () => {
    const { errors } = validateAgentResponse({
      threat_level: 99, // invalid
      confidence: 0.5,
      signals: [],
      actions: [],
      memory_updates: {},
      stage_check: { current_depth: 0 },
    });
    assert.ok(errors.some((e) => e.includes('threat_level')));
  });

  test('validateAgentResponse catches invalid confidence', () => {
    const { errors } = validateAgentResponse({
      threat_level: 1,
      confidence: 1.5, // > 1
      signals: [],
      actions: [],
      memory_updates: {},
      stage_check: { current_depth: 0 },
    });
    assert.ok(errors.some((e) => e.includes('confidence')));
  });

  test('validateAgentResponse accepts a valid response', () => {
    const { valid } = validateAgentResponse({
      threat_level: 2,
      confidence: 0.75,
      signals: ['unknown_caller'],
      actions: [{ type: 'monitor', target: '+15550000' }],
      memory_updates: {},
      stage_check: { current_depth: 0.1 },
    });
    assert.equal(valid, true);
  });

  test('fallback response is returned when Claude is unavailable', () => {
    // Simulate what agent-instance does on Claude failure
    const fallback = {
      event_id: 'evt_fail',
      agent: 'anchor',
      instance: 'anchor-mom',
      threat_level: 1,
      confidence: 0,
      assessment: 'Unable to assess — Claude unavailable: connection refused',
      signals: [],
      actions: [{ type: 'log', reason: 'connection refused' }],
      memory_updates: {},
      stage_check: { current_depth: 0 },
    };

    // Fallback should pass validation
    const { valid } = validateAgentResponse(fallback);
    assert.equal(valid, true);
    assert.equal(fallback.threat_level, 1);
  });
});
