# Feature Spec: Household Fraud Case Demo

Status: Draft
Created: 2026-03-20 17:20
Updated: 2026-03-20 17:20
Inputs: CR-20260320-1720
Decisions: D-20260320-1720

## Summary

Keep the real Twilio household-ingress path, then add one thin case layer that lets the operator attach one manual evidence item to a recent household call and generate a persisted fraud-case summary with explainable signals and a recommended action.

Sources: CR-20260320-1720; D-20260320-1720

## User Stories & Acceptance

### US1: Create a Household Fraud Case from a Live Call (Priority: P0)
Narrative:
- As a demo operator, I want to pick a recent household call, attach one evidence item, and create a fraud case, so that the judge sees a multi-signal protection story instead of plain call routing.

Acceptance scenarios:
1. Given a recent `twilio` inbound-call event for the selected household, When I submit one evidence item, Then CORTEGE creates a persisted fraud case linked to that household and event. (Verifies: FR-001, FR-002, FR-004)
2. Given the selected household changes, When I open the case panel, Then I only see recent call options and cases for that household. (Verifies: FR-003, FR-006)

### US2: Explainable Risk Summary (Priority: P0)
Narrative:
- As a judge, I want the fraud case to explain why it is risky, so that the demo feels concrete and trustworthy.

Acceptance scenarios:
1. Given event metadata and evidence content that includes scam indicators, When the fraud case is generated, Then the response includes severity, signal tags, a short rationale, and a recommended action. (Verifies: FR-004, FR-005)
2. Given ambiguous or weak evidence, When the fraud case is generated, Then the summary uses conservative language instead of claiming certainty. (Verifies: FR-007)

### US3: Demo-First Scope (Priority: P1)
Narrative:
- As the product team, I want this pivot to stay shippable tonight, so that we avoid overreaching into image forensics or full case management.

Acceptance scenarios:
1. Given the evidence intake UI, When I review the supported inputs, Then the scope is limited to text-first manual evidence types (`message_excerpt`, `suspicious_url`, `screenshot_note`). (Verifies: FR-002, FR-007)
2. Given the code and docs, When I review the feature, Then it does not claim definitive AI-media detection. (Verifies: FR-007, FR-008)

## Requirements

### Functional Requirements
- FR-001: The backend SHALL support creating a household-scoped fraud case linked to one recent event and one manual evidence item. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-002: Supported manual evidence types SHALL be `message_excerpt`, `suspicious_url`, and `screenshot_note`, each with non-empty text content. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-003: The fraud-case flow SHALL scope recent-call choices and case history to the selected household. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-004: Fraud-case creation SHALL compute deterministic risk signals from the linked event and evidence content, including urgency, secrecy, payment pressure, impersonation, and suspicious-link cues when present. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-005: The fraud-case response SHALL include a stable case ID, severity, explainable signal list, short rationale, and recommended action. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-006: The Live Feed UI SHALL let the operator choose a recent household call, enter one evidence item, create a case, and view recent cases for the selected household. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-007: The fraud-case summary SHALL use conservative language and SHALL NOT claim definitive AI-generated-media detection. (Sources: CR-20260320-1720; D-20260320-1720)
- FR-008: The README and hackathon-facing docs SHALL describe the new demo as household-aware fraud-case correlation, not as broad AI-media detection. (Sources: CR-20260320-1720; D-20260320-1720)

### Non-Functional Requirements
- NFR-001: The fraud-case path SHOULD reuse existing event and household APIs where possible and avoid a major architecture rewrite. (Sources: CR-20260320-1720; D-20260320-1720)
- NFR-002: The pivot MUST remain demoable on localhost tonight, including at least one end-to-end UI test for case creation. (Sources: CR-20260320-1720; D-20260320-1720)

## Edge Cases
- EC1: Given no recent `twilio` events for the selected household, When the operator opens the case panel, Then the UI shows that a live call is needed before a case can be created. (Verifies: FR-003, FR-006)
- EC2: Given an event from another household, When a case-create request references it, Then the backend rejects the request. (Verifies: FR-001, FR-003)
- EC3: Given evidence text with weak or benign cues, When the case is generated, Then severity remains low and the recommendation is framed as verification rather than a hard scam judgment. (Verifies: FR-004, FR-007)

## Dependencies
- Active Twilio household ingress from `specs/working-demo-with-twilio`
- Existing live-feed UI and `/api/events`
- Existing household selection context

## Out of Scope
- OCR for uploaded screenshots
- direct image or video forensics
- automated caller challenge flows
- full case management workflow with edit/delete/reassignment

## Success Criteria
- [ ] A real Twilio call plus one manual evidence item can be turned into a persisted fraud case
- [ ] The Live Feed tab shows the case with severity, signals, and recommendation
- [ ] The demo claims stay conservative and believable
