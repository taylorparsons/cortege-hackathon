# Feature Spec: 20260320-playwright-e2e

Status: Active
Created: 2026-03-20 11:00
Inputs: CR-20260320-1000, CR-20260320-1100
Decisions: D-20260320-1100

## Summary
Add Playwright end-to-end tests to CORTEGE covering navigation, household CRUD, member CRUD, companion cards, and live feed. Tests run against the full stack (Vite frontend on 5173, Express backend on 3001) using existing data-testid attributes. Each test file uses API helpers to set up and tear down test data so tests are isolated and deterministic.

## User Stories & Acceptance

### US1: Developer can run E2E tests with a single command (Priority: P1)
Narrative:
- As a developer, I want to run `npm run test:e2e:pw` to verify the full CORTEGE app, so that regressions are caught before merging.

Acceptance scenarios:
1. Given the project is installed, When I run `npm run test:e2e:pw`, Then Playwright starts both servers and runs all 16 tests. (Verifies: FR-001, FR-002)

### US2: Navigation tests verify tab routing (Priority: P1)
Narrative:
- As a tester, I want navigation tests, so that tab switching is verified to work correctly.

Acceptance scenarios:
1. Given the app loads, When I check all 4 nav tabs, Then all are visible. (Verifies: FR-003)
2. Given the app loads, When I click each tab, Then the content section changes. (Verifies: FR-003)
3. Given a household exists, When the app loads, Then household-bar shows the household name. (Verifies: FR-004)

### US3: Household CRUD tests cover create/switch/delete flow (Priority: P1)
Narrative:
- As a tester, I want household CRUD tests, so that the household management UI is verified end-to-end.

Acceptance scenarios:
1. Given the app loads, When I click btn-switch-household, Then the household selector modal opens. (Verifies: FR-005)
2. Given the modal is open, When I fill and submit the create form, Then the new household appears in the list. (Verifies: FR-006)
3. Given two households exist, When I click a household row, Then household-name updates. (Verifies: FR-007)
4. Given a household exists, When I accept the delete confirm dialog, Then the household is removed. (Verifies: FR-008)

### US4: Member CRUD tests cover add/edit/remove flow (Priority: P1)
Narrative:
- As a tester, I want member CRUD tests, so that member management UI is verified end-to-end.

Acceptance scenarios:
1. Given a household exists, When I add a member via the form, Then the member row appears. (Verifies: FR-009)
2. Given a member exists, When I edit and save the member, Then the updated name is shown. (Verifies: FR-010)
3. Given a member exists, When I accept the remove confirm dialog, Then the member row is gone. (Verifies: FR-011)
4. Given the add-member form, When I select profile type "child", Then companion designation shows "scout". (Verifies: FR-012)

### US5: Companion card tests verify detail panel interaction (Priority: P1)
Narrative:
- As a tester, I want companion card tests, so that the companion detail panel interaction is verified.

Acceptance scenarios:
1. Given a household exists, When the app loads the Household tab, Then the companion grid renders. (Verifies: FR-013)
2. Given companions are loaded, When I click a companion card, Then the detail panel is visible. (Verifies: FR-014)
3. Given the detail panel is open, When I click the same card again, Then the detail panel closes. (Verifies: FR-015)

### US6: Live Feed tests verify agent monitoring components (Priority: P1)
Narrative:
- As a tester, I want live feed tests, so that the agent monitoring UI components are verified present.

Acceptance scenarios:
1. Given the app loads, When I click the Live Feed tab, Then event-feed and agent-status are visible. (Verifies: FR-016)
2. Given the Live Feed tab, When I look at the event injector, Then form-event-injector and btn-inject-event are visible. (Verifies: FR-017)

## Requirements

Functional requirements:
- FR-001: `npm run test:e2e:pw` script added to package.json that runs `npx playwright test`. (Sources: CR-20260320-1100)
- FR-002: playwright.config.js configures testDir ./e2e, baseURL http://localhost:5173, webServer entries for both backend (3001) and frontend (5173), reuseExistingServer: true. (Sources: CR-20260320-1100)
- FR-003: navigation.spec.js with 3 tests verifying tab rendering and tab switching. (Sources: CR-20260320-1100)
- FR-004: navigation.spec.js test 3 verifies household bar shows name when household exists. (Sources: CR-20260320-1100)
- FR-005: household-crud.spec.js test 1 opens household selector modal via btn-switch-household. (Sources: CR-20260320-1100)
- FR-006: household-crud.spec.js test 2 creates a new household and verifies it in list. (Sources: CR-20260320-1100)
- FR-007: household-crud.spec.js test 3 switches to a different household and verifies household-name updates. (Sources: CR-20260320-1100)
- FR-008: household-crud.spec.js test 4 deletes a household via confirm dialog. (Sources: CR-20260320-1100)
- FR-009: member-crud.spec.js test 1 adds a member and verifies member row. (Sources: CR-20260320-1100)
- FR-010: member-crud.spec.js test 2 edits a member and verifies updated name. (Sources: CR-20260320-1100)
- FR-011: member-crud.spec.js test 3 removes a member via confirm dialog and verifies row gone. (Sources: CR-20260320-1100)
- FR-012: member-crud.spec.js test 4 verifies profile type "child" auto-derives "scout" companion. (Sources: CR-20260320-1100)
- FR-013: companion-cards.spec.js test 1 verifies companion grid renders. (Sources: CR-20260320-1100)
- FR-014: companion-cards.spec.js test 2 verifies clicking a companion card shows detail panel. (Sources: CR-20260320-1100)
- FR-015: companion-cards.spec.js test 3 verifies clicking same card again closes detail panel. (Sources: CR-20260320-1100)
- FR-016: live-feed.spec.js test 1 verifies event-feed and agent-status visible on Live Feed tab. (Sources: CR-20260320-1100)
- FR-017: live-feed.spec.js test 2 verifies form-event-injector and btn-inject-event visible. (Sources: CR-20260320-1100)
- FR-018: e2e/helpers.js exports createTestHousehold, deleteTestHousehold, addTestMember, cleanupTestHouseholds. (Sources: CR-20260320-1100)
- FR-019: Each test file uses beforeEach to clean up E2E test data via API helpers. (Sources: CR-20260320-1100)

## Edge cases
- App may be slow to start; webServer timeout set to 10000ms with reuseExistingServer to handle pre-running servers. (Verifies: FR-002)
- Confirm dialogs require page.on('dialog') handler set BEFORE clicking delete. (Verifies: FR-008, FR-011)
- Test data uses E2E Test prefix with timestamp for uniqueness; cleanupTestHouseholds deletes any household starting with "E2E Test". (Verifies: FR-019)
