import { describe, it } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeHash, validateHashChain } from '../storage/hash-chain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Hash Chain', () => {
  describe('computeHash', () => {
    it('should produce consistent SHA-256 hashes', () => {
      const event = {
        event_id: 'test-001',
        timestamp: '2026-03-18T12:00:00.000Z',
        payload: JSON.stringify({ test: 'data' }),
        prev_hash: null
      };

      const hash1 = computeHash(event);
      const hash2 = computeHash(event);

      assert.strictEqual(hash1, hash2, 'Hash should be deterministic');
      assert.strictEqual(hash1.length, 64, 'SHA-256 hash should be 64 hex characters');
    });

    it('should handle NULL prev_hash for first event', () => {
      const event = {
        event_id: 'test-001',
        timestamp: '2026-03-18T12:00:00.000Z',
        payload: JSON.stringify({ test: 'data' }),
        prev_hash: null
      };

      const hash = computeHash(event);
      assert.ok(hash, 'Hash should be computed for first event');
      assert.strictEqual(hash.length, 64, 'Hash should be valid SHA-256');
    });

    it('should produce different hashes for different events', () => {
      const event1 = {
        event_id: 'test-001',
        timestamp: '2026-03-18T12:00:00.000Z',
        payload: JSON.stringify({ test: 'data1' }),
        prev_hash: null
      };

      const event2 = {
        event_id: 'test-002',
        timestamp: '2026-03-18T12:01:00.000Z',
        payload: JSON.stringify({ test: 'data2' }),
        prev_hash: computeHash(event1)
      };

      const hash1 = computeHash(event1);
      const hash2 = computeHash(event2);

      assert.notStrictEqual(hash1, hash2, 'Different events should have different hashes');
    });
  });

  describe('validateHashChain', () => {
    it('should pass for valid hash chain', () => {
      // Create in-memory database with test events
      const db = new Database(':memory:');
      const schemaPath = path.join(__dirname, '../storage/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);

      // Insert events with valid hash chain
      const event1 = {
        event_id: 'test-001',
        type: 'call_received',
        source: 'simulator',
        target_member: 'member_001',
        payload: JSON.stringify({ test: 'data1' }),
        timestamp: '2026-03-18T12:00:00.000Z',
        prev_hash: null
      };
      event1.hash = computeHash(event1);

      db.prepare(`
        INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event1.event_id, event1.type, event1.source, event1.target_member, event1.payload, event1.timestamp, event1.hash, event1.prev_hash);

      const event2 = {
        event_id: 'test-002',
        type: 'call_received',
        source: 'simulator',
        target_member: 'member_001',
        payload: JSON.stringify({ test: 'data2' }),
        timestamp: '2026-03-18T12:01:00.000Z',
        prev_hash: event1.hash
      };
      event2.hash = computeHash(event2);

      db.prepare(`
        INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event2.event_id, event2.type, event2.source, event2.target_member, event2.payload, event2.timestamp, event2.hash, event2.prev_hash);

      const result = validateHashChain(db);
      assert.strictEqual(result.valid, true, 'Valid chain should pass validation');
      assert.strictEqual(result.tamperedEventId, null, 'No tampered event should be found');

      db.close();
    });

    it('should detect tampered event', () => {
      // Create in-memory database with test events
      const db = new Database(':memory:');
      const schemaPath = path.join(__dirname, '../storage/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);

      // Insert events with valid hash chain
      const event1 = {
        event_id: 'test-001',
        type: 'call_received',
        source: 'simulator',
        target_member: 'member_001',
        payload: JSON.stringify({ test: 'data1' }),
        timestamp: '2026-03-18T12:00:00.000Z',
        prev_hash: null
      };
      event1.hash = computeHash(event1);

      db.prepare(`
        INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event1.event_id, event1.type, event1.source, event1.target_member, event1.payload, event1.timestamp, event1.hash, event1.prev_hash);

      // Insert second event with WRONG prev_hash (simulating tampering)
      const event2 = {
        event_id: 'test-002',
        type: 'call_received',
        source: 'simulator',
        target_member: 'member_001',
        payload: JSON.stringify({ test: 'data2' }),
        timestamp: '2026-03-18T12:01:00.000Z',
        prev_hash: 'wrong-hash-simulating-tampering'
      };
      event2.hash = computeHash(event2);

      db.prepare(`
        INSERT INTO events (event_id, type, source, target_member, payload, timestamp, hash, prev_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event2.event_id, event2.type, event2.source, event2.target_member, event2.payload, event2.timestamp, event2.hash, event2.prev_hash);

      const result = validateHashChain(db);
      assert.strictEqual(result.valid, false, 'Tampered chain should fail validation');
      assert.strictEqual(result.tamperedEventId, 'test-002', 'Tampered event should be identified');
      assert.ok(result.expected, 'Expected hash should be provided');
      assert.ok(result.actual, 'Actual hash should be provided');

      db.close();
    });
  });
});
