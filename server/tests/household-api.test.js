import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../api/routes.js';
import { HouseholdStore } from '../storage/household-store.js';
import fs from 'node:fs';

describe('Household API', () => {
  let app;
  let householdStore;
  const testDir = 'data/test-households-api';

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    householdStore = new HouseholdStore(testDir);
    
    const mockOrchestrator = {
      household: [],
      agentInstances: new Map(),
      householdStore
    };
    
    app = express();
    app.use(express.json());
    app.use(createApiRouter(mockOrchestrator));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('POST /api/households - creates new household', async () => {
    const response = await request(app)
      .post('/api/households')
      .send({ name: 'Smith Family', location: 'Austin, TX' })
      .expect(201);
    
    expect(response.body.household_id).toBeDefined();
    expect(response.body.name).toBe('Smith Family');
  });

  it('GET /api/households - lists all households', async () => {
    await householdStore.createHousehold({ name: 'Family 1', location: 'NYC' });
    await householdStore.createHousehold({ name: 'Family 2', location: 'LA' });
    
    const response = await request(app)
      .get('/api/households')
      .expect(200);
    
    expect(response.body).toHaveLength(2);
  });

  it('GET /api/households/:id - gets specific household', async () => {
    const household = await householdStore.createHousehold({ 
      name: 'Test Family', 
      location: 'Seattle' 
    });
    
    const response = await request(app)
      .get(`/api/households/${household.household_id}`)
      .expect(200);
    
    expect(response.body.name).toBe('Test Family');
  });

  it('PUT /api/households/:id - updates household', async () => {
    const household = await householdStore.createHousehold({ 
      name: 'Old Name', 
      location: 'Old Location' 
    });
    
    const response = await request(app)
      .put(`/api/households/${household.household_id}`)
      .send({ name: 'New Name' })
      .expect(200);
    
    expect(response.body.name).toBe('New Name');
  });

  it('DELETE /api/households/:id - deletes household', async () => {
    const household = await householdStore.createHousehold({ 
      name: 'Delete Me', 
      location: 'Portland' 
    });
    
    await request(app)
      .delete(`/api/households/${household.household_id}`)
      .expect(200);
    
    await request(app)
      .get(`/api/households/${household.household_id}`)
      .expect(404);
  });

  it('POST /api/households/:id/members - adds member', async () => {
    const household = await householdStore.createHousehold({ 
      name: 'Test Family', 
      location: 'Seattle' 
    });
    
    const response = await request(app)
      .post(`/api/households/${household.household_id}/members`)
      .send({
        name: 'Alice Smith',
        age: 35,
        profile_type: 'adult',
        companion: 'sentinel'
      })
      .expect(201);
    
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Alice Smith');
  });

  it('PUT /api/households/:id/members/:memberId - updates member', async () => {
    const household = await householdStore.createHousehold({ 
      name: 'Test Family', 
      location: 'Seattle' 
    });
    const member = await householdStore.addMember(household.household_id, {
      name: 'Bob Jones',
      age: 40,
      profile_type: 'adult',
      companion: 'sentinel'
    });
    
    const response = await request(app)
      .put(`/api/households/${household.household_id}/members/${member.id}`)
      .send({ age: 41 })
      .expect(200);
    
    expect(response.body.age).toBe(41);
  });

  it('DELETE /api/households/:id/members/:memberId - removes member', async () => {
    const household = await householdStore.createHousehold({ 
      name: 'Test Family', 
      location: 'Seattle' 
    });
    const member = await householdStore.addMember(household.household_id, {
      name: 'Charlie Brown',
      age: 12,
      profile_type: 'child',
      companion: 'scout'
    });
    
    await request(app)
      .delete(`/api/households/${household.household_id}/members/${member.id}`)
      .expect(200);
  });
});
