# Feature Spec: 20260320-active-household-companions

Status: Done
Created: 2026-03-20 15:25
Inputs: CR-20260320-1525

## Summary
Fix the selected-household dashboard mismatch so live companion cards, counts, and detail data follow the household the user selected in the UI.

## User Stories & Acceptance

### US1: Operators see the right companions for the selected household (Priority: P1)
Narrative:
- As an operator switching households in the demo, I want the Household tab to show the selected household’s companions, so the dashboard and member editor stay consistent.

Acceptance scenarios:
1. Given I select a household with two members, When the Household tab refreshes, Then the companion count shows `2` and the visible companion cards use those two member names. (Verifies: FR-001, FR-003)
2. Given a household is already selected from local storage or the current UI session, When the frontend fetches companion snapshots, Then the backend returns companion data for that selected household instead of a stale startup household. (Verifies: FR-002)

## Requirements

Functional requirements:
- FR-001: `server/orchestrator/orchestrator.js` shall support activating a household from the household store and rebuilding live companion instances for it. (Sources: CR-20260320-1525; D-20260320-1525)
- FR-002: `server/api/routes.js` and `src/hooks/useCortegeData.js` shall make companion snapshot fetches household-aware when `currentHouseholdId` is set. (Sources: CR-20260320-1525; D-20260320-1525)
- FR-003: An end-to-end UI test shall verify that selecting a two-member household updates the dashboard companion cards and count to match that household. (Sources: CR-20260320-1525; D-20260320-1525)

Non-functional requirements:
- NFR-001: The fix shall use live backend companion instances rather than rendering synthetic placeholder cards. (Sources: CR-20260320-1525; D-20260320-1525)
