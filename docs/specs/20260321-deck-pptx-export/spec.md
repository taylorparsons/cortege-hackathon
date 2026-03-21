# Feature Spec: 20260321-deck-pptx-export

Status: Done
Created: 2026-03-21 08:01
Inputs: CR-20260321-0801

## Summary
Generate a native PowerPoint version of the existing reveal.js presentation so the hackathon deck can be opened and edited as `cortege-AI-Agents-Week-long-Hack.pptx` while preserving the current slide copy and visual system.

## User Stories & Acceptance

### US1: Presenters can open the deck as a PowerPoint file (Priority: P1)
Narrative:
- As a presenter, I want the reveal.js deck exported as a `.pptx` file so I can use it in standard presentation software without rebuilding the story manually.

Acceptance scenarios:
1. Given the repo contains `deck.html`, When I run the deck export workflow, Then it writes `cortege-AI-Agents-Week-long-Hack.pptx` in the repo root with 8 slides. (Verifies: FR-001, FR-005)
2. Given the reveal.js deck defines the presentation copy, When the PowerPoint is generated, Then the slide text in `cortege-AI-Agents-Week-long-Hack.pptx` matches the current slide copy from `deck.html`. (Verifies: FR-002)
3. Given the design system uses a dark background with amber, teal, and light-text accents, When the PowerPoint is generated, Then the deck uses those colors and targets the requested heading/body fonts with safe fallback behavior. (Verifies: FR-003)
4. Given the live-product slide references three existing screenshots, When the deck is generated, Then those images are embedded in the PowerPoint media bundle and laid out on slide 5. (Verifies: FR-004)
5. Given the export workflow is part of the repo, When verification runs, Then it proves slide count, representative text, and embedded media in the generated `.pptx`. (Verifies: FR-006)

## Requirements

Functional requirements:
- FR-001: The repo shall include a Python generator that uses `python-pptx` to create `cortege-AI-Agents-Week-long-Hack.pptx` from the reveal.js source content in `deck.html`. (Sources: CR-20260321-0801, CR-20260321-0836; D-20260321-0801, D-20260321-0836)
- FR-002: The generated PowerPoint shall contain 8 slides whose text content matches the current deck copy in `deck.html`. (Sources: CR-20260321-0801; D-20260321-0801)
- FR-003: The generated PowerPoint shall apply the current visual system with background `#111009`, light text `#F0EAD8`, amber `#E8A838`, teal `#4ECDC4`, and requested font targets for headings/body with fallback if unavailable. (Sources: CR-20260321-0801; D-20260321-0801)
- FR-004: The generated PowerPoint shall embed the three existing Cypress screenshots referenced on the live-product slide. (Sources: CR-20260321-0801)
- FR-005: The workflow shall save the generated file as `cortege-AI-Agents-Week-long-Hack.pptx` in the repo root. (Sources: CR-20260321-0801, CR-20260321-0836; D-20260321-0836)
- FR-006: Verification shall run the generator and inspect the resulting `.pptx` for the expected slide count, representative deck text, and embedded media assets. (Sources: CR-20260321-0801; D-20260321-0801)

Non-functional requirements:
- NFR-001: The export workflow shall be reproducible from the repo without manual slide editing in PowerPoint. (Sources: CR-20260321-0801; D-20260321-0801)
- NFR-002: The implementation may approximate the reveal.js CSS layout with native PowerPoint shapes rather than requiring HTML rendering. (Sources: CR-20260321-0801; D-20260321-0801)
