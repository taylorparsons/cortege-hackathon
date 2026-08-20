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

## Working Demo with Twilio (Sources: [CR-20260318-1640](requests.md#cr-20260318-1640); [D-20260318-1640](decisions.md#d-20260318-1640); [CR-20260320-1550](requests.md#cr-20260320-1550); [D-20260320-1550](decisions.md#d-20260320-1550); [CR-20260320-1559](requests.md#cr-20260320-1559); [D-20260320-1559](decisions.md#d-20260320-1559); [CR-20260320-1607](requests.md#cr-20260320-1607); [D-20260320-1607](decisions.md#d-20260320-1607); [CR-20260320-1619](requests.md#cr-20260320-1619); [D-20260320-1619](decisions.md#d-20260320-1619); [CR-20260320-1646](requests.md#cr-20260320-1646); [D-20260320-1646](decisions.md#d-20260320-1646); [CR-20260320-1655](requests.md#cr-20260320-1655); [D-20260320-1655](decisions.md#d-20260320-1655))
- Working demo guide created: [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md)
- Spec created: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)
- Tasks created: [`specs/working-demo-with-twilio/tasks.md`](specs/working-demo-with-twilio/tasks.md)
- Goal: Working localhost demo with real Twilio integration using one Twilio number per household
- Routing model: Twilio `To` number resolves `household_id` before member-level routing
- Deployment guide now targets ngrok-based localhost testing plus the household store model, not legacy `household.json`
- Twilio docs require redacted phone logging and preserved signature validation guidance
- Deployment guide includes Mermaid sequence diagrams for the allowed-call and blocked-call outcomes
- Deployment guide now separates Twilio platform, CORTEGE webhook, CORTEGE agent pipeline, and LLM lanes in those diagrams
- Current runtime slice: add unique household `twilio_number` support and make `POST /ingest/twilio/voice` resolve `household_id` from `To` before `eventBus.emit()`
- Next runtime slice: make `/api/events` show storage-backed live Twilio calls and target each inbound household call to one member (primary member when configured, otherwise first household member)
- Household setup for the live demo now requires two numbers: `twilio_number` for ingress and `pass_through_number` for the real number that should ring when a call is allowed
- The existing household editor modal SHALL expose both routing numbers and primary-member selection so live Twilio setup can be done without curl
- UI should stay focused on real working household-scoped features only
- Spec and task list updated around the household-number model

## Household Fraud Case Demo (Sources: [CR-20260320-1720](requests.md#cr-20260320-1720); [D-20260320-1720](decisions.md#d-20260320-1720))
- The judge demo SHALL pivot from Twilio-only call routing to a household-scoped fraud case built from one real call plus one manual evidence item
- Twilio ingress SHALL remain the proof of real-world input, but the headline outcome SHALL be a linked fraud case with severity, signals, rationale, and recommendation
- Supported manual evidence inputs for the first pass SHALL be text-first: `message_excerpt`, `suspicious_url`, and `screenshot_note`
- The demo SHALL use conservative, explainable risk heuristics and SHALL NOT claim definitive AI-generated-media detection
- The Live Feed tab SHALL provide the narrowest usable operator flow: select a recent household call, attach one evidence item, and render the created case
- Spec: [specs/20260320-household-fraud-case-demo/spec.md](specs/20260320-household-fraud-case-demo/spec.md)
- Tasks: [specs/20260320-household-fraud-case-demo/tasks.md](specs/20260320-household-fraud-case-demo/tasks.md)

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

## Privacy-First Household Data (Sources: [CR-20260320-1147](requests.md#cr-20260320-1147); [D-20260320-1147](decisions.md#d-20260320-1147); [CR-20260320-1203](requests.md#cr-20260320-1203); [D-20260320-1203](decisions.md#d-20260320-1203))
- Household records SHALL reference locations by `location_id` instead of using `location` as the primary location model
- Location records SHALL store encrypted location name and encrypted structured address
- The API SHALL support full location CRUD, including guarded delete semantics for referenced locations
- Member records SHALL store encrypted full name, encrypted phone, and encrypted date of birth at rest
- Deterministic phone tokens SHALL support equality lookup without persisting plaintext phone values
- External LLM calls SHALL use sanitized event and memory payloads with aliases instead of raw PII
- Server logs and error messages SHALL redact or tokenize PII so cleartext phone, address, date of birth, and full name are not emitted
- Trusted household/location/member read paths MAY return decrypted values to the UI, but persistence, logs, and external calls SHALL use protected forms
- The UI SHALL provide location list, edit, and guarded delete flows, and SHALL support household reassignment before location deletion
- Spec: [specs/20260320-pii-encryption-location-model/spec.md](specs/20260320-pii-encryption-location-model/spec.md)
- Tasks: [specs/20260320-pii-encryption-location-model/tasks.md](specs/20260320-pii-encryption-location-model/tasks.md)

## Documentation Alignment — SHIPPED (Sources: [CR-20260320-1315](requests.md#cr-20260320-1315); [D-20260320-1315](decisions.md#d-20260320-1315))
- `README.md` SHALL describe the shipped `location_id` + saved-location workflow, including location CRUD and household reassignment
- `README.md` SHALL document the privacy model at a high level, including encrypted PII at rest and the `PII_MASTER_KEY` environment variable
- The top-level project structure and API overview in `README.md` SHALL reflect the current repo layout and shipped endpoints
- Evidence: `README.md`, `.env.example`
- Spec: [specs/20260320-readme-alignment/spec.md](specs/20260320-readme-alignment/spec.md)
- Tasks: [specs/20260320-readme-alignment/tasks.md](specs/20260320-readme-alignment/tasks.md)

## Main Branch Publication — SHIPPED (Sources: [CR-20260320-1345](requests.md#cr-20260320-1345); [D-20260320-1345](decisions.md#d-20260320-1345))
- The verified privacy/location feature branch and README-alignment follow-up SHALL be committed and merged into local `main`
- The merged `main` branch SHALL be pushed to `origin/main`
- Evidence: `README.md`, `.env.example`, `docs/progress.txt`
- Spec: [specs/20260320-main-branch-push/spec.md](specs/20260320-main-branch-push/spec.md)
- Tasks: [specs/20260320-main-branch-push/tasks.md](specs/20260320-main-branch-push/tasks.md)

## Release v0.3.0 — SHIPPED (Sources: [CR-20260320-1415](requests.md#cr-20260320-1415); [D-20260320-1415](decisions.md#d-20260320-1415))
- `RELEASE-0.3.0.md` SHALL describe the full shipped delta from `v0.2.0` to current `main`
- The `v0.3.0` tag SHALL point to the corrected release commit on `main`
- The GitHub Releases page SHALL publish a `v0.3.0` release with the updated text
- Evidence: `RELEASE-0.3.0.md`
- Spec: [specs/20260320-release-v030/spec.md](specs/20260320-release-v030/spec.md)
- Tasks: [specs/20260320-release-v030/tasks.md](specs/20260320-release-v030/tasks.md)

## API Docs Alignment — SHIPPED (Sources: [CR-20260320-1435](requests.md#cr-20260320-1435); [D-20260320-1435](decisions.md#d-20260320-1435))
- `docs/API.md` SHALL reflect the current household, location, member, and companion-status API behavior
- The served `/api/docs` page SHALL expose the updated markdown from `docs/API.md`
- Evidence: `docs/API.md`, `server/api/routes.js`
- Spec: [specs/20260320-api-docs-alignment/spec.md](specs/20260320-api-docs-alignment/spec.md)
- Tasks: [specs/20260320-api-docs-alignment/tasks.md](specs/20260320-api-docs-alignment/tasks.md)

## Household Editing UI (Sources: [CR-20260320-1450](requests.md#cr-20260320-1450); [D-20260320-1450](decisions.md#d-20260320-1450))
- The household selector modal SHALL include an explicit selected-household editor so users can see and update the current household name without leaving the existing flow
- The selected-household editor SHALL group household details, location reassignment, and member CRUD into one visible management surface
- Household edit verification SHALL be covered by an end-to-end UI test that exercises renaming the selected household from the modal
- Evidence: `src/components/HouseholdSelector.jsx`, `src/context/HouseholdContext.jsx`, `src/hooks/useCortegeData.js`, `src/hooks/useHouseholds.js`, `cypress/support/commands.js`, `cypress/e2e/household-crud.cy.js`
- Spec: [specs/20260320-household-editor-ui/spec.md](specs/20260320-household-editor-ui/spec.md)
- Tasks: [specs/20260320-household-editor-ui/tasks.md](specs/20260320-household-editor-ui/tasks.md)

## Member Phone Input UX (Sources: [CR-20260320-1504](requests.md#cr-20260320-1504); [D-20260320-1504](decisions.md#d-20260320-1504))
- The member add/edit UI SHALL normalize common US phone input formats into E.164 before calling the household member API
- Member add/edit failures SHALL show inline form errors in the modal instead of failing only in the browser console
- Member add verification SHALL include an end-to-end UI test using a non-E.164 typed phone input that is normalized client-side
- Evidence: `src/components/MemberManager.jsx`, `cypress/e2e/member-crud.cy.js`
- Spec: [specs/20260320-member-phone-input/spec.md](specs/20260320-member-phone-input/spec.md)
- Tasks: [specs/20260320-member-phone-input/tasks.md](specs/20260320-member-phone-input/tasks.md)

## Active Household Companions (Sources: [CR-20260320-1525](requests.md#cr-20260320-1525); [D-20260320-1525](decisions.md#d-20260320-1525))
- The Household tab SHALL show companion cards and counts for the currently selected household, not for a stale startup household
- Companion snapshot fetches SHALL activate the requested household on the backend before returning live agent instances
- Household-switch verification SHALL include an end-to-end UI test that selects a two-member household and confirms the displayed companion names and count match it
- Evidence: `server/orchestrator/orchestrator.js`, `server/api/routes.js`, `src/Cortege.jsx`, `src/hooks/useCortegeData.js`, `src/hooks/useCompanionDetail.js`, `cypress/e2e/companion-cards.cy.js`
- Spec: [specs/20260320-active-household-companions/spec.md](specs/20260320-active-household-companions/spec.md)
- Tasks: [specs/20260320-active-household-companions/tasks.md](specs/20260320-active-household-companions/tasks.md)

## Cypress Test Artifacts (Sources: [CR-20260320-1545](requests.md#cr-20260320-1545); [D-20260320-1545](decisions.md#d-20260320-1545); [CR-20260320-1555](requests.md#cr-20260320-1555); [D-20260320-1555](decisions.md#d-20260320-1555))
- Cypress runs SHALL record videos by default for author review
- Cypress runs SHALL capture screenshots on failure and SHALL also save screenshots for successful executed tests
- Verification SHALL rerun the current household/member demo E2E specs and confirm Cypress video and screenshot artifacts were written
- Evidence: `cypress.config.js`, `cypress/support/e2e.js`, `cypress/videos/`, `cypress/screenshots/`
- Spec: [specs/20260320-cypress-artifacts/spec.md](specs/20260320-cypress-artifacts/spec.md)
- Tasks: [specs/20260320-cypress-artifacts/tasks.md](specs/20260320-cypress-artifacts/tasks.md)

## README Localhost Validation Artifacts (Sources: [CR-20260320-1459](requests.md#cr-20260320-1459); [D-20260320-1459](decisions.md#d-20260320-1459))
- `README.md` SHALL document the localhost Cypress validation command used for the household/member demo review
- `README.md` SHALL link to representative screenshot and video artifacts generated by that localhost Cypress run
- The current uncommitted changes SHALL be checked in locally after the README evidence section is updated
- Evidence: `README.md`, `cypress/screenshots/`, `cypress/videos/`
- Spec: [specs/20260320-readme-localhost-artifacts/spec.md](specs/20260320-readme-localhost-artifacts/spec.md)
- Tasks: [specs/20260320-readme-localhost-artifacts/tasks.md](specs/20260320-readme-localhost-artifacts/tasks.md)

## Live Feed Household Data (Sources: [CR-20260320-1515](requests.md#cr-20260320-1515); [D-20260320-1515](decisions.md#d-20260320-1515))
- The Live Feed event injector SHALL derive target members from the currently selected household instead of a hard-coded default member list
- Companion activity queries SHALL exclude events that predate the selected companion’s creation time
- Verification SHALL cover the dynamic event-injector member list and the empty initial activity state for a newly created companion
- Evidence: `src/components/EventInjector.jsx`, `src/Cortege.jsx`, `server/api/routes.js`, `cypress/e2e/live-feed.cy.js`, `server/tests/companion-activity.test.js`
- Spec: [specs/20260320-live-feed-household-data/spec.md](specs/20260320-live-feed-household-data/spec.md)
- Tasks: [specs/20260320-live-feed-household-data/tasks.md](specs/20260320-live-feed-household-data/tasks.md)

## Live Feed Patch Release (Sources: [CR-20260320-1719](requests.md#cr-20260320-1719); [D-20260320-1719](decisions.md#d-20260320-1719))
- `README.md` SHALL describe the live-feed target-member fix and the stable companion identity behavior that prevents same-name members from inheriting old activity
- The current live-feed bugfix changes SHALL be checked in locally after verification
- A new `v0.3.1` patch release SHALL be published from the verified `main` branch
- Evidence: `README.md`, `RELEASE-0.3.1.md`, `package.json`, `docs/progress.txt`
- Spec: [specs/20260320-live-feed-patch-release/spec.md](specs/20260320-live-feed-patch-release/spec.md)
- Tasks: [specs/20260320-live-feed-patch-release/tasks.md](specs/20260320-live-feed-patch-release/tasks.md)

## Twilio Docs Publication (Sources: [CR-20260320-1612](requests.md#cr-20260320-1612); [D-20260320-1612](decisions.md#d-20260320-1612))
- The current Twilio documentation rewrite and clarified sequence diagrams SHALL be committed on `main` as a docs-only update
- The docs update SHALL be pushed to `origin/main`
- Evidence: `docs/PRODUCTION_DEPLOYMENT.md`, `docs/specs/working-demo-with-twilio/spec.md`, `docs/specs/working-demo-with-twilio/tasks.md`, `docs/progress.txt`
- Spec: [specs/20260320-twilio-docs-publication/spec.md](specs/20260320-twilio-docs-publication/spec.md)
- Tasks: [specs/20260320-twilio-docs-publication/tasks.md](specs/20260320-twilio-docs-publication/tasks.md)

## Playwright E2E Tests — SHIPPED (Sources: [CR-20260320-1000](requests.md#cr-20260320-1000), [CR-20260320-1100](requests.md#cr-20260320-1100))
- @playwright/test@1.58.2 installed; `test:e2e:pw` script added to package.json
- playwright.config.js: webServer auto-starts backend (3001) and frontend (5173), workers: 1 to serialize
- 5 test files with 16 tests: navigation (3), household-crud (4), member-crud (4), companion-cards (3), live-feed (2)
- e2e/helpers.js: createTestHousehold, deleteTestHousehold, addTestMember, cleanupTestHouseholds
- Each test uses beforeEach cleanup; test data prefixed with "E2E Test" for isolation
- All 16 tests passing: `npx playwright test` → 16 passed (8.8s)
- Spec: [specs/20260320-playwright-e2e/spec.md](specs/20260320-playwright-e2e/spec.md) (Status: Done)
- Tasks: [specs/20260320-playwright-e2e/tasks.md](specs/20260320-playwright-e2e/tasks.md)
- Evidence: e2e/*.spec.js, e2e/helpers.js, playwright.config.js

## Cypress E2E Tests — SHIPPED (Sources: [CR-20260320-1000](requests.md#cr-20260320-1000); [D-20260320-1000](decisions.md#d-20260320-1000))
- Cypress installed as dev dependency; `test:e2e:cy` and `test:e2e:cy:open` scripts added to package.json
- 5 test files with 16 tests total covering navigation, household CRUD, member CRUD, companion cards, and live feed
- Custom commands: createHousehold, deleteHousehold, addMember, cleanupTestHouseholds, openHouseholdSelector
- Tests create their own data via API in beforeEach and clean up with cleanupTestHouseholds prefix filter
- Companion-cards tests resilient to empty backend state (no agents running in CI)
- Spec: [specs/20260320-cypress-e2e/spec.md](specs/20260320-cypress-e2e/spec.md) (Status: Done)
- Tasks: [specs/20260320-cypress-e2e/tasks.md](specs/20260320-cypress-e2e/tasks.md)
- Evidence: cypress/e2e/*.cy.js, cypress/support/commands.js, cypress.config.js

## Next / Backlog
- Execute working demo tasks from [working demo spec](specs/working-demo-with-twilio/tasks.md)
- Add `twilio_number` to the household model and validate uniqueness
- Wire Twilio webhook to event bus with `To -> household_id` routing
- Implement Twilio signature validation
- Test with live Twilio account and real phone calls on localhost through ngrok
- Update UI to show only working features with real household-scoped use cases

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

## PowerPoint Deck Export (Sources: [CR-20260321-0801](requests.md#cr-20260321-0801); [CR-20260321-0836](requests.md#cr-20260321-0836); [D-20260321-0801](decisions.md#d-20260321-0801); [D-20260321-0836](decisions.md#d-20260321-0836))
- The repo SHALL include a reproducible Python workflow that generates [`cortege-AI-Agents-Week-long-Hack.pptx`](../cortege-AI-Agents-Week-long-Hack.pptx) from [`deck.html`](../deck.html) using `python-pptx`. (Sources: [CR-20260321-0801](requests.md#cr-20260321-0801); [CR-20260321-0836](requests.md#cr-20260321-0836); [D-20260321-0801](decisions.md#d-20260321-0801); [D-20260321-0836](decisions.md#d-20260321-0836))
- The generated PowerPoint SHALL contain 8 slides whose copy matches the current reveal.js source content in [`deck.html`](../deck.html). (Sources: [CR-20260321-0801](requests.md#cr-20260321-0801); [D-20260321-0801](decisions.md#d-20260321-0801))
- The generated PowerPoint SHALL match the existing visual system closely using native slide background, typography targets, accent colors, cards, badges, and diagram shapes, with font fallback when the requested fonts are unavailable. (Sources: [CR-20260321-0801](requests.md#cr-20260321-0801); [D-20260321-0801](decisions.md#d-20260321-0801))
- The live-product slide SHALL embed the three existing Cypress screenshots already referenced by the reveal.js presentation. (Sources: [CR-20260321-0801](requests.md#cr-20260321-0801))
- Verification SHALL run non-destructive checks that confirm the canonical `.pptx` artifact path, script targets, and representative deck contents remain aligned. (Sources: [CR-20260321-0801](requests.md#cr-20260321-0801); [CR-20260321-0836](requests.md#cr-20260321-0836); [D-20260321-0801](decisions.md#d-20260321-0801); [D-20260321-0836](decisions.md#d-20260321-0836))

## Global Codex PPTX Skill (Sources: [CR-20260321-0815](requests.md#cr-20260321-0815); [D-20260321-0815](decisions.md#d-20260321-0815))
- A reusable global Codex skill SHALL be installed at `~/.codex/skills/pptx-presentation-builder/SKILL.md` for future PowerPoint-generation work. (Sources: [CR-20260321-0815](requests.md#cr-20260321-0815); [D-20260321-0815](decisions.md#d-20260321-0815))
- The skill SHALL guide editable-first PPTX generation with `python-pptx`, including source-of-truth reading, design-token extraction, native slide construction, asset embedding, and verification. (Sources: [CR-20260321-0815](requests.md#cr-20260321-0815); [D-20260321-0815](decisions.md#d-20260321-0815))
- Verification SHALL confirm the installed skill file exists in the global Codex skill directory after creation. (Sources: [CR-20260321-0815](requests.md#cr-20260321-0815); [D-20260321-0815](decisions.md#d-20260321-0815))
- The global skill SHALL include reusable helper scripts for PPTX scaffolding and artifact inspection under its own `scripts/` directory. (Sources: [CR-20260321-0820](requests.md#cr-20260321-0820); [D-20260321-0820](decisions.md#d-20260321-0820))

## Repository Licensing (Sources: [CR-20260321-0826](requests.md#cr-20260321-0826); [D-20260321-0826](decisions.md#d-20260321-0826))
- The repository SHALL include a top-level `LICENSE` file stating that the project is proprietary, not open source, and all rights are reserved. (Sources: [CR-20260321-0826](requests.md#cr-20260321-0826); [D-20260321-0826](decisions.md#d-20260321-0826))
- `package.json` SHALL declare `"license": "UNLICENSED"` to keep package metadata aligned with the proprietary repository status. (Sources: [CR-20260321-0826](requests.md#cr-20260321-0826); [D-20260321-0826](decisions.md#d-20260321-0826))
- `README.md` SHALL explicitly state that the project is not open source and that all rights are reserved. (Sources: [CR-20260321-0826](requests.md#cr-20260321-0826); [D-20260321-0826](decisions.md#d-20260321-0826))

## Main Publication (Sources: [CR-20260321-0831](requests.md#cr-20260321-0831); [D-20260321-0831](decisions.md#d-20260321-0831))
- The current March 21 repo-scoped work SHALL be committed locally on `main` before publication. (Sources: [CR-20260321-0831](requests.md#cr-20260321-0831); [D-20260321-0831](decisions.md#d-20260321-0831))
- `origin/main` SHALL be updated by pushing the resulting local `main` commit. (Sources: [CR-20260321-0831](requests.md#cr-20260321-0831); [D-20260321-0831](decisions.md#d-20260321-0831))
- Publication SHALL include the repo-targeted `deck.pptx` artifact and exclude the duplicate renamed PPTX and Office lock artifact from source control. (Sources: [CR-20260321-0831](requests.md#cr-20260321-0831); [D-20260321-0831](decisions.md#d-20260321-0831))

## WARDEN Agent — Data Broker Removal (Sources: CR-20260323-1000; D-20260323-1000)
- WARDEN is a proactive data broker removal subsystem (`server/warden/`) that scans commercial data broker sites for household member PII and submits opt-out requests via headless browser. (Sources: CR-20260323-1000; D-20260323-1000) — [spec](specs/20260323-warden-agent/spec.md)
- Ten initial broker definitions stored as declarative JSON; adding a broker requires only a JSON file. (Sources: CR-20260323-1000; D-20260323-1000)
- CAPTCHA detection fires L3 escalation + `warden:captcha_required` WebSocket event with screenshot + direct URL; member clicks "Mark as Resolved" to resume. (Sources: CR-20260323-1000; D-20260323-1000)
- Social graph discovery: associated people extracted from broker listings, surfaced as suggested household members (read-only — member explicitly adds). (Sources: CR-20260323-1000; D-20260323-1000)
- Hardcoded "Data Broker Status" UI card replaced with live `<BrokerStatus>` component. (Sources: CR-20260323-1000; D-20260323-1000)
- Scheduled re-monitoring via WARDEN-managed `node-cron` (real-world time, daily 3 AM default). (Sources: CR-20260323-1000; D-20260323-1000)

## WARDEN Mobile App — Shipaton Spinoff (Sources: [CR-20260819-1922](requests.md#cr-20260819-1922); [D-20260819-1922](decisions.md#d-20260819-1922); [CR-20260819-1924](requests.md#cr-20260819-1924))
- A standalone Expo/React Native mobile app SHALL expose WARDEN's data-broker-scan engine directly to consumers, extending the existing CORTEGE Node server rather than extracting or rebuilding it. (Sources: [CR-20260819-1922](requests.md#cr-20260819-1922); [D-20260819-1922](decisions.md#d-20260819-1922)) — [spec](specs/20260819-warden-mobile-app/spec.md)
- The free tier SHALL provide one-time broker-exposure scan results; a paid subscription SHALL unlock continuous re-scan/monitoring. Automated removal filing and a family plan tier are explicitly deferred past v1. (Sources: [CR-20260819-1922](requests.md#cr-20260819-1922); [D-20260819-1922](decisions.md#d-20260819-1922))
- Sign-in SHALL be Apple/Google only; no email/password or magic-link path SHALL exist in v1. (Sources: [CR-20260819-1924](requests.md#cr-20260819-1924); [D-20260819-1922](decisions.md#d-20260819-1922))
- Subscriptions SHALL be managed via a single RevenueCat entitlement ("Monitoring") with monthly and annual packages. (Sources: [CR-20260819-1924](requests.md#cr-20260819-1924); [D-20260819-1922](decisions.md#d-20260819-1922))
- On-device/local-model inference SHALL be scoped to exposure summarization only (platform-native APIs with a template-string fallback); WARDEN's broker-scan crawling SHALL remain server-side, and no bundled cross-platform LLM SHALL ship in the app binary. (Sources: [CR-20260819-1924](requests.md#cr-20260819-1924); [D-20260819-1922](decisions.md#d-20260819-1922))
- **Status**: Design captured via superpowers:brainstorming (architectural path) + ai-pm-agent-level4; full design not yet given final user sign-off. Current deliverable in progress: pitch document.
