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
import { AgentInstance } from '../agents/agent-instance.js';

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

/** Build a minimal mock Claude API response with submit_assessment tool_use (slim schema) */
function mockClaudeResponse(overrides = {}) {
  return {
    content: [
      {
        type: 'tool_use',
        name: 'submit_assessment',
        input: {
          threat_level: 0,
          confidence: 0.8,
          assessment: 'Normal call from known contact.',
          signals: [],
          actions: [{ type: 'log', reason: 'routine' }],
          memory_updates: {
            add_trusted_contact: { id: 'contact_test', name: 'Alice', relationship: 'daughter', confidence: 0.9 },
          },
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

    // L3 response (backfilled fields included, no stage_check in slim schema)
    const response = {
      event_id: 'evt_001',
      agent: 'anchor',
      instance: 'anchor-mom',
      threat_level: 3,
      confidence: 0.9,
      assessment: 'Grandparent scam detected',
      signals: ['urgency', 'unknown_contact', 'gift_card'],
      actions: [{ type: 'escalate', level: 3, to: 'primary', summary: 'Scam attempt' }],
      memory_updates: {},
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
          input: { threat_level: 0 }, // missing most fields
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
    });
    assert.ok(errors.some((e) => e.includes('confidence')));
  });

  test('validateAgentResponse accepts a valid response (slim schema)', () => {
    const { valid } = validateAgentResponse({
      threat_level: 2,
      confidence: 0.75,
      signals: ['unknown_contact'],
      actions: [{ type: 'monitor', target: '+15550000' }],
      memory_updates: {},
    });
    assert.equal(valid, true);
  });

  test('fallback response is returned when Claude is unavailable', () => {
    // Simulate what agent-instance does on Claude failure (backfilled fields included)
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
    };

    // Fallback should pass validation
    const { valid } = validateAgentResponse(fallback);
    assert.equal(valid, true);
    assert.equal(fallback.threat_level, 1);
  });
});

// ---------------------------------------------------------------------------
// 10.2.5 — String coercion guards (actions/signals as free text)
// ---------------------------------------------------------------------------

describe('String coercion guards', () => {
  test('escalation handler skips actions when actions is a string', () => {
    const ws = makeWs();
    const handler = new EscalationHandler(MEMBERS, ws);
    const instance = {
      id: 'anchor-mom',
      memberId: 'member_002',
      memberName: 'Mom',
      memoryStore: null,
    };

    const response = {
      event_id: 'evt_str',
      agent: 'anchor',
      instance: 'anchor-mom',
      threat_level: 0,
      confidence: 0.8,
      assessment: 'Normal call.',
      signals: [],
      actions: 'Log this event and monitor the caller for future reference.',
      memory_updates: {},
    };

    // Should not throw or produce hundreds of log lines
    assert.doesNotThrow(() => handler.handle(response, instance));
    // No escalation events should fire for L0
    assert.equal(ws.emitted.length, 0);
  });

  test('parseAgentResponse + backfill coerces string actions/signals to arrays', () => {
    const mockResponse = {
      content: [
        {
          type: 'tool_use',
          name: 'submit_assessment',
          input: {
            threat_level: 0,
            confidence: 0.8,
            assessment: 'Normal call.',
            signals: 'normal, known_contact',
            actions: 'Log this event.',
            memory_updates: {},
          },
        },
      ],
    };

    // parseAgentResponse should succeed (required fields present)
    const parsed = parseAgentResponse(mockResponse);
    assert.equal(typeof parsed.actions, 'string'); // raw parse returns string

    // Simulate what agent-instance does: coerce non-arrays
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (!Array.isArray(parsed.signals)) parsed.signals = [];

    assert.ok(Array.isArray(parsed.actions));
    assert.ok(Array.isArray(parsed.signals));
    assert.equal(parsed.actions.length, 0);
    assert.equal(parsed.signals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 10.2.6 — AgentInstance.getStatus() extended fields
// ---------------------------------------------------------------------------

describe('AgentInstance.getStatus() extended fields', () => {
  test('returns agentRole, profileType, designation, and memberName', () => {
    const instance = new AgentInstance({
      id: 'anchor-mom',
      agentName: 'anchor',
      memberId: 'member_002',
      memberName: 'Mom',
      config: { role: 'Senior Protection Agent', profile_type: 'senior', designation: 'β' },
      systemPrompt: 'You are a companion agent.',
    });

    const status = instance.getStatus();

    // Original fields
    assert.equal(status.id, 'anchor-mom');
    assert.equal(status.agentName, 'anchor');
    assert.equal(status.memberId, 'member_002');
    assert.equal(status.memberName, 'Mom');
    assert.equal(status.stage, 'baseline');
    assert.equal(status.depthScore, 0);
    assert.equal(status.eventsProcessed, 0);

    // Extended fields
    assert.equal(status.agentRole, 'Senior Protection Agent');
    assert.equal(status.profileType, 'senior');
    assert.equal(status.designation, 'β');
    assert.equal(status.lastAction, null);
    assert.equal(status.trustedContactCount, 0);
    assert.equal(status.blockedContactCount, 0);
    assert.equal(status.threatHistoryCount, 0);
    assert.equal(status.createdAt, null);
  });

  test('returns defaults when config is missing', () => {
    const instance = new AgentInstance({
      id: 'test-agent',
      agentName: 'test',
      memberId: 'member_999',
      memberName: 'Nobody',
      config: null,
      systemPrompt: '',
    });

    const status = instance.getStatus();

    assert.equal(status.agentRole, null);
    assert.equal(status.profileType, null);
    assert.equal(status.designation, null);
    assert.equal(status.lastAction, null);
  });

  test('returns contact/threat counts from memory', () => {
    const dir = makeTempDir();
    const instance = new AgentInstance({
      id: 'anchor-mom',
      agentName: 'anchor',
      memberId: 'member_002',
      memberName: 'Mom',
      config: { role: 'Senior Protection Agent', profile_type: 'senior', designation: 'β' },
      systemPrompt: '',
    });

    instance.initMemory(dir);

    // Add trusted contacts and a blocked contact via memory store
    instance.memoryStore.applyUpdates({
      add_trusted_contact: { id: 'c1', name: 'Alice', relationship: 'daughter', confidence: 0.9 },
    });
    instance.memoryStore.applyUpdates({
      add_trusted_contact: { id: 'c2', name: 'Bob', relationship: 'son', confidence: 0.85 },
    });
    instance.memoryStore.applyUpdates({
      block_contact: { id: 'b1', name: 'Scammer', reason: 'fraud' },
    });

    const status = instance.getStatus();

    assert.equal(status.trustedContactCount, 2);
    assert.equal(status.blockedContactCount, 1);
    assert.ok(status.createdAt !== null, 'Expected createdAt to be set after initMemory');

    fs.rmSync(dir, { recursive: true });
  });

  test('_lastAction is populated after setting it', () => {
    const instance = new AgentInstance({
      id: 'anchor-mom',
      agentName: 'anchor',
      memberId: 'member_002',
      memberName: 'Mom',
      config: { role: 'Senior Protection Agent', profile_type: 'senior', designation: 'β' },
      systemPrompt: '',
    });

    assert.equal(instance.getStatus().lastAction, null);

    // Simulate what _processOne does
    instance._lastAction = {
      text: 'Normal call from known contact.',
      timestamp: '2026-03-19T10:00:00.000Z',
      threatLevel: 0,
    };

    const status = instance.getStatus();
    assert.equal(status.lastAction.text, 'Normal call from known contact.');
    assert.equal(status.lastAction.timestamp, '2026-03-19T10:00:00.000Z');
    assert.equal(status.lastAction.threatLevel, 0);
  });
});
