# Add Household Feature Specification

**Feature ID:** 20260319-add-household-feature  
**Status:** In Progress  
**Created:** 2026-03-19  
**Sources:** [CR-20260319-1730](../../requests.md#cr-20260319-1730); [D-20260319-1730](../../decisions.md#d-20260319-1730)

## Overview

Add multi-household management capability to CORTEGE, allowing users to create, manage, and switch between multiple households with independent members and companion agents.

## User Stories

### US-1: Create Household (Sources: CR-20260319-1730)
**As a** CORTEGE administrator  
**I want to** create multiple households  
**So that** I can manage protection for different families or groups independently

**Acceptance Criteria:**
- Given I am on the household management screen
- When I click "New Household" and enter name and location
- Then a new household is created with a unique ID
- And I can add members to that household

**Verifies:** FR-001, FR-002

### US-2: Switch Households (Sources: CR-20260319-1730)
**As a** CORTEGE user  
**I want to** switch between households  
**So that** I can view and manage different households independently

**Acceptance Criteria:**
- Given I have multiple households configured
- When I select a different household from the selector
- Then the UI updates to show that household's members and agents
- And the selection persists across page reloads

**Verifies:** FR-003, FR-004

### US-3: Manage Members (Sources: CR-20260319-1730)
**As a** household administrator  
**I want to** add, edit, and remove members from a household  
**So that** I can keep household membership current

**Acceptance Criteria:**
- Given I have selected a household
- When I add a new member with name, age, profile type, and companion
- Then the member appears in the household
- And an agent instance is created for that member

**Verifies:** FR-005, FR-006, FR-007

## Functional Requirements

### Backend Requirements

**FR-001: Household Storage** (Sources: CR-20260319-1730; D-20260319-1730)  
System SHALL store multiple households as separate JSON files in `data/households/` directory

**FR-002: Household CRUD API** (Sources: CR-20260319-1730)  
System SHALL provide REST API endpoints for creating, reading, updating, and deleting households

**FR-003: Member Management API** (Sources: CR-20260319-1730)  
System SHALL provide REST API endpoints for adding, updating, and removing members from households

**FR-004: Backward Compatibility** (Sources: CR-20260319-1730; D-20260319-1730)  
System SHALL continue to support legacy `data/household.json` for single-household deployments

**FR-005: Household Store Integration** (Sources: CR-20260319-1730)  
Orchestrator SHALL integrate HouseholdStore for multi-household management

### Frontend Requirements

**FR-006: Household Selector UI** (Sources: CR-20260319-1730)  
UI SHALL provide a household selector component for switching between households

**FR-007: Household Context** (Sources: CR-20260319-1730)  
UI SHALL maintain current household selection in application context with localStorage persistence

**FR-008: Data Fetching** (Sources: CR-20260319-1730)  
UI SHALL fetch data scoped to the currently selected household

### Migration Requirements

**FR-009: Migration Script** (Sources: CR-20260319-1730; D-20260319-1730)  
System SHALL provide a migration script to convert legacy `household.json` to new format

**FR-010: Migration Backup** (Sources: CR-20260319-1730)  
Migration script SHALL create backup of original `household.json` before conversion

## Non-Functional Requirements

**NFR-001: Test Coverage** (Sources: CR-20260319-1730)  
Implementation SHALL include comprehensive test coverage (unit, integration, API tests)

**NFR-002: Documentation** (Sources: CR-20260319-1730)  
Implementation SHALL update API documentation and README with household management guide

**NFR-003: Performance** (Sources: CR-20260319-1730)  
Household list SHALL load in <100ms, household switching SHALL update UI in <200ms

## Acceptance Scenarios

### Scenario 1: Create and Switch Households
**Given** CORTEGE is running with household store enabled  
**When** I create two households "Family A" and "Family B"  
**And** I add members to each household  
**And** I switch between households  
**Then** each household shows its own members  
**And** the selection persists after page reload  
**Verifies:** FR-001, FR-002, FR-003, FR-006, FR-007, FR-008

### Scenario 2: Migrate Legacy Household
**Given** I have an existing `data/household.json` file  
**When** I run the migration script  
**Then** a new household is created in the household store  
**And** all members are migrated  
**And** a backup of the original file is created  
**Verifies:** FR-009, FR-010

### Scenario 3: Backward Compatibility
**Given** household store is not enabled  
**When** I call GET /api/household  
**Then** the system returns data from `data/household.json`  
**And** existing functionality continues to work  
**Verifies:** FR-004

## Out of Scope

- Household-scoped event/memory isolation (future enhancement)
- Multi-user authentication/authorization
- Household sharing between users
- Cloud synchronization

## Dependencies

- Existing storage-adapter.js pattern
- Express.js REST API
- React context API
- localStorage for persistence

## Risks

- File-based storage may have concurrent write limitations (mitigated: household management is low-frequency operation)
- Migration script must handle edge cases (mitigated: comprehensive testing and backup creation)

## Implementation Plan

See: [`docs/superpowers/plans/2026-03-19-add-household-feature.md`](../../superpowers/plans/2026-03-19-add-household-feature.md)
