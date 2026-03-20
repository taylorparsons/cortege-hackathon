# Multi-Household Management — Design Spec

**Date:** 2026-03-19
**Status:** Done
**Scope:** Multi-household CRUD, member management, backward compatibility, frontend household switching
**Diagrams:** [System Diagrams](2026-03-19-household-management-diagrams.md)
**Feature Spec:** [docs/specs/20260319-add-household-feature/spec.md](../../specs/20260319-add-household-feature/spec.md)
**Implementation Plan:** [docs/superpowers/plans/2026-03-19-add-household-feature.md](../plans/2026-03-19-add-household-feature.md)

## Summary

Extends CORTEGE from a single hardcoded household (`data/household.json`) to a multi-household system where each household is an independent JSON file in `data/households/`. The orchestrator, API, and frontend all support creating, switching, and managing multiple households with full backward compatibility.

## Decisions

- **Storage:** File-per-household in `data/households/<id>.json` (not a single DB table) — matches existing JSON-file patterns, human-readable, low-frequency writes
- **Backward compatibility:** `GET /api/household` falls through: household store (by `DEFAULT_HOUSEHOLD_ID` env var) → first available household → legacy `data/household.json` → empty default
- **Frontend state:** React Context + localStorage for household selection persistence — no server-side session needed
- **Migration:** Opt-in script (`scripts/migrate-household.js`) converts legacy file, creates backup — no automatic migration on startup
- **Member IDs:** UUID v4, generated server-side on member creation
- **Household IDs:** UUID v4, generated server-side on household creation

## Architecture

### Storage Layer

```
data/
├── household.json          # Legacy (preserved for backward compat)
└── households/
    ├── <uuid-1>.json       # { household_id, name, location, members[], created_at, updated_at }
    └── <uuid-2>.json
```

**HouseholdStore** (`server/storage/household-store.js`):
- CRUD: `createHousehold`, `getHousehold`, `listHouseholds`, `updateHousehold`, `deleteHousehold`
- Member ops: `addMember`, `updateMember`, `removeMember`
- File I/O: `fs.readFile` / `fs.writeFile` with JSON serialization
- Directory auto-created on first write

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/households` | Create household |
| GET | `/api/households` | List all households |
| GET | `/api/households/:id` | Get household by ID |
| PUT | `/api/households/:id` | Update household |
| DELETE | `/api/households/:id` | Delete household |
| POST | `/api/households/:id/members` | Add member |
| PUT | `/api/households/:id/members/:memberId` | Update member |
| DELETE | `/api/households/:id/members/:memberId` | Remove member |
| GET | `/api/household` | Legacy endpoint (backward compat fallback chain) |

### Frontend Components

- **HouseholdContext** (`src/context/HouseholdContext.jsx`): React context providing `currentHouseholdId` + `setCurrentHouseholdId`, persisted to `localStorage`
- **HouseholdSelector** (`src/components/HouseholdSelector.jsx`): Modal UI for listing, creating, selecting, and deleting households
- **useHouseholds** (`src/hooks/useHouseholds.js`): Data hook for household CRUD operations
- **useCortegeData** (modified): Fetches household-scoped data when `currentHouseholdId` changes

### Orchestrator Integration

`Orchestrator.start()` conditionally initializes `HouseholdStore` when `enableHouseholdStore: true` is passed. The store instance is exposed on `orchestrator.householdStore` for route handlers to use.

## Migration Path

```
# Opt-in migration from legacy format
node scripts/migrate-household.js

# Creates:
#   data/households/<new-uuid>.json  (migrated household)
#   data/household.json.backup       (original preserved)
```

No automatic migration. Legacy `data/household.json` continues to work via the backward-compat fallback in `GET /api/household`.

## Test Coverage

- **8 unit tests**: HouseholdStore CRUD + member operations
- **8 API tests**: All REST endpoints
- **4 integration tests**: End-to-end flows, multi-household, 404 handling, backward compat

## Evidence

- PR: https://github.com/taylorparsons/cortege-hackathon/pull/1
- Commits: `4206429`, `2888ef9`, `f936a2e`, `2a1501a`
- Tests: 20 vitest tests passing
- Build: 40 modules, 256KB / 77KB gzip
