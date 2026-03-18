# Tasks: 20260318-sqlite-auditability

Spec: docs/specs/20260318-sqlite-auditability/spec.md

## NEXT

### Phase 6: Event Replay

- [ ] 6.1 Implement event replay
  - [ ] 6.1.1 Create replayEvents() function in server/storage/replay.js (Implements: FR-018, FR-019)
  - [ ] 6.1.2 Accept filters: { instance_id, start_time, end_time } (Implements: FR-019)
  - [ ] 6.1.3 Query events from SQLite with filters (Implements: FR-019)
  - [ ] 6.1.4 Initialize fresh memory state (Implements: FR-018)
  - [ ] 6.1.5 Apply each event's memory_updates to memory state (Implements: FR-018)
  - [ ] 6.1.6 Return reconstructed memory state (Implements: FR-018)
  - [ ] 6.1.7 Log warning if events are missing in sequence (Implements: EC5)

- [ ] 6.2 Test event replay
  - [ ] 6.2.1 Integration test: replay 10 events reconstructs correct memory state (Implements: FR-018)
  - [ ] 6.2.2 Integration test: replay with timestamp filter stops at correct point (Implements: FR-019)
  - [ ] 6.2.3 Integration test: replay with missing event logs warning and continues (Implements: EC5)

### Phase 7: Performance Benchmarks

- [ ] 7.1 Benchmark event writes
  - [ ] 7.1.1 Create scripts/benchmark-writes.js (Implements: NFR-001)
  - [ ] 7.1.2 Write 1000 events and measure p50, p95, p99 latency (Implements: NFR-001)
  - [ ] 7.1.3 Verify p95 < 50ms (Implements: NFR-001)

- [ ] 7.2 Benchmark hash chain validation
  - [ ] 7.2.1 Create scripts/benchmark-validation.js (Implements: NFR-002)
  - [ ] 7.2.2 Validate hash chain for 10,000 events (Implements: NFR-002)
  - [ ] 7.2.3 Verify validation completes in <1s (Implements: NFR-002)

- [ ] 7.3 Benchmark queries
  - [ ] 7.3.1 Create scripts/benchmark-queries.js (Implements: NFR-003)
  - [ ] 7.3.2 Query events by member_id, threat_level, timestamp range (Implements: NFR-003)
  - [ ] 7.3.3 Verify indexes are used (EXPLAIN QUERY PLAN) (Implements: NFR-003)

### Phase 8: Documentation and Deployment

- [ ] 8.2 Create deployment checklist
  - [ ] 8.2.1 Document migration steps: backup → dual-write → verify → cutover → deprecate JSON (Implements: FR-017)
  - [ ] 8.2.2 Document rollback procedure (Implements: FR-015, FR-016)
  - [ ] 8.2.3 Document hash chain validation schedule (daily cron job) (Implements: FR-004)

## IN PROGRESS

## DONE

### Phase 1: SQLite Schema and Core Infrastructure

- [x] 1.1 Install dependencies
  - [x] 1.1.1 Install better-sqlite3 npm package (Implements: FR-001)
  - [x] 1.1.2 Add SQLite to package.json dependencies (Implements: FR-001)

- [x] 1.2 Create SQLite schema
  - [x] 1.2.1 Create server/storage/schema.sql with events table (Implements: FR-001)
  - [x] 1.2.2 Create memory_snapshots table schema (Implements: FR-010)
  - [x] 1.2.3 Add indexes on (target_member, timestamp, type) (Implements: NFR-003)
  - [x] 1.2.4 Add FOREIGN KEY constraint from memory_snapshots.event_id to events.event_id (Implements: FR-010)

- [x] 1.3 Create append-only triggers
  - [x] 1.3.1 Create trigger to prevent UPDATE on events table (Implements: FR-005)
  - [x] 1.3.2 Create trigger to prevent DELETE on events table (Implements: FR-005)
  - [x] 1.3.3 Test triggers reject UPDATE/DELETE operations (Implements: FR-005)

- [x] 1.4 Initialize database connection
  - [x] 1.4.1 Create server/storage/db.js with Database class (Implements: FR-001)
  - [x] 1.4.2 Enable WAL mode for crash recovery (Implements: NFR-004)
  - [x] 1.4.3 Set database file permissions to 0600 (Implements: NFR-007)
  - [x] 1.4.4 Load schema.sql on first connection (Implements: FR-001)

### Phase 2: Hash Chain Implementation

- [x] 2.1 Implement hash computation
  - [x] 2.1.1 Create server/storage/hash-chain.js with computeHash() function (Implements: FR-002)
  - [x] 2.1.2 Use SHA-256 from Node.js crypto module (Implements: NFR-008)
  - [x] 2.1.3 Hash format: SHA-256(event_id || timestamp || payload || prev_hash) (Implements: FR-002)
  - [x] 2.1.4 Handle NULL prev_hash for first event (Implements: FR-003, EC1)

- [x] 2.2 Implement hash chain validation
  - [x] 2.2.1 Create validateHashChain() function in hash-chain.js (Implements: FR-004)
  - [x] 2.2.2 Query all events ordered by id ASC (Implements: FR-004)
  - [x] 2.2.3 Verify each event's prev_hash matches previous event's hash (Implements: FR-004)
  - [x] 2.2.4 Log first tampered event ID and expected vs actual hash (Implements: NFR-010)
  - [x] 2.2.5 Return validation result: { valid: boolean, tamperedEventId: string|null, expected: string|null, actual: string|null } (Implements: FR-004)

- [x] 2.3 Test hash chain
  - [x] 2.3.1 Unit test: computeHash() produces consistent SHA-256 hashes (Implements: FR-002)
  - [x] 2.3.2 Unit test: validateHashChain() passes for valid chain (Implements: FR-004)
  - [x] 2.3.3 Unit test: validateHashChain() detects tampered event (Implements: FR-004)
  - [x] 2.3.4 Unit test: first event with NULL prev_hash validates correctly (Implements: EC1)

### Phase 3: Event Storage API

- [x] 3.1 Implement event write
  - [x] 3.1.1 Create writeEvent() function in db.js (Implements: FR-001, FR-002, FR-003)
  - [x] 3.1.2 Query previous event's hash (SELECT hash FROM events ORDER BY id DESC LIMIT 1) (Implements: FR-003)
  - [x] 3.1.3 Compute hash with prev_hash (Implements: FR-002)
  - [x] 3.1.4 INSERT event with computed hash (Implements: FR-001)
  - [x] 3.1.5 Return inserted event with hash (Implements: FR-001)

- [x] 3.2 Implement event queries
  - [x] 3.2.1 Create queryEvents() function with filters: { member_id, threat_level_min, start_time, end_time, signals } (Implements: FR-006, FR-007, FR-008, FR-009)
  - [x] 3.2.2 Build SQL WHERE clause from filters (Implements: FR-006, FR-007, FR-008, FR-009)
  - [x] 3.2.3 Use JSON_EXTRACT for threat_level and signals filtering (Implements: FR-007, FR-009)
  - [x] 3.2.4 Return array of matching events (Implements: FR-006, FR-007, FR-008, FR-009)

- [x] 3.3 Test event storage
  - [x] 3.3.1 Integration test: writeEvent() creates event with valid hash (Implements: FR-001, FR-002)
  - [x] 3.3.2 Integration test: second event's prev_hash matches first event's hash (Implements: FR-003)
  - [x] 3.3.3 Integration test: queryEvents() filters by member_id (Implements: FR-006)
  - [x] 3.3.4 Integration test: queryEvents() filters by threat_level >= 3 (Implements: FR-007)
  - [x] 3.3.5 Integration test: queryEvents() filters by timestamp range (Implements: FR-008)
  - [x] 3.3.6 Integration test: queryEvents() filters by signals array (Implements: FR-009)

### Phase 4: Memory Snapshot Integration

- [x] 4.1 Implement memory snapshot write
  - [x] 4.1.1 Create writeMemorySnapshot() function in db.js (Implements: FR-010, FR-011)
  - [x] 4.1.2 Accept (instance_id, member_id, snapshot_json, event_id) (Implements: FR-010)
  - [x] 4.1.3 INSERT into memory_snapshots table (Implements: FR-010)
  - [x] 4.1.4 Use same transaction as event write (Implements: FR-011)

- [x] 4.2 Implement atomic event + memory write
  - [x] 4.2.1 Create writeEventWithMemory() function in db.js (Implements: FR-011, FR-012)
  - [x] 4.2.2 Begin transaction (Implements: FR-011)
  - [x] 4.2.3 Call writeEvent() (Implements: FR-011)
  - [x] 4.2.4 Call writeMemorySnapshot() (Implements: FR-011)
  - [x] 4.2.5 Commit transaction (Implements: FR-011)
  - [x] 4.2.6 Rollback on error (Implements: FR-012)

- [x] 4.3 Implement memory snapshot read
  - [x] 4.3.1 Create getLatestMemorySnapshot() function in db.js (Implements: FR-013)
  - [x] 4.3.2 Query: SELECT snapshot FROM memory_snapshots WHERE instance_id = ? ORDER BY id DESC LIMIT 1 (Implements: FR-013)
  - [x] 4.3.3 Parse JSON and return memory object (Implements: FR-013)
  - [x] 4.3.4 Return null if no snapshot exists (Implements: FR-013)

- [x] 4.4 Test memory snapshots
  - [x] 4.4.1 Integration test: writeEventWithMemory() writes both event and snapshot (Implements: FR-011)
  - [x] 4.4.2 Integration test: transaction rollback on error (Implements: FR-012)
  - [x] 4.4.3 Integration test: getLatestMemorySnapshot() returns correct snapshot (Implements: FR-013)
  - [x] 4.4.4 Integration test: memory snapshot JSON structure matches memory-store.js format (Implements: FR-013)

### Phase 5: Migration Strategy

- [x] 5.1 Implement dual-write mode
  - [x] 5.1.1 Create server/storage/storage-adapter.js with StorageAdapter class (Implements: FR-014, FR-015, FR-016)
  - [x] 5.1.2 Support STORAGE_MODE env var: sqlite|json|dual-write (Implements: FR-014, FR-015)
  - [x] 5.1.3 In dual-write mode, write to both JSON and SQLite (Implements: FR-014)
  - [x] 5.1.4 Log discrepancies between JSON and SQLite writes (Implements: NFR-006)
  - [x] 5.1.5 In sqlite mode with ENABLE_JSON_FALLBACK=true, fall back to JSON on read errors (Implements: FR-016)

- [x] 5.2 Update memory-store.js to use StorageAdapter
  - [x] 5.2.1 Import StorageAdapter in memory-store.js (Implements: FR-014)
  - [x] 5.2.2 Replace fs.writeFileSync with adapter.writeMemory() (Implements: FR-014)
  - [x] 5.2.3 Replace fs.readFileSync with adapter.readMemory() (Implements: FR-014)
  - [x] 5.2.4 Preserve existing memory-store.js API (no breaking changes) (Implements: FR-013)

- [x] 5.3 Update event-bus.js to use StorageAdapter
  - [x] 5.3.1 Import StorageAdapter in event-bus.js (Implements: FR-014)
  - [x] 5.3.2 Call adapter.writeEvent() when emitting events (Implements: FR-014)
  - [x] 5.3.3 Preserve existing event-bus.js API (no breaking changes) (Implements: FR-014)

- [x] 5.4 Create migration script
  - [x] 5.4.1 Create scripts/migrate-to-sqlite.js (Implements: FR-017)
  - [x] 5.4.2 Backup existing SQLite file if it exists (Implements: NFR-005)
  - [x] 5.4.3 Read all JSON event files from data/events/*.jsonl (Implements: FR-017)
  - [x] 5.4.4 Parse events and sort by timestamp (Implements: FR-017)
  - [x] 5.4.5 Write events to SQLite with reconstructed hash chain (Implements: FR-017)
  - [x] 5.4.6 Read all JSON memory files from data/memories/*.json (Implements: FR-017)
  - [x] 5.4.7 Write memory snapshots to SQLite (Implements: FR-017)
  - [x] 5.4.8 Log progress: events imported, errors, duration (Implements: NFR-009)
  - [x] 5.4.9 Validate hash chain after migration (Implements: FR-017)

- [x] 5.5 Test migration
  - [x] 5.5.1 Integration test: migrate 100 events from JSON to SQLite (Implements: FR-017)
  - [x] 5.5.2 Integration test: hash chain is valid after migration (Implements: FR-017)
  - [x] 5.5.3 Integration test: memory snapshots match JSON files (Implements: FR-017)
  - [x] 5.5.4 Integration test: dual-write mode writes to both stores (Implements: FR-014)
  - [x] 5.5.5 Integration test: JSON fallback works when SQLite fails (Implements: FR-016)

### Phase 6: Event Replay

- [ ] 6.1 Implement event replay
  - [ ] 6.1.1 Create replayEvents() function in server/storage/replay.js (Implements: FR-018, FR-019)
  - [ ] 6.1.2 Accept filters: { instance_id, start_time, end_time } (Implements: FR-019)
  - [ ] 6.1.3 Query events from SQLite with filters (Implements: FR-019)
  - [ ] 6.1.4 Initialize fresh memory state (Implements: FR-018)
  - [ ] 6.1.5 Apply each event's memory_updates to memory state (Implements: FR-018)
  - [ ] 6.1.6 Return reconstructed memory state (Implements: FR-018)
  - [ ] 6.1.7 Log warning if events are missing in sequence (Implements: EC5)

- [ ] 6.2 Test event replay
  - [ ] 6.2.1 Integration test: replay 10 events reconstructs correct memory state (Implements: FR-018)
  - [ ] 6.2.2 Integration test: replay with timestamp filter stops at correct point (Implements: FR-019)
  - [ ] 6.2.3 Integration test: replay with missing event logs warning and continues (Implements: EC5)

### Phase 7: Performance Benchmarks

- [ ] 7.1 Benchmark event writes
  - [ ] 7.1.1 Create scripts/benchmark-writes.js (Implements: NFR-001)
  - [ ] 7.1.2 Write 1000 events and measure p50, p95, p99 latency (Implements: NFR-001)
  - [ ] 7.1.3 Verify p95 < 50ms (Implements: NFR-001)

- [ ] 7.2 Benchmark hash chain validation
  - [ ] 7.2.1 Create scripts/benchmark-validation.js (Implements: NFR-002)
  - [ ] 7.2.2 Validate hash chain for 10,000 events (Implements: NFR-002)
  - [ ] 7.2.3 Verify validation completes in <1s (Implements: NFR-002)

- [ ] 7.3 Benchmark queries
  - [ ] 7.3.1 Create scripts/benchmark-queries.js (Implements: NFR-003)
  - [ ] 7.3.2 Query events by member_id, threat_level, timestamp range (Implements: NFR-003)
  - [ ] 7.3.3 Verify indexes are used (EXPLAIN QUERY PLAN) (Implements: NFR-003)

### Phase 8: Documentation and Deployment

- [x] 8.1 Update documentation
  - [x] 8.1.1 Update README.md with SQLite setup instructions (Implements: FR-001)
  - [x] 8.1.2 Update docs/API.md with new query endpoints (Implements: FR-006, FR-007, FR-008, FR-009)
  - [x] 8.1.3 Update docs/PRODUCTION_DEPLOYMENT.md with migration guide (Implements: FR-017)
  - [x] 8.1.4 Document STORAGE_MODE and ENABLE_JSON_FALLBACK env vars (Implements: FR-014, FR-015, FR-016)

- [ ] 8.2 Create deployment checklist
  - [ ] 8.2.1 Document migration steps: backup → dual-write → verify → cutover → deprecate JSON (Implements: FR-017)
  - [ ] 8.2.2 Document rollback procedure (Implements: FR-015, FR-016)
  - [ ] 8.2.3 Document hash chain validation schedule (daily cron job) (Implements: FR-004)

## IN PROGRESS

## DONE

## Task Dependencies

```
Phase 1 (Schema) → Phase 2 (Hash Chain)
Phase 2 (Hash Chain) → Phase 3 (Event Storage)
Phase 3 (Event Storage) → Phase 4 (Memory Snapshots)
Phase 4 (Memory Snapshots) → Phase 5 (Migration)
Phase 5 (Migration) → Phase 6 (Event Replay)
Phase 6 (Event Replay) → Phase 7 (Performance)
Phase 7 (Performance) → Phase 8 (Documentation)
```

## Notes

- SQLite file location: data/cortege.db (default)
- JSON files remain in data/events/*.jsonl and data/memories/*.json during migration
- Dual-write mode allows gradual rollout and verification
- Hash chain validation should run daily in production (cron job)
- Migration script is idempotent (can be run multiple times safely)

## Estimated Effort

- Phase 1: 0.5 days (schema and infrastructure)
- Phase 2: 1 day (hash chain implementation and tests)
- Phase 3: 1 day (event storage API and tests)
- Phase 4: 1 day (memory snapshot integration and tests)
- Phase 5: 2 days (migration strategy, dual-write, adapter, tests)
- Phase 6: 1 day (event replay and tests)
- Phase 7: 0.5 days (performance benchmarks)
- Phase 8: 0.5 days (documentation)

Total: 7.5 days (1.5 weeks)

## Success Criteria

- [ ] All 19 functional requirements implemented
- [ ] All 10 non-functional requirements met
- [ ] All 8 edge cases handled
- [ ] Hash chain validation passes for 10,000+ events
- [ ] Migration script successfully imports existing JSON files
- [ ] Performance benchmarks meet targets (<50ms writes, <1s validation)
- [ ] All tests pass (unit + integration)
- [ ] Documentation complete (README, API, PRODUCTION_DEPLOYMENT)
