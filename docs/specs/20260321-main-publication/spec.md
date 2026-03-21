# Feature Spec: 20260321-main-publication

Status: Done
Created: 2026-03-21 08:31
Inputs: CR-20260321-0831

## Summary
Publish the current March 21 repo work by committing the verified local changes on `main` and pushing that commit to `origin/main`, while excluding transient or redundant local PPTX artifacts.

## User Stories & Acceptance

### US1: Current repo work is published cleanly (Priority: P1)
Narrative:
- As the project owner, I want the current local work checked in and pushed to the default remote branch, so the remote repo reflects the latest intended artifacts and docs.

Acceptance scenarios:
1. Given `main` has uncommitted March 21 repo changes, When publication begins, Then those intended files are committed locally with ATHENA traceability. (Verifies: FR-001)
2. Given the new local commit exists on `main`, When I push to `origin/main`, Then the remote branch advances to that commit. (Verifies: FR-002)
3. Given the repo root contains extra local PPTX artifacts, When the commit is created, Then it includes `deck.pptx` but excludes the duplicate renamed export and the Office lock file. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: Commit the current March 21 repo-scoped work on local `main` with a traceable commit message. (Sources: CR-20260321-0831; D-20260321-0831)
- FR-002: Push the resulting local `main` commit to `origin/main`. (Sources: CR-20260321-0831; D-20260321-0831)
- FR-003: Include `deck.pptx` in the publication and exclude `cortege-AI-Agents-Week-long-Hack.pptx` plus `~$cortege-AI-Agents-Week-long-Hack.pptx` from the commit. (Sources: CR-20260321-0831; D-20260321-0831)

Non-functional requirements:
- NFR-001: The publication record must preserve ATHENA traceability in `docs/progress.txt`. (Sources: CR-20260321-0831; D-20260321-0831)
