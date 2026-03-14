# Feature Spec: 20260314-hackathon-setup

Status: Done
Created: 2026-03-14 13:20
Inputs: CR-20260314-1320
Decisions: D-20260314-1320

## Summary
Scaffold a runnable hackathon project from the existing CORTEGE v2 prototype JSX file and PRD document. Initialize git, create a proper Vite+React project structure, and push to GitHub.

## User Stories & Acceptance

### US1: Runnable project (Priority: P1)
Narrative:
- As a hackathon participant, I want a runnable React project, so that I can iterate on the CORTEGE v2 prototype during the hackathon.

Acceptance scenarios:
1. Given the repo is cloned, When I run `npm install && npm run dev`, Then the CORTEGE v2 UI renders in the browser. (Verifies: FR-001, FR-002)
2. Given the project exists, When I visit the GitHub repo URL, Then all source files and docs are available. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: Project uses Vite + React as build toolchain. (Sources: CR-20260314-1320; D-20260314-1320)
- FR-002: Existing cortege-v2-prototype.jsx is integrated as the main app component. (Sources: CR-20260314-1320)
- FR-003: Project is pushed to https://github.com/taylorparsons/cortege-hackathon. (Sources: CR-20260314-1320)

## Edge cases
- None for initial setup
