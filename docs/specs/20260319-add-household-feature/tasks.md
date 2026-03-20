# Add Household Feature - Task List

**Feature ID:** 20260319-add-household-feature
**Status:** Done
**Plan:** [`docs/superpowers/plans/2026-03-19-add-household-feature.md`](../../superpowers/plans/2026-03-19-add-household-feature.md)

## Task Status Legend
- ⬜ Not Started
- 🔄 In Progress
- ✅ Done

## Backend Tasks

### T-001: Create HouseholdStore ✅
**Implements:** FR-001
**Description:** Create `server/storage/household-store.js` with methods for CRUD operations on households
**Files:** `server/storage/household-store.js`, `server/tests/household-store.test.js`
**Verification:** 8 tests pass for createHousehold, listHouseholds, getHousehold, updateHousehold, deleteHousehold, addMember, updateMember, removeMember

### T-002: Add Member Management to HouseholdStore ✅
**Implements:** FR-003
**Description:** Add methods for managing members within households
**Files:** `server/storage/household-store.js`, `server/tests/household-store.test.js`
**Verification:** Included in T-001 (8 tests)

### T-003: Add Household Management API Routes ✅
**Implements:** FR-002
**Description:** Add REST endpoints for household CRUD operations
**Files:** `server/api/routes.js`, `server/tests/household-api.test.js`
**Verification:** 8 API tests pass for POST/GET/PUT/DELETE /api/households

### T-004: Add Member Management API Routes ✅
**Implements:** FR-003
**Description:** Add REST endpoints for member CRUD operations
**Files:** `server/api/routes.js`, `server/tests/household-api.test.js`
**Verification:** Included in T-003 (8 tests)

### T-005: Integrate HouseholdStore with Orchestrator ✅
**Implements:** FR-005
**Description:** Add HouseholdStore initialization to orchestrator
**Files:** `server/orchestrator/orchestrator.js`, `server/index.js`, `server/tests/integration.test.js`
**Verification:** Integration tests pass for orchestrator with household store

### T-006: Add Backward Compatibility Layer ✅
**Implements:** FR-004
**Description:** Update legacy /api/household endpoint to support both modes
**Files:** `server/api/routes.js`
**Verification:** Legacy endpoint returns household store data or falls back to household.json

## Frontend Tasks

### T-007: Create useHouseholds Hook ✅
**Implements:** FR-006, FR-008
**Description:** Create React hook for household data fetching and management
**Files:** `src/hooks/useHouseholds.js`
**Verification:** Hook fetches, creates, and deletes households

### T-008: Create HouseholdSelector Component ✅
**Implements:** FR-006
**Description:** Create UI component for household selection and management
**Files:** `src/components/HouseholdSelector.jsx`
**Verification:** Component renders with CORTEGE UI styling

### T-009: Add HouseholdContext ✅
**Implements:** FR-007
**Description:** Create React context for household state management
**Files:** `src/context/HouseholdContext.jsx`, `src/main.jsx`
**Verification:** Context provides currentHouseholdId, persists to localStorage

### T-010: Integrate Household Selector in Main App ✅
**Implements:** FR-006, FR-007
**Description:** Add household selector to main Cortege component
**Files:** `src/Cortege.jsx`
**Verification:** "Switch Household" button in nav opens selector modal

### T-011: Update Data Fetching for Household Context ✅
**Implements:** FR-008
**Description:** Update useCortegeData to fetch household-scoped data
**Files:** `src/hooks/useCortegeData.js`
**Verification:** Data re-fetches when household changes

## Migration Tasks

### T-012: Create Migration Script ✅
**Implements:** FR-009, FR-010
**Description:** Create script to migrate legacy household.json to new format
**Files:** `scripts/migrate-household.js`
**Verification:** Script migrates data and creates backup

## Documentation Tasks

### T-013: Update API Documentation ✅
**Implements:** NFR-002
**Description:** Add household management endpoints to API.md
**Files:** `docs/API.md`
**Verification:** All household endpoints documented with examples

### T-014: Update README ⬜
**Implements:** NFR-002
**Description:** Deferred — not explicitly requested

### T-015: Update Environment Variables ✅
**Implements:** NFR-002
**Description:** Add household configuration to .env.example
**Files:** `.env.example`
**Verification:** DEFAULT_HOUSEHOLD_ID added

## Testing Tasks

### T-016: Add Integration Tests ✅
**Implements:** NFR-001
**Description:** Create end-to-end integration tests for household feature
**Files:** `server/tests/household-integration.test.js`
**Verification:** 4 integration tests pass

### T-017: Run Full Test Suite ✅
**Implements:** NFR-001
**Description:** Verify all tests pass including new household tests
**Verification:** 20 vitest tests pass (8 store + 8 API + 4 integration), build passes (40 modules)

## Summary

**Total Tasks:** 17
**Completed:** 16
**Deferred:** 1 (T-014 README update)
**Not Started:** 0

**Test Coverage:** 20 new tests (8 store + 8 API + 4 integration)
