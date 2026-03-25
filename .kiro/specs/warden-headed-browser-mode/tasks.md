# Tasks: WARDEN Headed/Headless Browser Mode

**Feature ID:** warden-headed-browser-mode
**Spec:** [requirements.md](requirements.md)
**Design:** [design.md](design.md)
**Detailed Plan:** [../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md)

> **Note:** This is a high-level task summary. For detailed implementation steps with exact code, commands, and TDD workflow, see the [detailed implementation plan](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md).

---

## Phase 1: Core Infrastructure

### T-001: Create ModeResolver Module
**Implements:** FR-001, FR-002, FR-005

Create the ModeResolver class that determines browser mode based on priority: user override > broker config > env var > default.

**Files:**
- Create: `server/warden/mode-resolver.js`
- Create: `server/tests/mode-resolver.test.js`

**Acceptance:**
- [x] ModeResolver.resolve() returns 'headed' when job.headedOverride is true
- [x] ModeResolver.resolve() returns 'headless' when job.headedOverride is false
- [x] ModeResolver.resolve() returns 'headed' when broker.requires_headed_mode is true
- [x] ModeResolver.resolve() returns 'headless' when broker.requires_headed_mode is false
- [x] ModeResolver.resolve() returns 'headed' when globalHeadedMode is true and no other config
- [x] ModeResolver.resolve() returns 'headless' by default when no config provided
- [x] ModeResolver.resolve() logs deprecation warning when using globalHeadedMode
- [x] All 7 unit tests pass

---

### T-002: Add Broker Definition Validation
**Implements:** FR-001, FR-007

Update BrokerRegistry to validate the optional requires_headed_mode field in broker definitions.

**Files:**
- Modify: `server/warden/broker-registry.js`
- Modify: `server/tests/broker-registry.test.js`

**Acceptance:**
- [x] BrokerRegistry._validateBroker() throws error when requires_headed_mode is not boolean
- [x] BrokerRegistry._validateBroker() accepts requires_headed_mode: true
- [x] BrokerRegistry._validateBroker() accepts requires_headed_mode: false
- [x] BrokerRegistry._validateBroker() accepts missing requires_headed_mode field
- [x] All existing broker definitions load without errors
- [x] All broker registry tests pass

---

## Phase 2: WARDEN Engine Integration

### T-003: Integrate ModeResolver into WARDEN Engine
**Implements:** FR-002, FR-005, FR-006, FR-008, FR-009
**Detailed Steps:** See [Plan Chunk 3](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md#chunk-3-warden-engine-integration)

Update WARDEN Engine to use ModeResolver for determining browser mode per scan job, including event updates and error handling.

**Files:**
- Modify: `server/warden/warden-engine.js`

**Acceptance:**
- [x] WARDEN Engine imports ModeResolver
- [x] Constructor initializes _activeHeadedSessions counter
- [x] enqueueScan() accepts optional headed parameter
- [x] Scan jobs store headedOverride field
- [x] _executeJob() resolves mode using ModeResolver
- [x] _executeJob() stores resolvedMode in job for audit
- [x] _executeJob() logs mode in scan start message
- [x] Browser session launches with correct headless parameter
- [x] Headed sessions increment/decrement _activeHeadedSessions counter
- [x] All scan events (WebSocket and event bus) include mode field
- [x] Browser launch failures include mode in error metadata
- [x] All existing WARDEN Engine tests pass

---

## Phase 3: Storage Layer

### T-004: Update Broker Scan Store to Track Mode
**Implements:** FR-008
**Detailed Steps:** See [Plan Chunk 4](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md#chunk-4-storage-layer-updates)

Extend BrokerScanStore to persist browser mode in scan history.

**Files:**
- Modify: `server/warden/broker-scan-store.js`
- Modify: `server/tests/broker-scan-store.test.js`

**Acceptance:**
- [x] updateBrokerStatus() accepts mode in metadata parameter
- [x] Broker status includes last_scan_mode field
- [x] Scan history entries include mode field
- [x] Mode defaults to 'headless' when not provided
- [x] getMemberScans() returns mode data correctly
- [x] Test verifies mode storage in scan history
- [x] Test verifies default to headless when mode omitted
- [x] All broker scan store tests pass

---

## Phase 4: API Layer

### T-005: Add POST /api/warden/scan/headed Endpoint
**Implements:** FR-003
**Detailed Steps:** See [Plan Chunk 5](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md#chunk-5-api-endpoint)

Create new API endpoint for triggering headed scans.

**Files:**
- Modify: `server/api/routes.js`
- Create: `server/tests/warden-headed-mode.test.js`

**Acceptance:**
- [x] Endpoint validates household_id is provided
- [x] Endpoint validates member_id is provided
- [x] Endpoint validates broker_id is provided
- [x] Endpoint returns 400 when required fields missing
- [x] Endpoint returns 404 when household not found
- [x] Endpoint returns 404 when member not found
- [x] Endpoint returns 404 when broker not found
- [x] Endpoint queues scan with headed: true
- [x] Endpoint returns 200 with success message
- [x] Integration tests verify endpoint behavior
- [x] All API tests pass

---

### T-006: Update API Documentation
**Implements:** FR-003
**Detailed Steps:** See [Plan Chunk 5, Step 5](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md#chunk-5-api-endpoint)

Document the new headed scan endpoint in API documentation.

**Files:**
- Modify: `docs/API.md`

**Acceptance:**
- [x] API.md includes POST /api/warden/scan/headed section
- [x] Documentation shows request body schema
- [x] Documentation shows success response format
- [x] Documentation shows error responses (400, 404, 500)
- [x] Documentation includes curl example

---

## Phase 5: UI Layer

### T-007: Create BrokerScanStatus Component
**Implements:** FR-004
**Detailed Steps:** See [Plan Chunk 6](../../docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md#chunk-6-ui-component)

Create React component for displaying broker scan status with headed scan button.

**Files:**
- Create: `src/components/BrokerScanStatus.jsx`

**Acceptance:**
- [ ] Component displays broker name
- [ ] Component displays scan status
- [ ] Component displays last scan timestamp
- [ ] Component displays mode badge (headed/headless)
- [ ] Component shows warning for brokers requiring manual interaction
- [ ] Component includes "Scan with Browser" button
- [ ] Button calls POST /api/warden/scan/headed on click
- [ ] Component shows loading state while queueing
- [ ] Component shows success notification after queueing
- [ ] Component shows error notification on failure
- [ ] Component styling matches CORTEGE design system

---

## Phase 6: Broker Configuration

### T-009: Flag Cloudflare-Protected Brokers
**Implements:** FR-010

Update broker definitions for Cloudflare-protected brokers to use headed mode by default.

**Files:**
- Modify: `server/warden/brokers/cyberbackgroundchecks.json`
- Modify: `server/warden/brokers/spokeo.json`
- Modify: `server/tests/warden-headed-mode.test.js`

**Acceptance:**
- [x] CyberBackgroundChecks has requires_headed_mode: true
- [x] Spokeo has requires_headed_mode: true
- [x] Version and last_verified dates updated
- [x] Broker registry loads both definitions without errors
- [x] Test verifies Cloudflare brokers use headed mode by default
- [x] Test verifies ModeResolver returns 'headed' for these brokers
- [x] All broker tests pass

---

## Phase 7: Documentation

### T-010: Update Environment Variable Documentation
**Implements:** FR-007

Document WARDEN_HEADED_MODE deprecation and new per-broker configuration.

**Files:**
- Modify: `.env.example`
- Modify: `docs/WARDEN_DEMO_GUIDE.md`

**Acceptance:**
- [x] .env.example includes WARDEN_HEADED_MODE with deprecation notice
- [x] .env.example documents WARDEN_MAX_CONCURRENT_SESSIONS
- [ ] WARDEN_DEMO_GUIDE.md includes headed/headless mode section
- [ ] Documentation explains per-broker configuration
- [ ] Documentation explains manual headed scan workflow
- [ ] Documentation includes API endpoint example
- [ ] Documentation includes UI usage instructions

---

## Phase 8: Integration Testing

### T-011: End-to-End Integration Tests
**Implements:** FR-001, FR-002, FR-005, FR-006, FR-008

Create comprehensive integration tests for headed scan flow.

**Files:**
- Modify: `server/tests/warden-headed-mode.test.js`

**Acceptance:**
- [ ] Test: Full headed scan flow with mode tracking
- [ ] Test: Broker with requires_headed_mode uses headed by default
- [ ] Test: User override headless forces headless for headed broker
- [ ] Test: User override headed forces headed for headless broker
- [ ] Test: Mode is persisted in scan history
- [ ] Test: WebSocket events include mode field
- [ ] Test: Headed sessions are tracked separately
- [ ] All integration tests pass
- [ ] Full test suite passes with no regressions

---

## Phase 9: Error Handling

### T-012: Implement Headed Mode Error Handling
**Implements:** FR-009

Add error handling for headed browser launch failures.

**Files:**
- Modify: `server/warden/warden-engine.js`
- Modify: `server/tests/warden-headed-mode.test.js`

**Acceptance:**
- [ ] Browser launch failure marks scan as 'error'
- [ ] Error reason set to 'browser_launch_failed'
- [ ] Error includes mode in metadata
- [ ] WebSocket emits warden:scan_error with mode
- [ ] Error logged with full details
- [ ] Test verifies error handling for headed mode
- [ ] Test verifies error handling for headless mode
- [ ] All error handling tests pass

---

## Phase 10: Manual Verification

### T-013: Manual Testing and Verification
**Implements:** All requirements

Perform manual testing to verify end-to-end functionality.

**Acceptance:**
- [ ] Manual test: Headed scan via UI button works
- [ ] Manual test: Browser window opens for headed scan
- [ ] Manual test: Headless scan for non-protected broker works
- [ ] Manual test: No browser window for headless scan
- [ ] Manual test: Mode badges display correctly in UI
- [ ] Manual test: Warning appears for brokers requiring manual interaction
- [ ] Manual test: Success notification appears after queueing
- [ ] Manual test: Error notification appears on failure
- [ ] Review: All requirements documentation is accurate
- [ ] Review: All design documentation is accurate
- [ ] Review: All API documentation is accurate

---

### T-014: Create Implementation Summary
**Implements:** Documentation

Create summary document of completed implementation.

**Files:**
- Create: `.kiro/specs/warden-headed-browser-mode/IMPLEMENTATION_SUMMARY.md`

**Acceptance:**
- [x] Summary lists all completed tasks
- [x] Summary includes test results
- [x] Summary lists all files changed (new and modified)
- [x] Summary confirms all 10 requirements implemented
- [x] Summary includes next steps and future enhancements

---

## Summary

**Total Tasks:** 14
**Estimated Effort:** 4-6 hours
**Requirements Coverage:** 10/10 (100%)

**Task Breakdown by Phase:**
- Phase 1 (Core Infrastructure): 2 tasks
- Phase 2 (WARDEN Engine): 2 tasks
- Phase 3 (Storage Layer): 1 task
- Phase 4 (API Layer): 2 tasks
- Phase 5 (UI Layer): 1 task
- Phase 6 (Broker Config): 1 task
- Phase 7 (Documentation): 1 task
- Phase 8 (Integration Testing): 1 task
- Phase 9 (Error Handling): 1 task
- Phase 10 (Verification): 2 tasks

**Execution Order:**
Tasks should be executed in order (T-001 through T-014) as later tasks depend on earlier ones.

**Testing Strategy:**
- Unit tests: T-001, T-002, T-005
- Integration tests: T-006, T-011, T-012
- Manual tests: T-013
- Regression: Run full test suite after each phase

**Traceability:**
All tasks reference specific functional requirements (FR-001 through FR-010) from [requirements.md](requirements.md).
