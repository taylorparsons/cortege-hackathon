/**
 * Migrate legacy household.json to new HouseholdStore format.
 * Implements: FR-009, FR-010
 *
 * Usage: node scripts/migrate-household.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { HouseholdStore } from '../server/storage/household-store.js';

async function migrate() {
  const legacyPath = 'data/household.json';

  if (!fs.existsSync(legacyPath)) {
    console.log('No legacy household.json found, skipping migration');
    return;
  }

  console.log('Reading legacy household.json...');
  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));

  const store = new HouseholdStore('data/households');

  console.log('Creating household in new store...');
  const household = await store.createHousehold({
    name: legacy.name || 'Default Household',
    location: legacy.location || 'Unknown'
  });

  console.log(`Created household: ${household.household_id}`);

  if (legacy.members && Array.isArray(legacy.members)) {
    console.log(`Migrating ${legacy.members.length} members...`);

    for (const member of legacy.members) {
      await store.addMember(household.household_id, member);
      console.log(`  Migrated ${member.name}`);
    }
  }

  // Backup legacy file
  const backupPath = `${legacyPath}.backup.${Date.now()}`;
  fs.copyFileSync(legacyPath, backupPath);
  console.log(`\nBackup created: ${backupPath}`);

  console.log('\nMigration complete!');
  console.log(`New household ID: ${household.household_id}`);
  console.log('\nTo use the new household store, set this in your .env:');
  console.log(`DEFAULT_HOUSEHOLD_ID=${household.household_id}`);
}

migrate().catch(console.error);
