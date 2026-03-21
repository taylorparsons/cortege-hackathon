# Feature Spec: 20260321-pptx-codex-skill

Status: Done
Created: 2026-03-21 08:15
Inputs: CR-20260321-0815, CR-20260321-0820

## Summary
Install a reusable global Codex skill for future PowerPoint work so PPTX generation follows a consistent `python-pptx` workflow instead of starting from scratch each time.

## User Stories & Acceptance

### US1: Future Codex sessions can discover a reusable PPTX skill (Priority: P1)
Narrative:
- As a Codex user, I want a reusable PPTX skill in my global skill directory so future presentation requests start from a known-good workflow.

Acceptance scenarios:
1. Given the Codex global skill directory is `/Users/taylorparsons/.codex/skills`, When the work completes, Then a new `pptx-presentation-builder` skill exists there. (Verifies: FR-001, FR-003)
2. Given the skill is intended for broad PPTX work, When a future session reads it, Then it explains when to use editable native slides, how to translate a source deck into PowerPoint primitives, and how to verify the result. (Verifies: FR-002)
3. Given future sessions need more than prose, When the skill is installed, Then helper scripts for scaffolding and artifact inspection are available under the skill directory and documented in the skill. (Verifies: FR-004, FR-005)

## Requirements

Functional requirements:
- FR-001: A new global Codex skill shall be installed at `/Users/taylorparsons/.codex/skills/pptx-presentation-builder/SKILL.md`. (Sources: CR-20260321-0815; D-20260321-0815)
- FR-002: The skill shall describe a reusable `python-pptx` workflow covering source review, design-token extraction, native slide construction, media handling, and verification. (Sources: CR-20260321-0815; D-20260321-0815)
- FR-003: Verification shall confirm the installed skill file exists and is readable after creation. (Sources: CR-20260321-0815; D-20260321-0815)
- FR-004: The global skill shall include reusable helper scripts under `/Users/taylorparsons/.codex/skills/pptx-presentation-builder/scripts/` for scaffolding a PPTX workflow and inspecting a generated `.pptx` artifact. (Sources: CR-20260321-0820; D-20260321-0820)
- FR-005: The skill documentation shall reference the helper scripts with enough usage detail that future Codex sessions can invoke them directly. (Sources: CR-20260321-0820; D-20260321-0820)

Non-functional requirements:
- NFR-001: The skill shall stay technology-specific to PowerPoint generation and avoid being tied to this repo alone. (Sources: CR-20260321-0815; D-20260321-0815)
- NFR-002: The skill frontmatter shall follow Codex skill conventions so it is discoverable in future sessions. (Sources: CR-20260321-0815; D-20260321-0815)
- NFR-003: The helper scripts shall stay generic enough for reuse across repositories and deck types instead of depending on one repo's slide content. (Sources: CR-20260321-0820; D-20260321-0820)
