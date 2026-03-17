/**
 * Household — Utilities for loading and querying household.json.
 * Implements: FR-038, FR-039, FR-040, FR-041
 */

import fs from 'node:fs';

// ---------------------------------------------------------------------------
// loadHousehold
// ---------------------------------------------------------------------------

/**
 * Reads and parses data/household.json.
 * Validates that each member has: id, name, profile_type.
 *
 * @param {string} householdPath  Absolute or relative path to household.json
 * @returns {{ household_id: string, name: string, location: string, members: Array }}
 * @throws {Error} If file is missing, JSON is invalid, or members fail validation
 */
export function loadHousehold(householdPath) {
  let raw;
  try {
    raw = fs.readFileSync(householdPath, 'utf8');
  } catch (err) {
    throw new Error(`[household] Cannot read household file "${householdPath}": ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[household] Invalid JSON in "${householdPath}": ${err.message}`);
  }

  // Validate members array
  if (!Array.isArray(data.members)) {
    throw new Error(`[household] "members" field is missing or not an array in "${householdPath}"`);
  }

  const REQUIRED_MEMBER_FIELDS = ['id', 'name', 'profile_type'];
  for (const member of data.members) {
    for (const field of REQUIRED_MEMBER_FIELDS) {
      if (!member[field]) {
        throw new Error(
          `[household] Member is missing required field "${field}": ${JSON.stringify(member)}`
        );
      }
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// getMember
// ---------------------------------------------------------------------------

/**
 * Finds a member by ID.
 *
 * @param {Array} members
 * @param {string} memberId
 * @returns {object|null}
 */
export function getMember(members, memberId) {
  return members.find((m) => m.id === memberId) ?? null;
}

// ---------------------------------------------------------------------------
// getPrimaryMember
// ---------------------------------------------------------------------------

/**
 * Returns the first member with is_primary: true, or null if none.
 * Per EC9: if multiple members have is_primary: true, the first one wins.
 *
 * @param {Array} members
 * @returns {object|null}
 */
export function getPrimaryMember(members) {
  return members.find((m) => m.is_primary === true) ?? null;
}
