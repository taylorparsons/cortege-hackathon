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

describe('Household + Location API', () => {
  let app;
  let rootDir;
  let householdStore;
  let locationStore;

  async function createLocation(overrides = {}) {
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
      ...overrides,
    });
  }

  beforeEach(() => {
    rootDir = makeTempDir('cortege-household-api-');
    householdStore = new HouseholdStore(path.join(rootDir, 'households'));
    locationStore = new LocationStore(path.join(rootDir, 'locations'));

    const orchestrator = {
      household: [],
      agentInstances: new Map(),
      agentFactory: { templates: new Map() },
      simulator: { runScenario: async () => ({ error: 'not available' }) },
      eventBus: { on: () => {} },
      householdStore,
      locationStore,
    };

    app = express();
    app.use(express.json());
    app.use(createApiRouter(orchestrator));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  test('POST /api/locations creates a location and GET /api/locations lists summaries', async () => {
    const created = await request(app).post('/api/locations').send({
      name: 'Home',
      address: {
        line1: '123 Main St',
        line2: null,
        city: 'Austin',
        region: 'TX',
        postal_code: '78701',
        country: 'US',
      },
    }).expect(201);

    assert.ok(created.body.location_id);
    assert.equal(created.body.name, 'Home');

    const listed = await request(app).get('/api/locations').expect(200);
    assert.equal(listed.body.length, 1);
    assert.equal(listed.body[0].name, 'Home');
    assert.equal(listed.body[0].address_summary, 'Austin, TX, US');
  });

  test('POST /api/households requires location_id and returns expanded location details', async () => {
    await request(app).post('/api/households').send({ name: 'Smith Family' }).expect(400);

    const location = await createLocation();
    const response = await request(app)
      .post('/api/households')
      .send({
        name: 'Smith Family',
        location_id: location.location_id,
        twilio_number: '+12065550111',
        pass_through_number: '+19147634039',
      })
      .expect(201);

    assert.ok(response.body.household_id);
    assert.equal(response.body.name, 'Smith Family');
    assert.equal(response.body.location_id, location.location_id);
    assert.equal(response.body.twilio_number, '+12065550111');
    assert.equal(response.body.pass_through_number, '+19147634039');
    assert.equal(response.body.location_name, 'Home');
    assert.equal(response.body.address_summary, 'Austin, TX, US');
    assert.equal(response.body.location_details.location_id, location.location_id);
  });

  test('PUT /api/households/:id reassigns a household to another location', async () => {
    const locationA = await createLocation({ name: 'Home' });
    const locationB = await createLocation({
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
    const household = await householdStore.createHousehold({
      name: 'Smith Family',
      location_id: locationA.location_id,
      twilio_number: '+12065550112',
    });

    const response = await request(app)
      .put(`/api/households/${household.household_id}`)
      .send({
        location_id: locationB.location_id,
        twilio_number: '+12065550113',
        pass_through_number: '+19147634753',
      })
      .expect(200);

    assert.equal(response.body.location_id, locationB.location_id);
    assert.equal(response.body.location_name, 'Cabin');
    assert.equal(response.body.address_summary, 'Bend, OR, US');
    assert.equal(response.body.twilio_number, '+12065550113');
    assert.equal(response.body.pass_through_number, '+19147634753');
  });

  test('household routes validate pass_through_number as E.164 when provided', async () => {
    const location = await createLocation();

    await request(app)
      .post('/api/households')
      .send({
        name: 'Invalid Pass Through Family',
        location_id: location.location_id,
        pass_through_number: '914-764-4039',
      })
      .expect(400);
  });

  test('household routes reject duplicate twilio_number values', async () => {
    const location = await createLocation();

    await request(app)
      .post('/api/households')
      .send({
        name: 'Family A',
        location_id: location.location_id,
        twilio_number: '+12065550114',
      })
      .expect(201);

    await request(app)
      .post('/api/households')
      .send({
        name: 'Family B',
        location_id: location.location_id,
        twilio_number: '+12065550114',
      })
      .expect(409);
  });

  test('DELETE /api/locations/:id rejects referenced locations with blocking households', async () => {
    const location = await createLocation();
    await householdStore.createHousehold({
      name: 'Family A',
      location_id: location.location_id,
    });

    const response = await request(app)
      .delete(`/api/locations/${location.location_id}`)
      .expect(409);

    assert.equal(response.body.location_id, location.location_id);
    assert.equal(response.body.households.length, 1);
    assert.equal(response.body.households[0].name, 'Family A');
  });

  test('DELETE /api/locations/:id deletes unreferenced locations', async () => {
    const location = await createLocation();

    await request(app)
      .delete(`/api/locations/${location.location_id}`)
      .expect(200);

    await request(app)
      .get(`/api/locations/${location.location_id}`)
      .expect(404);
  });

  test('member routes enforce E.164 phone validation', async () => {
    const location = await createLocation();
    const household = await householdStore.createHousehold({
      name: 'Phone Test Family',
      location_id: location.location_id,
    });

    await request(app)
      .post(`/api/households/${household.household_id}/members`)
      .send({
        name: 'Alice Example',
        phone: '555-0100',
        profile_type: 'adult',
        companion: 'sentinel',
      })
      .expect(400);

    const created = await request(app)
      .post(`/api/households/${household.household_id}/members`)
      .send({
        name: 'Alice Example',
        phone: '+14155550100',
        date_of_birth: '1980-04-12',
        profile_type: 'adult',
        companion: 'sentinel',
      })
      .expect(201);

    assert.equal(created.body.phone, '+14155550100');
    assert.equal(created.body.date_of_birth, '1980-04-12');
  });
});
