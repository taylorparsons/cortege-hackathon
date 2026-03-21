import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FraudCaseStore } from '../storage/fraud-case-store.js';
import { analyzeFraudCase } from '../risk/fraud-case-analyzer.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('FraudCaseStore + Analyzer', () => {
  let dataDir;
  let store;

  beforeEach(() => {
    dataDir = makeTempDir('cortege-fraud-cases-');
    store = new FraudCaseStore(dataDir);
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  test('createCase persists a household-scoped fraud case and listCases returns it newest-first', async () => {
    const created = await store.createCase({
      household_id: 'hh_demo_001',
      event_id: 'evt_demo_001',
      evidence: {
        type: 'message_excerpt',
        content: 'Please keep this secret and send gift cards right away.',
      },
      analysis: {
        severity: 'high',
        score: 4,
        signals: ['urgency', 'secrecy', 'payment_pressure'],
        rationale: 'The message pressures the target to act quickly, hide the request, and pay with gift cards.',
        recommended_action: 'Do not engage. Verify the request through a known-good number.',
      },
    });

    assert.ok(created.case_id);
    assert.equal(created.household_id, 'hh_demo_001');

    const rawPath = path.join(dataDir, `${created.case_id}.json`);
    assert.equal(fs.existsSync(rawPath), true);

    const listed = await store.listCases('hh_demo_001');
    assert.equal(listed.length, 1);
    assert.equal(listed[0].case_id, created.case_id);
    assert.equal(listed[0].analysis.severity, 'high');
  });

  test('analyzeFraudCase uses conservative signals from the event and manual evidence', () => {
    const analysis = analyzeFraudCase({
      event: {
        source: 'twilio',
        payload: {
          from: '+12062857717',
          to: '+12066664210',
        },
      },
      evidence: {
        type: 'suspicious_url',
        content: 'Urgent. Your account is locked. Do not tell anyone. Verify now at http://bank-secure-login.net',
      },
    });

    assert.equal(analysis.severity, 'high');
    assert.ok(analysis.signals.includes('urgency'));
    assert.ok(analysis.signals.includes('secrecy'));
    assert.ok(analysis.signals.includes('suspicious_link'));
    assert.match(analysis.rationale, /risk|signal|suspicious|verify/i);
    assert.match(analysis.recommended_action, /verify|engage|call/i);
  });
});
