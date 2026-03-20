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

## Agent Orchestration Implementation (Sources: [CR-20260317-1400](requests.md#cr-20260317-1400); [D-20260317-1400](decisions.md#d-20260317-1400))
- Implementation spec created: [`.kiro/specs/agent-orchestration-implementation/requirements.md`](../.kiro/specs/agent-orchestration-implementation/requirements.md)
- Task breakdown: [`.kiro/specs/agent-orchestration-implementation/tasks.md`](../.kiro/specs/agent-orchestration-implementation/tasks.md)
- 48 functional requirements, 15 non-functional requirements, 10 edge cases
- 10 implementation phases: Foundation → Agent Instances → Claude Integration → Escalation → Ingestion → API → Scheduler → Templates → Frontend → Testing
- Estimated effort: 10-17 days (2-3.5 weeks)

## Cost Optimization (Sources: [CR-20260318-1000](requests.md#cr-20260318-1000); [D-20260318-1000](decisions.md#d-20260318-1000), [D-20260318-1100](decisions.md#d-20260318-1100), [D-20260318-1130](decisions.md#d-20260318-1130), [D-20260318-1200](decisions.md#d-20260318-1200))
- Slim response schema: remove event_id, agent, instance, stage_check from submit_assessment tool output
- Assessment constraint: "One sentence, max 30 words"
- Signal enum vocabulary: soft-guided codes per agent type (global + agent-specific)
- Server-side backfill of removed fields in agent-instance.js after parsing
- Prompt caching: split system prompt into static template (cached) + dynamic memory (uncached)
- CLAUDE_DEBUG env var for cache hit/miss and token count logging (Sources: [D-20260318-1100](decisions.md#d-20260318-1100))
- String coercion guards: Array.isArray on actions/signals in agent-instance.js and escalation-handler.js (Sources: [D-20260318-1130](decisions.md#d-20260318-1130))
- Template expansion: Worked Examples section pushes body past Haiku's 2048-token cache minimum (Sources: [D-20260318-1200](decisions.md#d-20260318-1200))
- Target: ~64% cost reduction per event with cache hits

## Working Demo with Twilio (Sources: [CR-20260318-1640](requests.md#cr-20260318-1640); [D-20260318-1640](decisions.md#d-20260318-1640))
- Working demo guide created: [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md)
- Spec created: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)
- Tasks created: [`specs/working-demo-with-twilio/tasks.md`](specs/working-demo-with-twilio/tasks.md)
- Goal: Working localhost demo with real Twilio integration showing actual use cases
- Four integration options documented: call forwarding (recommended), number porting, mobile app (future), carrier partnerships (long-term)
- Call forwarding setup instructions for T-Mobile, Verizon, AT&T
- Twilio account setup and webhook configuration for localhost testing
- UI focused on real working features only
- 19 functional requirements, 10 non-functional requirements, 8 edge cases
- 7 implementation phases, estimated 5 days

## API Documentation (Sources: [CR-20260318-1700](requests.md#cr-20260318-1700); [D-20260318-1700](decisions.md#d-20260318-1700))
- Comprehensive API documentation created: [`API.md`](API.md)
- Documents all REST endpoints with request/response examples
- Includes WebSocket message formats
- Documents error codes and future considerations (auth, rate limiting, CORS)
- Covers: household, companions, events, scenarios, agents, manual injection, Twilio webhooks

## Frontend API Integration — SHIPPED (Sources: [CR-20260319-1000](requests.md#cr-20260319-1000); [D-20260319-1000](decisions.md#d-20260319-1000))
- All hardcoded mock data removed from frontend — replaced with live API data
- Backend `getStatus()` extended with 8 new fields (agentRole, profileType, designation, lastAction, trustedContactCount, blockedContactCount, threatHistoryCount, createdAt)
- WebSocket updates wired to main Household tab (companion:status, agent:response, stage:transition)
- Display properties derived from agent type metadata via `src/lib/companion-display.js`
- Loading/empty/offline states handled gracefully — sparse data on day 1 is a feature, not a bug
- Custom hooks: `useCortegeData` (REST + WS), `useCompanionDetail` (detail panel)
- Evidence: `src/Cortege.jsx`, `src/hooks/useCortegeData.js`, `src/hooks/useCompanionDetail.js`, `src/lib/companion-display.js`, `server/agents/agent-instance.js`, `server/api/routes.js`
- Spec: [`specs/20260319-frontend-api-integration/spec.md`](specs/20260319-frontend-api-integration/spec.md) (Status: Done)
- Tasks: [`specs/20260319-frontend-api-integration/tasks.md`](specs/20260319-frontend-api-integration/tasks.md)

## Frontend Dev Connectivity — SHIPPED (Sources: [CR-20260319-1654](requests.md#cr-20260319-1654); [D-20260319-1654](decisions.md#d-20260319-1654))
- Follow-up fix to make the shipped frontend API integration work in localhost development through the Vite origin
- Replace hardcoded absolute frontend transport URLs with same-origin-relative paths
- Add Vite proxy support for `/api`, `/ws`, and `/ingest`
- Add a valid `npm run server` command so local startup instructions match the actual backend entrypoint
- Evidence: `src/lib/backend-url.js`, `src/hooks/useCortegeData.js`, `vite.config.js`, `package.json`, `run-local.sh`
- Spec: [`specs/20260319-frontend-dev-connectivity/spec.md`](specs/20260319-frontend-dev-connectivity/spec.md) (Status: Done)
- Tasks: [`specs/20260319-frontend-dev-connectivity/tasks.md`](specs/20260319-frontend-dev-connectivity/tasks.md)

## Git Hygiene (Sources: [CR-20260319-1707](requests.md#cr-20260319-1707))
- Ignore the specific local backup artifact `data/cortege.db.backup.1773876131352` in `.gitignore`
- Spec: [`specs/20260319-gitignore-backup-file/spec.md`](specs/20260319-gitignore-backup-file/spec.md)
- Tasks: [`specs/20260319-gitignore-backup-file/tasks.md`](specs/20260319-gitignore-backup-file/tasks.md)

## Branch Publication (Sources: [CR-20260319-1709](requests.md#cr-20260319-1709))
- Add a detailed shipped-change summary to `docs/progress.txt` for the recent frontend dev-connectivity and Git hygiene work
- Push the current `design` branch to `origin`
- Spec: [`specs/20260319-design-branch-push/spec.md`](specs/20260319-design-branch-push/spec.md)
- Tasks: [`specs/20260319-design-branch-push/tasks.md`](specs/20260319-design-branch-push/tasks.md)

## Multi-Household Management — SHIPPED (Sources: [CR-20260319-1730](requests.md#cr-20260319-1730); [D-20260319-1730](decisions.md#d-20260319-1730))
- HouseholdStore for managing multiple households as JSON files in data/households/
- REST API: CRUD for households (POST/GET/PUT/DELETE /api/households) and members (/api/households/:id/members)
- Backward-compatible GET /api/household endpoint (household store → legacy household.json → default)
- Frontend: HouseholdSelector component, HouseholdContext with localStorage, useCortegeData household switching
- Migration script: scripts/migrate-household.js (converts legacy household.json, creates backup)
- 20 new tests (8 store + 8 API + 4 integration), all passing
- Evidence: server/storage/household-store.js, server/api/routes.js, src/components/HouseholdSelector.jsx, src/context/HouseholdContext.jsx, src/hooks/useHouseholds.js, scripts/migrate-household.js
- Spec: [specs/20260319-add-household-feature/spec.md](specs/20260319-add-household-feature/spec.md) (Status: Done)
- Tasks: [specs/20260319-add-household-feature/tasks.md](specs/20260319-add-household-feature/tasks.md)

## Next / Backlog
- Execute working demo tasks from [working demo spec](specs/working-demo-with-twilio/tasks.md)
- Wire Twilio webhook to event bus (Phase 3)
- Implement Twilio signature validation (Phase 3)
- Test with live Twilio account and real phone calls on localhost (Phase 6)
- Update UI to show only working features with real use cases

## Agent Orchestration Implementation (Sources: [CR-20260317-1400](requests.md#cr-20260317-1400))
- Implementation spec created: [`.kiro/specs/agent-orchestration-implementation/requirements.md`](../.kiro/specs/agent-orchestration-implementation/requirements.md)
- Derived from design documents: [`2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md), [`2026-03-14-agent-orchestration-diagrams.md`](superpowers/specs/2026-03-14-agent-orchestration-diagrams.md)
- 48 functional requirements covering: agent templates, event bus, Claude integration, memory store, escalation, ingestion, API, household config, accelerated learning, scheduler
- 15 non-functional requirements covering: performance, reliability, auditability, extensibility, security
- 10 edge cases documented
- 10 implementation phases with 100+ tasks
- Estimated effort: 10-17 days (2-3.5 weeks)
- Success criteria: All requirements verified, demo scenario runs successfully, hackathon participants can create new agents via markdown files
- **Status**: All 10 phases complete, 110/110 tests passing, demo running successfully



## SQLite Storage with Auditability (Sources: [CR-20260318-1800](requests.md#cr-20260318-1800); [D-20260318-1800](decisions.md#d-20260318-1800))
- Spec created: [`specs/20260318-sqlite-auditability/spec.md`](specs/20260318-sqlite-auditability/spec.md)
- Tasks created: [`specs/20260318-sqlite-auditability/tasks.md`](specs/20260318-sqlite-auditability/tasks.md)
- Goal: Implement production-ready SQLite storage with tamper-evident audit trail
- Migrate from mutable JSON files to SQLite with append-only event log, hash chain for tamper evidence, and atomic memory snapshots
- 19 functional requirements covering: event log schema, hash chain, query capabilities, memory snapshots, migration strategy, event replay
- 10 non-functional requirements covering: performance, reliability, security, observability
- 8 edge cases documented
- 8 implementation phases, estimated 7.5 days (1.5 weeks)
- Migration strategy: dual-write mode → verify → cutover → deprecate JSON files
- Backward compatibility maintained during migration
