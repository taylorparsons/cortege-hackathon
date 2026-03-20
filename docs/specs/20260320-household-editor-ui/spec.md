# Feature Spec: 20260320-household-editor-ui

Status: Done
Created: 2026-03-20 14:50
Inputs: CR-20260320-1450

## Summary
Make household editing explicit inside the existing household selector modal so the selected household can be renamed and its location/member tools are presented as one coherent editing surface.

## User Stories & Acceptance

### US1: Operators can clearly edit the selected household (Priority: P1)
Narrative:
- As an operator managing a household, I want the selected household to show an explicit edit area in the selector modal so I can rename the household and manage its members without guessing where those controls live.

Acceptance scenarios:
1. Given I open the household selector with a selected household, When I view the lower portion of the modal, Then I see a dedicated household-details section for that selected household. (Verifies: FR-001)
2. Given I edit the household name and save it, When the request succeeds, Then the household list row and the main household bar both show the updated name. (Verifies: FR-002)
3. Given I am editing a selected household, When I view the editor section, Then the location reassignment controls and member CRUD remain available as part of the same editing surface. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: `src/components/HouseholdSelector.jsx` shall render a dedicated selected-household editor section when `currentHouseholdId` is set. (Sources: CR-20260320-1450; D-20260320-1450)
- FR-002: The selected-household editor shall allow updating the current household name through the existing `updateHousehold` API flow. (Sources: CR-20260320-1450; D-20260320-1450)
- FR-003: The selected-household editor shall keep location reassignment and member CRUD visible beneath the household details so household management is discoverable in one place. (Sources: CR-20260320-1450; D-20260320-1450)
- FR-004: An end-to-end UI test shall verify renaming the selected household from the selector modal. (Sources: CR-20260320-1450; D-20260320-1450)

Non-functional requirements:
- NFR-001: The change shall reuse the existing household selector modal instead of adding a new page or modal. (Sources: CR-20260320-1450; D-20260320-1450)
- NFR-002: This task shall not change phone-number requirements or minor-contact fallback behavior. (Sources: CR-20260320-1450; D-20260320-1450)
