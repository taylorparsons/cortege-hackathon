import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import SQLiteDatabase from '../storage/db.js';

describe('Event Storage', () => {
  const testDbPath = 'data/test-event-storage.db';
  const dbInstance = new SQLiteDatabase(testDbPath);

  after(() => {
    dbInstance.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should write event with valid hash', () => {
    const event = {
      event_id: 'test-001',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ caller: '+15551234567' }),
      timestamp: new Date().toISOString()
    };

    const result = dbInstance.writeEvent(event);
    
    assert.ok(result.hash, 'Event should have hash');
    assert.strictEqual(result.hash.length, 64, 'Hash should be SHA-256');
    assert.strictEqual(result.prev_hash, null, 'First event should have null prev_hash');
  });

  it('should chain second event to first', () => {
    const event2 = {
      event_id: 'test-002',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ caller: '+15559876543' }),
      timestamp: new Date().toISOString()
    };

    const result = dbInstance.writeEvent(event2);
    
    assert.ok(result.prev_hash, 'Second event should have prev_hash');
    assert.strictEqual(result.prev_hash.length, 64, 'prev_hash should be SHA-256');
  });

  it('should filter events by member_id', () => {
    // Insert events for different members
    dbInstance.writeEvent({
      event_id: 'test-member-001',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ test: 'data' }),
      timestamp: new Date().toISOString()
    });
    
    dbInstance.writeEvent({
      event_id: 'test-member-002',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_002',
      payload: JSON.stringify({ test: 'data' }),
      timestamp: new Date().toISOString()
    });
    
    const results = dbInstance.queryEvents({ member_id: 'member_001' });
    assert.ok(results.length >= 1, 'Should find events for member_001');
    assert.ok(results.every(e => e.target_member === 'member_001'), 'All results should be for member_001');
  });

  it('should filter events by threat_level', () => {
    dbInstance.writeEvent({
      event_id: 'test-threat-low',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ threat_level: 1 }),
      timestamp: new Date().toISOString()
    });
    
    dbInstance.writeEvent({
      event_id: 'test-threat-high',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ threat_level: 4 }),
      timestamp: new Date().toISOString()
    });
    
    const results = dbInstance.queryEvents({ threat_level_min: 3 });
    assert.ok(results.length >= 1, 'Should find high threat events');
    assert.ok(results.every(e => {
      const payload = JSON.parse(e.payload);
      return payload.threat_level >= 3;
    }), 'All results should have threat_level >= 3');
  });
});
