import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import SQLiteDatabase from '../storage/db.js';

describe('Memory Snapshots', () => {
  const testDbPath = 'data/test-memory-snapshots.db';
  const dbInstance = new SQLiteDatabase(testDbPath);

  after(() => {
    dbInstance.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should write event and memory snapshot atomically', () => {
    const event = {
      event_id: 'test-atomic-001',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ test: 'data' }),
      timestamp: new Date().toISOString()
    };
    
    const memory = {
      stage: 'baseline',
      observations: ['test observation'],
      patterns: []
    };
    
    const result = dbInstance.writeEventWithMemory(
      event,
      'anchor-member_001',
      'member_001',
      memory
    );
    
    assert.ok(result.hash, 'Event should be written');
    
    const snapshot = dbInstance.getLatestMemorySnapshot('anchor-member_001');
    assert.deepStrictEqual(snapshot, memory, 'Memory snapshot should match');
  });

  it('should rollback on error', () => {
    const event = {
      event_id: 'test-rollback-001',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ test: 'data' }),
      timestamp: new Date().toISOString()
    };
    
    // Simulate error by passing invalid memory (will fail JSON.stringify)
    const circularRef = {};
    circularRef.self = circularRef;
    
    assert.throws(() => {
      dbInstance.writeEventWithMemory(
        event,
        'anchor-member_001',
        'member_001',
        circularRef
      );
    }, 'Should throw on circular reference');
    
    // Verify event was NOT written
    const db = dbInstance.connect();
    const events = db.prepare('SELECT * FROM events WHERE event_id = ?').all('test-rollback-001');
    assert.strictEqual(events.length, 0, 'Event should not exist after rollback');
  });
});
