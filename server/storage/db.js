import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeHash } from './hash-chain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SQLiteDatabase {
  constructor(dbPath = process.env.SQLITE_DB_PATH || 'data/cortege.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  connect() {
    if (this.db) {
      return this.db;
    }

    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create database connection
    this.db = new Database(this.dbPath);

    // Enable WAL mode for crash recovery (NFR-004)
    this.db.pragma('journal_mode = WAL');

    // Set file permissions to 0600 (owner read/write only) (NFR-007)
    try {
      fs.chmodSync(this.dbPath, 0o600);
    } catch (err) {
      console.warn(`Could not set database file permissions: ${err.message}`);
    }

    // Load schema on first connection
    this.loadSchema();

    return this.db;
  }

  loadSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
  }

  writeEvent(eventData) {
    const db = this.connect();
    
    // Query previous event's hash
    const prevEvent = db.prepare('SELECT hash FROM events ORDER BY id DESC LIMIT 1').get();
    const prev_hash = prevEvent ? prevEvent.hash : null;
    
    // Compute hash for new event
    const eventWithPrevHash = { ...eventData, prev_hash };
    const hash = computeHash(eventWithPrevHash);
    
    // Insert event with computed hash
    const result = db.prepare(`
      INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventData.event_id,
      eventData.type,
      eventData.source,
      eventData.target_member,
      eventData.payload,
      eventData.timestamp,
      hash,
      prev_hash
    );
    
    // Return inserted event with hash
    return {
      ...eventData,
      hash,
      prev_hash,
      id: result.lastInsertRowid
    };
  }

  queryEvents(filters = {}) {
    const db = this.connect();
    
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];
    
    if (filters.member_id) {
      sql += ' AND target_member = ?';
      params.push(filters.member_id);
    }
    
    if (filters.threat_level_min !== undefined) {
      // Use json_extract and compare as number
      sql += ' AND json_extract(payload, \'$.threat_level\') >= ?';
      params.push(filters.threat_level_min);
    }
    
    if (filters.start_time) {
      sql += ' AND timestamp >= ?';
      params.push(filters.start_time);
    }
    
    if (filters.end_time) {
      sql += ' AND timestamp <= ?';
      params.push(filters.end_time);
    }
    
    if (filters.signals && filters.signals.length > 0) {
      // Check if any signal in the array matches
      const signalConditions = filters.signals.map(() => 
        'EXISTS (SELECT 1 FROM json_each(json_extract(payload, \'$.signals\')) WHERE value = ?)'
      ).join(' OR ');
      sql += ` AND (${signalConditions})`;
      params.push(...filters.signals);
    }
    
    sql += ' ORDER BY id ASC';
    
    return db.prepare(sql).all(...params);
  }

  getRecentEvents(limit = 50, dateStr = null) {
    const db = this.connect();

    let sql = 'SELECT event_id, type, source, target_member, payload, timestamp FROM events';
    const params = [];

    if (dateStr) {
      sql += ' WHERE date(timestamp) = date(?)';
      params.push(dateStr);
    }

    sql += ' ORDER BY timestamp DESC, id DESC LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params);
  }

  getEventById(eventId) {
    const db = this.connect();
    return db.prepare(`
      SELECT event_id, type, source, target_member, payload, timestamp
      FROM events
      WHERE event_id = ?
      LIMIT 1
    `).get(eventId);
  }

  writeMemorySnapshot(instance_id, member_id, snapshot, event_id) {
    const db = this.connect();
    
    const result = db.prepare(`
      INSERT INTO memory_snapshots (instance_id, member_id, snapshot, event_id, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      instance_id,
      member_id,
      JSON.stringify(snapshot),
      event_id,
      new Date().toISOString()
    );
    
    return result.lastInsertRowid;
  }

  getLatestMemorySnapshot(instance_id) {
    const db = this.connect();
    
    const row = db.prepare(`
      SELECT snapshot FROM memory_snapshots 
      WHERE instance_id = ? 
      ORDER BY id DESC 
      LIMIT 1
    `).get(instance_id);
    
    if (!row) {
      return null;
    }
    
    try {
      return JSON.parse(row.snapshot);
    } catch (err) {
      console.error(`Failed to parse memory snapshot for ${instance_id}:`, err);
      return null;
    }
  }

  writeEventWithMemory(eventData, instance_id, member_id, memorySnapshot) {
    const db = this.connect();
    
    // Begin transaction
    const transaction = db.transaction(() => {
      // Write event
      const event = this.writeEvent(eventData);
      
      // Write memory snapshot
      this.writeMemorySnapshot(instance_id, member_id, memorySnapshot, event.event_id);
      
      return event;
    });
    
    // Execute transaction (auto-rollback on error)
    return transaction();
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default SQLiteDatabase;
