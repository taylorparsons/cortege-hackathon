# Tasks: 20260323-warden-agent

Spec: docs/specs/20260323-warden-agent/spec.md

## NEXT

### Phase 1 — Storage + Registry + API + UI (no browser automation)
- T-001: Create `server/warden/broker-scan-store.js` with file-based storage for `data/broker-scans/`. (Implements: FR-005)
- T-002: Create `server/tests/broker-scan-store.test.js` (CRUD, status transitions, aggregates). (Implements: FR-005)
- T-003: Create `server/warden/broker-registry.js` that loads `server/warden/brokers/*.json`. (Implements: FR-002)
- T-004: Create all 10 broker definition JSON files in `server/warden/brokers/`. (Implements: FR-001, FR-002, FR-008)
- T-005: Create `server/tests/broker-registry.test.js` (loading, validation, filtering). (Implements: FR-002)
- T-006: Add 6 new event types to `server/orchestrator/event-bus.js`. (Implements: FR-005, FR-008)
- T-007: Add 10 WARDEN REST endpoints to `server/api/routes.js`. (Implements: FR-001, FR-005, FR-008)
- T-008: Create `src/components/BrokerStatus.jsx` and replace hardcoded relay card in `src/Cortege.jsx`. (Implements: FR-006)

### Phase 2 — Browser Automation Engine
- T-009: Add `playwright-core` as production dependency. (Implements: FR-003)
- T-010: Create `server/warden/browser-session.js` (Playwright chromium wrapper). (Implements: FR-003, FR-004)
- T-011: Create `server/warden/scan-executor.js` (step-walker with extract_associates support). (Implements: FR-003, FR-008)
- T-012: Create `server/warden/associate-discovery.js` (extract + deduplicate associated people). (Implements: FR-008)
- T-013: Create `server/warden/warden-engine.js` (scan queue, session pool, cron scheduling). (Implements: FR-001, FR-003, FR-010)
- T-014: Wire `WardenEngine` into `server/orchestrator/orchestrator.js`. (Implements: FR-001, FR-010)
- T-015: Create `server/tests/warden-engine.test.js` (Playwright mocked). (Implements: FR-001, FR-003)

### Phase 3 — CAPTCHA Escalation
- T-016: Create `server/warden/captcha-manager.js` (session tracking, timeout, resolution). (Implements: FR-004)
- T-017: Add `captcha_assist` action type to `server/escalation/escalation-handler.js`. (Implements: FR-004)
- T-018: Add WARDEN WebSocket event names to `server/api/websocket.js`. (Implements: FR-004, FR-005)
- T-019: Create `src/components/CaptchaAssist.jsx` (screenshot modal, direct URL, resolve button). (Implements: FR-007)
- T-020: Handle `warden:*` WebSocket events in `src/hooks/useCortegeData.js`. (Implements: FR-004, FR-005, FR-006, FR-008)

### Phase 4 — Associate Discovery UI
- T-021: Create `src/components/AssociateDiscovery.jsx` (Add to Household + Dismiss). (Implements: FR-009)
- T-022: Integrate AssociateDiscovery into BrokerStatus or Companion Network tab. (Implements: FR-009)

### Phase 5 — Polish + Test
- T-023: Add integration tests for WARDEN engine + event bus + escalation handler. (Implements: FR-001, FR-004)
- T-024: Add E2E tests for BrokerStatus and CaptchaAssist components. (Implements: FR-006, FR-007)
- T-025: Add `.env.example` entries for WARDEN config vars. (Implements: FR-010, NFR-003, NFR-004)
- T-026: Create `agents/warden/agent.md` template. (Implements: FR-001)

## IN PROGRESS

## DONE
