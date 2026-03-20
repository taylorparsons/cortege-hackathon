/**
 * HouseholdStore — Multi-household management with file-based storage.
 * Implements: FR-001, FR-002, FR-003
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export class HouseholdStore {
  constructor(dataDir = 'data/households') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async createHousehold({ name, location }) {
    const household = {
      household_id: `hh_${randomUUID().slice(0, 8)}`,
      name,
      location,
      created: new Date().toISOString(),
      members: []
    };
    
    const filepath = path.join(this.dataDir, `${household.household_id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(household, null, 2));
    
    return household;
  }

  async listHouseholds() {
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8'));
      return {
        household_id: data.household_id,
        name: data.name,
        location: data.location,
        member_count: data.members?.length ?? 0
      };
    });
  }

  async getHousehold(householdId) {
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Household ${householdId} not found`);
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  async updateHousehold(householdId, updates) {
    const household = await this.getHousehold(householdId);
    Object.assign(household, updates);
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(household, null, 2));
    return household;
  }

  async deleteHousehold(householdId) {
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  async addMember(householdId, memberData) {
    const household = await this.getHousehold(householdId);
    
    const member = {
      id: `member_${randomUUID().slice(0, 8)}`,
      name: memberData.name,
      age: memberData.age,
      profile_type: memberData.profile_type,
      companion: memberData.companion,
      is_primary: memberData.is_primary ?? false,
      primary_contact: memberData.primary_contact ?? null
    };
    
    household.members.push(member);
    
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(household, null, 2));
    
    return member;
  }

  async updateMember(householdId, memberId, updates) {
    const household = await this.getHousehold(householdId);
    const member = household.members.find(m => m.id === memberId);
    
    if (!member) {
      throw new Error(`Member ${memberId} not found in household ${householdId}`);
    }
    
    Object.assign(member, updates);
    
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(household, null, 2));
    
    return member;
  }

  async removeMember(householdId, memberId) {
    const household = await this.getHousehold(householdId);
    const index = household.members.findIndex(m => m.id === memberId);
    
    if (index === -1) {
      throw new Error(`Member ${memberId} not found in household ${householdId}`);
    }
    
    household.members.splice(index, 1);
    
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(household, null, 2));
  }
}
