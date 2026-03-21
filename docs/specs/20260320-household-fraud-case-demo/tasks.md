# Tasks: Household Fraud Case Demo

Status: Done
Created: 2026-03-20 17:20
Updated: 2026-03-20 17:31
Spec: spec.md

## Task Breakdown

### T-001 Capture the pivot in product docs
- [x] Update `docs/PRD.md` to describe the household fraud-case demo story. (Implements: FR-008)
- [x] Add the new feature to `docs/TRACEABILITY.md`. (Implements: FR-008)
- [x] Record the execution session in `docs/progress.txt`. (Implements: FR-008)

### T-002 Add backend fraud-case storage and analysis
- [x] Add a small fraud-case store for persisted household cases. (Implements: FR-001, FR-005, NFR-001)
- [x] Add deterministic risk analysis for supported evidence types. (Implements: FR-002, FR-004, FR-007)
- [x] Add backend tests for case creation, household scoping, and conservative summaries. (Implements: FR-001, FR-003, FR-004, FR-005, FR-007)

### T-003 Expose fraud-case API routes
- [x] Add `GET /api/fraud-cases?household_id=...` for recent household cases. (Implements: FR-001, FR-003, FR-005)
- [x] Add `POST /api/fraud-cases` for linked event + evidence case creation. (Implements: FR-001, FR-002, FR-003, FR-005)
- [x] Reject cross-household or invalid-event case creation. (Implements: FR-003)

### T-004 Add the live-feed case panel
- [x] Add a focused live-feed panel for selecting a recent household call and entering one evidence item. (Implements: FR-006)
- [x] Show created cases with severity, signals, rationale, and recommendation. (Implements: FR-005, FR-006, FR-007)
- [x] Add an end-to-end UI test for creating a household fraud case. (Implements: FR-006, NFR-002)

### T-005 Align docs with the demo pivot
- [x] Update `README.md` with the new hackathon demo story and supported evidence inputs. (Implements: FR-008)
- [x] Keep wording conservative and avoid definitive AI-media-detection claims. (Implements: FR-007, FR-008)

## Notes

- This feature is deliberately narrow and demo-first.
- Real Twilio ingress remains the proof of real-world input.
- The manual evidence item is text-first and explainable.
