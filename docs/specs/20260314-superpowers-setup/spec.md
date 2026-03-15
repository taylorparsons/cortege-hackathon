# Feature Spec: 20260314-superpowers-setup

Status: Done
Created: 2026-03-14 15:10
Inputs: CR-20260314-1510
Decisions: D-20260314-1510

## Summary
Copy all 14 non-deprecated superpowers plugin skills into the project and enable the plugin via project-level settings, making the full superpowers workflow suite available for every hackathon session.

## User Stories & Acceptance

### US1: All superpowers skills available (Priority: P1)
Narrative:
- As a developer, I want all superpowers skills in the project so that Claude Code applies the right process workflows (brainstorming, TDD, debugging, etc.) without relying on global config.

Acceptance scenarios:
1. Given `.claude/skills/superpowers/`, When I list it, Then all 14 skill directories are present. (Verifies: FR-001)
2. Given `.claude/settings.json`, When I read it, Then superpowers@claude-plugins-official is true. (Verifies: FR-002)
3. Given `CLAUDE.md`, When I read it, Then all 14 superpowers skills are listed with paths and triggers. (Verifies: FR-003)

## Requirements

Functional requirements:
- FR-001: All 14 superpowers skills copied to `.claude/skills/superpowers/<name>/`. (Sources: CR-20260314-1510; D-20260314-1510)
- FR-002: `.claude/settings.json` created with superpowers plugin enabled. (Sources: CR-20260314-1510; D-20260314-1510)
- FR-003: `CLAUDE.md` updated to list all 14 skills with paths and triggers. (Sources: CR-20260314-1510; D-20260314-1510)

Non-functional requirements:
- NFR-001: Deprecated aliases (execute-plan, brainstorm, write-plan) excluded. (Sources: D-20260314-1510)

## Edge cases
- Skills with scripts/ subdirs must be fully copied, not just SKILL.md. (Verifies: FR-001)
