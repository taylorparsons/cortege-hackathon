# Feature Spec: 20260320-member-phone-input

Status: Done
Created: 2026-03-20 15:04
Inputs: CR-20260320-1504

## Summary
Fix the member add/edit form so realistic phone input works in the UI and validation failures are visible to the user.

## User Stories & Acceptance

### US1: Operators can add members without knowing E.164 formatting rules (Priority: P1)
Narrative:
- As an operator adding a household member, I want the phone field to accept common US formatting and save correctly, so the form works with the way I naturally type phone numbers.

Acceptance scenarios:
1. Given I type `1914-764-5049` into the add-member form, When I submit the form, Then the member is created successfully and appears in the household member list. (Verifies: FR-001, FR-003)
2. Given the member API rejects an add or edit request, When the UI receives the error response, Then the modal shows the error inline instead of only logging it to the console. (Verifies: FR-002)

## Requirements

Functional requirements:
- FR-001: `src/components/MemberManager.jsx` shall normalize common US phone input formats into E.164 before sending member create or update requests. (Sources: CR-20260320-1504; D-20260320-1504)
- FR-002: `src/components/MemberManager.jsx` shall render inline add/edit form errors when member create or update requests fail. (Sources: CR-20260320-1504; D-20260320-1504)
- FR-003: An end-to-end UI test shall verify member creation with a non-E.164 typed phone input that the UI normalizes before submit. (Sources: CR-20260320-1504; D-20260320-1504)

Non-functional requirements:
- NFR-001: The backend member API shall remain the canonical E.164 validation boundary in this task. (Sources: CR-20260320-1504; D-20260320-1504)
