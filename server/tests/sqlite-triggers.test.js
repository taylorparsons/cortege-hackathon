import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SQLite Append-Only Triggers', () => {
  let db;
  const testDbPath = path.join(__dirname, '../../data/test-triggers.db');

  before(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create database and load schema
    db = new Database(testDbPath);
    const schemaPath = path.join(__dirname, '../storage/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);

    // Insert a test event
    db.prepare(`
      INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test-event-001',
      'call_received',
      'simulator',
      'member_001',
      JSON.stringify({ caller: '+15551234567' }),
      new Date().toISOString(),
      'test-hash-001',
      null
    );
  });

  after(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should reject UPDATE operations on events table', () => {
    assert.throws(
      () => {
        db.prepare('UPDATE events SET type = ? WHERE event_id = ?')
          .run('modified_type', 'test-event-001');
      },
      {
        message: /Events table is append-only: UPDATE not allowed/
      },
      'UPDATE should be rejected by trigger'
    );
  });

  it('should reject DELETE operations on events table', () => {
    assert.throws(
      () => {
        db.prepare('DELETE FROM events WHERE event_id = ?')
          .run('test-event-001');
      },
      {
        message: /Events table is append-only: DELETE not allowed/
      },
      'DELETE should be rejected by trigger'
    );
  });

  it('should allow INSERT operations on events table', () => {
    const result = db.prepare(`
      INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test-event-002',
      'call_received',
      'simulator',
      'member_001',
      JSON.stringify({ caller: '+15559876543' }),
      new Date().toISOString(),
      'test-hash-002',
      'test-hash-001'
    );

    assert.strictEqual(result.changes, 1, 'INSERT should succeed');
  });

  it('should verify event still exists after failed UPDATE', () => {
    const event = db.prepare('SELECT * FROM events WHERE event_id = ?')
      .get('test-event-001');

    assert.strictEqual(event.type, 'call_received', 'Event type should be unchanged');
    assert.strictEqual(event.event_id, 'test-event-001', 'Event should still exist');
  });
});
