/**
 * Household Integration Tests
 * Verifies: FR-001 through FR-005 (end-to-end household workflow)
 * Implements: NFR-001
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../api/routes.js';
import { HouseholdStore } from '../storage/household-store.js';
import fs from 'node:fs';

describe('Household Integration', () => {
  let app;
  let householdStore;
  const testDir = 'data/test-integration';

  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }

    householdStore = new HouseholdStore(`${testDir}/households`);

    // Mock orchestrator with household store enabled
    const mockOrchestrator = {
      household: [],
      agentInstances: new Map(),
      agentFactory: { templates: new Map() },
      simulator: { runScenario: async () => ({ error: 'not available' }) },
      eventBus: { on: () => {} },
      householdStore,
    };

    app = express();
    app.use(express.json());
    app.use(createApiRouter(mockOrchestrator));
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should create household, add members, update, and fetch data', async () => {
    // Create household
    const createRes = await request(app)
      .post('/api/households')
      .send({ name: 'Integration Test Family', location: 'Test City' })
      .expect(201);

    const householdId = createRes.body.household_id;
    expect(householdId).toBeDefined();
    expect(createRes.body.name).toBe('Integration Test Family');

    // Add member
    const memberRes = await request(app)
      .post(`/api/households/${householdId}/members`)
      .send({
        name: 'Test User',
        age: 30,
        profile_type: 'adult',
        companion: 'sentinel'
      })
      .expect(201);

    const memberId = memberRes.body.id;
    expect(memberId).toBeDefined();
    expect(memberRes.body.name).toBe('Test User');

    // Fetch household with members
    const getRes = await request(app)
      .get(`/api/households/${householdId}`)
      .expect(200);

    expect(getRes.body.members).toHaveLength(1);
    expect(getRes.body.members[0].name).toBe('Test User');

    // Update member
    await request(app)
      .put(`/api/households/${householdId}/members/${memberId}`)
      .send({ age: 31 })
      .expect(200);

    // Verify update
    const updatedRes = await request(app)
      .get(`/api/households/${householdId}`)
      .expect(200);

    expect(updatedRes.body.members[0].age).toBe(31);

    // Delete member
    await request(app)
      .delete(`/api/households/${householdId}/members/${memberId}`)
      .expect(200);

    // Verify deletion
    const afterDeleteRes = await request(app)
      .get(`/api/households/${householdId}`)
      .expect(200);

    expect(afterDeleteRes.body.members).toHaveLength(0);
  });

  it('should list multiple households', async () => {
    await request(app)
      .post('/api/households')
      .send({ name: 'Family A', location: 'NYC' })
      .expect(201);

    await request(app)
      .post('/api/households')
      .send({ name: 'Family B', location: 'LA' })
      .expect(201);

    const listRes = await request(app)
      .get('/api/households')
      .expect(200);

    // At least 2 from this test (plus 1 from previous test)
    expect(listRes.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 404 for non-existent household', async () => {
    await request(app)
      .get('/api/households/hh_nonexistent')
      .expect(404);
  });

  it('should use backward-compatible /api/household endpoint', async () => {
    const res = await request(app)
      .get('/api/household')
      .expect(200);

    // Should return first available household from store
    expect(res.body.household_id).toBeDefined();
    expect(res.body.name).toBeDefined();
  });
});
