# Tasks: 20260323-warden-agent

Spec: docs/specs/20260323-warden-agent/spec.md

## NEXT
- T-026 (deferred): Manual end-to-end smoke test with live household data and real Playwright browser against WhitePages. Deferred to post-hackathon.

## IN PROGRESS

## DONE
- [2026-03-23 10:00] T-001: Create `server/warden/broker-scan-store.js` with file-based storage for `data/broker-scans/`. (Implements: FR-005)
- [2026-03-23 10:00] T-002: Create `server/tests/broker-scan-store.test.js` (CRUD, status transitions, aggregates). (Implements: FR-005)
- [2026-03-23 10:00] T-003: Create `server/warden/broker-registry.js` that loads `server/warden/brokers/*.json`. (Implements: FR-002)
- [2026-03-23 10:00] T-004: Create all 10 broker definition JSON files in `server/warden/brokers/`. (Implements: FR-001, FR-002, FR-008)
- [2026-03-23 10:00] T-005: Create `server/tests/broker-registry.test.js` (loading, validation, filtering). (Implements: FR-002)
- [2026-03-23 10:00] T-006: Add 6 new event types to `server/orchestrator/event-bus.js`. (Implements: FR-005, FR-008)
- [2026-03-23 10:00] T-007: Add 10 WARDEN REST endpoints to `server/api/routes.js`. (Implements: FR-001, FR-005, FR-008)
- [2026-03-23 10:00] T-008: Create `src/components/BrokerStatus.jsx` and replace hardcoded relay card in `src/Cortege.jsx`. (Implements: FR-006)
- [2026-03-23 10:00] T-009: `@playwright/test` already present as devDep — no additional dep needed. (Implements: FR-003)
- [2026-03-23 10:00] T-010: Create `server/warden/browser-session.js` (Playwright chromium wrapper). (Implements: FR-003, FR-004)
- [2026-03-23 10:00] T-011: Create `server/warden/scan-executor.js` (step-walker with extract_associates support). (Implements: FR-003, FR-008)
- [2026-03-23 10:00] T-012: Create `server/warden/associate-discovery.js` (extract + deduplicate associated people). (Implements: FR-008)
- [2026-03-23 10:00] T-013: Create `server/warden/warden-engine.js` (scan queue, session pool, cron scheduling). (Implements: FR-001, FR-003, FR-010)
- [2026-03-23 10:00] T-014: Wire `WardenEngine` into `server/orchestrator/orchestrator.js`. (Implements: FR-001, FR-010)
- [2026-03-23 10:00] T-015: Create `server/tests/warden-engine.test.js` (Playwright mocked). (Implements: FR-001, FR-003)
- [2026-03-23 10:10] T-016: Create `server/warden/captcha-manager.js` (session tracking, timeout, resolution). (Implements: FR-004)
- [2026-03-23 10:10] T-017: Add `captcha_assist` action type to `server/escalation/escalation-handler.js`. (Implements: FR-004)
- [2026-03-23 10:10] T-018: Add WARDEN WebSocket event names to `server/api/websocket.js`. (Implements: FR-004, FR-005)
- [2026-03-23 10:10] T-019: Create `src/components/CaptchaAssist.jsx` (screenshot modal, direct URL, resolve button). (Implements: FR-007)
- [2026-03-23 10:10] T-020: Handle `warden:*` WebSocket events in `src/hooks/useCortegeData.js`. (Implements: FR-004, FR-005, FR-006, FR-008)
- [2026-03-23 10:30] T-021: Create `src/components/AssociateDiscovery.jsx` (Add to Household + Dismiss). (Implements: FR-009)
- [2026-03-23 10:30] T-022: Integrate AssociateDiscovery into Companion Network tab (NetworkView relay grid). (Implements: FR-009)
- [2026-03-23 10:30] T-023: Default cron changed 3 AM → noon; integrated alongside T-013. (Implements: FR-010, NFR-003)
- [2026-03-23 10:30] T-024: Add `.env.example` entries for WARDEN config vars. (Implements: FR-010, NFR-003, NFR-004)
- [2026-03-23 10:30] T-025: Create `agents/warden/agent.md` template. (Implements: FR-001)
