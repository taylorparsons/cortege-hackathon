# Traceability (How to follow the audit trail)

Start here:
1) Find the relevant raw request in [`requests.md`](requests.md) (CR-...).
2) Read linked interpretations/tradeoffs in [`decisions.md`](decisions.md) (D-...).
3) Open the feature spec at [`specs/<FEATURE_ID>/spec.md`](specs/).
   - Requirements use IDs (FR-...) and include `Sources: CR-...; D-...`.
   - Acceptance scenarios include `Verifies: FR-...`.
4) Open the feature task list at [`specs/<FEATURE_ID>/tasks.md`](specs/).
   - Tasks include `Implements: FR-...`.
5) Review execution notes in [`progress.txt`](progress.txt) for commands, outcomes, and completion.

## Document Index

| Document | Path | Purpose |
|---|---|---|
| PRD | [`PRD.md`](PRD.md) | Product requirements and current state |
| Requests | [`requests.md`](requests.md) | Raw customer requests (CR-*) |
| Decisions | [`decisions.md`](decisions.md) | Design decisions with rationale (D-*) |
| Progress | [`progress.txt`](progress.txt) | Execution log |
| Hackathon Setup | [`specs/20260314-hackathon-setup/spec.md`](specs/20260314-hackathon-setup/spec.md) | Project scaffolding spec |
| Skill Setup | [`specs/20260314-skill-setup/spec.md`](specs/20260314-skill-setup/spec.md) | Project-local skills spec |
| Superpowers Setup | [`specs/20260314-superpowers-setup/spec.md`](specs/20260314-superpowers-setup/spec.md) | Superpowers plugin skills spec |
| Agent Orchestration | [`superpowers/specs/2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md) | Agent system design spec |
| Agent Diagrams | [`superpowers/specs/2026-03-14-agent-orchestration-diagrams.md`](superpowers/specs/2026-03-14-agent-orchestration-diagrams.md) | Mermaid system diagrams |
