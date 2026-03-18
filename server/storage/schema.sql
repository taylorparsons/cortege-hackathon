-- CORTEGE SQLite Schema
-- Tamper-evident event log with hash chain + atomic memory snapshots

-- Events table: append-only event log with hash chain
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  target_member TEXT NOT NULL,
  payload TEXT NOT NULL,  -- JSON
  timestamp TEXT NOT NULL,  -- ISO8601
  hash TEXT NOT NULL,  -- SHA-256 of (event_id || timestamp || payload || prev_hash)
  prev_hash TEXT  -- NULL for first event
);

-- Memory snapshots table: atomic snapshots tied to events
CREATE TABLE IF NOT EXISTS memory_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instance_id TEXT NOT NULL,  -- agent-member pair (e.g., "anchor-member_001")
  member_id TEXT NOT NULL,
  snapshot TEXT NOT NULL,  -- JSON (same structure as memory-store.js)
  event_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,  -- ISO8601
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Indexes for query performance (NFR-003)
CREATE INDEX IF NOT EXISTS idx_events_target_member ON events(target_member);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_memory_snapshots_instance ON memory_snapshots(instance_id);
CREATE INDEX IF NOT EXISTS idx_memory_snapshots_member ON memory_snapshots(member_id);

-- Append-only triggers: prevent UPDATE and DELETE on events table (FR-005)
CREATE TRIGGER IF NOT EXISTS prevent_event_update
BEFORE UPDATE ON events
BEGIN
  SELECT RAISE(ABORT, 'Events table is append-only: UPDATE not allowed');
END;

CREATE TRIGGER IF NOT EXISTS prevent_event_delete
BEFORE DELETE ON events
BEGIN
  SELECT RAISE(ABORT, 'Events table is append-only: DELETE not allowed');
END;
