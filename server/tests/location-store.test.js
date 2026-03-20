import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocationStore } from '../storage/location-store.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('LocationStore', () => {
  let dataDir;
  let store;

  beforeEach(() => {
    dataDir = makeTempDir('cortege-locations-');
    store = new LocationStore(dataDir);
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  test('createLocation persists encrypted name/address and getLocation decrypts them', async () => {
    const location = await store.createLocation({
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

    const raw = fs.readFileSync(path.join(dataDir, `${location.location_id}.json`), 'utf8');
    assert.equal(raw.includes('Home'), false);
    assert.equal(raw.includes('123 Main St'), false);

    const fetched = await store.getLocation(location.location_id);
    assert.equal(fetched.name, 'Home');
    assert.equal(fetched.address.city, 'Austin');
    assert.equal(fetched.address_summary, 'Austin, TX, US');
  });

  test('listLocations returns decrypted summaries', async () => {
    await store.createLocation({
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

    const locations = await store.listLocations();

    assert.equal(locations.length, 1);
    assert.equal(locations[0].name, 'Home');
    assert.equal(locations[0].address_summary, 'Austin, TX, US');
  });

  test('ensureLegacyLocation creates a structured fallback from legacy location text', async () => {
    const location = await store.ensureLegacyLocation({
      legacyLocation: 'Legacy Home',
    });

    assert.equal(location.name, 'Legacy Home');
    assert.equal(location.address.line1, 'Legacy Home');
    assert.equal(location.address.city, 'Unknown');
  });

  test('deleteLocation removes persisted location records', async () => {
    const location = await store.createLocation({
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

    await store.deleteLocation(location.location_id);

    await assert.rejects(
      () => store.getLocation(location.location_id),
      /not found/
    );
  });
});
