import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  decryptLocationFromStorage,
  encryptLocationForStorage,
  formatAddressSummary,
} from '../privacy/pii.js';

export class LocationStore {
  constructor(dataDir = 'data/locations') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  _filePath(locationId) {
    return path.join(this.dataDir, `${locationId}.json`);
  }

  _writeRaw(location) {
    fs.writeFileSync(this._filePath(location.location_id), JSON.stringify(location, null, 2));
  }

  async createLocation({ name, address }) {
    const location = {
      location_id: `loc_${randomUUID().slice(0, 8)}`,
      name,
      address,
      created: new Date().toISOString(),
    };
    this._writeRaw(encryptLocationForStorage(location));
    return location;
  }

  async listLocations() {
    const files = fs.readdirSync(this.dataDir).filter((file) => file.endsWith('.json'));
    return files.map((file) => {
      const raw = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf8'));
      const location = decryptLocationFromStorage(raw);
      return {
        location_id: location.location_id,
        name: location.name,
        address_summary: location.address_summary,
      };
    });
  }

  async getLocation(locationId) {
    const filePath = this._filePath(locationId);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Location ${locationId} not found`);
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return decryptLocationFromStorage(raw);
  }

  async updateLocation(locationId, updates) {
    const current = await this.getLocation(locationId);
    const next = {
      ...current,
      name: updates.name ?? current.name,
      address: updates.address ?? current.address,
      updated_at: new Date().toISOString(),
    };
    this._writeRaw(encryptLocationForStorage(next));
    return next;
  }

  async deleteLocation(locationId) {
    const filePath = this._filePath(locationId);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Location ${locationId} not found`);
    }
    fs.unlinkSync(filePath);
    return { deleted: true, location_id: locationId };
  }

  async ensureLegacyLocation({ name, address, legacyLocation }) {
    const locationName = name ?? legacyLocation ?? 'Legacy Location';
    const normalizedAddress = address ?? {
      line1: legacyLocation ?? 'Unknown',
      line2: null,
      city: 'Unknown',
      region: 'Unknown',
      postal_code: 'Unknown',
      country: 'Unknown',
    };
    return this.createLocation({ name: locationName, address: normalizedAddress });
  }

  formatAddressSummary(address) {
    return formatAddressSummary(address);
  }
}

export default LocationStore;
