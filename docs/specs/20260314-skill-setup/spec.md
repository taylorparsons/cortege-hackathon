# Feature Spec: 20260314-skill-setup

Status: Done
Created: 2026-03-14 15:00
Inputs: CR-20260314-1500
Decisions: D-20260314-1500

## Summary
Install the relevant subset of global Claude skills into the project's `.claude/skills/` directory so that Claude Code has domain-appropriate guidance during all hackathon sessions. Skills are copied (not symlinked) for portability.

## User Stories & Acceptance

### US1: Skills available in project (Priority: P1)
Narrative:
- As a developer, I want project-local skills so that Claude Code applies the right workflows without manual instruction each session.

Acceptance scenarios:
1. Given a new Claude Code session, When I invoke `daisy`, Then it loads from `.claude/skills/daisy/SKILL.md`. (Verifies: FR-001)
2. Given a new Claude Code session, When I invoke `verification-before-completion`, Then it loads from `.claude/skills/verification-before-completion/SKILL.md`. (Verifies: FR-002)
3. Given a new Claude Code session, When I invoke `peas`, Then it loads from `.claude/skills/peas/SKILL.md`. (Verifies: FR-003)
4. Given a new Claude Code session, When I invoke `skill-creator`, Then it loads from `.claude/skills/skill-creator/SKILL.md`. (Verifies: FR-004)
5. Given `CLAUDE.md`, When I read it, Then all four skills are listed with paths and triggers. (Verifies: FR-005)

## Requirements

Functional requirements:
- FR-001: `daisy` skill copied to `.claude/skills/daisy/`. (Sources: CR-20260314-1500; D-20260314-1500)
- FR-002: `verification-before-completion` skill copied to `.claude/skills/verification-before-completion/`. (Sources: CR-20260314-1500; D-20260314-1500)
- FR-003: `peas` skill copied to `.claude/skills/peas/`. (Sources: CR-20260314-1500; D-20260314-1500)
- FR-004: `skill-creator` skill copied to `.claude/skills/skill-creator/`. (Sources: CR-20260314-1500; D-20260314-1500)
- FR-005: `CLAUDE.md` updated to register all four skills with paths and trigger conditions. (Sources: CR-20260314-1500; D-20260314-1500)

## Edge cases
- Skills with subdirectories (agents/, references/, scripts/) must be fully copied, not just SKILL.md. (Verifies: FR-001, FR-004)
