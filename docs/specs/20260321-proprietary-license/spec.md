# Feature Spec: 20260321-proprietary-license

Status: Done
Created: 2026-03-21 08:26
Inputs: CR-20260321-0826

## Summary
Declare the repository as proprietary software by adding an explicit top-level license notice and aligning the package metadata and README with that non-open-source status.

## User Stories & Acceptance

### US1: Repo visitors can see the project is proprietary (Priority: P1)
Narrative:
- As a repo visitor, I want the repository to state that it is not open source and all rights are reserved, so there is no ambiguity about reuse rights.

Acceptance scenarios:
1. Given the repository root, When I open `LICENSE`, Then it states the project is proprietary, not open source, and all rights are reserved. (Verifies: FR-001)
2. Given the package metadata and README, When I inspect the licensing sections, Then they match the proprietary, non-open-source status declared in `LICENSE`. (Verifies: FR-002, FR-003)

## Requirements

Functional requirements:
- FR-001: Add a repo-root `LICENSE` file that states the project is proprietary, not open source, and all rights are reserved. (Sources: CR-20260321-0826; D-20260321-0826)
- FR-002: Set `package.json` to `"license": "UNLICENSED"` so package metadata does not imply an open-source grant. (Sources: CR-20260321-0826; D-20260321-0826)
- FR-003: Update the README license section to state that the project is not open source and all rights are reserved. (Sources: CR-20260321-0826; D-20260321-0826)

Non-functional requirements:
- NFR-001: The licensing statement must be consistent across the repo-facing files touched by this task. (Sources: CR-20260321-0826; D-20260321-0826)
