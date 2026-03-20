# Feature Spec: 20260320-readme-alignment

Status: Done
Created: 2026-03-20 13:15
Inputs: CR-20260320-1315

## Summary
Align the top-level onboarding documentation with the shipped privacy-first household data model so README-driven setup and exploration match the current API, UI, and environment configuration.

## User Stories & Acceptance

### US1: New developers get accurate setup guidance (Priority: P1)
Narrative:
- As a developer reading the repository for the first time, I want `README.md` to describe the current location and privacy model, so that I can run and explore the app without following stale instructions.

Acceptance scenarios:
1. Given I read the environment and privacy sections in `README.md`, When I configure the app, Then I can see that `PII_MASTER_KEY` is part of the privacy model and understand that it is required for production while development has a fallback. (Verifies: FR-001)
2. Given I read the household and API sections in `README.md`, When I look for the current location model, Then I see saved locations, `location_id`, guarded location deletion, and member `phone` / `date_of_birth` documented. (Verifies: FR-002, FR-003)
3. Given I read the project structure section in `README.md`, When I compare it with the repo, Then the listed privacy/location files and directories exist. (Verifies: FR-004)

## Requirements

Functional requirements:
- FR-001: `README.md` shall describe the shipped privacy model at a high level, including encrypted PII at rest and the `PII_MASTER_KEY` environment variable. (Sources: CR-20260320-1315; D-20260320-1315)
- FR-002: `README.md` shall document the saved-location workflow and the current location CRUD surface, including reassignment before deletion. (Sources: CR-20260320-1315; D-20260320-1315)
- FR-003: `README.md` shall document the current member schema examples using `phone` and `date_of_birth`. (Sources: CR-20260320-1315; D-20260320-1315)
- FR-004: `README.md` shall reflect the current repo layout for privacy/location files and current test entrypoints. (Sources: CR-20260320-1315; D-20260320-1315)
- FR-005: `.env.example` shall include the privacy key setting referenced in the README. (Sources: CR-20260320-1315; D-20260320-1315)

Non-functional requirements:
- NFR-001: The documentation update shall stay factual and avoid claiming unimplemented capabilities. (Sources: CR-20260320-1315; D-20260320-1315)
