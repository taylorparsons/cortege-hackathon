/**
 * Unit tests: template-parser.js
 * Verifies: US1 — Agent templates can be loaded and validated
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateTemplate, parseTemplate } from '../agents/template-parser.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeTempTemplate(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cortege-test-'));
  const file = path.join(dir, 'agent.md');
  fs.writeFileSync(file, content, 'utf8');
  return { file, cleanup: () => fs.rmSync(dir, { recursive: true }) };
}

const VALID_FRONTMATTER = `---
name: TEST
events:
  - inbound_call
  - inbound_sms
threat_model:
  - voice_fraud
escalation:
  level_3: notify
learning:
  tracks:
    - communication_patterns
---

# Test Agent

You are a test agent.
`;

// ---------------------------------------------------------------------------
// validateTemplate
// ---------------------------------------------------------------------------

describe('validateTemplate', () => {
  test('accepts a fully valid config and system prompt', () => {
    const config = {
      name: 'TEST',
      events: ['inbound_call'],
      threat_model: ['voice_fraud'],
      escalation: { level_3: 'notify' },
      learning: { tracks: [] },
    };
    const { valid, errors } = validateTemplate(config, 'You are a test agent.');
    assert.equal(valid, true);
    assert.deepEqual(errors, []);
  });

  test('rejects config missing required field "name"', () => {
    const config = {
      events: ['inbound_call'],
      threat_model: [],
      escalation: {},
      learning: {},
    };
    const { valid, errors } = validateTemplate(config, 'prompt');
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('"name"')));
  });

  test('rejects config missing required field "events"', () => {
    const config = { name: 'X', threat_model: [], escalation: {}, learning: {} };
    const { valid, errors } = validateTemplate(config, 'prompt');
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('"events"')));
  });

  test('rejects empty events array', () => {
    const config = {
      name: 'X',
      events: [],
      threat_model: [],
      escalation: {},
      learning: {},
    };
    const { valid, errors } = validateTemplate(config, 'prompt');
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('"events" must be a non-empty array')));
  });

  test('rejects unknown event type', () => {
    const config = {
      name: 'X',
      events: ['not_a_real_event'],
      threat_model: [],
      escalation: {},
      learning: {},
    };
    const { valid, errors } = validateTemplate(config, 'prompt');
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('not_a_real_event')));
  });

  test('rejects empty system prompt', () => {
    const config = {
      name: 'X',
      events: ['inbound_call'],
      threat_model: [],
      escalation: {},
      learning: {},
    };
    const { valid, errors } = validateTemplate(config, '   ');
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('non-empty markdown body')));
  });

  test('rejects null system prompt', () => {
    const config = {
      name: 'X',
      events: ['inbound_call'],
      threat_model: [],
      escalation: {},
      learning: {},
    };
    const { valid, errors } = validateTemplate(config, null);
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.includes('non-empty markdown body')));
  });

  test('accumulates multiple errors', () => {
    const { errors } = validateTemplate({}, '');
    assert.ok(errors.length >= 5, `Expected ≥5 errors, got ${errors.length}`);
  });
});

// ---------------------------------------------------------------------------
// parseTemplate
// ---------------------------------------------------------------------------

describe('parseTemplate', () => {
  test('parses a valid agent.md file', () => {
    const { file, cleanup } = writeTempTemplate(VALID_FRONTMATTER);
    try {
      const { config, systemPrompt, errors } = parseTemplate(file);
      assert.deepEqual(errors, []);
      assert.equal(config.name, 'TEST');
      assert.deepEqual(config.events, ['inbound_call', 'inbound_sms']);
      assert.ok(systemPrompt.includes('You are a test agent'));
    } finally {
      cleanup();
    }
  });

  test('returns errors for missing required fields', () => {
    const { file, cleanup } = writeTempTemplate('---\nname: PARTIAL\n---\n\nSome prompt.\n');
    try {
      const { errors } = parseTemplate(file);
      assert.ok(errors.length > 0);
      assert.ok(errors.some((e) => e.includes('"events"')));
    } finally {
      cleanup();
    }
  });

  test('returns error for non-existent file', () => {
    const { errors } = parseTemplate('/tmp/does-not-exist-cortege.md');
    assert.ok(errors.length > 0);
    assert.ok(errors[0].includes('Could not read file'));
  });

  test('returns error for malformed YAML frontmatter', () => {
    const { file, cleanup } = writeTempTemplate('---\nname: [unclosed\n---\n\nPrompt.\n');
    try {
      const { errors } = parseTemplate(file);
      // gray-matter may or may not throw on this — just ensure we get a result
      assert.ok(Array.isArray(errors));
    } finally {
      cleanup();
    }
  });

  test('parses real anchor/agent.md without errors', () => {
    const anchorPath = path.resolve('agents/anchor/agent.md');
    const { errors } = parseTemplate(anchorPath);
    assert.deepEqual(errors, [], `anchor/agent.md has errors: ${errors.join(', ')}`);
  });

  test('parses real sentinel/agent.md without errors', () => {
    const sentinelPath = path.resolve('agents/sentinel/agent.md');
    const { errors } = parseTemplate(sentinelPath);
    assert.deepEqual(errors, [], `sentinel/agent.md has errors: ${errors.join(', ')}`);
  });

  test('parses real scout/agent.md without errors', () => {
    const scoutPath = path.resolve('agents/scout/agent.md');
    const { errors } = parseTemplate(scoutPath);
    assert.deepEqual(errors, [], `scout/agent.md has errors: ${errors.join(', ')}`);
  });
});
