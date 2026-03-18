import fs from 'fs';
import path from 'path';
import SQLiteDatabase from './db.js';

class StorageAdapter {
  constructor() {
    this.mode = process.env.STORAGE_MODE || 'sqlite'; // sqlite | json | dual-write
    this.enableFallback = process.env.ENABLE_JSON_FALLBACK === 'true';
    this.sqliteDb = new SQLiteDatabase();
  }

  writeEvent(eventData) {
    // Normalize event data: ensure payload is a JSON string and required fields exist
    const normalizedEvent = {
      event_id: eventData.id || eventData.event_id,  // Support both 'id' and 'event_id'
      type: eventData.type,
      source: eventData.source,
      target_member: eventData.target_member || null,
      timestamp: eventData.timestamp,
      payload: typeof eventData.payload === 'string' 
        ? eventData.payload 
        : JSON.stringify(eventData.payload)
    };

    if (this.mode === 'json') {
      return this._writeEventJSON(eventData);  // Use original for JSON mode
    } else if (this.mode === 'dual-write') {
      const sqliteResult = this.sqliteDb.writeEvent(normalizedEvent);
      try {
        this._writeEventJSON(eventData);  // Use original for JSON mode
      } catch (err) {
        console.warn('Dual-write: JSON write failed', err);
      }
      return sqliteResult;
    } else {
      // sqlite mode
      try {
        return this.sqliteDb.writeEvent(normalizedEvent);
      } catch (err) {
        if (this.enableFallback) {
          console.warn('SQLite write failed, falling back to JSON', err);
          return this._writeEventJSON(eventData);  // Use original for JSON mode
        }
        throw err;
      }
    }
  }

  writeMemory(instance_id, member_id, memoryData) {
    if (this.mode === 'json') {
      return this._writeMemoryJSON(instance_id, memoryData);
    } else if (this.mode === 'dual-write') {
      // Note: Memory snapshots in SQLite are tied to events via writeEventWithMemory
      // For standalone memory writes, only write to JSON in dual-write mode
      return this._writeMemoryJSON(instance_id, memoryData);
    } else {
      // sqlite mode - memory snapshots are written via writeEventWithMemory
      return this._writeMemoryJSON(instance_id, memoryData);
    }
  }

  readMemory(instance_id) {
    if (this.mode === 'json') {
      return this._readMemoryJSON(instance_id);
    } else {
      try {
        const snapshot = this.sqliteDb.getLatestMemorySnapshot(instance_id);
        if (snapshot) {
          return snapshot;
        }
        // Fall back to JSON if no SQLite snapshot
        if (this.enableFallback) {
          return this._readMemoryJSON(instance_id);
        }
        return null;
      } catch (err) {
        if (this.enableFallback) {
          console.warn('SQLite read failed, falling back to JSON', err);
          return this._readMemoryJSON(instance_id);
        }
        throw err;
      }
    }
  }

  _writeEventJSON(eventData) {
    const date = new Date(eventData.timestamp).toISOString().split('T')[0];
    const filePath = path.join('data', 'events', `${date}.jsonl`);
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.appendFileSync(filePath, JSON.stringify(eventData) + '\n');
    return eventData;
  }

  _writeMemoryJSON(instance_id, memoryData) {
    const filePath = path.join('data', 'memories', `${instance_id}.json`);
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(memoryData, null, 2));
    return memoryData;
  }

  _readMemoryJSON(instance_id) {
    const filePath = path.join('data', 'memories', `${instance_id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
}

export default StorageAdapter;
