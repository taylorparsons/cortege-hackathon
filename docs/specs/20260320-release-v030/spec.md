# Feature Spec: 20260320-release-v030

Status: In Progress
Created: 2026-03-20 14:15
Inputs: CR-20260320-1415

## Summary
Correct and publish the `v0.3.0` release so it reflects the current shipped state of `main`, not the earlier SQLite-only slice.

## User Stories & Acceptance

### US1: Release notes match the shipped product (Priority: P1)
Narrative:
- As a maintainer, I want the `v0.3.0` tag and release notes to match the actual shipped state of `main`, so the GitHub Releases page is accurate.

Acceptance scenarios:
1. Given the existing `RELEASE-0.3.0.md` is stale, When it is updated, Then it summarizes the current shipped changes since `v0.2.0`. (Verifies: FR-001)
2. Given the remote `v0.3.0` tag points to an older commit, When the release is corrected, Then `v0.3.0` points to the new release commit on `main`. (Verifies: FR-002)
3. Given the corrected tag exists, When the GitHub release is published, Then the Releases page shows `v0.3.0` with the updated body text. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: `RELEASE-0.3.0.md` shall describe the full shipped delta from `v0.2.0` to current `main`, including storage, frontend/API integration, household/location management, privacy, and test coverage. (Sources: CR-20260320-1415; D-20260320-1415)
- FR-002: The remote `v0.3.0` tag shall be updated to the corrected release commit on `main`. (Sources: CR-20260320-1415; D-20260320-1415)
- FR-003: A GitHub release for `v0.3.0` shall be published using the updated release notes text. (Sources: CR-20260320-1415; D-20260320-1415)

Non-functional requirements:
- NFR-001: The release notes shall stay factual and only claim shipped behavior verified on `main`. (Sources: CR-20260320-1415; D-20260320-1415)
