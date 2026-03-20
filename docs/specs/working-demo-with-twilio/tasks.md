# Tasks: Working Demo with Twilio on Localhost

Status: Not Started
Created: 2026-03-18 16:40
Updated: 2026-03-20 16:07
Spec: spec.md

## Task Breakdown

### T-001 Document the chosen routing model
- [ ] Rewrite `docs/PRODUCTION_DEPLOYMENT.md` around one Twilio number per household. (Implements: FR-001, FR-003, FR-011)
- [ ] Describe `To -> household_id` routing and the household-primary-member fallback. (Implements: FR-004, FR-005)
- [ ] Mark the current Twilio webhook as stubbed and separate shipped state from target state. (Implements: NFR-004)
- [ ] Add Mermaid sequence diagrams for the allowed-call and blocked-call outcomes. (Implements: FR-013)
- [ ] Separate Twilio, CORTEGE webhook, CORTEGE agent pipeline, and LLM work into distinct diagram lanes. (Implements: FR-014)

### T-002 Align the Twilio spec and backlog
- [ ] Rewrite `docs/specs/working-demo-with-twilio/spec.md` around the household-number model. (Implements: FR-001, FR-004, FR-011)
- [ ] Remove legacy `household.json` guidance from the Twilio backlog and replace it with household-store guidance. (Implements: FR-008, FR-012)
- [ ] Update `docs/PRD.md` so the Twilio summary and backlog point to the household-number model. (Implements: FR-011, FR-012)

### T-003 Add household-number data-model support
- [ ] Add a unique `twilio_number` field to the household model and validation layer. (Implements: FR-001, FR-004)
- [ ] Expose `twilio_number` in trusted household create/read/update flows. (Implements: FR-001, FR-003)
- [ ] Add store/API validation that rejects duplicate household Twilio numbers. (Implements: FR-002)

### T-004 Wire the Twilio webhook to the event bus
- [ ] Import the event bus into `server/ingestion/twilio-webhook.js`. (Implements: FR-006)
- [ ] Normalize inbound Twilio payloads into CORTEGE inbound-call events. (Implements: FR-006, FR-007)
- [ ] Resolve `household_id` from the webhook `To` number before emission. (Implements: FR-004, FR-007)
- [ ] Reject or quarantine unresolved-household events instead of routing them to a default household. (Implements: FR-002)

### T-005 Enforce security and privacy rules
- [ ] Implement Twilio signature validation for protected environments. (Implements: FR-010)
- [ ] Keep Twilio logging redacted or aliased instead of logging raw `From` / `To` values. (Implements: FR-009)
- [ ] Verify environment documentation references `PII_MASTER_KEY` and Twilio credentials only through env vars. (Implements: NFR-003)

### T-006 Validate the localhost demo path
- [ ] Run localhost webhook testing through ngrok with a household-mapped Twilio number. (Implements: FR-003, NFR-002)
- [ ] Verify the call appears on the correct household runtime path. (Implements: FR-004, FR-005, FR-007)
- [ ] Add regression tests for unknown-number routing and duplicate-number rejection. (Implements: FR-002)

## Notes

- This feature now assumes one Twilio number per household, not per member.
- The first routing step is household resolution from the Twilio `To` number.
- Member phone numbers are not required for the first Twilio ingress routing decision.
- The legacy `household.json` path is not the target for Twilio work.

## Estimated Effort

- T-001/T-002: 0.5 day
- T-003: 0.5 day
- T-004/T-005: 1 day
- T-006: 0.5 day

Total: 2.5 days

## Success Criteria

- [ ] Twilio docs consistently teach one-number-per-household
- [ ] No Twilio task still points to `household.json`
- [ ] The next implementation tasks are unambiguous and aligned with the household runtime model
