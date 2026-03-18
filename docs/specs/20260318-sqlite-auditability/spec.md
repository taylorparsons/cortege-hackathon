# Feature Spec: 20260318-sqlite-auditability

Status: Draft
Created: 2026-03-18 18:00
Inputs: CR-20260318-1800
Decisions: D-20260318-1800
Design: docs/superpowers/specs/2026-03-14-agent-orchestration-design.md

## Summary

Implement production-ready SQLite storage with tamper-evident audit trail. Migrate from mutable JSON files to SQLite with append-only event log, hash chain for tamper evidence, and atomic memory snapshots. Maintain backward compatibility during migration.

Sources: CR-20260318-1800; D-20260318-1800

## User Stories & Acceptance

### US1: Tamper-Evident Event Log (Priority: P0)
Narrative:
- As a compliance officer, I want an immutable event log with cryptographic tamper evidence, so that I can verify no events were modified or deleted after creation.

Acceptance scenarios:
1. Given an event is written to the database, When I query the events table, Then the event includes a hash of the previous event. (Verifies: FR-001, FR-002)
2. Given multiple events exist, When I verify the hash chain, Then each event's prev_hash matches the previous event's hash. (Verifies: FR-003)
3. Given an attacker modifies an event directly in SQLite, When I run hash chain validation, Then the validation fails and identifies the tampered event. (Verifies: FR-004)
4. Given an event exists, When I attempt to UPDATE or DELETE it, Then SQLite triggers reject the operation. (Verifies: FR-005)

### US2: Queryable Audit Trail (Priority: P0)
Narrative:
- As an auditor, I want to query events by member, agent, threat level, and time range, so that I can investigate incidents and generate compliance reports.

Acceptance scenarios:
1. Given events for multiple members, When I query events for member_002, Then only events for that member are returned. (Verifies: FR-006)
2. Given events with various threat levels, When I query events with threat_level >= 3, Then only L3+ escalations are returned. (Verifies: FR-007)
3. Given events over multiple days, When I query events between 2026-03-17 and 2026-03-18, Then only events in that range are returned. (Verifies: FR-008)
4. Given an event with specific signals, When I query events containing signal "grandparent_scam", Then all matching events are returned. (Verifies: FR-009)

### US3: Atomic Memory Snapshots (Priority: P0)
Narrative:
- As the system, I want memory updates to be atomic with event writes, so that memory state is always consistent with the event log.

Acceptance scenarios:
1. Given an agent processes an event, When the event is written to SQLite, Then the memory snapshot is written in the same transaction. (Verifies: FR-010, FR-011)
2. Given a database write fails mid-transaction, When the transaction rolls back, Then neither the event nor the memory snapshot are persisted. (Verifies: FR-012)
3. Given a memory snapshot exists, When I load it, Then it deserializes to the same structure as the current memory-store.js format. (Verifies: FR-013)

### US4: Backward Compatibility During Migration (Priority: P1)
Narrative:
- As a developer, I want the migration to be incremental and reversible, so that I can roll back if issues are discovered.

Acceptance scenarios:
1. Given dual-write mode is enabled, When an event is processed, Then it is written to both JSON files and SQLite. (Verifies: FR-014)
2. Given dual-write mode is enabled, When I disable SQLite, Then the system continues working with JSON files only. (Verifies: FR-015)
3. Given SQLite is the primary store, When I enable JSON fallback, Then reads fall back to JSON if SQLite query fails. (Verifies: FR-016)

### US5: Event Replay and Recovery (Priority: P1)
Narrative:
- As a system operator, I want to replay events from the audit log, so that I can reconstruct memory state after corruption or for testing.

Acceptance scenarios:
1. Given a corrupted memory snapshot, When I replay all events for that agent, Then the memory is reconstructed to the correct state. (Verifies: FR-017)
2. Given events in the audit log, When I replay events up to a specific timestamp, Then memory state matches the state at that point in time. (Verifies: FR-018)

## Requirements

### Functional Requirements

#### Event Log Schema
- FR-001: The events table SHALL have columns: id (INTEGER PRIMARY KEY), event_id (TEXT UNIQUE), type (TEXT), source (TEXT), target_member (TEXT), payload (TEXT as JSON), timestamp (TEXT ISO8601), hash (TEXT), prev_hash (TEXT). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-002: The hash column SHALL contain SHA-256 hash of (event_id || timestamp || payload || prev_hash). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-003: The prev_hash column SHALL contain the hash of the previous event (NULL for first event). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-004: A validateHashChain() function SHALL verify the integrity of the entire event log. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-005: SQLite triggers SHALL prevent UPDATE and DELETE operations on the events table. (Sources: CR-20260318-1800; D-20260318-1800)

#### Query Capabilities
- FR-006: The system SHALL support querying events by target_member. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-007: The system SHALL support querying events by threat_level (extracted from payload JSON). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-008: The system SHALL support querying events by timestamp range. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-009: The system SHALL support querying events by signals (extracted from payload JSON array). (Sources: CR-20260318-1800; D-20260318-1800)

#### Memory Snapshots
- FR-010: The memory_snapshots table SHALL have columns: id (INTEGER PRIMARY KEY), instance_id (TEXT), member_id (TEXT), snapshot (TEXT as JSON), event_id (TEXT FOREIGN KEY), timestamp (TEXT ISO8601). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-011: Memory snapshots SHALL be written in the same transaction as the triggering event. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-012: If a transaction fails, both event and memory snapshot SHALL be rolled back. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-013: Memory snapshots SHALL use the same JSON structure as current memory-store.js files. (Sources: CR-20260318-1800; D-20260318-1800)

#### Migration Strategy
- FR-014: The system SHALL support dual-write mode (write to both JSON and SQLite). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-015: The system SHALL support JSON-only mode (disable SQLite, use JSON files). (Sources: CR-20260318-1800; D-20260318-1800)
- FR-016: The system SHALL support SQLite-primary mode with JSON fallback on read errors. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-017: A migration script SHALL import existing JSON files into SQLite with reconstructed hash chain. (Sources: CR-20260318-1800; D-20260318-1800)

#### Event Replay
- FR-018: A replayEvents() function SHALL reconstruct memory state from event log. (Sources: CR-20260318-1800; D-20260318-1800)
- FR-019: Replay SHALL support filtering by instance_id and timestamp range. (Sources: CR-20260318-1800; D-20260318-1800)

### Non-Functional Requirements

#### Performance
- NFR-001: Event writes SHALL complete in <50ms (p95) on commodity hardware. (Sources: CR-20260318-1800; D-20260318-1800)
- NFR-002: Hash chain validation SHALL complete in <1s for 10,000 events. (Sources: CR-20260318-1800; D-20260318-1800)
- NFR-003: Event queries SHALL use indexes on (target_member, timestamp, type). (Sources: CR-20260318-1800; D-20260318-1800)

#### Reliability
- NFR-004: SQLite SHALL use WAL (Write-Ahead Logging) mode for crash recovery. (Sources: CR-20260318-1800; D-20260318-1800)
- NFR-005: Database file SHALL be backed up automatically before migration. (Sources: CR-20260318-1800; D-20260318-1800)
- NFR-006: Dual-write mode SHALL log discrepancies between JSON and SQLite writes. (Sources: CR-20260318-1800; D-20260318-1800)

#### Security
- NFR-007: Database file SHALL have 0600 permissions (owner read/write only). (Sources: CR-20260318-1800; D-20260318-1800)
- NFR-008: Hash algorithm SHALL be SHA-256 (FIPS 140-2 approved). (Sources: CR-20260318-1800; D-20260318-1800)

#### Observability
- NFR-009: Migration script SHALL log progress (events imported, errors, duration). (Sources: CR-20260318-1800; D-20260318-1800)
- NFR-010: Hash chain validation SHALL log the first tampered event ID and expected vs actual hash. (Sources: CR-20260318-1800; D-20260318-1800)

## Edge Cases

### EC1: First Event in Chain
- Given no previous events exist, When the first event is written, Then prev_hash is NULL and hash is computed without prev_hash. (Verifies: FR-002, FR-003)

### EC2: Concurrent Event Writes
- Given two events are written concurrently, When both transactions commit, Then the hash chain remains valid (one event becomes "previous" for the other). (Verifies: FR-002, FR-003, NFR-004)

### EC3: Corrupted Database File
- Given the SQLite file is corrupted, When the system starts, Then it logs an error and falls back to JSON files (if enabled). (Verifies: FR-016, NFR-004)

### EC4: Migration with Existing Events
- Given 10,000 events exist in JSON files, When migration runs, Then all events are imported with a valid hash chain. (Verifies: FR-017, NFR-002)

### EC5: Replay with Missing Events
- Given events 1-100 exist but event 50 is missing, When replay runs, Then it logs a warning and continues with available events. (Verifies: FR-018)

### EC6: JSON and SQLite Divergence in Dual-Write
- Given dual-write mode is enabled, When SQLite write succeeds but JSON write fails, Then the system logs the discrepancy and continues. (Verifies: FR-014, NFR-006)

### EC7: Hash Chain Validation on Large Dataset
- Given 100,000 events exist, When hash chain validation runs, Then it completes in <10s and reports progress every 10,000 events. (Verifies: FR-004, NFR-002)

### EC8: Memory Snapshot Deserialization Failure
- Given a memory snapshot with invalid JSON, When the system loads it, Then it logs an error and initializes fresh memory. (Verifies: FR-013)

## Dependencies

### External Dependencies
- SQLite 3.35+ with JSON1 extension
- Node.js crypto module (SHA-256)
- better-sqlite3 npm package (synchronous SQLite driver)

### Internal Dependencies
- Existing memory-store.js API (preserve interface)
- Existing event-bus.js (emit events to both stores)
- Existing agent-instance.js (call memory save in transaction)

### Environment Variables
```
STORAGE_MODE=sqlite|json|dual-write (default: sqlite)
SQLITE_DB_PATH=data/cortege.db (default)
ENABLE_JSON_FALLBACK=true|false (default: false)
```

## Out of Scope

- Multi-database replication (single SQLite file sufficient for single-household deployment)
- Encryption at rest (file-level encryption via OS/filesystem sufficient)
- Real-time event streaming (WebSocket already handles this)
- Event deletion/redaction (append-only by design; GDPR compliance via separate process)
- Distributed hash chain (single-node deployment only)

## Success Criteria

- [ ] SQLite schema created with events and memory_snapshots tables
- [ ] Append-only triggers prevent UPDATE/DELETE on events table
- [ ] Hash chain validation function implemented and tested
- [ ] Event writes include SHA-256 hash of previous event
- [ ] Memory snapshots written atomically with events
- [ ] Query functions support filtering by member, threat level, time range, signals
- [ ] Migration script imports existing JSON files with valid hash chain
- [ ] Dual-write mode logs discrepancies between JSON and SQLite
- [ ] Event replay function reconstructs memory from audit log
- [ ] All tests pass (unit tests for hash chain, integration tests for migration)
- [ ] Performance benchmarks meet NFR targets (<50ms writes, <1s validation for 10k events)
- [ ] Documentation updated (README, API.md, PRODUCTION_DEPLOYMENT.md)
