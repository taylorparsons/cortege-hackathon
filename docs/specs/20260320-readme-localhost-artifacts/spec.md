# Feature Spec: 20260320-readme-localhost-artifacts

Status: Done
Created: 2026-03-20 14:59
Inputs: CR-20260320-1459

## Summary
Document the verified localhost Cypress artifact workflow in `README.md` and create one local commit containing the current uncommitted household/demo changes.

## User Stories & Acceptance

### US1: Reviewers can find localhost validation evidence from the README (Priority: P1)
Narrative:
- As a reviewer running the demo locally, I want the README to show the exact Cypress command and the generated artifact paths so I can inspect the run output quickly.

Acceptance scenarios:
1. Given I open `README.md`, When I read the testing section, Then I can see the localhost Cypress command for the current household/member demo path. (Verifies: FR-001)
2. Given I open `README.md`, When I read the validation evidence section, Then I can click representative screenshot and video links for the localhost Cypress run artifacts. (Verifies: FR-002)

### US2: The local workspace is checked in after the docs update (Priority: P1)
Narrative:
- As the user asking for a local check-in, I want the current changes committed locally after the README update so the work is captured in Git without pushing.

Acceptance scenarios:
1. Given the README update is complete, When verification succeeds, Then a local Git commit exists containing the current staged changes. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: `README.md` shall document the localhost Cypress command used to validate the current household/member demo flow. (Sources: CR-20260320-1459; D-20260320-1459)
- FR-002: `README.md` shall link to representative screenshot and video artifacts produced by the localhost Cypress run. (Sources: CR-20260320-1459; D-20260320-1459)
- FR-003: After the README update and verification, the current local changes shall be committed in Git without pushing to a remote. (Sources: CR-20260320-1459; D-20260320-1459)

Non-functional requirements:
- NFR-001: The README artifact references shall point to files that exist in the working tree after the verification run. (Sources: CR-20260320-1459; D-20260320-1459)
