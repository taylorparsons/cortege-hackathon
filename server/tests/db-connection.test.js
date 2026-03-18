import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import SQLiteDatabase from '../storage/db.js';

describe('Database Connection', () => {
  const testDbPath = 'data/test-connection.db';
  const dbInstance = new SQLiteDatabase(testDbPath);

  after(() => {
    dbInstance.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create database file', () => {
    const db = dbInstance.connect();
    assert.ok(db, 'Database connection should exist');
    assert.ok(fs.existsSync(testDbPath), 'Database file should be created');
  });

  it('should enable WAL mode', () => {
    const db = dbInstance.connect();
    const result = db.pragma('journal_mode', { simple: true });
    assert.strictEqual(result, 'wal', 'WAL mode should be enabled');
  });

  it('should load schema tables', () => {
    const db = dbInstance.connect();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    assert.ok(tableNames.includes('events'), 'events table should exist');
    assert.ok(tableNames.includes('memory_snapshots'), 'memory_snapshots table should exist');
  });

  it('should load schema triggers', () => {
    const db = dbInstance.connect();
    const triggers = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all();
    const triggerNames = triggers.map(t => t.name);
    assert.ok(triggerNames.includes('prevent_event_update'), 'prevent_event_update trigger should exist');
    assert.ok(triggerNames.includes('prevent_event_delete'), 'prevent_event_delete trigger should exist');
  });
});
