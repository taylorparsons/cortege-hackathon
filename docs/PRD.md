# CORTEGE v2 — Hackathon PRD

## Overview
CORTEGE v2 is a companion-model AI security product. Each household member is paired with a dedicated AI companion agent that silently protects them — no dashboards, no alerts, no user involvement. Protection deepens over time through behavioral learning.

See [`GUARDIAN_PRD_v2_Addendum.docx`](../GUARDIAN_PRD_v2_Addendum.docx) for the full product philosophy and feature specification.

## Current State
- React prototype UI exists ([`cortege-v2-prototype.jsx`](../cortege-v2-prototype.jsx)) showing the companion dashboard concept (Sources: [CR-20260314-1320](requests.md#cr-20260314-1320))
- PRD addendum v2 defines the companion model philosophy and feature requirements (Sources: [CR-20260314-1320](requests.md#cr-20260314-1320))

## Immediate Goals (Hackathon)
- Scaffold a runnable Vite + React project around the existing prototype (Sources: [CR-20260314-1320](requests.md#cr-20260314-1320); [D-20260314-1320](decisions.md#d-20260314-1320)) — [spec](specs/20260314-hackathon-setup/spec.md)
- Push to GitHub at [taylorparsons/cortege-hackathon](https://github.com/taylorparsons/cortege-hackathon) (Sources: [CR-20260314-1320](requests.md#cr-20260314-1320))

## Skills Setup (Sources: [CR-20260314-1500](requests.md#cr-20260314-1500); [D-20260314-1500](decisions.md#d-20260314-1500))
- Project-local skills installed: `daisy`, `verification-before-completion`, `peas`, `skill-creator` (Sources: [CR-20260314-1500](requests.md#cr-20260314-1500); [D-20260314-1500](decisions.md#d-20260314-1500)) — [spec](specs/20260314-skill-setup/spec.md)
- All skills registered in [`CLAUDE.md`](../CLAUDE.md) with paths and triggers (Sources: [CR-20260314-1500](requests.md#cr-20260314-1500))

## Superpowers Skills Setup (Sources: [CR-20260314-1510](requests.md#cr-20260314-1510); [D-20260314-1510](decisions.md#d-20260314-1510))
- All 14 superpowers plugin skills copied to `.claude/skills/superpowers/` (Sources: [CR-20260314-1510](requests.md#cr-20260314-1510)) — [spec](specs/20260314-superpowers-setup/spec.md)
- [`.claude/settings.json`](../.claude/settings.json) enables plugin explicitly (Sources: [CR-20260314-1510](requests.md#cr-20260314-1510))
- [`CLAUDE.md`](../CLAUDE.md) updated with full skill registry (Sources: [CR-20260314-1510](requests.md#cr-20260314-1510))

## Agent Orchestration System (Sources: [CR-20260314-1600](requests.md#cr-20260314-1600); [D-20260314-1600](decisions.md#d-20260314-1600))
- Design spec completed and approved: [`2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md)
- Architecture: Event Bus + Agent Pool — Node.js orchestrator + Claude API-powered companion agents
- Agent templates defined as markdown files (YAML frontmatter + markdown body → Claude system prompt)
- Hackathon participants create new agent types by writing an `agent.md` file — no code required
- Agent factory pattern: scans `agents/` directory, parses templates, instantiates per household member
- Per-agent-instance JSON memory store for behavioral learning (4 maturity stages: Baseline → Pattern Recognition → Predictive → Cortege Mode)
- Event ingestion: simulator (default), manual injection API, Twilio voice webhook (plug in later)
- Orchestrator exposes REST + WebSocket API to React frontend
- Escalation handler routes agent decisions by threat level (L0-L4)
- Accelerated learning mode for hackathon demos via env var configuration

## Storage (Sources: [CR-20260315-1155](requests.md#cr-20260315-1155); [D-20260315-1155](decisions.md#d-20260315-1155))
- PoC: JSON files (`data/events/YYYY-MM-DD.jsonl`, `data/memories/<agent>-<member>.json`)
- Production: SQLite with JSON1 extension for reliability and query capabilities
- Rationale: JSON files match current design, human-readable for debugging, low event volume in demo

## Auditability (Sources: [CR-20260315-1202](requests.md#cr-20260315-1202); [D-20260315-1202](decisions.md#d-20260315-1202))
- Immutable event log with hash chain for tamper evidence
- SQLite with triggers enforces append-only
- Query capability for audit trails ("show all decisions for member X")
- Full replayability of events

## Architecture Decisions (Sources: [CR-20260315-1203](requests.md#cr-20260315-1203); [CR-20260315-1252](requests.md#cr-20260315-1252); [D-20260315-1203](decisions.md#d-20260315-1203); [D-20260315-1252](decisions.md#d-20260315-1252))
- MERN stack: Overkill — rejected for PoC
- Graph DB: Future enhancement for relationship queries (e.g., threat pattern analysis across members)
- Current design (Node.js + JSON/SQLite) is simpler, more auditable, and easier to demo

## Traceability
See [`TRACEABILITY.md`](TRACEABILITY.md) for how to follow the audit trail across docs.

| Document | Purpose |
|---|---|
| [`requests.md`](requests.md) | Raw customer requests (CR-*) |
| [`decisions.md`](decisions.md) | Design decisions with rationale (D-*) |
| [`progress.txt`](progress.txt) | Execution log of completed sessions |
| [`specs/`](specs/) | Feature specifications and task lists |

## Next / Backlog
- Create implementation plan from [agent orchestration design spec](superpowers/specs/2026-03-14-agent-orchestration-design.md) (invoke `superpowers:writing-plans`)
- Build the agent framework (server-side: orchestrator, event bus, agent factory, memory store, Claude integration)
- Build agent templates (ANCHOR, SCOUT, SENTINEL + starter template)
- Create demo scenarios for event simulator
- Wire React UI to backend via WebSocket for live agent status
- Plug in Twilio voice webhook when account is configured
- Decide final demo use case
