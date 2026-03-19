# Feature Spec: 20260319-frontend-dev-connectivity

Status: Done
Created: 2026-03-19 16:54
Inputs: CR-20260319-1654
Decisions: D-20260319-1654

## Summary
Fix localhost development connectivity so the React UI can actually consume the running CORTEGE backend when started with `./run-local.sh`. The frontend currently uses absolute backend URLs (`localhost:3001`) from the Vite dev origin (`localhost:5173`), which fails in the browser without CORS or proxying. The correct local-dev contract is same-origin-relative frontend requests plus a Vite proxy to the backend.

## User Stories & Acceptance

### US1: Household tab loads real backend data locally (Priority: P1)
Narrative:
- As a household admin running the app locally, I want the Household tab to load real data from the backend, so that the UI reflects actual system state instead of failing on startup.

Acceptance scenarios:
1. Given I start the app with `./run-local.sh`, When I open the Household tab at `http://localhost:5173`, Then household and companion data load successfully through the dev server without browser CORS failures. (Verifies: FR-001, FR-003, FR-004)
2. Given the backend is actually offline, When I open the Household tab, Then I still see the existing offline/error state instead of a crash. (Verifies: FR-001, FR-005)

### US2: Live Feed connects over the same local-dev contract (Priority: P1)
Narrative:
- As a household admin, I want the Live Feed WebSocket to connect through the current app origin, so that real-time updates work in local development.

Acceptance scenarios:
1. Given the backend is running, When I open the Live Feed tab, Then the WebSocket connects through `/ws` on the current origin and real-time updates flow normally. (Verifies: FR-002, FR-003)

### US3: Local startup instructions match the real command surface (Priority: P2)
Narrative:
- As a developer, I want the UI and scripts to point to a valid backend start command, so that local troubleshooting instructions are accurate.

Acceptance scenarios:
1. Given the UI reports the backend is offline, When I read the recovery text, Then the suggested backend start command exists in `package.json`. (Verifies: FR-006)

## Requirements

Functional requirements:
- FR-001: Replace hardcoded absolute REST API origins in active frontend code with same-origin-relative request paths. (Sources: CR-20260319-1654; D-20260319-1654)
- FR-002: Replace the hardcoded WebSocket origin in active frontend code with a browser-derived `/ws` URL based on the current page origin. (Sources: CR-20260319-1654; D-20260319-1654)
- FR-003: Configure Vite dev proxy rules for `/api`, `/ws`, and `/ingest` to `http://localhost:3001` so local development works without backend CORS changes. (Sources: CR-20260319-1654; D-20260319-1654)
- FR-004: Remove direct `localhost:3001` references from active frontend runtime code used by the UI. (Sources: CR-20260319-1654; D-20260319-1654)
- FR-005: Preserve the existing offline/error handling when the backend is genuinely unavailable. (Sources: CR-20260319-1654)
- FR-006: Add a valid `npm run server` script and keep local startup flows consistent with that command. (Sources: CR-20260319-1654; D-20260319-1654)

Non-functional requirements:
- NFR-001: Local development must work with the existing `./run-local.sh` entrypoint without requiring browser CORS workarounds. (Sources: CR-20260319-1654; D-20260319-1654)
- NFR-002: The fix must not change backend REST or WebSocket payload shapes. (Sources: CR-20260319-1654)
- NFR-003: Production build must continue to succeed after the transport-layer changes. (Sources: CR-20260319-1654)

## Edge cases
- EC-001: Backend offline after frontend starts — relative requests still fail gracefully and show the existing error UI. (Verifies: FR-005)
- EC-002: WebSocket must use `wss:` automatically if the page origin is HTTPS. (Verifies: FR-002)
- EC-003: Live Feed, Scenario Runner, Event Injector, detail hooks, and memory viewer must all use the same origin strategy so some panels do not silently keep failing. (Verifies: FR-001, FR-002, FR-004)
