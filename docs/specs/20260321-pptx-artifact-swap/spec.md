# Feature Spec: 20260321-pptx-artifact-swap

Status: Done
Created: 2026-03-21 08:36
Inputs: CR-20260321-0836

## Summary
Adopt `cortege-AI-Agents-Week-long-Hack.pptx` as the canonical repo deck artifact, remove `deck.pptx`, and align the deck-export workflow and current docs with that filename.

## User Stories & Acceptance

### US1: The repo points to one canonical PPTX artifact (Priority: P1)
Narrative:
- As the project owner, I want the repo to use the named hackathon PPTX artifact consistently, so there is no ambiguity about which presentation file is current.

Acceptance scenarios:
1. Given the repo root, When I inspect tracked PPTX artifacts, Then `cortege-AI-Agents-Week-long-Hack.pptx` is present and `deck.pptx` is absent. (Verifies: FR-001, FR-002)
2. Given the deck-export workflow files, When I inspect the generator and verification script, Then they target `cortege-AI-Agents-Week-long-Hack.pptx`. (Verifies: FR-003)
3. Given the current product docs, When I inspect the active deck-export requirements, Then they identify `cortege-AI-Agents-Week-long-Hack.pptx` as the canonical exported artifact. (Verifies: FR-004)

## Requirements

Functional requirements:
- FR-001: The repo SHALL use `cortege-AI-Agents-Week-long-Hack.pptx` as the canonical tracked PowerPoint deck artifact. (Sources: CR-20260321-0836; D-20260321-0836)
- FR-002: `deck.pptx` SHALL be removed from source control as the superseded deck artifact. (Sources: CR-20260321-0836; D-20260321-0836)
- FR-003: The deck generator and its verification script SHALL target `cortege-AI-Agents-Week-long-Hack.pptx` instead of `deck.pptx`. (Sources: CR-20260321-0836; D-20260321-0836)
- FR-004: The current ATHENA documentation for the deck export SHALL identify `cortege-AI-Agents-Week-long-Hack.pptx` as the canonical artifact. (Sources: CR-20260321-0836; D-20260321-0836)

Non-functional requirements:
- NFR-001: The change must preserve the existing 8-slide artifact and avoid destructive regeneration of the named PPTX during verification. (Sources: CR-20260321-0836; D-20260321-0836)
