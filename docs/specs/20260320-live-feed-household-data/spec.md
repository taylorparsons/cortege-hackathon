# Feature Spec: 20260320-live-feed-household-data

Status: Done
Created: 2026-03-20 15:15
Inputs: CR-20260320-1515

## Summary
Fix household-scoping bugs in the Live Feed event injector and the companion detail activity log.

## User Stories & Acceptance

### US1: Live Feed targets the selected household (Priority: P1)
Narrative:
- As a demo user working in a selected household, I want the event injector to show that household’s members so injected events target real current members instead of stale defaults.

Acceptance scenarios:
1. Given I switch to a created household with custom members, When I open the Live Feed event injector, Then the target dropdown lists those custom household members and not the old demo defaults. (Verifies: FR-001)

### US2: New companions do not inherit stale activity (Priority: P1)
Narrative:
- As a demo user viewing a just-created companion, I want its Silent Activity Log to start clean so I do not see historical events that happened before that companion existed.

Acceptance scenarios:
1. Given I create a new household member and open that companion’s detail panel, When no new events have targeted that companion yet, Then the Silent Activity Log is empty instead of showing older historical entries. (Verifies: FR-002)

## Requirements

Functional requirements:
- FR-001: The Live Feed event injector shall derive its target-member list from the selected household instead of a hard-coded demo member array. (Sources: CR-20260320-1515; D-20260320-1515)
- FR-002: Companion activity queries shall exclude historical events that occurred before the selected companion existed. (Sources: CR-20260320-1515; D-20260320-1515)
- FR-003: End-to-end verification shall cover both the dynamic event-injector target list and the empty initial activity log for a newly created companion. (Sources: CR-20260320-1515; D-20260320-1515)

Non-functional requirements:
- NFR-001: The fix shall be household-scoped and shall not rely on legacy hard-coded household defaults in the UI. (Sources: CR-20260320-1515; D-20260320-1515)
