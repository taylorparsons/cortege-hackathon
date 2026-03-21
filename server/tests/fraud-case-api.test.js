import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApiRouter } from '../api/routes.js';
import { HouseholdStore } from '../storage/household-store.js';
import { LocationStore } from '../storage/location-store.js';
import { FraudCaseStore } from '../storage/fraud-case-store.js';
import SQLiteDatabase from '../storage/db.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('Fraud Case API', () => {
  let app;
  let rootDir;
  let householdStore;
  let locationStore;
  let fraudCaseStore;
  let db;
  let originalDbPath;
  let originalStorageMode;

  beforeEach(async () => {
    rootDir = makeTempDir('cortege-fraud-case-api-');
    householdStore = new HouseholdStore(path.join(rootDir, 'households'));
    locationStore = new LocationStore(path.join(rootDir, 'locations'));
    fraudCaseStore = new FraudCaseStore(path.join(rootDir, 'fraud-cases'));

    originalDbPath = process.env.SQLITE_DB_PATH;
    originalStorageMode = process.env.STORAGE_MODE;
    process.env.SQLITE_DB_PATH = path.join(rootDir, 'events.db');
    process.env.STORAGE_MODE = 'sqlite';
    db = new SQLiteDatabase(process.env.SQLITE_DB_PATH);

    const orchestrator = {
      household: [],
      agentInstances: new Map(),
      agentFactory: { templates: new Map() },
      simulator: { runScenario: async () => ({ error: 'not available' }) },
      eventBus: { on: () => {} },
      householdStore,
      locationStore,
      fraudCaseStore,
    };

    app = express();
    app.use(express.json());
    app.use(createApiRouter(orchestrator));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
    if (originalDbPath === undefined) {
      delete process.env.SQLITE_DB_PATH;
    } else {
      process.env.SQLITE_DB_PATH = originalDbPath;
    }
    if (originalStorageMode === undefined) {
      delete process.env.STORAGE_MODE;
    } else {
      process.env.STORAGE_MODE = originalStorageMode;
    }
  });

  async function createLocation() {
    return locationStore.createLocation({
      name: 'Home',
      address: {
        line1: '123 Main St',
        line2: null,
        city: 'Austin',
        region: 'TX',
        postal_code: '78701',
        country: 'US',
      },
    });
  }

  test('POST /api/fraud-cases creates a household-scoped case and GET /api/fraud-cases lists it', async () => {
    const location = await createLocation();
    const household = await householdStore.createHousehold({
      name: 'Demo Household',
      location_id: location.location_id,
      twilio_number: '+12066664210',
    });

    db.writeEvent({
      event_id: 'evt_demo_case_001',
      type: 'inbound_call',
      source: 'twilio',
      target_member: 'member_demo_001',
      payload: JSON.stringify({
        from: '+12062857717',
        to: '+12066664210',
        twilio_call_sid: 'CA_DEMO_001',
      }),
      timestamp: '2026-03-21T00:07:50.669Z',
    });

    const created = await request(app)
      .post('/api/fraud-cases')
      .send({
        household_id: household.household_id,
        event_id: 'evt_demo_case_001',
        evidence: {
          type: 'suspicious_url',
          content: 'Urgent. Verify now at http://bank-secure-login.net and do not tell anyone.',
        },
      })
      .expect(201);

    assert.ok(created.body.case_id);
    assert.equal(created.body.household_id, household.household_id);
    assert.equal(created.body.event_id, 'evt_demo_case_001');
    assert.equal(created.body.analysis.severity, 'high');
    assert.ok(created.body.analysis.signals.includes('suspicious_link'));

    const listed = await request(app)
      .get(`/api/fraud-cases?household_id=${encodeURIComponent(household.household_id)}`)
      .expect(200);

    assert.equal(listed.body.length, 1);
    assert.equal(listed.body[0].case_id, created.body.case_id);
  });

  test('POST /api/fraud-cases rejects events that do not belong to the requested household', async () => {
    const location = await createLocation();
    const householdA = await householdStore.createHousehold({
      name: 'Household A',
      location_id: location.location_id,
      twilio_number: '+12066664210',
    });
    const householdB = await householdStore.createHousehold({
      name: 'Household B',
      location_id: location.location_id,
      twilio_number: '+12065550121',
    });

    db.writeEvent({
      event_id: 'evt_demo_case_002',
      type: 'inbound_call',
      source: 'twilio',
      target_member: 'member_demo_002',
      payload: JSON.stringify({
        from: '+12062857717',
        to: '+12066664210',
        twilio_call_sid: 'CA_DEMO_002',
      }),
      timestamp: '2026-03-21T00:08:00.000Z',
    });

    await request(app)
      .post('/api/fraud-cases')
      .send({
        household_id: householdB.household_id,
        event_id: 'evt_demo_case_002',
        evidence: {
          type: 'message_excerpt',
          content: 'Please send money right now.',
        },
      })
      .expect(400);

    const listed = await request(app)
      .get(`/api/fraud-cases?household_id=${encodeURIComponent(householdA.household_id)}`)
      .expect(200);

    assert.equal(listed.body.length, 0);
  });
});
