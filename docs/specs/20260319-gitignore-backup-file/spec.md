# Feature Spec: 20260319-gitignore-backup-file

Status: Done
Created: 2026-03-19 17:07
Inputs: CR-20260319-1707

## Summary
Ignore the specific SQLite backup artifact `data/cortege.db.backup.1773876131352` so it no longer appears as an untracked file in the repository.

## User Stories & Acceptance

### US1: Backup artifact stays out of Git (Priority: P1)
Narrative:
- As a developer, I want the generated backup file excluded from Git, so that it does not pollute repository status.

Acceptance scenarios:
1. Given the backup file exists in `data/`, When I run `git status`, Then it is no longer shown as untracked because `.gitignore` excludes it. (Verifies: FR-001)

## Requirements

Functional requirements:
- FR-001: Add an ignore rule for `data/cortege.db.backup.1773876131352` to `.gitignore`. (Sources: CR-20260319-1707)

Non-functional requirements:
- NFR-001: The change must not broaden ignore scope beyond the requested file. (Sources: CR-20260319-1707)
