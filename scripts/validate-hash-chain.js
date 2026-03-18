#!/usr/bin/env node
/**
 * Hash Chain Validation Script
 * Validates the integrity of the SQLite event log hash chain
 */

import SQLiteDatabase from '../server/storage/db.js';
import { validateHashChain } from '../server/storage/hash-chain.js';

const dbPath = process.env.SQLITE_DB_PATH || 'data/cortege.db';

console.log(`Validating hash chain in ${dbPath}...`);

const db = new SQLiteDatabase(dbPath);
db.connect();

const result = validateHashChain(db.db);

if (result.valid) {
  console.log('✓ Hash chain validation PASSED');
  console.log('  All events are cryptographically linked and tamper-free');
  process.exit(0);
} else {
  console.error('✗ Hash chain validation FAILED');
  console.error(`  Tampered event: ${result.tamperedEventId}`);
  console.error(`  Expected: ${result.expected}`);
  console.error(`  Actual: ${result.actual}`);
  process.exit(1);
}
