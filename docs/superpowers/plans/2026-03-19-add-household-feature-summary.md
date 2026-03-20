# Add Household Feature - Quick Reference

**Plan Location:** `docs/superpowers/plans/2026-03-19-add-household-feature.md`

**Status:** Ready for execution

**Estimated Time:** 2-3 days

**Test Coverage:** 14 new tests

---

## Overview

Implements multi-household support in CORTEGE, allowing users to create, manage, and switch between multiple households with full backward compatibility.

## Structure

### Chunk 1: Backend Foundation (Tasks 1-5)
- HouseholdStore implementation
- Household management API (CRUD)
- Member management API (CRUD)
- Orchestrator integration

### Chunk 2: Frontend UI (Tasks 6-8)
- HouseholdSelector component
- HouseholdContext for state management
- Data fetching updates

### Chunk 3: Data Migration (Tasks 9-10)
- Migration script for legacy household.json
- Backward compatibility layer

### Chunk 4: Documentation (Tasks 11-13)
- API documentation updates
- README updates
- Environment variable docs

### Chunk 5: Testing & Validation (Tasks 14-17)
- Integration tests
- Full test suite validation
- Manual testing checklist
- PR creation

---

## Key Features

✓ Create/read/update/delete households
✓ Add/edit/remove household members
✓ Switch between households in UI
✓ Migrate legacy household.json
✓ Backward compatible with existing code
✓ Comprehensive test coverage
✓ Full documentation

---

## Execution

**With subagents (recommended):**
```
Use superpowers:subagent-driven-development to execute this plan
```

**Without subagents:**
```
Use superpowers:executing-plans to execute this plan
```

---

## Files Created/Modified

**New Files:**
- `server/storage/household-store.js`
- `server/tests/household-store.test.js`
- `server/tests/household-api.test.js`
- `server/tests/household-integration.test.js`
- `src/components/HouseholdSelector.jsx`
- `src/hooks/useHouseholds.js`
- `src/context/HouseholdContext.jsx`
- `scripts/migrate-household.js`

**Modified Files:**
- `server/api/routes.js`
- `server/orchestrator/orchestrator.js`
- `server/index.js`
- `src/Cortege.jsx`
- `src/main.jsx`
- `src/hooks/useCortegeData.js`
- `docs/API.md`
- `README.md`
- `.env.example`
- `docs/progress.txt`

---

## Breaking Changes

None - fully backward compatible with existing household.json format.

---

## Next Steps

1. Review the full plan at `docs/superpowers/plans/2026-03-19-add-household-feature.md`
2. Execute using appropriate superpower skill
3. Follow TDD approach (test → fail → implement → pass → commit)
4. Complete all 17 tasks across 5 chunks
5. Create PR when complete

