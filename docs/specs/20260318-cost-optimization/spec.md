# Feature Spec: 20260318-cost-optimization

Status: Done
Created: 2026-03-18 10:00
Inputs: CR-20260318-1000
Decisions: D-20260318-1000

## Summary
Reduce per-event Claude API cost by ~64% through output token reduction (removing redundant fields, constraining assessment length, adding signal vocabulary) and input token caching (Anthropic prompt caching on static template prefix).

## User Stories & Acceptance

### US1: Slim Response Schema (Priority: P1)
Narrative:
- As the system operator, I want Claude to return fewer redundant tokens, so that per-event output cost drops by ~50%.

Acceptance scenarios:
1. Given a Claude response without event_id/agent/instance/stage_check, When parseAgentResponse processes it, Then it succeeds without error. (Verifies: FR-001, FR-002)
2. Given agent-instance processes an event, When the response is parsed, Then event_id, agent, and instance are backfilled from server context. (Verifies: FR-003)
3. Given an agent template, When Claude generates a response, Then assessment is ~30 words and signals use vocabulary codes. (Verifies: FR-004, FR-005)

### US2: Prompt Caching (Priority: P1)
Narrative:
- As the system operator, I want the static agent template to be cached across API calls, so that input token cost drops by ~90% on cache hits.

Acceptance scenarios:
1. Given callClaude receives templateBody + memoryText, When it calls the Anthropic API, Then system message is an array with cache_control on the template block. (Verifies: FR-006)
2. Given callClaude receives legacy systemPrompt, When it calls the Anthropic API, Then it uses the string as-is (backward compat). (Verifies: FR-007)

## Requirements

Functional requirements:
- FR-001: Remove event_id, agent, instance, stage_check from SUBMIT_ASSESSMENT_TOOL required fields and properties. (Sources: CR-20260318-1000; D-20260318-1000)
- FR-002: Update REQUIRED_FIELDS array and validateAgentResponse to match new 6-field schema. (Sources: CR-20260318-1000; D-20260318-1000)
- FR-003: agent-instance backfills event_id, agent, instance after parseAgentResponse. (Sources: CR-20260318-1000; D-20260318-1000)
- FR-004: Assessment tool description constrains to "One sentence, max 30 words." (Sources: CR-20260318-1000; D-20260318-1000)
- FR-005: Signals tool description references agent-specific vocabulary codes. (Sources: CR-20260318-1000; D-20260318-1000)
- FR-006: callClaude accepts templateBody + memoryText and sends system array with cache_control. (Sources: CR-20260318-1000; D-20260318-1000)
- FR-007: callClaude backward-compatible with legacy systemPrompt string. (Sources: CR-20260318-1000; D-20260318-1000)
- FR-008: Agent templates updated to remove stage_check, add signal vocabulary, emphasize concise assessment. (Sources: CR-20260318-1000; D-20260318-1000)

## Edge cases
- EC1: Claude may still return removed fields — server should ignore them, not fail. (Verifies: FR-001)
- EC2: Cache misses should not break functionality — just cost more. (Verifies: FR-006)
