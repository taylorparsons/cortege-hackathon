# Feature Spec: 20260320-cypress-e2e

Status: Active
Created: 2026-03-20 10:00
Inputs: CR-20260320-1000
Decisions: D-20260320-1000

## Summary

Add Cypress end-to-end tests for the CORTEGE application covering navigation, household CRUD, member CRUD, companion cards, and the live feed tab. Tests run against the live Vite dev server (port 5173) and backend (port 3001). Custom Cypress commands abstract API setup/teardown so each test controls its own data.

## User Stories & Acceptance

### US1: E2E test coverage for household and member flows (Priority: P1)
Narrative:
- As a developer, I want E2E tests that exercise the full browser-to-API path so that regressions in UI interactions and API wiring are caught before demo.

Acceptance scenarios:
1. Given the app is running, When I visit /, Then all 4 nav tabs are visible. (Verifies: FR-001)
2. Given a household exists, When I click a tab, Then the content area changes. (Verifies: FR-002)
3. Given no households, When I create one via the selector, Then it appears in the list. (Verifies: FR-003)
4. Given multiple households, When I click a household row, Then the household bar updates. (Verifies: FR-004)
5. Given a household exists, When I delete it, Then it disappears from the list. (Verifies: FR-005)
6. Given a household, When I add a member, Then the member row appears. (Verifies: FR-006)
7. Given a member exists, When I edit it, Then the updated name is shown. (Verifies: FR-007)
8. Given a member exists, When I remove it, Then the row is gone. (Verifies: FR-008)
9. Given a member with profile_type=child, When saved, Then the companion label shows "scout". (Verifies: FR-009)
10. Given the app is running, When I click Live Feed tab, Then event-feed and agent-status are visible. (Verifies: FR-010)

## Requirements

Functional requirements:
- FR-001: Install Cypress as a dev dependency and add test:e2e:cy scripts to package.json. (Sources: CR-20260320-1000)
- FR-002: Create cypress.config.js with baseUrl=http://localhost:5173, specPattern, video=false. (Sources: CR-20260320-1000)
- FR-003: Create cypress/support/e2e.js importing commands. (Sources: CR-20260320-1000)
- FR-004: Create cypress/support/commands.js with createHousehold, deleteHousehold, addMember, cleanupTestHouseholds, openHouseholdSelector custom commands. (Sources: CR-20260320-1000)
- FR-005: Write cypress/e2e/navigation.cy.js with 3 navigation tests. (Sources: CR-20260320-1000)
- FR-006: Write cypress/e2e/household-crud.cy.js with 4 household CRUD tests. (Sources: CR-20260320-1000)
- FR-007: Write cypress/e2e/member-crud.cy.js with 4 member CRUD tests. (Sources: CR-20260320-1000)
- FR-008: Write cypress/e2e/companion-cards.cy.js with 3 companion card tests. (Sources: CR-20260320-1000)
- FR-009: Write cypress/e2e/live-feed.cy.js with 2 live feed tests. (Sources: CR-20260320-1000)

Non-functional requirements:
- NFR-001: Each test file uses beforeEach to clean up E2E test data and create its own via API commands. (Sources: CR-20260320-1000)
- NFR-002: Tests use data-testid attributes for all element selection. (Sources: CR-20260320-1000)
- NFR-003: Tests handle confirm dialogs with cy.on('window:confirm', () => true). (Sources: CR-20260320-1000)

## Edge cases
- If no households exist, companion-cards tests should handle the empty state gracefully. (Verifies: FR-008)
- Cleanup command filters by name prefix "E2E Test" to avoid deleting real data. (Verifies: FR-004)
