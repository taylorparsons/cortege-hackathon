# Tasks: 20260320-live-feed-household-data

Spec: docs/specs/20260320-live-feed-household-data/spec.md

## NEXT
None.

## IN PROGRESS
None.

## DONE
- [2026-03-20 16:35] T-001: Capture the live-feed household-scoping bug in ATHENA docs and add failing regression coverage for the event-injector member list and the new-companion empty activity state. (Implements: FR-001, FR-002, FR-003)
- [2026-03-20 16:45] T-002: Replace the hard-coded event-injector member list with selected-household members and filter companion activity to exclude events before companion creation. (Implements: FR-001, FR-002)
- [2026-03-20 16:55] T-003: Re-key companion instances by `member.id` so new same-name members do not inherit old memory/activity, then rerun targeted API and Cypress verification. (Implements: FR-002, FR-003)
