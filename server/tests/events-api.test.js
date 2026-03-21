import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApiRouter } from '../api/routes.js';
import SQLiteDatabase from '../storage/db.js';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('Events API', () => {
  let rootDir;
  let dbPath;
  let db;
  let app;
  let originalDbPath;
  let originalStorageMode;

  beforeEach(() => {
    rootDir = makeTempDir('cortege-events-api-');
    dbPath = path.join(rootDir, 'events.db');
    db = new SQLiteDatabase(dbPath);

    originalDbPath = process.env.SQLITE_DB_PATH;
    originalStorageMode = process.env.STORAGE_MODE;
    process.env.SQLITE_DB_PATH = dbPath;
    process.env.STORAGE_MODE = 'sqlite';

    db.writeEvent({
      event_id: 'evt_live_001',
      type: 'inbound_call',
      source: 'twilio',
      target_member: 'member_primary',
      payload: JSON.stringify({
        from: '+14155550199',
        to: '+12066664210',
        twilio_call_sid: 'CA_LIVE_001',
      }),
      timestamp: '2026-03-20T23:43:49.591Z',
    });

    app = express();
    app.use(createApiRouter({
      household: [],
      agentInstances: new Map(),
      agentFactory: { templates: new Map() },
      simulator: { runScenario: async () => ({ error: 'not available' }) },
      eventBus: { on: () => {} },
      householdStore: null,
      locationStore: null,
    }));
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

  test('GET /api/events returns recent live events from the active storage backend', async () => {
    const response = await request(app)
      .get('/api/events?limit=5')
      .expect(200);

    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].source, 'twilio');
    assert.equal(response.body[0].payload.twilio_call_sid, 'CA_LIVE_001');
    assert.equal(response.body[0].target_member, 'member_primary');
  });
});
