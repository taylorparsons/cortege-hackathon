# Feature Spec: Working Demo with Twilio on Localhost

Status: Draft
Created: 2026-03-18 16:40
Updated: 2026-03-20 16:07
Inputs: CR-20260318-1640, CR-20260320-1550, CR-20260320-1559, CR-20260320-1607
Decisions: D-20260318-1640, D-20260320-1550, D-20260320-1559, D-20260320-1607
Design: docs/superpowers/specs/2026-03-14-agent-orchestration-design.md

## Summary

Build the next Twilio demo around **one Twilio number per household**. Inbound voice webhooks should resolve the household from the Twilio `To` number, normalize the call into a CORTEGE event, and route it into the existing household-scoped companion system running on localhost via ngrok.

Sources: CR-20260318-1640; CR-20260320-1550; CR-20260320-1559; CR-20260320-1607; D-20260318-1640; D-20260320-1550; D-20260320-1559; D-20260320-1607

## User Stories & Acceptance

### US1: Household Number Routing (Priority: P0)
Narrative:
- As the orchestrator, I want each Twilio number to map to a single household, so that inbound calls route deterministically before any member-level decision is made.

Acceptance scenarios:
1. Given a Twilio webhook with a `To` number mapped to a household, When the webhook is processed, Then CORTEGE resolves exactly one `household_id` before event emission. (Verifies: FR-001, FR-004)
2. Given a Twilio webhook with a `To` number that is not mapped, When the webhook is processed, Then CORTEGE rejects or quarantines the event as unresolved household routing. (Verifies: FR-002)
3. Given a resolved household and no explicit target member, When the event is routed, Then CORTEGE falls back to the household primary member. (Verifies: FR-005)

### US2: Localhost Twilio Demo Flow (Priority: P0)
Narrative:
- As a hackathon operator, I want to run a real Twilio call into localhost, so that the demo proves the live household-ingress path end to end.

Acceptance scenarios:
1. Given ngrok and a configured Twilio number, When a call hits the Twilio number, Then the webhook is delivered to localhost and normalized into a CORTEGE inbound-call event. (Verifies: FR-003, FR-006, FR-007)
2. Given a real inbound call for a mapped household, When the webhook is processed, Then the event appears on the correct household runtime path instead of a global or legacy default household. (Verifies: FR-004, FR-005, FR-007)

### US3: Privacy-Safe Twilio Handling (Priority: P0)
Narrative:
- As a security reviewer, I want Twilio docs and behavior to follow the shipped privacy model, so that the live demo does not reintroduce plaintext phone-number handling.

Acceptance scenarios:
1. Given the Twilio docs, When I review the routing model, Then I see household store guidance instead of legacy `household.json` instructions. (Verifies: FR-008)
2. Given webhook logging guidance, When I review the docs and implementation targets, Then I see redacted or aliased phone logging instead of cleartext `From` / `To` logging requirements. (Verifies: FR-009)
3. Given production-style validation guidance, When I review the spec, Then Twilio signature validation is still required for non-dev deployments. (Verifies: FR-010)

### US4: Demo-Focused Scope (Priority: P1)
Narrative:
- As the product team, I want the Twilio docs to focus on the chosen hackathon model, so that the next implementation work is not diluted by speculative alternatives.

Acceptance scenarios:
1. Given the Twilio guide, When I review the architecture, Then the primary path is one Twilio number per household. (Verifies: FR-011)
2. Given the Twilio tasks, When I review the backlog, Then it no longer asks for legacy per-user proxy routing or `household.json` production edits. (Verifies: FR-012)

### US5: Visual Demo Explanation (Priority: P1)
Narrative:
- As a demo operator, I want the Twilio guide to show the final allowed and blocked call paths visually, so that I can explain the outcome quickly during the hackathon.

Acceptance scenarios:
1. Given the Twilio guide, When I review the allowed-call path, Then I see a Mermaid sequence diagram that ends with the call bridging back to the original household line. (Verifies: FR-013)
2. Given the Twilio guide, When I review the blocked-call path, Then I see a Mermaid sequence diagram that ends with the call being blocked before household delivery. (Verifies: FR-013)
3. Given the Twilio guide, When I review either diagram, Then I can distinguish Twilio platform actions from CORTEGE webhook code, CORTEGE agent-pipeline work, and any LLM call. (Verifies: FR-014)

## Requirements

### Functional Requirements

#### Household Routing
- FR-001: The Twilio demo architecture SHALL use one Twilio number per household as the primary routing model. (Sources: CR-20260318-1640; CR-20260320-1550; D-20260320-1550)
- FR-002: The webhook flow SHALL treat `To`-number lookup failure as unresolved household routing, not as a silent fallback to a default household. (Sources: CR-20260320-1550; D-20260320-1550)
- FR-003: The deployment guide SHALL document localhost setup with ngrok and one voice-capable Twilio number for the demo household. (Sources: CR-20260318-1640; CR-20260320-1550; D-20260318-1640; D-20260320-1550)
- FR-004: The Twilio webhook SHALL resolve `household_id` from the Twilio `To` number before emitting an inbound-call event. (Sources: CR-20260318-1640; CR-20260320-1550; D-20260320-1550)
- FR-005: The Twilio demo flow SHALL define a household-primary-member fallback when no explicit target member is known. (Sources: CR-20260320-1550; D-20260320-1550)

#### Webhook Integration
- FR-006: The Twilio webhook SHALL wire valid inbound voice calls to `eventBus.emit()` as normalized CORTEGE events. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-007: The normalized inbound-call event SHALL include the resolved `household_id` plus Twilio call metadata needed for downstream routing. (Sources: CR-20260318-1640; CR-20260320-1550; D-20260320-1550)
- FR-008: The Twilio guide and tasks SHALL use the current household store model and SHALL NOT instruct operators to update legacy `household.json` for Twilio routing. (Sources: CR-20260320-1550; D-20260320-1550)

#### Privacy & Security
- FR-009: Twilio logging guidance SHALL require redacted or aliased phone logging and SHALL NOT require cleartext `From` / `To` logging. (Sources: CR-20260320-1550; D-20260320-1550)
- FR-010: The Twilio webhook SHALL validate Twilio request signatures when `TWILIO_AUTH_TOKEN` is configured for protected environments. (Sources: CR-20260318-1640; D-20260318-1640)

#### Scope Control
- FR-011: The deployment guide SHALL present one-number-per-household as the recommended hackathon path. (Sources: CR-20260320-1550; D-20260320-1550)
- FR-012: The working-demo task list SHALL remove stale per-user proxy-number and legacy-household-file tasks so the next implementation work follows the chosen household model. (Sources: CR-20260320-1550; D-20260320-1550)
- FR-013: The deployment guide SHALL include Mermaid sequence diagrams for the two target Twilio outcomes: allowed-and-bridged back to the original household line, and blocked before household delivery. (Sources: CR-20260320-1559; D-20260320-1559)
- FR-014: The Mermaid diagrams SHALL separate Twilio platform behavior, CORTEGE webhook handling, CORTEGE agent-pipeline processing, and the optional LLM call into distinct lanes. (Sources: CR-20260320-1607; D-20260320-1607)

### Non-Functional Requirements

#### Reliability
- NFR-001: The Twilio webhook MUST respond quickly enough for Twilio voice delivery expectations and should offload slow processing when needed. (Sources: CR-20260318-1640; D-20260318-1640)

#### Security
- NFR-002: The Twilio demo setup MUST use HTTPS webhook delivery through ngrok or an equivalent secure tunnel for localhost testing. (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-003: Twilio auth credentials and the `PII_MASTER_KEY` MUST remain in environment variables and out of Git. (Sources: CR-20260318-1640; CR-20260320-1550; D-20260320-1550)

#### Documentation
- NFR-004: The Twilio guide MUST clearly distinguish current shipped state from target implementation where the webhook is still stubbed. (Sources: CR-20260320-1550; D-20260320-1550)

## Edge Cases

### EC1: Unknown Twilio Number
- Given an inbound webhook for a `To` number not assigned to any household, When the webhook is handled, Then CORTEGE does not route it into the wrong household. (Verifies: FR-002)

### EC2: Shared Number Misconfiguration
- Given two households are configured with the same Twilio number, When the system validates routing setup, Then the configuration is rejected or surfaced as invalid. (Verifies: FR-001, FR-004)

### EC3: No Explicit Target Member
- Given a household resolves successfully but no member-level target can be inferred, When the event is routed, Then the household-primary-member fallback is used. (Verifies: FR-005)

### EC4: Signature Validation Disabled in Dev
- Given localhost development without a configured Twilio auth token, When the webhook is exercised manually, Then the route can still be tested while the docs preserve signature validation as required for protected environments. (Verifies: FR-010)

## Dependencies

### External Dependencies
- Twilio account with one voice-capable number per demo household
- ngrok or equivalent HTTPS tunnel for localhost testing

### Internal Dependencies
- `server/ingestion/twilio-webhook.js`
- `server/orchestrator/event-bus.js`
- household store / household selection runtime
- privacy-safe logging helpers

## Out of Scope

- one shared Twilio number across many households
- one Twilio number per member
- mobile app interception
- number porting
- carrier partnerships
- SMS webhook integration

## Success Criteria

- [ ] `docs/PRODUCTION_DEPLOYMENT.md` teaches one-number-per-household routing
- [ ] `docs/specs/working-demo-with-twilio/tasks.md` is internally consistent and household-model-based
- [ ] Twilio backlog work is framed around `To -> household_id` routing
- [ ] The Twilio docs no longer instruct operators to use legacy `household.json` for live routing
- [ ] The Twilio guide visually explains the allowed and blocked call outcomes with Mermaid sequence diagrams
- [ ] The Twilio guide makes it visually obvious which steps are Twilio, CORTEGE code, and optional LLM work
