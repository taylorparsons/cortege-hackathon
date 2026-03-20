import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import request from 'supertest';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('Companion activity API', () => {
  const originalCwd = process.cwd();
  let tempRoot;

  beforeEach(() => {
    tempRoot = makeTempDir('cortege-companion-activity-');
    fs.mkdirSync(path.join(tempRoot, 'data', 'events'), { recursive: true });

    const fixtureEvents = [
      {
        id: 'evt_old_broadcast',
        type: 'financial_transaction',
        source: 'fixture',
        target_member: null,
        timestamp: '2026-03-18T10:00:00.000Z',
        payload: { description: 'old broadcast event' },
      },
      {
        id: 'evt_old_target',
        type: 'inbound_call',
        source: 'fixture',
        target_member: 'member_sam',
        timestamp: '2026-03-18T11:00:00.000Z',
        payload: { description: 'old targeted event' },
      },
      {
        id: 'evt_new_target',
        type: 'contact_request',
        source: 'fixture',
        target_member: 'member_sam',
        timestamp: '2026-03-20T16:00:00.000Z',
        payload: { description: 'new targeted event' },
      },
    ];

    fs.writeFileSync(
      path.join(tempRoot, 'data', 'events', '2026-03-20.jsonl'),
      fixtureEvents.map((event) => JSON.stringify(event)).join('\n') + '\n',
      'utf8'
    );
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('filters out events that predate the companion creation time', async () => {
    process.chdir(tempRoot);

    const routesUrl = new URL(`../api/routes.js?companion-activity=${Date.now()}`, import.meta.url);
    const { createApiRouter } = await import(routesUrl.href);

    const instance = {
      getMemberId() {
        return 'member_sam';
      },
      getStatus() {
        return { createdAt: '2026-03-20T15:00:00.000Z' };
      },
    };

    const app = express();
    app.use(express.json());
    app.use(createApiRouter({
      household: [],
      agentInstances: new Map([['sentinel-sam dodge', instance]]),
      agentFactory: { templates: new Map() },
      simulator: { runScenario: async () => ({ error: 'not available' }) },
      eventBus: { on: () => {} },
    }));

    const response = await request(app)
      .get('/api/companions/sentinel-sam%20dodge/activity?limit=20')
      .expect(200);

    assert.deepEqual(
      response.body.map((event) => event.id),
      ['evt_new_target']
    );
  });
});
