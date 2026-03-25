# Companion Agent Creation Bug Fix

**Feature ID**: 20260324-companion-agent-creation-bug  
**Status**: In Progress  
**Created**: 2026-03-24  
**Sources**: [CR-20260324-1000](../../requests.md#cr-20260324-1000); [D-20260324-1000](../../decisions.md#d-20260324-1000)

## Problem Statement

User created a household with 4 members (David T Parsons, Melanie Blair, Walker Parsons, Aidan Parsons) but only 1 companion agent appears in the UI. All 4 members are visible in the household editor, but the "Companion Agents" section only shows David T Parsons.

## Root Cause

The orchestrator activates the first household alphabetically at startup when no DEFAULT_HOUSEHOLD_ID is set. Currently, an E2E test household with 0 members is being activated instead of the Seattle Parsons household with 4 members.

## Functional Requirements

### FR-001: Default Household Selection
**Sources**: CR-20260324-1000; D-20260324-1000  
The orchestrator SHALL activate the correct household at startup by setting DEFAULT_HOUSEHOLD_ID in .env.

**Verifies**: Given a .env file with DEFAULT_HOUSEHOLD_ID=hh_fab2e400, when the server starts, then 4 companion agents are created for the Seattle Parsons household.

### FR-002: Test Household Cleanup
**Sources**: CR-20260324-1000; D-20260324-1000  
E2E tests SHALL clean up test households after completion to prevent interference with demo households.

**Verifies**: Given E2E tests have run, when the server starts, then no test households remain in data/households/.

### FR-003: Empty Household Handling
**Sources**: CR-20260324-1000; D-20260324-1000  
The orchestrator SHALL skip households with 0 members when selecting the default household at startup.

**Verifies**: Given multiple households exist including one with 0 members, when no DEFAULT_HOUSEHOLD_ID is set, then the orchestrator activates the first non-empty household.

## Non-Functional Requirements

### NFR-001: Backward Compatibility
The fix SHALL NOT break existing household activation logic for households with members.

### NFR-002: Documentation
The .env.example file SHALL document the DEFAULT_HOUSEHOLD_ID variable.

## Edge Cases

### EC1: All Households Empty
If all households have 0 members, the orchestrator SHALL log a warning and activate the first household anyway.

### EC2: Invalid DEFAULT_HOUSEHOLD_ID
If DEFAULT_HOUSEHOLD_ID is set to a non-existent household, the orchestrator SHALL fall back to the first available household.

## Success Criteria

1. Setting DEFAULT_HOUSEHOLD_ID=hh_fab2e400 results in 4 companion agents being created
2. All 4 members appear in the UI companion section
3. E2E tests clean up after themselves
4. Empty households are skipped during default selection
5. Documentation is updated
