# Feature Spec: 20260320-cypress-artifacts

Status: Done
Created: 2026-03-20 15:45
Inputs: CR-20260320-1545

## Summary
Enable Cypress run artifacts so end-to-end household demo flows produce reviewable videos and failure screenshots.

## User Stories & Acceptance

### US1: Authors can review Cypress runs after execution (Priority: P1)
Narrative:
- As an author reviewing demo test runs, I want Cypress to save artifacts from the run so I can inspect what happened after the fact.

Acceptance scenarios:
1. Given I run the targeted Cypress specs, When the run completes, Then Cypress writes video artifacts for those specs. (Verifies: FR-001, FR-003)
2. Given I run the targeted Cypress specs successfully, When the run completes, Then Cypress writes screenshot artifacts for those executed tests. (Verifies: FR-002, FR-003)
3. Given a Cypress test fails in a later run, When the failure occurs, Then Cypress is still configured to capture screenshots on failure. (Verifies: FR-002)

## Requirements

Functional requirements:
- FR-001: `cypress.config.js` shall enable `video` for Cypress E2E runs. (Sources: CR-20260320-1545; D-20260320-1545)
- FR-002: Cypress support code shall save screenshots for executed Cypress tests, while `cypress.config.js` keeps failure screenshots enabled. (Sources: CR-20260320-1545; D-20260320-1545; CR-20260320-1555; D-20260320-1555)
- FR-003: Verification shall rerun the current household/member Cypress specs and confirm video and screenshot artifacts were produced. (Sources: CR-20260320-1545; D-20260320-1545; CR-20260320-1555; D-20260320-1555)

Non-functional requirements:
- NFR-001: The change shall be limited to Cypress configuration and verification; no Playwright artifact settings are in scope. (Sources: CR-20260320-1545; D-20260320-1545)
