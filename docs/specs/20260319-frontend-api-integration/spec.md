# Feature Spec: 20260319-frontend-api-integration

Status: Done
Created: 2026-03-19 10:00
Inputs: CR-20260319-1000
Decisions: D-20260319-1000

## Summary
Replace all hardcoded mock data in the CORTEGE React frontend with live API data from the backend. The main Household tab currently displays 100% fake data (HOUSEHOLD, COMPANIONS constants). The backend API already serves real companion status, events, and memory — the frontend just doesn't use it. This change makes the app a "trusted background app that builds trust over time" by showing only real system data that grows as the agents learn.

## User Stories & Acceptance

### US1: Dashboard shows real companion data (Priority: P1)
Narrative:
- As a household admin, I want the dashboard to show real companion agent status, so that I trust the data is genuine.

Acceptance scenarios:
1. Given the backend is running with agents loaded, When I open the Household tab, Then I see companion cards populated from GET /api/companions with real stage, depth score, and events processed. (Verifies: FR-001, FR-002, FR-003)
2. Given the backend has no events yet, When I open the Household tab, Then I see companion cards with empty/zero state that clearly shows "no activity yet" rather than fake data. (Verifies: FR-001, FR-008)
3. Given a demo scenario has been run, When I view the Household tab, Then companion cards reflect the actual events and learning from that scenario. (Verifies: FR-001, FR-002)

### US2: Real-time updates on main view (Priority: P1)
Narrative:
- As a household admin, I want the Household tab to update in real-time via WebSocket, so that I see the system working live.

Acceptance scenarios:
1. Given I'm on the Household tab with WebSocket connected, When an event is processed by an agent, Then the companion card updates its stats and last action without page refresh. (Verifies: FR-005, FR-006)
2. Given I'm on the Household tab, When an agent transitions to a new learning stage, Then the companion card reflects the new stage immediately. (Verifies: FR-005, FR-007)

### US3: Detail panel shows real activity (Priority: P2)
Narrative:
- As a household admin, I want to click a companion card and see real activity from the API, so that I can review actual agent actions.

Acceptance scenarios:
1. Given I click a companion card, When the detail panel opens, Then recent activity is fetched from GET /api/companions/:id/activity and displayed. (Verifies: FR-004, FR-009)
2. Given I click a companion card, When the detail panel opens, Then memory data is fetched from GET /api/companions/:id/memory and displayed. (Verifies: FR-004, FR-010)

### US4: Household info from API (Priority: P1)
Narrative:
- As a household admin, I want household metadata to come from the API, so that it reflects the actual configured household.

Acceptance scenarios:
1. Given the backend is running, When I view the Household tab header bar, Then household name and location come from GET /api/household. (Verifies: FR-011)

## Requirements

Functional requirements:
- FR-001: Remove hardcoded COMPANIONS constant from Cortege.jsx and replace with API-fetched data. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-002: Fetch companion data from GET /api/companions on component mount and on WebSocket reconnect. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-003: Extend backend getStatus() to include: agentRole, pairedMemberName, pairedMemberAge, profileType, lastAction (text + timestamp), eventsProcessedToday, and color/display metadata. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-004: Fetch companion detail data from GET /api/companions/:id/activity and GET /api/companions/:id/memory when detail panel opens. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-005: Route WebSocket companion:status and agent:response events to main Household tab state, not just Live Feed. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-006: Update companion card stats in real-time when agent:response events arrive (increment eventsProcessed, update lastAction). (Sources: CR-20260319-1000; D-20260319-1000)
- FR-007: Update companion card stage when stage:transition WebSocket events arrive. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-008: Show graceful empty/loading states when API data is not yet available. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-009: Display recent activity in detail panel using real event data formatted with event type icons and timestamps. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-010: Display memory/learning state in detail panel using real memory data from the API. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-011: Remove hardcoded HOUSEHOLD constant and fetch from GET /api/household. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-012: Derive companion display properties (color, glow, ring) from agent type/profile type, not from mock data. (Sources: CR-20260319-1000; D-20260319-1000)
- FR-013: Keep DEPTH_STAGES as a UI constant (it defines the learning model visualization, not fake data). (Sources: CR-20260319-1000; D-20260319-1000)

Non-functional requirements:
- NFR-001: Initial data fetch should complete within 500ms on localhost. (Sources: CR-20260319-1000)
- NFR-002: WebSocket updates should reflect in UI within 100ms of receipt. (Sources: CR-20260319-1000)
- NFR-003: Frontend should work gracefully when backend is offline (show connection status, no crashes). (Sources: CR-20260319-1000)

## Edge cases
- EC-001: Backend offline — show "connecting..." state, no crashes. (Verifies: FR-008)
- EC-002: Backend running but no agents loaded — show empty companion grid with message. (Verifies: FR-008)
- EC-003: Agent has never processed an event — show zero counts and "No activity yet". (Verifies: FR-008)
- EC-004: WebSocket reconnects after disconnect — re-fetch companion data to sync state. (Verifies: FR-002, FR-005)
- EC-005: API returns unexpected shape — defensive parsing, don't crash. (Verifies: FR-001)
