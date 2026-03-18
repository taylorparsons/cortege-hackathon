import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import StorageAdapter from '../storage/storage-adapter.js';

describe('Storage Adapter', () => {
  const testDbPath = 'data/test-adapter.db';
  
  before(() => {
    // Clean up test data
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  after(() => {
    // Clean up
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Clean up test JSON files
    const testDate = new Date().toISOString().split('T')[0];
    const testEventFile = `data/events/${testDate}.jsonl`;
    if (fs.existsSync(testEventFile)) {
      fs.unlinkSync(testEventFile);
    }
  });

  it('should write to SQLite in sqlite mode', () => {
    process.env.STORAGE_MODE = 'sqlite';
    process.env.SQLITE_DB_PATH = testDbPath;
    
    const adapter = new StorageAdapter();
    const event = {
      event_id: 'test-adapter-001',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ test: 'data' }),
      timestamp: new Date().toISOString()
    };
    
    const result = adapter.writeEvent(event);
    assert.ok(result.hash, 'Event should have hash from SQLite');
  });

  it('should write to both stores in dual-write mode', () => {
    process.env.STORAGE_MODE = 'dual-write';
    process.env.SQLITE_DB_PATH = testDbPath;
    
    const adapter = new StorageAdapter();
    const event = {
      event_id: 'test-dual-001',
      type: 'call_received',
      source: 'simulator',
      target_member: 'member_001',
      payload: JSON.stringify({ test: 'data' }),
      timestamp: new Date().toISOString()
    };
    
    const result = adapter.writeEvent(event);
    assert.ok(result.hash, 'Event should have hash from SQLite');
    
    // Verify JSON file was also written
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    const jsonPath = `data/events/${date}.jsonl`;
    assert.ok(fs.existsSync(jsonPath), 'JSON file should exist');
  });

  it('should read memory from JSON in json mode', () => {
    process.env.STORAGE_MODE = 'json';
    
    const adapter = new StorageAdapter();
    const instance_id = 'test-instance';
    const memory = { stage: 'baseline', observations: [] };
    
    adapter.writeMemory(instance_id, 'member_001', memory);
    const result = adapter.readMemory(instance_id);
    
    assert.deepStrictEqual(result, memory, 'Memory should match');
    
    // Clean up
    const memoryPath = `data/memories/${instance_id}.json`;
    if (fs.existsSync(memoryPath)) {
      fs.unlinkSync(memoryPath);
    }
  });
});
