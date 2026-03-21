import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { HouseholdStore } from '../storage/household-store.js';
import { createTwilioRouter } from '../ingestion/twilio-webhook.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('Twilio voice webhook', () => {
  let app;
  let rootDir;
  let householdStore;
  let emitted;
  let eventBus;

  beforeEach(() => {
    rootDir = makeTempDir('cortege-twilio-webhook-');
    householdStore = new HouseholdStore(path.join(rootDir, 'households'));
    emitted = [];
    eventBus = {
      emit(event) {
        emitted.push(event);
        return event;
      },
    };

    app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use('/ingest/twilio', createTwilioRouter({ householdStore, eventBus }));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  test('POST /ingest/twilio/voice emits an inbound_call event with resolved household_id', async () => {
    const household = await householdStore.createHousehold({
      name: 'Twilio Family',
      location_id: 'loc_home',
      twilio_number: '+12066664210',
    });
    const primaryMember = await householdStore.addMember(household.household_id, {
      name: 'Primary Member',
      phone: '+14155550123',
      date_of_birth: '1980-04-12',
      profile_type: 'adult',
      companion: 'sentinel',
      is_primary: true,
    });
    await householdStore.addMember(household.household_id, {
      name: 'Secondary Member',
      phone: '+14155550124',
      date_of_birth: '1981-04-12',
      profile_type: 'adult',
      companion: 'sentinel',
      is_primary: false,
    });

    const response = await request(app)
      .post('/ingest/twilio/voice')
      .type('form')
      .send({
        CallSid: 'CA123',
        From: '+14155550199',
        To: '+12066664210',
        CallStatus: 'ringing',
        Direction: 'inbound',
      })
      .expect(200);

    assert.match(response.text, /<Response><\/Response>/);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].type, 'inbound_call');
    assert.equal(emitted[0].source, 'twilio');
    assert.equal(emitted[0].household_id, household.household_id);
    assert.equal(emitted[0].target_member, primaryMember.id);
    assert.equal(emitted[0].payload.to, '+12066664210');
    assert.equal(emitted[0].metadata.twilio_call_sid, 'CA123');
  });

  test('POST /ingest/twilio/voice falls back to the first household member when no primary exists', async () => {
    const household = await householdStore.createHousehold({
      name: 'No Primary Family',
      location_id: 'loc_home',
      twilio_number: '+12065550111',
    });
    const firstMember = await householdStore.addMember(household.household_id, {
      name: 'First Member',
      phone: '+14155550131',
      date_of_birth: '1985-01-01',
      profile_type: 'adult',
      companion: 'sentinel',
      is_primary: false,
    });
    await householdStore.addMember(household.household_id, {
      name: 'Second Member',
      phone: '+14155550132',
      date_of_birth: '1986-01-01',
      profile_type: 'adult',
      companion: 'sentinel',
      is_primary: false,
    });

    await request(app)
      .post('/ingest/twilio/voice')
      .type('form')
      .send({
        CallSid: 'CA124',
        From: '+14155550199',
        To: '+12065550111',
      })
      .expect(200);

    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].target_member, firstMember.id);
  });

  test('POST /ingest/twilio/voice rejects unknown household twilio numbers', async () => {
    const response = await request(app)
      .post('/ingest/twilio/voice')
      .type('form')
      .send({
        CallSid: 'CA404',
        From: '+14155550199',
        To: '+12065550999',
      })
      .expect(404);

    assert.equal(response.body.error, 'No household is assigned to this Twilio number');
    assert.equal(emitted.length, 0);
  });
});
