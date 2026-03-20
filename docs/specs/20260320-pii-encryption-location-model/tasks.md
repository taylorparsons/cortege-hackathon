# Tasks: 20260320-pii-encryption-location-model

Spec: docs/specs/20260320-pii-encryption-location-model/spec.md

## NEXT
None.

## IN PROGRESS
None.

## DONE
- [2026-03-20 11:47] T-001: Capture request, create privacy/location spec + tasks, update PRD/traceability/progress, and add the superpowers execution plan. (Skills: athena, writing-plans)
- [2026-03-20 12:45] T-002: Stabilize privacy helpers for encryption, deterministic tokens, validation, and reusable redaction/sanitization helpers. (Skills: athena)
- [2026-03-20 12:45] T-003: Complete encrypted household/member persistence and legacy compatibility in `HouseholdStore`. (Skills: athena)
- [2026-03-20 12:45] T-004: Complete `LocationStore` support for encrypted named locations, read models, and legacy-location creation. (Skills: athena)
- [2026-03-20 12:45] T-005: Update household and location API routes to use canonical `location_id`, expanded trusted reads, and guarded delete semantics. (Skills: athena)
- [2026-03-20 12:45] T-006: Add household reassignment and location-management data operations to the frontend hook layer. (Skills: athena)
- [2026-03-20 12:45] T-007: Add location list, edit, delete-blocked, and reassignment UI flows. (Skills: athena)
- [2026-03-20 12:45] T-008: Sanitize Claude request building, logging, and ingestion paths to prevent raw PII emission. (Skills: athena)
- [2026-03-20 12:45] T-009: Add regression coverage for encrypted persistence, sanitized LLM payloads, redacted logs, compatibility migration, and guarded location delete/reassignment flows. (Skills: athena, verification-before-completion)
- [2026-03-20 12:45] T-010: Update docs, test fixtures, and verification commands to match the new location and PII model. (Skills: athena, writing-plans, verification-before-completion)
