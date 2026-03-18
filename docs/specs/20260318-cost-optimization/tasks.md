# Tasks: 20260318-cost-optimization

Spec: docs/specs/20260318-cost-optimization/spec.md

## NEXT

## IN PROGRESS

## DONE
- [2026-03-18 10:10] T-001: Update SUBMIT_ASSESSMENT_TOOL schema, REQUIRED_FIELDS, validateAgentResponse in response-schema.js. (Implements: FR-001, FR-002, FR-004, FR-005)
- [2026-03-18 10:12] T-002: Add server-side backfill in agent-instance.js _processOne and split prompt for caching. (Implements: FR-003)
- [2026-03-18 10:14] T-003: Update callClaude in claude-client.js for split-prompt with cache_control. (Implements: FR-006, FR-007)
- [2026-03-18 10:16] T-004: Update agent templates (anchor, sentinel, scout, _template) response format sections. (Implements: FR-008)
- [2026-03-18 10:18] T-005: Update test suite for new schema shape and backfill behavior. (Implements: FR-001, FR-002, FR-003, FR-006)
- [2026-03-18 10:20] T-006: Run full test suite — 109 tests, 108 pass, 0 fail, 1 skipped (API key). (Implements: all)
- [2026-03-18 11:00] T-007: Add CLAUDE_DEBUG env var with per-call cache/token logging and one-time SDK diagnostics. (Implements: FR-009)
- [2026-03-18 11:10] T-008: Fix live API test bug (ws.fn → ws) and increase timeout to 30s for 5 sequential calls. (Implements: FR-006)
- [2026-03-18 11:30] T-009: Add Array.isArray guards for actions/signals in agent-instance.js and escalation-handler.js. (Implements: FR-010)
- [2026-03-18 11:40] T-010: Add regression tests for string coercion guards (2 tests in integration.test.js). (Implements: FR-010)
- [2026-03-18 12:00] T-011: Expand agent templates with Worked Examples section to exceed 2048-token caching threshold. (Implements: FR-011)
- [2026-03-18 12:10] T-012: Run full test suite — 111 tests, 110 pass, 0 fail, 1 skipped. (Implements: all)
