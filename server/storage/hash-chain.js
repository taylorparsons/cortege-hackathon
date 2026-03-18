import crypto from 'crypto';

/**
 * Compute SHA-256 hash for an event
 * Hash format: SHA-256(event_id || timestamp || payload || prev_hash)
 * @param {Object} event - Event object with event_id, timestamp, payload, prev_hash
 * @returns {string} - 64-character hex SHA-256 hash
 */
export function computeHash(event) {
  const { event_id, timestamp, payload, prev_hash } = event;
  
  // Concatenate fields (prev_hash is empty string if null)
  const data = event_id + timestamp + payload + (prev_hash || '');
  
  // Compute SHA-256 hash
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate the integrity of the entire event log hash chain
 * @param {Database} db - SQLite database instance
 * @returns {Object} - { valid: boolean, tamperedEventId: string|null, expected: string|null, actual: string|null }
 */
export function validateHashChain(db) {
  // Query all events ordered by id ASC
  const events = db.prepare('SELECT * FROM events ORDER BY id ASC').all();

  if (events.length === 0) {
    return { valid: true, tamperedEventId: null, expected: null, actual: null };
  }

  let prevHash = null;

  for (const event of events) {
    // Verify prev_hash matches previous event's hash
    if (event.prev_hash !== prevHash) {
      console.error(`Hash chain validation failed at event ${event.event_id}`);
      console.error(`Expected prev_hash: ${prevHash}`);
      console.error(`Actual prev_hash: ${event.prev_hash}`);
      
      return {
        valid: false,
        tamperedEventId: event.event_id,
        expected: prevHash,
        actual: event.prev_hash
      };
    }

    // Recompute hash and verify it matches stored hash
    const computedHash = computeHash(event);
    if (computedHash !== event.hash) {
      console.error(`Hash mismatch at event ${event.event_id}`);
      console.error(`Expected hash: ${computedHash}`);
      console.error(`Actual hash: ${event.hash}`);
      
      return {
        valid: false,
        tamperedEventId: event.event_id,
        expected: computedHash,
        actual: event.hash
      };
    }

    prevHash = event.hash;
  }

  return { valid: true, tamperedEventId: null, expected: null, actual: null };
}
