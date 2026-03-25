# Tasks: Companion Agent Creation Bug Fix

**Feature ID**: 20260324-companion-agent-creation-bug  
**Spec**: [spec.md](spec.md)

## T-001: Set DEFAULT_HOUSEHOLD_ID in .env
**Implements**: FR-001  
**Effort**: 5 minutes

Add `DEFAULT_HOUSEHOLD_ID=hh_fab2e400` to .env file to activate the Seattle Parsons household at startup.

## T-002: Update .env.example
**Implements**: NFR-002  
**Effort**: 5 minutes

Document the DEFAULT_HOUSEHOLD_ID variable in .env.example with a comment explaining its purpose.

## T-003: Add Empty Household Skip Logic
**Implements**: FR-003  
**Effort**: 15 minutes

Update `orchestrator._resolveInitialHouseholdId()` to skip households with 0 members when selecting the default household.

## T-004: Update E2E Test Cleanup
**Implements**: FR-002  
**Effort**: 15 minutes

Ensure Cypress and Playwright E2E tests clean up test households in afterEach/after hooks.

## T-005: Verify Fix
**Implements**: All FRs  
**Effort**: 10 minutes

1. Stop the server
2. Verify .env has DEFAULT_HOUSEHOLD_ID=hh_fab2e400
3. Start the server
4. Check logs show "Activated household 'Seattle Parsons' with 4 member(s)"
5. Check logs show "Created 4 agent instance(s)"
6. Open UI and verify 4 companion agents appear
7. Run E2E tests and verify no test households remain

## T-006: Update ATHENA Docs
**Implements**: All FRs  
**Effort**: 10 minutes

Update docs/progress.txt with the bug fix session notes.
