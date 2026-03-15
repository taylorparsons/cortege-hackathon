---
name: peas
description: Apply the PEAS framework (Performance measure, Environment, Actuators, Sensors) to specify or audit an AI agent’s task environment. Use when the user asks to create a PEAS list/table for a coding agent or workflow, translate a vague “how should the agent work?” into concrete success metrics and constraints, or add a PEAS section to AGENTS.md / PRD / design docs.
---

# PEAS

## Overview

Use PEAS to make an agent’s job explicit: how success is measured, what world it operates in, what actions it can take, and what feedback signals it should use.

Default behavior when invoked for an implementation request: create/update a repo PEAS spec first, then implement the requested change following the Sensors list and running the checks.

## Workflow

### 0) Determine the mode

- If the user only wants a PEAS spec (e.g., “PEAS only”, “spec-only”), do **Spec-only**.
- Otherwise do **PEAS-first execution** (default): “create PEAS for this repo and then implement X”.

### 1) Choose the target “agent”

- Identify what is being specified: a human+tool loop, an AI coding agent in a repo, a CI bot, a “support triage” assistant, or a specific skill/workflow (e.g., “RALPH loop executor”).
- Name the agent and its primary job in one sentence.

### 2) Draft PEAS (first pass)

- Write each PEAS quadrant as concrete bullets.
- Prefer falsifiable statements over aspirations.

### 3) Tighten with the “So what?” test

- For each bullet, ask: “Would this change a decision the agent makes?”
- Remove bullets that do not alter behavior.
- Add missing constraints that would prevent common failure modes.

### 4) Convert to checks and defaults

- Turn **Performance** into a small “Definition of done” list (tests pass, lint passes, acceptance criteria met, latency budget, etc.).
- Turn **Sensors** into an explicit “verify” list (what to read/run before claiming success).
- Turn **Actuators** into allowed/disallowed actions (edit which files, run which commands, whether network is allowed).

### 5) Place the PEAS spec

- If the goal is to instruct an agent in a repo, add a section to `AGENTS.md`.
- If the goal is requirements clarity, add it to the PRD/spec as a “PEAS” or “Operating assumptions” section.
- If the goal is auditing an existing workflow, add it to a short doc next to the workflow description (then update the workflow accordingly).

### 6) Execute the task (default)

When the prompt includes an “implement/fix/add” request:

- Write/update the PEAS spec for **this repo** first.
  - Prefer updating the most relevant `AGENTS.md` (closest in scope to the code being changed). If none exists, create `AGENTS.md` at the repo root.
  - Keep `## PEAS` short and concrete; avoid duplicating other policy text.
- Implement **X** next, staying within the Actuators constraints.
- Run the checks from **Sensors**.
  - If Sensors lists concrete commands, run them.
  - If Sensors is high-level, choose the closest repo-native equivalents (tests/lint/typecheck/build).
  - If checks cannot be run, record why and what was done instead.

## Template

Use this format (prefer a table if writing into long docs; use bullets if writing into `AGENTS.md`):

```text
## PEAS

Agent:
- <one-sentence job>

Performance measure (P):
- <how success is evaluated; falsifiable>

Environment (E):
- <constraints, repo/runtime, stakeholders, boundaries>

Actuators (A):
- <actions the agent may take; include allowed commands/files>

Sensors (S):
- <what the agent can observe; include tests/logs/telemetry/human review>
```

## Heuristics

- Keep **P** short and measurable; prefer “must pass X” to “should be good”.
- Make **E** include “non-goals” (what the agent must not touch).
- Make **A** reflect real permissions and workflow (PRs allowed? direct push? run `npm install`?).
- Make **S** include negative signals (failing tests, flaky CI, security scan warnings).

## Examples

### Example: AI coding agent in a repo

```text
## PEAS

Agent:
- Implement small, reviewable changes in this repository following existing conventions.

Performance measure (P):
- Proposed changes satisfy the user request without expanding scope.
- Relevant tests/lint/typecheck pass (or failures are recorded with rationale).
- No secrets are introduced; no destructive commands run without explicit approval.

Environment (E):
- Monorepo with Node/TypeScript services; CI is the source of truth for merges.
- Network access may be restricted; installs may require approval.
- Follow `AGENTS.md` and existing project conventions.

Actuators (A):
- Edit files within the workspace; add/remove files only when required.
- Run repo-provided checks (`npm test`, `pnpm lint`, `pytest`, etc.) when available.
- Update docs and changelogs only when required by the task.

Sensors (S):
- Test/lint/typecheck output; build output; git diff; code search results.
- Reviewer feedback; CI status; runtime logs if the app is run locally.
```

### Example: Agent executing a strict workflow (e.g., RALPH loop)

```text
## PEAS

Agent:
- Execute the workflow exactly as defined and maintain traceability artifacts.

Performance measure (P):
- Every requirement/task has traceability links (Sources/Verifies/Implements) with no broken IDs.
- Exactly one task is “IN PROGRESS” at a time; progress log updated with commands/outcomes.

Environment (E):
- Repo contains canonical workflow docs; do not invent requirements.

Actuators (A):
- Append to request/decision logs; edit PRD/spec/tasks/progress; implement code changes for the selected task.

Sensors (S):
- Presence/contents of the workflow files; validation command results; traceability consistency checks.
```

## Output Rules

- Default: produce a PEAS spec in the Template format, place it into `AGENTS.md`, then implement the requested change and run the Sensors checks.
- Spec-only override: if the user explicitly asks for “PEAS only / spec-only”, only produce the PEAS spec (and optionally place it into `AGENTS.md` if requested).
- If information is missing (metrics, constraints, allowed actions, checks), ask up to 3 targeted questions before proceeding.
