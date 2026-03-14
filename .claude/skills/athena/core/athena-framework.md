# ATHENA Core Framework (Agent-Agnostic)

## Purpose

Run a strict, repeatable loop that converts raw requests into traceable delivery artifacts and implementation tasks.

## Core Artifacts

- `docs/requests.md`: append-only customer inputs
- `docs/decisions.md`: append-only interpretation/tradeoff log
- `docs/PRD.md`: source of truth requirements
- `docs/specs/<feature-id>/spec.md`: feature requirements + acceptance scenarios
- `docs/specs/<feature-id>/tasks.md`: implementation tasks linked to requirements
- `docs/progress.txt`: execution log and evidence
- `docs/TRACEABILITY.md`: audit entry point

## Non-Negotiable Rules

1. Capture the current request verbatim before PRD/code changes.
2. Record decisions whenever scope/interpretation/tradeoffs are introduced.
3. Every requirement must have `Sources: CR...` and `D...` when applicable.
4. Every task must map to a requirement (`Implements: FR-...`).
5. Keep `IN PROGRESS` to a single task.
6. Record commands, outcomes, and risks in progress notes.
7. If Git is present, commit with traceability pointers and record commit hashes.
8. Never push unless explicitly requested.

## ATHENA Loop

1. Capture request.
2. Ensure core docs exist.
3. Read current docs (`requests`, `decisions`, `PRD`, `progress`, `TRACEABILITY`).
4. Reconcile request into PRD + decision log.
5. Create/update feature spec and task list. Default to a new dated feature for each new request; reuse an existing feature only for explicit or clearly same-feature follow-up work.
6. Select one small task.
7. Implement.
8. Run relevant checks.
9. Reconcile PRD/spec/tasks/progress.
10. Commit with traceability.

## Completion Criteria

- The task has evidence (tests/checks or explicit manual verification).
- Progress log shows what changed and why.
- PRD/spec/tasks/progress are consistent.
- Git commit message references request/decision/feature/task.
