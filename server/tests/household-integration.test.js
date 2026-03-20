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

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('Household integration', () => {
  let app;
  let rootDir;
  let householdStore;
  let locationStore;

  beforeEach(() => {
    rootDir = makeTempDir('cortege-household-int-');
    householdStore = new HouseholdStore(path.join(rootDir, 'households'));
    locationStore = new LocationStore(path.join(rootDir, 'locations'));

    app = express();
    app.use(express.json());
    app.use(createApiRouter({
      household: [],
      agentInstances: new Map(),
      agentFactory: { templates: new Map() },
      simulator: { runScenario: async () => ({ error: 'not available' }) },
      eventBus: { on: () => {} },
      householdStore,
      locationStore,
    }));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  test('create household, add/update/delete member, and reassign location end-to-end', async () => {
    const home = await locationStore.createLocation({
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
    const cabin = await locationStore.createLocation({
      name: 'Cabin',
      address: {
        line1: '9 Lake Rd',
        line2: null,
        city: 'Bend',
        region: 'OR',
        postal_code: '97701',
        country: 'US',
      },
    });

    const createRes = await request(app)
      .post('/api/households')
      .send({ name: 'Integration Test Family', location_id: home.location_id })
      .expect(201);

    const householdId = createRes.body.household_id;
    assert.equal(createRes.body.location_name, 'Home');

    const memberRes = await request(app)
      .post(`/api/households/${householdId}/members`)
      .send({
        name: 'Test User',
        phone: '+14155550123',
        date_of_birth: '1990-03-22',
        profile_type: 'adult',
        companion: 'sentinel',
      })
      .expect(201);

    const memberId = memberRes.body.id;
    assert.equal(memberRes.body.name, 'Test User');

    const updatedMember = await request(app)
      .put(`/api/households/${householdId}/members/${memberId}`)
      .send({
        phone: '+14155550124',
        is_primary: true,
      })
      .expect(200);

    assert.equal(updatedMember.body.phone, '+14155550124');
    assert.equal(updatedMember.body.is_primary, true);

    const reassigned = await request(app)
      .put(`/api/households/${householdId}`)
      .send({ location_id: cabin.location_id })
      .expect(200);

    assert.equal(reassigned.body.location_name, 'Cabin');
    assert.equal(reassigned.body.address_summary, 'Bend, OR, US');

    await request(app)
      .delete(`/api/households/${householdId}/members/${memberId}`)
      .expect(200);

    const finalRes = await request(app)
      .get(`/api/households/${householdId}`)
      .expect(200);

    assert.equal(finalRes.body.members.length, 0);
    assert.equal(finalRes.body.location_id, cabin.location_id);
  });

  test('GET /api/household falls back to first household store record', async () => {
    const location = await locationStore.createLocation({
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
    const household = await householdStore.createHousehold({
      name: 'Default Household',
      location_id: location.location_id,
    });

    const response = await request(app).get('/api/household').expect(200);

    assert.equal(response.body.household_id, household.household_id);
    assert.equal(response.body.location_name, 'Home');
  });
});
