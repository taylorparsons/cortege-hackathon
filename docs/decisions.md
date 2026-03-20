# Decisions (append-only)

## D-20260314-1320
Date: 2026-03-14 13:20
Inputs: [CR-20260314-1320](requests.md#cr-20260314-1320)
PRD: [Project Setup](PRD.md#immediate-goals-hackathon)
Spec: [`specs/20260314-hackathon-setup/spec.md`](specs/20260314-hackathon-setup/spec.md)

Decision:
Scaffold as a Vite + React project since the existing prototype is a JSX React component. Add a .gitignore for Node.js projects.

Rationale:
The existing [`cortege-v2-prototype.jsx`](../cortege-v2-prototype.jsx) imports React hooks and exports a default component — it's designed for a React build pipeline. Vite is the fastest way to get a working dev environment for a hackathon.

Alternatives considered:
- Next.js (rejected because the prototype is a single-page SPA with no routing or SSR needs)
- Create React App (rejected — deprecated)

Acceptance / test:
- `npm run dev` starts a dev server that renders the CORTEGE prototype

## D-20260314-1500
Date: 2026-03-14 15:00
Inputs: [CR-20260314-1500](requests.md#cr-20260314-1500)
PRD: [Skills Setup](PRD.md#skills-setup-sources-cr-20260314-1500-d-20260314-1500)
Spec: [`specs/20260314-skill-setup/spec.md`](specs/20260314-skill-setup/spec.md)

Decision:
Install daisy, verification-before-completion, peas, and skill-creator from global skills into the project. Exclude career-graph-resume-writer, squarespace-brine-7 (irrelevant domains), create-plan (global-only sufficient), and taylor-style-voice (global-only sufficient).

Rationale:
- daisy: UI work will be central to this hackathon; Tailwind/DaisyUI is the likely styling path
- verification-before-completion: always applicable — prevents false "done" claims
- peas: CORTEGE is an AI companion agent product; PEAS framework directly supports specifying agent task environments
- skill-creator: hackathon pace means we may need to build project-specific skills quickly
- Copy (not symlink) so project is self-contained and portable

Alternatives considered:
- Symlink to global skills (rejected because symlinks break on other machines/CI)
- Include all global skills (rejected — keeps [`CLAUDE.md`](../CLAUDE.md) clean and relevant)

Acceptance / test:
- Each skill's SKILL.md readable from `.claude/skills/<skill>/SKILL.md`
- [`CLAUDE.md`](../CLAUDE.md) lists all four skills with correct paths and triggers

## D-20260314-1510
Date: 2026-03-14 15:10
Inputs: [CR-20260314-1510](requests.md#cr-20260314-1510)
PRD: [Skills Setup — Superpowers](PRD.md#superpowers-skills-setup-sources-cr-20260314-1510-d-20260314-1510)
Spec: [`specs/20260314-superpowers-setup/spec.md`](specs/20260314-superpowers-setup/spec.md)

Decision:
Copy all 14 non-deprecated superpowers skills from the plugin cache (v5.0.2) into `.claude/skills/superpowers/<name>/`. Also create a project-level [`settings.json`](../.claude/settings.json) enabling the superpowers plugin explicitly. Skip deprecated aliases (execute-plan, brainstorm, write-plan).

Rationale:
- Makes the project self-contained — skills work without depending on global plugin state
- [`settings.json`](../.claude/settings.json) ensures the plugin is active even if a collaborator's global config differs
- Copying from the current cached version (5.0.2) pins a known-good snapshot for the hackathon

Alternatives considered:
- Symlink to plugin cache (rejected — paths are machine-specific)
- Rely only on global plugin enablement (rejected — not portable, no local audit trail)

Acceptance / test:
- All 14 `superpowers/*/SKILL.md` files present in `.claude/skills/superpowers/`
- [`.claude/settings.json`](../.claude/settings.json) has `enabledPlugins.superpowers@claude-plugins-official = true`
- [`CLAUDE.md`](../CLAUDE.md) lists all skills with triggers

## D-20260314-1600
Date: 2026-03-14 16:00
Inputs: [CR-20260314-1600](requests.md#cr-20260314-1600)
PRD: [Agent Orchestration System](PRD.md#agent-orchestration-system-sources-cr-20260314-1600-d-20260314-1600)
Design spec: [`superpowers/specs/2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md)

Decision:
Event Bus + Agent Pool architecture with Node.js orchestrator and Claude API-powered companion agents. Agents defined as markdown templates (YAML frontmatter for config + markdown body for Claude system prompt). Agent factory pattern for hackathon extensibility.

Rationale:
- Event Bus + Agent Pool is the simplest architecture that demonstrates real patterns without production-scale complexity (vs. Actor Model or Pipeline alternatives)
- Hybrid runtime (Node.js plumbing + Claude intelligence) matches the product vision where companions are genuinely intelligent, not rule-based
- Markdown templates chosen over config-only or code-based approaches because hackathon participants are comfortable with structured markdown, it's self-documenting, and it mirrors the existing skills pattern
- Agent factory pattern (vs. self-generating agents) is buildable and demoable at a hackathon while establishing the extensibility story
- One fully working agent for PoC (vs. all three) tells a better demo story and proves the factory pattern works

Alternatives considered:
- Actor Model / agent-per-process (rejected — overkill for PoC, IPC debugging too complex for hackathon pace)
- Pipeline Architecture (rejected — too rigid for household coordination which is graph-shaped, not linear)
- Self-generating agents (rejected — unreliable for hackathon, factory pattern proves extensibility without the risk)
- Config-only agent definition (rejected — less expressive than markdown for defining agent personality and reasoning)
- Code-based agent definition (rejected — too high barrier for hackathon participants)

Acceptance / test:
- [Design spec](superpowers/specs/2026-03-14-agent-orchestration-design.md) passes automated review (3 passes)
- Spec covers: template format, architecture, learning system, event model, API contracts, household config, accelerated learning, model config, validation, error handling
- Architecture supports any use case via swappable agent templates and scenario files
## D-20260314-1600
Date: 2026-03-14 16:00
Inputs: [CR-20260314-1600](requests.md#cr-20260314-1600)
PRD: [Agent Orchestration System](PRD.md#agent-orchestration-system-sources-cr-20260314-1600-d-20260314-1600)
Design spec: [`superpowers/specs/2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md)

Decision:
Event Bus + Agent Pool architecture with Node.js orchestrator and Claude API-powered companion agents. Agents defined as markdown templates (YAML frontmatter for config + markdown body for Claude system prompt). Agent factory pattern for hackathon extensibility.

Rationale:
- Event Bus + Agent Pool is the simplest architecture that demonstrates real patterns without production-scale complexity (vs. Actor Model or Pipeline alternatives)
- Hybrid runtime (Node.js plumbing + Claude intelligence) matches the product vision where companions are genuinely intelligent, not rule-based
- Markdown templates chosen over config-only or code-based approaches because hackathon participants are comfortable with structured markdown, it's self-documenting, and it mirrors the existing skills pattern
- Agent factory pattern (vs. self-generating agents) is buildable and demoable at a hackathon while establishing the extensibility story
- One fully working agent for PoC (vs. all three) tells a better demo story and proves the factory pattern works

Alternatives considered:
- Actor Model / agent-per-process (rejected — overkill for PoC, IPC debugging too complex for hackathon pace)
- Pipeline Architecture (rejected — too rigid for household coordination which is graph-shaped, not linear)
- Self-generating agents (rejected — unreliable for hackathon, factory pattern proves extensibility without the risk)
- Config-only agent definition (rejected — less expressive than markdown for defining agent personality and reasoning)
- Code-based agent definition (rejected — too high barrier for hackathon participants)

Acceptance / test:
- [Design spec](superpowers/specs/2026-03-14-agent-orchestration-design.md) passes automated review (3 passes)
- Spec covers: template format, architecture, learning system, event model, API contracts, household config, accelerated learning, model config, validation, error handling

## D-20260315-1155
Date: 2026-03-15 11:55
Inputs: [CR-20260315-1155](requests.md#cr-20260315-1155)
PRD: [Agent Orchestration System — Storage](PRD.md#agent-orchestration-system)

Decision:
Keep JSON files for the hackathon PoC — the design is already built around them, they're human-readable for debugging, and the event volume will be low during demos. For production, consider SQLite with JSON1 for better reliability and query capabilities.

Rationale:
- JSON files match the current design (data/events/*.jsonl, data/memories/*.json)
- Simple, human-readable, easy to debug during hackathon
- Event volume in demo is low; no performance bottleneck
- SQLite adds complexity that's unnecessary for PoC

Acceptance / test:
- Design spec updated to reflect JSON file storage choice

## D-20260315-1202
Date: 2026-03-15 12:02
Inputs: [CR-20260315-1202](requests.md#cr-20260315-1202)
PRD: [Agent Orchestration System — Auditability](PRD.md#agent-orchestration-system)

Decision:
For auditability, use SQLite with append-only event log + JSON memory. This provides immutable events, tamper evidence via hash chain, and query capabilities.

Rationale:
- JSON files can be edited — not tamper-evident
- SQLite with triggers enforces append-only
- Hash chain (each event hashes previous) provides tamper evidence
- Query capability for "show all decisions for member X"

Acceptance / test:
- Auditability requirement documented in design spec

## D-20260315-1203
Date: 2026-03-15 12:03
Inputs: [CR-20260315-1203](requests.md#cr-20260315-1203)
PRD: [Agent Orchestration System — Architecture](PRD.md#agent-orchestration-system)

Decision:
MERN stack (MongoDB, Express, React, Node.js) is overkill for this project. Stick with current design (Node.js + JSON files or SQLite).

Rationale:
- MongoDB adds operational complexity (server, backups, replication)
- No benefit from horizontal scaling (single household per instance)
- Over-engineering for a PoC/demo
- Current design is simpler, more auditable, and easier to demo

Acceptance / test:
- Design spec updated to reject MERN stack

## D-20260315-1252
Date: 2026-03-15 12:52
Inputs: [CR-20260315-1252](requests.md#cr-20260315-1252)
PRD: [Agent Orchestration System — Knowledge Store](PRD.md#agent-orchestration-system)

Decision:
Graph database could help for relational queries across entities, but only add if you need to traverse relationships. For PoC, skip graph DB — JSON files + SQLite are simpler.

Rationale:
- Graph DBs excel at: "Find all contacts of member X's trusted contacts", "Show threat patterns linked to multiple members", "Trace escalation chain"
- Current design doesn't need graph queries yet
- Add graph layer only for specific relationship queries (e.g., threat pattern analysis)

Acceptance / test:
- Design spec updated to note graph DB as future enhancement


## D-20260317-1400
Date: 2026-03-17 14:00
Inputs: [CR-20260317-1400](requests.md#cr-20260317-1400)
PRD: [Agent Orchestration System](PRD.md#agent-orchestration-system-sources-cr-20260314-1600-d-20260314-1600)
Spec: [`.kiro/specs/agent-orchestration-implementation/requirements.md`](../.kiro/specs/agent-orchestration-implementation/requirements.md)

Decision:
Create implementation spec using design-first workflow. Reference existing design documents at `docs/superpowers/specs/2026-03-14-agent-orchestration-design.md` as the technical design source.

Rationale:
- Design documents already exist and are comprehensive (10 sections covering architecture, templates, learning, events, API contracts, error handling)
- Design-first workflow is appropriate since technical approach is already defined
- Implementation spec will derive requirements from design and create task breakdown
- Athena conventions ensure traceability from customer request → decision → design → requirements → tasks

Alternatives considered:
- Requirements-first workflow (rejected — design already exists, would be redundant)
- Direct implementation without spec (rejected — loses traceability and task tracking)

Acceptance / test:
- Spec created at `.kiro/specs/agent-orchestration-implementation/`
- requirements.md includes all FR/NFR requirements traced to CR-20260317-1400 and D-20260314-1600
- tasks.md includes 10 phases with granular task breakdown
- All requirements reference the design documents as source

## D-20260318-1000
Date: 2026-03-18 10:00
Inputs: CR-20260318-1000
PRD: [Cost Optimization](PRD.md#cost-optimization)

Decision:
Reduce output tokens by removing redundant fields (event_id, agent, instance, stage_check) from submit_assessment tool schema and backfilling server-side. Add prompt caching via Anthropic system message array with cache_control on static template prefix. Add signal vocabulary as soft guidance (not hard enum) to reduce free-text token usage.

Rationale:
- Output tokens cost 5x input ($4.00 vs $0.80/MTok on Haiku)
- Removing 4 fields the server already knows saves ~50-100 output tokens per call
- Constraining assessment to "one sentence, max 30 words" saves ~100-200 tokens
- Signal codes vs free-text saves ~10-30 tokens
- Prompt caching reduces input cost by 90% on cache hits (~4,200 token template)
- Combined: ~64% cost reduction per event with cache hits
- No downstream breakage: server backfills fields before escalation handler sees them

Alternatives considered:
- Hard enum for signals (rejected — too restrictive, agents may need novel signals)
- Remove memory_updates from output (rejected — agents must drive their own learning)
- Switch to cheaper model (rejected — already on Haiku, the cheapest option)

Acceptance / test:
- All 108+ existing tests pass with schema changes
- parseAgentResponse accepts responses without event_id/agent/instance/stage_check
- agent-instance backfills those fields before passing to escalation handler
- callClaude sends system message array with cache_control when templateBody is provided

## D-20260318-1100
Date: 2026-03-18 11:00
Inputs: CR-20260318-1000
PRD: [Cost Optimization](PRD.md#cost-optimization)

Decision:
Add CLAUDE_DEBUG environment variable to claude-client.js that logs cache hit/miss status, input/output token counts, cache_creation_input_tokens, and cache_read_input_tokens per API call. Also logs SDK usage keys and system message type on first call for diagnostics.

Rationale:
- Prompt caching showed `cache=NONE` on all calls with no visibility into why
- Need to verify: (a) SDK returns cache fields, (b) system message is sent as array, (c) token counts are as expected
- Debug mode must be opt-in to avoid noisy production logs
- One-time diagnostic (usage keys, system type) helps verify SDK + API compatibility without repeated noise

Alternatives considered:
- Always-on logging (rejected — too noisy for production/demo)
- Separate debug script (rejected — need to observe real API calls in context)

## D-20260319-1654
Date: 2026-03-19 16:54
Inputs: [CR-20260319-1654](requests.md#cr-20260319-1654)
PRD: [Frontend Dev Connectivity](PRD.md#frontend-dev-connectivity-sources-cr-20260319-1654-d-20260319-1654)
Spec: [`specs/20260319-frontend-dev-connectivity/spec.md`](specs/20260319-frontend-dev-connectivity/spec.md)

Decision:
Use same-origin-relative frontend API and WebSocket paths plus a Vite dev proxy to `http://localhost:3001`. Do not make backend CORS the primary fix. Also add a `npm run server` script so the UI and scripts point to a valid backend command.

Rationale:
- The backend is already reachable directly on `localhost:3001`; the browser failure is caused by the Vite dev origin (`localhost:5173`) calling hardcoded cross-origin URLs with no proxy/CORS support.
- Relative frontend paths plus Vite proxy are the smallest fix that makes `./run-local.sh` work as the user expects.
- This keeps the frontend transport contract aligned with the current page origin and avoids scattering absolute dev-only URLs through the UI.
- Adding `npm run server` makes the UI recovery message truthful and keeps local startup commands consistent.

Alternatives considered:
- Enable Express CORS only (rejected — fixes the symptom in dev but keeps hardcoded absolute origins in the frontend)
- Keep absolute URLs and document manual browser workarounds (rejected — user goal is to have the UI use the real APIs locally by default)

Acceptance / test:
- `CLAUDE_DEBUG=1` shows per-call cache status, token counts, and one-time SDK diagnostics
- No output when CLAUDE_DEBUG is unset

## D-20260318-1130
Date: 2026-03-18 11:30
Inputs: CR-20260318-1000
PRD: [Cost Optimization](PRD.md#cost-optimization)

Decision:
Add Array.isArray guards for actions and signals in both agent-instance.js (before downstream processing) and escalation-handler.js (_processActions entry). When Claude returns these fields as free-text strings instead of arrays, coerce to empty arrays with a console.warn.

Rationale:
- Claude nondeterministically returned `actions` as a free-text string ("Log this event and monitor the caller for future reference.") instead of an array of action objects
- `for (const action of "string")` iterates individual characters, where `char.type === undefined`
- This produced hundreds of `Unknown action type "undefined"` log lines per event — a "wall of text" bug that cost real money in a live API test
- Defense in depth: guard in agent-instance.js (before backfill) AND escalation-handler.js (at consumption point)

Alternatives considered:
- Strict schema validation that rejects string responses (rejected — would lose the assessment data; better to log warning and continue)
- Only guard in one location (rejected — defense in depth is warranted given the cost of the failure mode)

Acceptance / test:
- Regression tests: escalation handler skips string actions without throw; parseAgentResponse + backfill coerces strings to arrays
- 111 tests pass (110 + 1 skipped)

## D-20260318-1200
Date: 2026-03-18 12:00
Inputs: CR-20260318-1000
PRD: [Cost Optimization](PRD.md#cost-optimization)

Decision:
Expand agent template bodies with "Worked Examples" section (3 examples per agent: L0/L3/L4) to push past Haiku's 2048-token minimum for prompt cache activation. Template bodies were ~1,960 tokens (88 short of threshold).

Rationale:
- Live API test confirmed `cache_creation_input_tokens=0` and `cache_read_input_tokens=0` on all 5 calls
- Diagnostic logging confirmed: SDK returns cache fields, system message is array with cache_control — but block was undersized
- gray-matter strips YAML frontmatter (~691 bytes), leaving only markdown body (~7,838 bytes / ~1,960 tokens)
- Haiku requires minimum 2048 tokens in a cached block; API silently skips cache creation for undersized blocks
- Worked examples add genuine value: they show Claude the expected signal codes, action patterns, and threat level reasoning, improving response quality alongside enabling caching
- After expansion: ANCHOR ~2,288 tokens, SENTINEL ~2,283 tokens, SCOUT ~2,100 tokens — all above threshold with buffer

Alternatives considered:
- Include frontmatter in cached block (rejected — frontmatter is config YAML, not a Claude instruction; would confuse the model)
- Merge tool definition into cached block (rejected — tool_choice is a separate API parameter, can't be cached this way)
- Leave as-is / accept no caching (rejected — caching is the primary cost lever, worth the template expansion)
- Pad with filler text (rejected — every token should earn its keep; worked examples improve quality)

Acceptance / test:
- Body byte counts: ANCHOR 9152B, SENTINEL 9132B, SCOUT 8403B — all estimate >2048 tokens
- Re-run live test with CLAUDE_DEBUG=1 should show cache=WRITE on first call, cache=HIT on subsequent calls
- 111 tests pass (110 + 1 skipped)

## D-20260318-1640
Date: 2026-03-18 16:40
Inputs: CR-20260318-1640
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio)

Decision:
Create a working localhost demo with real Twilio integration showing actual use cases. Focus on call forwarding as the integration method, wire Twilio webhook to event bus, and update UI to show only working features with real scenarios.

Rationale:
- Current Twilio webhook is stubbed but ready (`POST /ingest/twilio/voice`)
- Call forwarding is fastest path to working demo: user keeps T-Mobile number, forwards to Twilio proxy, Twilio analyzes + forwards to user
- Localhost testing with ngrok or similar allows rapid iteration without production deployment complexity
- UI should focus on demonstrating real working features, not placeholder/mock data
- Real use cases (grandparent scam, bank fraud, etc.) show actual value proposition

Alternatives considered:
- Full production deployment (rejected — too complex for initial demo, localhost sufficient)
- Keep using event simulator only (rejected — doesn't demonstrate real Twilio integration value)
- Mock Twilio responses (rejected — want to show actual end-to-end flow with real calls)

Acceptance / test:
- Working demo guide created at `docs/PRODUCTION_DEPLOYMENT.md` (updated for localhost)
- Implementation spec created for Twilio webhook wiring
- Guide covers: Twilio account setup for localhost, ngrok setup, call forwarding instructions, UI updates to show real features only
- Demo successfully processes real phone call on localhost

## D-20260318-1700
Date: 2026-03-18 17:00
Inputs: CR-20260318-1700
PRD: [API Documentation](PRD.md#api-documentation)

Decision:
Create comprehensive API documentation at docs/API.md covering all REST endpoints with request/response examples, query parameters, and error codes. Use markdown format for easy reading and maintenance.

Rationale:
- No built-in Swagger/OpenAPI documentation exists
- routes.js has good inline comments but not accessible to API consumers
- Markdown documentation is easy to maintain alongside code
- Examples help developers understand request/response formats
- Query parameters and error codes reduce support burden

Alternatives considered:
- Swagger/OpenAPI spec (rejected — adds complexity, requires tooling, overkill for hackathon)
- JSDoc comments only (rejected — not accessible to external developers)
- Inline README in server/api/ (rejected — docs/ is the established location for documentation)

Acceptance / test:
- docs/API.md created with all endpoints documented
- Each endpoint includes: method, path, description, query params (if any), request body (if any), response format, example
- Error codes documented (400, 404, 500)

## D-20260318-1800
Date: 2026-03-18 18:00
Inputs: [CR-20260318-1800](requests.md#cr-20260318-1800)
PRD: [Storage](PRD.md#storage), [Auditability](PRD.md#auditability)

Decision:
Create implementation spec for SQLite storage with tamper-evident audit trail. Migrate from mutable JSON files to SQLite with append-only event log, hash chain for tamper evidence, and atomic memory snapshots. Maintain backward compatibility during migration.

Rationale:
- Current JSON files (data/memories/*.json, data/events/*.jsonl) are mutable — no tamper evidence
- D-20260315-1155 and D-20260315-1202 documented the need but implementation was deferred
- SQLite provides: ACID transactions, append-only enforcement via triggers, query capabilities, better reliability
- Hash chain (each event hashes previous event) provides cryptographic tamper evidence
- Memory snapshots as JSON blobs in SQLite preserve current memory-store.js API
- Migration path: dual-write mode → verify → cutover → deprecate JSON files

Alternatives considered:
- Keep JSON files (rejected — no auditability, no tamper evidence, fragile for production)
- Full rewrite of memory-store.js (rejected — too risky, prefer incremental migration)
- PostgreSQL (rejected — overkill for single-household deployment, SQLite sufficient)

Acceptance / test:
- Spec created at docs/specs/20260318-sqlite-auditability/spec.md
- Tasks created at docs/specs/20260318-sqlite-auditability/tasks.md
- All requirements traced to CR-20260318-1800 and D-20260318-1800
- Migration plan includes rollback strategy

## D-20260319-1000
Date: 2026-03-19 10:00
Inputs: CR-20260319-1000
PRD: [Frontend API Integration](PRD.md#frontend-api-integration)

Decision:
Replace all hardcoded mock data in Cortege.jsx with live API data. Extend `getStatus()` on the backend to include richer companion data (recent activity summary, event counts, last action). Frontend fetches from `/api/companions` for grid view and `/api/companions/:id/activity` + `/api/companions/:id/memory` for detail panel. WebSocket updates feed into the main Household view, not just Live Feed. Display properties (colors, icons, roles) derived from agent type metadata, not fake stats.

Rationale:
- The backend API already exists and returns real data — the frontend simply doesn't use it for the main view
- Extending `getStatus()` is cleaner than making 5+ separate API calls per companion from the frontend
- WebSocket already pushes events and status updates — routing these to the main view unifies the data flow
- Showing real (even sparse) data that grows over time aligns with the "trust over time" product philosophy
- Mock scenarios (grandparent-scam, normal-day) produce real API data — that's OK, it's system output not fake constants
- UI should handle empty/sparse state gracefully as a feature (day 1 is intentionally sparse → day 365 is rich)

Alternatives considered:
- Keep mock data as "example" data alongside real data (rejected — user explicitly wants nothing 100% fake)
- Create mock API responses on the backend (rejected — defeats the purpose; the real API already works)
- Only show what getStatus() currently returns (rejected — too sparse for useful UX; extending it is low-effort)
- Fetch all data client-side from multiple endpoints (rejected — too many HTTP calls; better to enrich getStatus())

Acceptance / test:
- Zero hardcoded mock data constants remain in Cortege.jsx (HOUSEHOLD, COMPANIONS, DEPTH_STAGES constants removed)
- All companion card data comes from GET /api/companions
- Detail panel activity comes from GET /api/companions/:id/activity
- WebSocket updates reflect in real-time on the Household tab
- Loading and empty states shown gracefully when backend is starting up or has no events yet
- Running a demo scenario populates the UI with real data


## D-20260319-1730
Date: 2026-03-19 17:30
Request: [CR-20260319-1730](requests.md#cr-20260319-1730)
PRD Impact: "Next / Backlog" section

Decision:
Implement multi-household support to allow CORTEGE to manage multiple households with independent members and agents. Use HouseholdStore pattern (similar to existing storage-adapter.js) to manage household data in separate JSON files under data/households/. Maintain backward compatibility with existing data/household.json for single-household deployments.

Rationale:
- Current single-household limitation prevents users from managing multiple families/groups
- File-based storage (JSON) matches existing architecture patterns
- Backward compatibility ensures existing deployments continue working
- Implementation plan follows TDD approach with comprehensive test coverage

Alternatives Considered:
- SQLite-only storage: Rejected - adds complexity, JSON files sufficient for household metadata
- In-memory only: Rejected - need persistence across restarts
- Modify existing household.json: Rejected - breaks backward compatibility

Tradeoffs:
- File-based storage limits concurrent write performance (acceptable for household management use case)
- Multiple JSON files vs single file: Chose multiple for cleaner separation and easier management
