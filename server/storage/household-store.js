/**
 * HouseholdStore — Multi-household management with file-based storage.
 * Implements: FR-001, FR-002, FR-003
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  decryptHouseholdName,
  decryptMemberFromStorage,
  encryptHouseholdName,
  encryptMemberForStorage,
} from '../privacy/pii.js';

export class HouseholdStore {
  constructor(dataDir = 'data/households') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async createHousehold({
    name,
    location_id = null,
    location = null,
    address = null,
    twilio_number = null,
    pass_through_number = null,
  }) {
    const household = {
      household_id: `hh_${randomUUID().slice(0, 8)}`,
      name,
      location_id,
      twilio_number,
      pass_through_number,
      location,
      address,
      created: new Date().toISOString(),
      members: [],
    };

    const filepath = path.join(this.dataDir, `${household.household_id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(this._encodeHousehold(household), null, 2));

    return this.getHousehold(household.household_id);
  }

  async listHouseholds() {
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8'));
      const household = this._decodeHousehold(data);
      return {
        household_id: household.household_id,
        name: household.name,
        location_id: household.location_id ?? null,
        twilio_number: household.twilio_number ?? null,
        pass_through_number: household.pass_through_number ?? null,
        location: household.location ?? null,
        member_count: household.members?.length ?? 0
      };
    });
  }

  async getHousehold(householdId) {
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Household ${householdId} not found`);
    }
    return this._decodeHousehold(JSON.parse(fs.readFileSync(filepath, 'utf8')));
  }

  async updateHousehold(householdId, updates) {
    const household = await this.getHousehold(householdId);
    if (updates.name !== undefined) household.name = updates.name;
    if (updates.location_id !== undefined) household.location_id = updates.location_id;
    if (updates.twilio_number !== undefined) household.twilio_number = updates.twilio_number;
    if (updates.pass_through_number !== undefined) household.pass_through_number = updates.pass_through_number;
    if (updates.location !== undefined) household.location = updates.location;
    if (updates.address !== undefined) household.address = updates.address;
    household.updated_at = new Date().toISOString();
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(this._encodeHousehold(household), null, 2));
    return this.getHousehold(householdId);
  }

  async deleteHousehold(householdId) {
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Household ${householdId} not found`);
    }
    fs.unlinkSync(filepath);
  }

  async findHouseholdsByLocationId(locationId) {
    if (!locationId) return [];

    const households = await this.listHouseholds();
    return households.filter((household) => household.location_id === locationId);
  }

  async findHouseholdByTwilioNumber(twilioNumber) {
    if (!twilioNumber) return null;

    const households = await this.listHouseholds();
    return households.find((household) => household.twilio_number === twilioNumber) ?? null;
  }

  async addMember(householdId, memberData) {
    const household = await this.getHousehold(householdId);
    
    const member = {
      id: `member_${randomUUID().slice(0, 8)}`,
      name: memberData.name,
      date_of_birth: memberData.date_of_birth ?? null,
      phone: memberData.phone ?? null,
      email: memberData.email ?? null,
      profile_type: memberData.profile_type,
      companion: memberData.companion,
      is_primary: memberData.is_primary ?? false,
      primary_contact: memberData.primary_contact ?? null
    };
    
    household.members.push(member);
    
    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(this._encodeHousehold(household), null, 2));
    
    return member;
  }

  async updateMember(householdId, memberId, updates) {
    const household = await this.getHousehold(householdId);
    const member = household.members.find(m => m.id === memberId);
    
    if (!member) {
      throw new Error(`Member ${memberId} not found in household ${householdId}`);
    }
    
    const allowedMember = [
      'name',
      'date_of_birth',
      'profile_type',
      'companion',
      'phone',
      'email',
      'is_primary',
      'primary_contact',
    ];
    for (const key of allowedMember) {
      if (updates[key] !== undefined) member[key] = updates[key];
    }

    const filepath = path.join(this.dataDir, `${householdId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(this._encodeHousehold(household), null, 2));
    
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
    fs.writeFileSync(filepath, JSON.stringify(this._encodeHousehold(household), null, 2));
  }

  _decodeHousehold(raw) {
    return {
      household_id: raw.household_id,
      name: decryptHouseholdName(raw),
      location_id: raw.location_id ?? null,
      twilio_number: raw.twilio_number ?? null,
      pass_through_number: raw.pass_through_number ?? null,
      location: raw.location ?? null,
      address: raw.address ?? null,
      created: raw.created,
      updated_at: raw.updated_at ?? null,
      members: (raw.members ?? []).map((member) => decryptMemberFromStorage(member)),
    };
  }

  _encodeHousehold(household) {
    return {
      household_id: household.household_id,
      name_enc: encryptHouseholdName(household.name),
      location_id: household.location_id ?? null,
      twilio_number: household.twilio_number ?? null,
      pass_through_number: household.pass_through_number ?? null,
      location: household.location ?? null,
      address: household.address ?? null,
      created: household.created,
      updated_at: household.updated_at ?? null,
      members: (household.members ?? []).map((member) => encryptMemberForStorage(member)),
    };
  }
}
