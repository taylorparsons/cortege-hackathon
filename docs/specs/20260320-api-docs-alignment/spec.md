# Feature Spec: 20260320-api-docs-alignment

Status: Done
Created: 2026-03-20 14:35
Inputs: CR-20260320-1435

## Summary
Align `docs/API.md` and the served `/api/docs` page with the current route behavior after the recent household, location, privacy, and companion-status changes.

## User Stories & Acceptance

### US1: Operators see accurate served API docs (Priority: P1)
Narrative:
- As a developer using `http://localhost:3001/api/docs`, I want the served API documentation to match the current implementation, so I can call the latest routes and payloads correctly.

Acceptance scenarios:
1. Given I review the companion endpoints, When I read `GET /api/companions` and `GET /api/companions/:id`, Then I see the current `getStatus()` shape including `depthScore`, `eventsProcessed`, and the extended frontend fields. (Verifies: FR-001)
2. Given I review the location APIs, When I read the docs, Then I see the full location CRUD surface including `GET /api/locations/:id` and `PUT /api/locations/:id`. (Verifies: FR-002)
3. Given I review the household/member APIs, When I read the docs, Then I see the expanded `location_details` household response shape and current member update fields. (Verifies: FR-003)
4. Given the server is running locally, When I load `/api/docs`, Then the served page includes the updated API markdown content. (Verifies: FR-004)

## Requirements

Functional requirements:
- FR-001: `docs/API.md` shall document the current companion status payload shape returned by `AgentInstance.getStatus()`. (Sources: CR-20260320-1435; D-20260320-1435)
- FR-002: `docs/API.md` shall document the full location CRUD routes currently implemented in `server/api/routes.js`. (Sources: CR-20260320-1435; D-20260320-1435)
- FR-003: `docs/API.md` shall document the expanded household response shape and member create/update fields currently implemented in `server/api/routes.js`. (Sources: CR-20260320-1435; D-20260320-1435)
- FR-004: The served `/api/docs` page shall reflect the updated `docs/API.md` content. (Sources: CR-20260320-1435; D-20260320-1435)

Non-functional requirements:
- NFR-001: The API docs update shall stay factual and only document routes and payloads present in the current code. (Sources: CR-20260320-1435; D-20260320-1435)
