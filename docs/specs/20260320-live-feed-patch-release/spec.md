# Feature Spec: 20260320-live-feed-patch-release

Status: Done
Created: 2026-03-20 17:19
Inputs: CR-20260320-1719

## Summary
Check in the verified live-feed household-data bugfix, update `README.md` for the latest demo behavior, and publish a patch release.

## User Stories & Acceptance

### US1: Demo docs reflect the shipped live-feed behavior (Priority: P1)
Narrative:
- As a demo reviewer, I want the README to mention the live-feed target-member fix and stable companion identity behavior so I know the latest household-scoping bug is fixed and how to validate it locally.

Acceptance scenarios:
1. Given I read `README.md`, When I review the household/live-feed sections, Then I can see that the event injector uses selected-household members and that companion identity is stable per member ID. (Verifies: FR-001)
2. Given I read `README.md`, When I review the localhost artifact section, Then I can find the updated live-feed Cypress artifact references. (Verifies: FR-001)

### US2: The bugfix is checked in and released as a patch version (Priority: P1)
Narrative:
- As the user asking for a remote patch release, I want the verified live-feed fix committed and published as a new patch release without rewriting the old `v0.3.0` record.

Acceptance scenarios:
1. Given the live-feed fix is verified, When the local check-in is complete, Then Git contains a new local commit for the bugfix/docs/release update. (Verifies: FR-002)
2. Given the local commit is on `main`, When the release step completes, Then a `v0.3.1` GitHub release exists for the current `main`. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: `README.md` shall document the selected-household live-feed target list, stable companion identity by `member.id`, and updated localhost validation artifacts. (Sources: CR-20260320-1719; D-20260320-1719)
- FR-002: The current verified live-feed bugfix changes shall be committed locally. (Sources: CR-20260320-1719; D-20260320-1719)
- FR-003: A new `v0.3.1` patch release shall be published from the verified `main` branch. (Sources: CR-20260320-1719; D-20260320-1719)

Non-functional requirements:
- NFR-001: The release shall preserve `v0.3.0` unchanged and publish a new patch version instead of mutating the existing release. (Sources: CR-20260320-1719; D-20260320-1719)
