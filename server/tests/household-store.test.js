import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HouseholdStore } from '../storage/household-store.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('HouseholdStore', () => {
  let dataDir;
  let store;

  beforeEach(() => {
    dataDir = makeTempDir('cortege-households-');
    store = new HouseholdStore(dataDir);
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  test('createHousehold returns decrypted data and persists encrypted household name', async () => {
    const household = await store.createHousehold({
      name: 'Test Family',
      location_id: 'loc_home',
    });

    assert.ok(household.household_id);
    assert.equal(household.name, 'Test Family');
    assert.equal(household.location_id, 'loc_home');
    assert.deepEqual(household.members, []);

    const raw = fs.readFileSync(path.join(dataDir, `${household.household_id}.json`), 'utf8');
    assert.equal(raw.includes('Test Family'), false);
    assert.equal(raw.includes('"name_enc"'), true);
  });

  test('listHouseholds returns decrypted summaries', async () => {
    await store.createHousehold({ name: 'Family 1', location_id: 'loc_1' });
    await store.createHousehold({ name: 'Family 2', location_id: 'loc_2' });

    const households = await store.listHouseholds();

    assert.equal(households.length, 2);
    assert.equal(households[0].name.length > 0, true);
    assert.equal(households[0].member_count, 0);
  });

  test('addMember encrypts direct PII at rest and returns decrypted member data', async () => {
    const household = await store.createHousehold({ name: 'Test Family', location_id: 'loc_1' });
    const member = await store.addMember(household.household_id, {
      name: 'Alice Example',
      phone: '+14155550123',
      date_of_birth: '1980-04-12',
      profile_type: 'adult',
      companion: 'sentinel',
    });

    assert.ok(member.id);
    assert.equal(member.name, 'Alice Example');
    assert.equal(member.phone, '+14155550123');
    assert.equal(member.date_of_birth, '1980-04-12');

    const raw = fs.readFileSync(path.join(dataDir, `${household.household_id}.json`), 'utf8');
    assert.equal(raw.includes('Alice Example'), false);
    assert.equal(raw.includes('+14155550123'), false);
    assert.equal(raw.includes('1980-04-12'), false);
    assert.equal(raw.includes('"phone_token"'), true);
  });

  test('updateMember supports encrypted PII and plaintext routing fields', async () => {
    const household = await store.createHousehold({ name: 'Test Family', location_id: 'loc_1' });
    const member = await store.addMember(household.household_id, {
      name: 'Jane Doe',
      phone: '+14155550111',
      date_of_birth: '1990-05-01',
      profile_type: 'adult',
      companion: 'sentinel',
    });

    const updated = await store.updateMember(household.household_id, member.id, {
      name: 'Jane Smith',
      phone: '+14155550999',
      is_primary: true,
      primary_contact: 'member_other',
    });

    assert.equal(updated.name, 'Jane Smith');
    assert.equal(updated.phone, '+14155550999');
    assert.equal(updated.is_primary, true);
    assert.equal(updated.primary_contact, 'member_other');
  });

  test('findHouseholdsByLocationId returns referencing households', async () => {
    const a = await store.createHousehold({ name: 'Family A', location_id: 'loc_shared' });
    await store.createHousehold({ name: 'Family B', location_id: 'loc_shared' });
    await store.createHousehold({ name: 'Family C', location_id: 'loc_other' });

    const households = await store.findHouseholdsByLocationId('loc_shared');

    assert.equal(households.length, 2);
    assert.equal(households.some((household) => household.household_id === a.household_id), true);
  });

  test('legacy plaintext household records remain readable', async () => {
    const householdId = 'hh_legacy01';
    fs.writeFileSync(
      path.join(dataDir, `${householdId}.json`),
      JSON.stringify(
        {
          household_id: householdId,
          name: 'Legacy Family',
          location: 'Legacy Home',
          created: '2026-03-20T00:00:00.000Z',
          members: [
            {
              id: 'member_legacy',
              name: 'Legacy Member',
              phone: '+14155550155',
              date_of_birth: '1970-01-01',
              profile_type: 'senior',
              companion: 'anchor',
            },
          ],
        },
        null,
        2
      )
    );

    const household = await store.getHousehold(householdId);

    assert.equal(household.name, 'Legacy Family');
    assert.equal(household.location, 'Legacy Home');
    assert.equal(household.members[0].name, 'Legacy Member');
    assert.equal(household.members[0].phone, '+14155550155');
  });
});
