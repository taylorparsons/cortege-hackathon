import fs from 'fs';
import path from 'path';
import SQLiteDatabase from '../server/storage/db.js';
import { validateHashChain } from '../server/storage/hash-chain.js';

const dbPath = process.env.SQLITE_DB_PATH || 'data/cortege.db';
const eventsDir = 'data/events';
const memoriesDir = 'data/memories';

console.log('Starting migration to SQLite...');
const startTime = Date.now();

// Backup existing SQLite file if it exists
if (fs.existsSync(dbPath)) {
  const backupPath = `${dbPath}.backup.${Date.now()}`;
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backed up existing database to ${backupPath}`);
}

const db = new SQLiteDatabase(dbPath);
db.connect();

// Read all JSON event files
if (!fs.existsSync(eventsDir)) {
  console.log('No events directory found, skipping event migration');
} else {
  const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.jsonl'));
  const allEvents = [];

  for (const file of eventFiles) {
    const filePath = path.join(eventsDir, file);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      try {
        allEvents.push(JSON.parse(line));
      } catch (err) {
        console.warn(`Failed to parse event in ${file}:`, err.message);
      }
    }
  }

  // Sort events by timestamp
  allEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  console.log(`Found ${allEvents.length} events to migrate`);

  // Write events to SQLite with reconstructed hash chain
  let imported = 0;
  let errors = 0;

  for (const event of allEvents) {
    try {
      db.writeEvent(event);
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`Imported ${imported}/${allEvents.length} events...`);
      }
    } catch (err) {
      console.error(`Failed to import event ${event.event_id}:`, err.message);
      errors++;
    }
  }

  console.log(`Imported ${imported} events with ${errors} errors`);

  // Validate hash chain
  console.log('Validating hash chain...');
  const validation = validateHashChain(db.db);

  if (validation.valid) {
    console.log('✓ Hash chain validation passed');
  } else {
    console.error('✗ Hash chain validation failed');
    console.error(`Tampered event: ${validation.tamperedEventId}`);
    console.error(`Expected: ${validation.expected}`);
    console.error(`Actual: ${validation.actual}`);
  }
}

// Read and migrate memory snapshots
if (!fs.existsSync(memoriesDir)) {
  console.log('No memories directory found, skipping memory migration');
} else {
  const memoryFiles = fs.readdirSync(memoriesDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${memoryFiles.length} memory files to migrate`);

  let memoriesImported = 0;

  for (const file of memoryFiles) {
    const instance_id = path.basename(file, '.json');
    const filePath = path.join(memoriesDir, file);
    
    try {
      const memory = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Find the most recent event for this instance to link the snapshot
      const [agent, member] = instance_id.split('-');
      const recentEvent = db.db.prepare(`
        SELECT event_id FROM events 
        WHERE target_member = ? 
        ORDER BY id DESC 
        LIMIT 1
      `).get(member);
      
      if (recentEvent) {
        db.writeMemorySnapshot(instance_id, member, memory, recentEvent.event_id);
        memoriesImported++;
      } else {
        console.warn(`No events found for ${instance_id}, skipping memory snapshot`);
      }
    } catch (err) {
      console.error(`Failed to import memory ${instance_id}:`, err.message);
    }
  }

  console.log(`Imported ${memoriesImported} memory snapshots`);
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`Migration completed in ${duration}s`);

db.close();
