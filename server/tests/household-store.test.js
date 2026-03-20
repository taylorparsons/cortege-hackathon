import { describe, it, expect, beforeEach } from 'vitest';
import { HouseholdStore } from '../storage/household-store.js';
import fs from 'node:fs';

describe('HouseholdStore', () => {
  const testDir = 'data/test-households';
  
  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should create a new household', async () => {
    const store = new HouseholdStore(testDir);
    const household = await store.createHousehold({
      name: 'Test Family',
      location: 'Portland, OR'
    });
    
    expect(household.household_id).toBeDefined();
    expect(household.name).toBe('Test Family');
    expect(household.members).toEqual([]);
  });

  it('should list all households', async () => {
    const store = new HouseholdStore(testDir);
    await store.createHousehold({ name: 'Family 1', location: 'NYC' });
    await store.createHousehold({ name: 'Family 2', location: 'LA' });
    
    const households = await store.listHouseholds();
    expect(households).toHaveLength(2);
    expect(households[0].name).toBeDefined();
    expect(households[0].member_count).toBe(0);
  });

  it('should get a specific household', async () => {
    const store = new HouseholdStore(testDir);
    const created = await store.createHousehold({ name: 'Test Family', location: 'Seattle' });
    
    const household = await store.getHousehold(created.household_id);
    expect(household.name).toBe('Test Family');
    expect(household.location).toBe('Seattle');
  });

  it('should update household metadata', async () => {
    const store = new HouseholdStore(testDir);
    const created = await store.createHousehold({ name: 'Old Name', location: 'Old Location' });
    
    const updated = await store.updateHousehold(created.household_id, {
      name: 'New Name',
      location: 'New Location'
    });
    
    expect(updated.name).toBe('New Name');
    expect(updated.location).toBe('New Location');
  });

  it('should delete a household', async () => {
    const store = new HouseholdStore(testDir);
    const created = await store.createHousehold({ name: 'Delete Me', location: 'Nowhere' });
    
    await store.deleteHousehold(created.household_id);
    
    await expect(store.getHousehold(created.household_id)).rejects.toThrow('not found');
  });

  it('should add member to household', async () => {
    const store = new HouseholdStore(testDir);
    const household = await store.createHousehold({ name: 'Test Family', location: 'Seattle' });
    
    const member = await store.addMember(household.household_id, {
      name: 'John Doe',
      age: 45,
      profile_type: 'adult',
      companion: 'sentinel'
    });
    
    expect(member.id).toBeDefined();
    expect(member.name).toBe('John Doe');
    
    const updated = await store.getHousehold(household.household_id);
    expect(updated.members).toHaveLength(1);
  });

  it('should update member', async () => {
    const store = new HouseholdStore(testDir);
    const household = await store.createHousehold({ name: 'Test Family', location: 'Seattle' });
    const member = await store.addMember(household.household_id, {
      name: 'Jane Doe',
      age: 40,
      profile_type: 'adult',
      companion: 'sentinel'
    });
    
    const updated = await store.updateMember(household.household_id, member.id, { age: 41 });
    expect(updated.age).toBe(41);
  });

  it('should remove member from household', async () => {
    const store = new HouseholdStore(testDir);
    const household = await store.createHousehold({ name: 'Test Family', location: 'Seattle' });
    const member = await store.addMember(household.household_id, {
      name: 'Charlie Brown',
      age: 12,
      profile_type: 'child',
      companion: 'scout'
    });
    
    await store.removeMember(household.household_id, member.id);
    
    const updated = await store.getHousehold(household.household_id);
    expect(updated.members).toHaveLength(0);
  });
});
