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

## D-20260320-1450
Date: 2026-03-20 14:50
Inputs: [CR-20260320-1450](requests.md#cr-20260320-1450)
PRD: [Household Editing UI](PRD.md#household-editing-ui-sources-cr-20260320-1450-d-20260320-1450)
Spec: [`specs/20260320-household-editor-ui/spec.md`](specs/20260320-household-editor-ui/spec.md)

Decision:
Implement household editing as an explicit editor inside the existing household selector modal. Keep phone-number changes out of scope for this task and prioritize clearer household-name and member-management access without adding a new page or modal layer.

Rationale:
- The existing selector modal already contains the selected-household context, location reassignment, and member CRUD, so this is the smallest coherent change.
- The user's main issue is discoverability and access, not missing backend support for household updates.
- Adding a dedicated admin page or second modal would increase UI complexity without solving the immediate problem faster.

Alternatives considered:
- Dedicated household settings modal (rejected for now: more state and navigation work)
- Full household administration page (rejected for now: too large for the immediate UX gap)
- Phone-optional and minor-contact fallback in the same task (rejected for now: separate behavior change, lower priority)

Acceptance / test:
- The selected household can be renamed from the existing household selector modal.
- The modal presents household details, location reassignment, and member CRUD as one visible editing surface.

## D-20260320-1504
Date: 2026-03-20 15:04
Inputs: [CR-20260320-1504](requests.md#cr-20260320-1504)
PRD: [Member Phone Input UX](PRD.md#member-phone-input-ux-sources-cr-20260320-1504-d-20260320-1504)
Spec: [`specs/20260320-member-phone-input/spec.md`](specs/20260320-member-phone-input/spec.md)

Decision:
Keep the backend member API contract strict on E.164 storage and validation, but make the UI normalize common US phone input formats before submit and show inline form errors when member creation or update fails.

Rationale:
- The screenshot shows a realistic local-format phone entry that should be accepted by the UI even if the API stores the normalized international form.
- Preserving the E.164 backend contract avoids reopening the privacy/location member schema and API docs unnecessarily.
- The current silent failure is a UX bug because the error is only logged to the console.

Alternatives considered:
- Loosen the backend to accept arbitrary phone formats (rejected: weakens canonical storage and validation)
- Leave backend strict and only improve the error message (rejected: still forces users to guess the exact formatting rules)
- Make phone optional in the same change (rejected: separate product decision, previously deferred)

Acceptance / test:
- Adding a member with a common US formatted phone like `1914-764-5049` succeeds and stores the member.
- Invalid member submissions surface an inline error in the modal instead of failing silently.

## D-20260320-1525
Date: 2026-03-20 15:25
Inputs: [CR-20260320-1525](requests.md#cr-20260320-1525)
PRD: [Active Household Companions](PRD.md#active-household-companions-sources-cr-20260320-1525-d-20260320-1525)
Spec: [`specs/20260320-active-household-companions/spec.md`](specs/20260320-active-household-companions/spec.md)

Decision:
Treat the selected household as the active backend household for companion snapshots. Make companion-fetch paths household-aware so the server activates the requested household before returning live companion instances, rather than faking the UI with stale global agent data.

Rationale:
- The current mismatch is caused by a single global companion set created from the startup household, not by a rendering issue.
- For a localhost hackathon demo, switching the active household on the backend is the simplest correct behavior.
- Returning stale or synthetic companion cards for the wrong household would undermine the demo.

Alternatives considered:
- Filter the existing companion cards in the frontend only (rejected: still uses the wrong backend household)
- Render synthetic companion cards from member data (rejected: fake state, not live companion instances)
- Add a separate explicit “activate household” UI step (rejected: user already selected a household; the switch should be authoritative)

Acceptance / test:
- After selecting a household with two members, the dashboard companion count and visible companion names match that household.

## D-20260320-1545
Date: 2026-03-20 15:45
Inputs: [CR-20260320-1545](requests.md#cr-20260320-1545)
PRD: [Cypress Test Artifacts](PRD.md#cypress-test-artifacts-sources-cr-20260320-1545-d-20260320-1545)
Spec: [`specs/20260320-cypress-artifacts/spec.md`](specs/20260320-cypress-artifacts/spec.md)

Decision:
Enable Cypress run videos and failure screenshots by default in the local test config, then rerun the relevant household demo E2E specs and verify that artifact files are produced.

Rationale:
- The user explicitly wants reviewable artifacts from Cypress only.
- This is a configuration change, not a test-framework migration.
- Videos are produced on runs; screenshots remain failure-focused to avoid unnecessary artifact noise.

Alternatives considered:
- Enable Playwright artifacts too (rejected: user explicitly scoped to Cypress)
- Record screenshots on every successful step (rejected: too noisy for the requested review aid)

Acceptance / test:
- `cypress.config.js` enables `video` and `screenshotOnRunFailure`
- A fresh Cypress run produces video files in the Cypress artifacts directory

## D-20260320-1555
Date: 2026-03-20 15:55
Inputs: [CR-20260320-1555](requests.md#cr-20260320-1555)
PRD: [Cypress Test Artifacts](PRD.md#cypress-test-artifacts-sources-cr-20260320-1545-d-20260320-1545-cr-20260320-1555-d-20260320-1555)
Spec: [`specs/20260320-cypress-artifacts/spec.md`](specs/20260320-cypress-artifacts/spec.md)

Decision:
Keep Cypress videos enabled and add an always-on screenshot hook so successful runs also save screenshots, while still leaving `screenshotOnRunFailure` enabled for failure capture.

Rationale:
- The user explicitly asked for screenshots and videos, not screenshots only on failure.
- Cypress does not provide success screenshots by config alone; an explicit test hook is the smallest reliable solution.
- Keeping failure screenshots enabled preserves the default failure artifact behavior as well.

Acceptance / test:
- A fresh Cypress run produces video files and screenshot files for the executed specs.

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

## D-20260320-1000
Date: 2026-03-20 10:00
Inputs: CR-20260320-1000
PRD: [Cypress E2E Tests](PRD.md#cypress-e2e-tests)

Decision:
Use Cypress for E2E tests. Implement 5 test files covering navigation, household CRUD, member CRUD, companion cards, and live feed. Use custom commands for API setup/teardown. Companion-cards tests are resilient to empty backend state (no agents running).

Rationale:
- Cypress is the specified test framework for Phase 3
- Custom commands (createHousehold, addMember, cleanupTestHouseholds) isolate test data via API, making tests independent of each other
- Companion grid depends on live orchestrator agents — tests gracefully skip card-click assertions when no agents are running, avoiding false failures in CI
- data-testid attributes already exist on all relevant elements from the household feature work

Alternatives considered:
- Always-failing companion tests (rejected — backend agents don't auto-start in test environment)
- Mocking the companions API (rejected — E2E tests should test real integration, not mocks)

Acceptance / test:
- npx cypress run completes all 16 tests
- Tests are self-contained: each creates and cleans up its own data via beforeEach

## D-20260320-1147
Date: 2026-03-20 11:47
Inputs: [CR-20260320-1147](requests.md#cr-20260320-1147)
PRD: [Privacy-First Household Data](PRD.md#privacy-first-household-data-sources-cr-20260320-1147-d-20260320-1147)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Decision:
Implement a privacy-first household data model that stores household locations as separate `location` records referenced by `location_id`, encrypts full name / phone / date of birth / location name / structured address at rest, derives deterministic phone tokens for matching, and sanitizes all logs and external LLM requests so raw PII is never emitted outside trusted server read paths.

Rationale:
- The current household/member model persists PII in clear text across household JSON, memory snapshots, and event payload flows
- `location` is currently only display metadata, so normalizing it behind `location_id` reduces duplication and creates a clean boundary for encrypted address storage
- Phone matching requires equality lookup for Twilio/manual event routing, so encrypted-only storage is insufficient without a deterministic token
- LLM prompts and console logs currently receive serialized event and memory data; a centralized privacy layer is safer than scattered field masking

Alternatives considered:
- Encrypt only at the transport layer with HTTPS (rejected — does not protect data at rest, logs, or LLM boundaries)
- Keep inline household `address` and plaintext member fields (rejected — duplicates sensitive data and leaves the current exposure model intact)
- Use encryption without deterministic tokens (rejected — breaks phone-based lookup and future routing use cases)

Acceptance / test:
- Household/member/location persistence contains no plaintext name, phone, date_of_birth, location name, or address
- External Claude calls are built from sanitized event + memory payloads with aliases, not raw PII
- Representative server logs no longer print raw PII-bearing payloads or identifiers
- Household APIs create and update households via `location_id`, with trusted read responses expanding decrypted location data

## D-20260320-1203
Date: 2026-03-20 12:03
Inputs: [CR-20260320-1203](requests.md#cr-20260320-1203)
PRD: [Privacy-First Household Data](PRD.md#privacy-first-household-data-sources-cr-20260320-1147-d-20260320-1147-cr-20260320-1203-d-20260320-1203)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Decision:
Extend the active privacy/location feature to include full location CRUD expectations across both the API and the UI. Location deletion will use the stricter guardrail: reject deleting a location that is still referenced by one or more households, require household reassignment first, and return blocking household details so the UI can guide the operator.

Rationale:
- The original location normalization plan already implied reusable location records, but without explicit UI CRUD coverage operators could create locations without being able to manage them cleanly
- Delete behavior must be deterministic because deleting a referenced encrypted address record would orphan households or silently destroy location context
- Returning blocking household details in a `409 Conflict` response gives the UI enough information to drive reassignment without exposing a vague failure state

Alternatives considered:
- Allow deleting referenced locations and cascade null household references (rejected — breaks household integrity and weakens the normalized data model)
- Allow deleting referenced locations and require implicit fallback recreation (rejected — surprising behavior and harder to audit)
- Leave location editing/deletion out of the UI (rejected — incomplete CRUD despite normalized API model)

Acceptance / test:
- API includes a guarded `DELETE /api/locations/:id` route
- Deleting a referenced location returns `409 Conflict` with blocking household identifiers
- UI lists saved locations, supports editing name/address, and surfaces reassignment guidance before delete

## D-20260320-1220
Date: 2026-03-20 12:20
Inputs: [CR-20260320-1220](requests.md#cr-20260320-1220)
PRD: [Privacy-First Household Data](PRD.md#privacy-first-household-data-sources-cr-20260320-1147-d-20260320-1147-cr-20260320-1203-d-20260320-1203)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Decision:
Keep the same ATHENA feature ID, but decompose execution into a dedicated superpowers plan plus smaller ATHENA tasks grouped by storage/privacy primitives, API integrity, UI flows, sanitization, and verification.

Rationale:
- The feature requirements are valid, but the original task list is too coarse for reliable execution and review
- File-scoped tasks and an explicit plan reduce ambiguity while preserving the existing traceability chain
- The current codebase already contains partially implemented changes, so the plan needs to target integration gaps instead of restating the original product request

Acceptance / test:
- A plan document exists at `docs/superpowers/plans/2026-03-20-pii-encryption-location-model.md`
- The ATHENA task list is decomposed into smaller execution units with clear FR mappings

## D-20260320-1228
Date: 2026-03-20 12:28
Inputs: [CR-20260320-1228](requests.md#cr-20260320-1228)
PRD: [Privacy-First Household Data](PRD.md#privacy-first-household-data-sources-cr-20260320-1147-d-20260320-1147-cr-20260320-1203-d-20260320-1203)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Decision:
Execute the approved privacy/location plan from the current workspace by moving the existing dirty `main` work onto a feature branch, rather than creating a new worktree from clean HEAD.

Rationale:
- The implementation is already partially in progress in the current workspace, so switching to a feature branch preserves that work without forcing an unsafe stash/replay step
- Continuing directly on `main` would violate the execution guardrail against starting implementation on `main`
- A same-workspace feature branch is the safest adaptation available under the current repo state

Acceptance / test:
- The working branch is no longer `main`
- Implementation continues against the active feature ID with the existing uncommitted changes preserved

## D-20260320-1248
Date: 2026-03-20 12:48
Inputs: [CR-20260320-1248](requests.md#cr-20260320-1248)
PRD: [Privacy-First Household Data](PRD.md#privacy-first-household-data-sources-cr-20260320-1147-d-20260320-1147-cr-20260320-1203-d-20260320-1203)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Decision:
Create one traceable feature commit on `feature/pii-encryption-location-model` using a concise message derived from the shipped privacy/location feature scope rather than splitting the already-verified work into synthetic smaller commits.

Rationale:
- The implementation was completed and verified as one integrated feature spanning storage, API, UI, tests, and docs
- Retroactively splitting it into multiple commits would weaken the actual audit trail instead of improving it
- A single commit can still be traceable because the ATHENA request/decision/spec/task/progress documents already capture the internal breakdown

Acceptance / test:
- The working tree is committed on `feature/pii-encryption-location-model`
- The commit message clearly reflects the shipped privacy/location feature

## D-20260320-1315
Date: 2026-03-20 13:15
Inputs: [CR-20260320-1315](requests.md#cr-20260320-1315)
PRD: [Documentation Alignment](PRD.md#documentation-alignment--shipped-sources-cr-20260320-1315-d-20260320-1315)
Spec: [`specs/20260320-readme-alignment/spec.md`](specs/20260320-readme-alignment/spec.md)

Decision:
Treat this as a narrow documentation-alignment task. Update `README.md` and `.env.example` so the top-level setup, API overview, privacy notes, and project structure match the shipped location/privacy implementation without changing product behavior.

Rationale:
- The review found documentation drift, not a runtime defect
- `README.md` is the primary onboarding surface, but its env and API sections depend on `.env.example` for accuracy
- Keeping the scope to README + env template fixes the user-facing gaps without reopening the broader privacy/location feature

Acceptance / test:
- `README.md` documents the location CRUD model, privacy behavior, and current repo structure accurately
- `.env.example` includes the privacy key setting referenced by the README

## D-20260320-1345
Date: 2026-03-20 13:45
Inputs: [CR-20260320-1345](requests.md#cr-20260320-1345)
PRD: [Main Branch Publication](PRD.md#main-branch-publication--shipped-sources-cr-20260320-1345-d-20260320-1345)
Spec: [`specs/20260320-main-branch-push/spec.md`](specs/20260320-main-branch-push/spec.md)

Decision:
Publish by first committing the pending README-alignment changes on the active feature branch, then merging that branch into local `main`, verifying the merged result, and pushing `main` to `origin`.

Rationale:
- The working tree is not clean, so switching directly to `main` without committing would risk losing the README-alignment audit trail
- The feature branch already contains the verified privacy/location implementation, making it the correct integration source
- A local merge into `main` preserves a clean branch history before the explicit remote push the user requested

Acceptance / test:
- The pending README/docs updates are committed with traceability
- Local `main` contains the feature branch changes
- `origin/main` is updated to the merged commit

## D-20260320-1415
Date: 2026-03-20 14:15
Inputs: [CR-20260320-1415](requests.md#cr-20260320-1415)
PRD: [Release v0.3.0](PRD.md#release-v030--shipped-sources-cr-20260320-1415-d-20260320-1415)
Spec: [`specs/20260320-release-v030/spec.md`](specs/20260320-release-v030/spec.md)

Decision:
Correct the existing `v0.3.0` tag by moving it to the current `main` release commit, update `RELEASE-0.3.0.md` so it reflects the full shipped delta from `v0.2.0`, and publish a GitHub `v0.3.0` release using that updated release-notes file.

Rationale:
- The remote already has a `v0.3.0` tag, but it points to an older docs-only commit and has no published release entry
- The checked-in release notes are stale and only describe the SQLite slice, not the later frontend, household, privacy, and testing work
- Publishing `v0.3.0` from current `main` matches the package version and the actual shipped feature set better than creating a new patch tag

Acceptance / test:
- `RELEASE-0.3.0.md` summarizes the shipped changes since `v0.2.0`
- Remote tag `v0.3.0` points at the new release commit on `main`
- GitHub release `v0.3.0` exists with the updated release text

## D-20260320-1435
Date: 2026-03-20 14:35
Inputs: [CR-20260320-1435](requests.md#cr-20260320-1435)
PRD: [API Docs Alignment](PRD.md#api-docs-alignment--shipped-sources-cr-20260320-1435-d-20260320-1435)
Spec: [`specs/20260320-api-docs-alignment/spec.md`](specs/20260320-api-docs-alignment/spec.md)

Decision:
Treat this as a narrow docs/API alignment pass. Update `docs/API.md` so the served `/api/docs` page matches the current route behavior for companion status, location CRUD, expanded household responses, and member update fields.

Rationale:
- `/api/docs` is generated directly from `docs/API.md`, so fixing the markdown fixes the served page
- The current drift is documentation-only and concentrated in the household/location/companion areas touched by recent changes
- Keeping the scope to API docs avoids reopening unrelated product docs

Acceptance / test:
- `docs/API.md` includes the missing location endpoints and current response shapes
- A local `GET /api/docs` serves the updated API markdown content

## D-20260320-1459
Date: 2026-03-20 14:59
Inputs: [CR-20260320-1459](requests.md#cr-20260320-1459)
PRD: [README Localhost Validation Artifacts](PRD.md#readme-localhost-validation-artifacts--sources-cr-20260320-1459-d-20260320-1459)
Spec: [`specs/20260320-readme-localhost-artifacts/spec.md`](specs/20260320-readme-localhost-artifacts/spec.md)

Decision:
Treat this as a docs-and-check-in slice. Update `README.md` with the exact localhost Cypress validation command plus representative screenshot and video artifact links, then create one local commit that includes all current uncommitted changes.

Rationale:
- The repo now generates reviewable Cypress artifacts, but the top-level onboarding doc does not show where to find them
- The user asked for a local check-in, not a push, so a traceable local commit is the correct publication scope
- Folding the README evidence pointers and the local commit into one slice keeps the documentation aligned with the verified demo state

Acceptance / test:
- `README.md` documents the localhost Cypress run and links to generated screenshots/videos
- Targeted verification reruns the localhost Cypress specs and confirms the artifact files exist
- A local Git commit captures all current changes

## D-20260320-1515
Date: 2026-03-20 15:15
Inputs: [CR-20260320-1515](requests.md#cr-20260320-1515)
PRD: [Live Feed Household Data](PRD.md#live-feed-household-data-sources-cr-20260320-1515-d-20260320-1515)
Spec: [`specs/20260320-live-feed-household-data/spec.md`](specs/20260320-live-feed-household-data/spec.md)

Decision:
Treat the Live Feed and companion-detail views as household-scoped runtime surfaces. Replace the hard-coded event-injector member list with members from the selected household, and prevent companion activity APIs from showing pre-existing global history that predates the selected companion.

Rationale:
- The current event injector is plainly wrong because it still renders the original static demo members regardless of the selected household
- The current companion activity route over-reads the global event log and includes broadcast history that existed before a newly created companion was provisioned
- For the demo, the correct behavior is to show only household-relevant member choices and only activity that belongs to that companion after it existed

Acceptance / test:
- Live Feed shows the selected household’s actual members in the event-injector target dropdown
- A newly created companion does not show stale historical activity from before its creation

## D-20260320-1719
Date: 2026-03-20 17:19
Inputs: [CR-20260320-1719](requests.md#cr-20260320-1719)
PRD: [Live Feed Patch Release](PRD.md#live-feed-patch-release-sources-cr-20260320-1719-d-20260320-1719)
Spec: [`specs/20260320-live-feed-patch-release/spec.md`](specs/20260320-live-feed-patch-release/spec.md)

Decision:
Treat this as a patch release from the current verified `main`. Update `README.md` to document the live-feed injector/member-identity fix and the new localhost artifact coverage, then ship a new `v0.3.1` release on GitHub instead of rewriting the existing `v0.3.0` release.

Rationale:
- The current changes are additive bug fixes on top of an already published `v0.3.0`, which fits a semver patch release better than mutating the old release
- The README should reflect the latest live-feed behavior because that bug directly affected the demo workflow
- Publishing a new patch release preserves a clean release history and avoids rewriting the previous release record

Acceptance / test:
- `README.md` documents the live-feed household-scoping fix and localhost artifact coverage
- The verified local changes are committed
- A `v0.3.1` GitHub release exists for the current `main`

## D-20260320-1550
Date: 2026-03-20 15:50
Inputs: [CR-20260320-1550](requests.md#cr-20260320-1550)
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio-sources-cr-20260318-1640-d-20260318-1640-cr-20260320-1550-d-20260320-1550)
Spec: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)

Decision:
Rewrite the Twilio demo docs around one Twilio number per household. The Twilio number is the household ingress point, maps directly to `household_id`, and no longer relies on the older per-user proxy-number model or `household.json` production guidance.

Rationale:
- The user explicitly selected one number per household as the hackathon routing model
- The current docs still describe a per-user forwarding architecture that is ambiguous for routing and no longer matches the household-centric product direction
- The shipped household/location/privacy work means Twilio guidance must reference the household store and protected data model, not legacy inline configuration files

Alternatives considered:
- Keep the old multi-option Twilio docs and add a note about households (rejected — leaves the main docs teaching the wrong architecture)
- Use one Twilio number per member (rejected for the hackathon — clearer routing, but more operational overhead than needed for the demo)

Acceptance / test:
- `docs/PRODUCTION_DEPLOYMENT.md` describes the household-number routing flow and current localhost/ngrok path
- `docs/specs/working-demo-with-twilio/spec.md` and `tasks.md` align with `To -> household_id` routing and the household store model
- `docs/PRD.md` backlog and Twilio summary reference the new household-number direction

## D-20260320-1559
Date: 2026-03-20 15:59
Inputs: [CR-20260320-1559](requests.md#cr-20260320-1559)
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio-sources-cr-20260318-1640-d-20260318-1640-cr-20260320-1550-d-20260320-1550-cr-20260320-1559-d-20260320-1559)
Spec: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)

Decision:
Add Mermaid sequence diagrams to the Twilio demo guide for the two target outcomes: an allowed call that is bridged back to the original household number, and a blocked call that is terminated before it reaches the household line.

Rationale:
- The current text explains routing, but the demo narrative is easier to understand visually
- The user explicitly asked for the final “call reaches the original household number” path and the blocked path
- The diagrams should document the target Twilio behavior without implying that call bridging is already shipped in code

Acceptance / test:
- `docs/PRODUCTION_DEPLOYMENT.md` contains Mermaid sequence diagrams for both the allowed and blocked call outcomes
- The Twilio feature spec/tasks mention the diagram requirement so the audit trail covers the new documentation request

## D-20260320-1607
Date: 2026-03-20 16:07
Inputs: [CR-20260320-1607](requests.md#cr-20260320-1607)
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio-sources-cr-20260318-1640-d-20260318-1640-cr-20260320-1550-d-20260320-1550-cr-20260320-1559-d-20260320-1559-cr-20260320-1607-d-20260320-1607)
Spec: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)

Decision:
Update the Twilio Mermaid diagrams to separate the Twilio platform, CORTEGE webhook, CORTEGE agent pipeline, and LLM into distinct lanes so the viewer can see exactly where Twilio ends and CORTEGE/LLM processing begins.

Rationale:
- The first draft made `CORTEGE Webhook + Routing` look like it might be Twilio-owned code
- The user explicitly asked whether the highlighted lane was Twilio and whether there was an LLM call
- Distinct lanes are the clearest way to show that Twilio sends the webhook, CORTEGE handles routing, and the LLM is an optional downstream call inside the agent pipeline

Acceptance / test:
- `docs/PRODUCTION_DEPLOYMENT.md` diagrams include separate participants for Twilio, CORTEGE webhook, CORTEGE agent pipeline, and LLM
- The Twilio spec/tasks mention the lane-clarity requirement for the diagrams

## D-20260320-1612
Date: 2026-03-20 16:12
Inputs: [CR-20260320-1612](requests.md#cr-20260320-1612)
PRD: [Twilio Docs Publication](PRD.md#twilio-docs-publication-sources-cr-20260320-1612-d-20260320-1612)
Spec: [`specs/20260320-twilio-docs-publication/spec.md`](specs/20260320-twilio-docs-publication/spec.md)

Decision:
Publish the current Twilio documentation rewrite as a docs-only follow-up on top of the latest `main`. Use one commit covering the Twilio guide, Twilio spec/tasks, and the ATHENA audit updates, then push `main` to `origin`.

Rationale:
- The working tree changes are all documentation and audit-trail updates tied to the active Twilio direction
- The user explicitly asked to push this update on top of the latest remote change, so the correct publication path is a docs-only commit on `main`
- Keeping the Twilio guide/spec/task changes in one traceable commit preserves the narrative from routing-model choice to final diagram clarification

Acceptance / test:
- The current Twilio documentation changes are committed on `main`
- `origin/main` contains the new docs-only commit

## D-20260320-1619
Date: 2026-03-20 16:19
Inputs: [CR-20260320-1619](requests.md#cr-20260320-1619)
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio-sources-cr-20260318-1640-d-20260318-1640-cr-20260320-1550-d-20260320-1550-cr-20260320-1559-d-20260320-1559-cr-20260320-1607-d-20260320-1607-cr-20260320-1619-d-20260320-1619)
Spec: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)

Decision:
Implement the first Twilio runtime slice as backend-only household ingress wiring: add a unique household `twilio_number`, resolve `household_id` from the webhook `To` number, and emit a normalized inbound-call event onto the existing event bus. Defer signature validation and Twilio-console configuration until after this local runtime slice passes.

Rationale:
- This is the smallest slice that converts the Twilio work from documentation into running code.
- The repo already has the household store, event bus, and household-aware orchestrator runtime needed for this step.
- Keeping the first slice backend-only avoids mixing ingress plumbing with Twilio account setup or call-control behavior.

Alternatives considered:
- Start with Twilio account configuration or TwiML call bridging (rejected — local runtime routing is not implemented yet)
- Include signature validation in the same slice (deferred — important, but not required to prove `To -> household_id` routing locally)
- Add member-level targeting in the first slice (rejected — household resolution is the required first routing decision)

Acceptance / test:
- Household create/update/read flows expose `twilio_number` and reject duplicates
- `POST /ingest/twilio/voice` resolves `household_id` from `To` and emits an inbound-call event
- Unknown `To` numbers are rejected instead of falling back to a default household

## D-20260320-1646
Date: 2026-03-20 16:46
Inputs: [CR-20260320-1646](requests.md#cr-20260320-1646)
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio-sources-cr-20260318-1640-d-20260318-1640-cr-20260320-1550-d-20260320-1550-cr-20260320-1559-d-20260320-1559-cr-20260320-1607-d-20260320-1607-cr-20260320-1619-d-20260320-1619-cr-20260320-1646-d-20260320-1646)
Spec: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)

Decision:
Implement the next Twilio runtime slice in two parts: make `/api/events` read recent events from the active storage backend instead of only JSONL, and target inbound Twilio household calls to a single member. Use the household primary member when present; if no primary is configured, fall back to the first household member to avoid broadcast fanout in the hackathon demo.

Rationale:
- Live validation proved the Twilio webhook is working, but the UI-facing events API still shows stale simulator JSONL data instead of the newly ingested SQLite-backed call events.
- The current `target_member: null` Twilio event shape causes every household companion to process the same inbound call, which is not the intended demo behavior.
- Choosing the first household member when no explicit primary exists keeps the demo deterministic without requiring an immediate household-data migration.

Alternatives considered:
- Leave `/api/events` on JSONL until a later storage cleanup (rejected — it hides the live Twilio call the user just triggered)
- Require every household to mark an `is_primary` member before Twilio routing works (rejected — too much setup friction for the demo)
- Keep Twilio calls as household broadcasts (rejected — duplicates companion processing and confuses the demo)

Acceptance / test:
- `/api/events` returns the recent live Twilio call when the runtime is using SQLite storage
- The Twilio webhook emits `target_member` for one household member instead of broadcasting to all agents
- A household with no explicit primary still routes to exactly one deterministic member

## D-20260320-1655
Date: 2026-03-20 16:55
Inputs: [CR-20260320-1655](requests.md#cr-20260320-1655)
PRD: [Working Demo with Twilio](PRD.md#working-demo-with-twilio-sources-cr-20260318-1640-d-20260318-1640-cr-20260320-1550-d-20260320-1550-cr-20260320-1559-d-20260320-1559-cr-20260320-1607-d-20260320-1607-cr-20260320-1619-d-20260320-1619-cr-20260320-1646-d-20260320-1646-cr-20260320-1655-d-20260320-1655)
Spec: [`specs/working-demo-with-twilio/spec.md`](specs/working-demo-with-twilio/spec.md)

Decision:
Add a second household phone field named `pass_through_number` for the real number that should ring when a Twilio call is allowed. Keep `twilio_number` as the ingress routing number. Expose both fields in the existing household editor modal and allow the same UI pass to select the household primary member. Primary-member selection should support one chosen member or no explicit primary, in which case routing continues to fall back to the first household member.

Rationale:
- The user’s real cell number should not be overloaded as the Twilio ingress key; the demo needs one number to receive the call and a different number to ring on allow.
- The current household editor is already the management surface for household details, so extending it is lower-risk than creating a new Twilio settings screen.
- Primary-member control belongs in the same household routing section because it affects how live Twilio calls are targeted.

Alternatives considered:
- Reuse `twilio_number` as the ringing number (rejected — it collapses ingress routing and pass-through behavior into one field)
- Put `pass_through_number` on each member (rejected for the hackathon — household-level is the simplest model)
- Add primary-member editing only through member edit forms (rejected — less discoverable for Twilio routing setup)

Acceptance / test:
- Household create/read/update flows expose optional `pass_through_number`
- The household editor UI can save `twilio_number`, `pass_through_number`, and a selected primary member
- The updated UI persists a single primary member and the new household routing numbers

## D-20260320-1720
Date: 2026-03-20 17:20
Inputs: [CR-20260320-1720](requests.md#cr-20260320-1720)
PRD: [Household Fraud Case Demo](PRD.md#household-fraud-case-demo-sources-cr-20260320-1720-d-20260320-1720)
Spec: [`specs/20260320-household-fraud-case-demo/spec.md`](specs/20260320-household-fraud-case-demo/spec.md)

Decision:
Pivot the remaining hackathon implementation to one believable judge demo: keep real Twilio household ingress, then let the operator attach one manual evidence item to that live call and produce a household-scoped fraud case with explainable signals and a recommended action. Use deterministic heuristics and conservative language instead of broad AI-detection claims. Support text-first evidence types (`message_excerpt`, `suspicious_url`, `screenshot_note`) instead of building full OCR or image-forensics in the remaining time.

Rationale:
- A Twilio-only route-or-block demo is not differentiated enough from built-in phone spam tools.
- The repo already has live Twilio ingress, household routing, live-feed UI, and event persistence, so a thin case layer can create a stronger story without a rewrite.
- The remaining time is too short for credible AI-image/video detection or production-grade multimodal analysis.
- Deterministic, explainable risk signals are safer for a hackathon demo than overclaiming synthetic-media detection.

Alternatives considered:
- Finish Twilio call-control first and keep the demo phone-centric (rejected — not differentiated enough)
- Attempt AI-generated image/video detection (rejected — not credible enough in the remaining time)
- Build a full cross-channel case-management system (rejected — too large for the deadline)

Acceptance / test:
- A recent household call plus one manual evidence item can be turned into a persisted fraud case
- The UI shows the created case with severity, signals, and recommendation
- The implementation avoids claims of definitive AI-generated-media detection

## D-20260320-1739
Date: 2026-03-20 17:39
Inputs: [CR-20260320-1739](requests.md#cr-20260320-1739)
PRD: [Household Fraud Case Demo](PRD.md#household-fraud-case-demo-sources-cr-20260320-1720-d-20260320-1720)
Spec: [`specs/20260320-household-fraud-case-demo/spec.md`](specs/20260320-household-fraud-case-demo/spec.md)

Decision:
Publish the current demo state as one clean local commit that includes the household Twilio runtime work, the fraud-case demo flow, and the recorded Cypress review artifacts. Update `README.md` to point at the exact six-spec localhost capture run, and keep `data/fraud-cases/` out of Git as runtime output.

Rationale:
- The user explicitly asked for a clean local check-in and README links to the exact generated artifacts.
- The current working tree spans one coherent demo narrative: household setup, household-scoped routing, live feed behavior, and fraud-case creation.
- Fraud-case JSON files are runtime state, not source, and should follow the same gitignore treatment as other mutable data directories.

Alternatives considered:
- Split the work into multiple cleanup commits (rejected — the user asked for a clean single check-in)
- Commit `data/fraud-cases/` example output (rejected — mutable runtime data should stay out of source control)

Acceptance / test:
- `README.md` documents the exact Cypress localhost suite and links to the generated screenshots/videos
- `data/fraud-cases/` is gitignored
- The working tree is committed cleanly after final verification

## D-20260321-0801
Date: 2026-03-21 08:01
Inputs: [CR-20260321-0801](requests.md#cr-20260321-0801)
PRD: [PowerPoint Deck Export](PRD.md#powerpoint-deck-export-sources-cr-20260321-0801-d-20260321-0801)
Spec: [`specs/20260321-deck-pptx-export/spec.md`](specs/20260321-deck-pptx-export/spec.md)

Decision:
Generate the PowerPoint as native `python-pptx` slides and shapes from the content in `deck.html`, rather than rasterizing the HTML into slide images.

Rationale:
- The user explicitly asked for `python-pptx`.
- A native slide deck remains editable in PowerPoint and keeps screenshots, text, and layout elements separable.
- Reproducing the reveal.js presentation approximately with PowerPoint primitives is sufficient for the requested design match without introducing an HTML rendering dependency.
- Fonts may fall back at open time if the local PowerPoint environment does not have `Cormorant Garamond` or `Outfit`; the generator should still target those families.

Alternatives considered:
- Export the HTML deck as screenshots and embed one image per slide (rejected: fast, but not editable and does not meaningfully use `python-pptx`)
- Attempt full HTML/CSS rendering inside PowerPoint generation (rejected: brittle and unnecessary for this deck)

Acceptance / test:
- A repo-local Python generator creates `deck.pptx` with 8 slides, key text copied from `deck.html`, and embedded screenshot media for the live-product slide.

## D-20260321-0815
Date: 2026-03-21 08:15
Inputs: [CR-20260321-0815](requests.md#cr-20260321-0815)
PRD: [Global Codex PPTX Skill](PRD.md#global-codex-pptx-skill-sources-cr-20260321-0815-d-20260321-0815)
Spec: [`specs/20260321-pptx-codex-skill/spec.md`](specs/20260321-pptx-codex-skill/spec.md)

Decision:
Create a global Codex skill under `~/.codex/skills/pptx-presentation-builder/SKILL.md` that teaches a reusable, editable-first `python-pptx` workflow for future presentation tasks.

Rationale:
- The user asked for something reusable in future Codex sessions, which implies installation in the global Codex skill directory instead of only this repo.
- The recently added deck-export workflow provides a concrete pattern worth generalizing: source fidelity first, native slide primitives, explicit theme tokens, media embedding, and output verification.
- A skill should encode decision rules and verification, not just copy one repo’s script.

Alternatives considered:
- Keep the guidance only in this repo (rejected: not reusable across future sessions)
- Create a skill tied only to reveal.js-to-PowerPoint conversion (rejected: too narrow for “any pptx”)

Acceptance / test:
- The new skill exists at `~/.codex/skills/pptx-presentation-builder/SKILL.md`
- The skill frontmatter and content clearly guide future PPTX tasks and reference verification expectations

## D-20260321-0820
Date: 2026-03-21 08:20
Inputs: [CR-20260321-0820](requests.md#cr-20260321-0820)
PRD: [Global Codex PPTX Skill](PRD.md#global-codex-pptx-skill-sources-cr-20260321-0815-d-20260321-0815)
Spec: [`specs/20260321-pptx-codex-skill/spec.md`](specs/20260321-pptx-codex-skill/spec.md)

Decision:
Extend the global PPTX skill with reusable helper scripts: one scaffold script that creates starter build/test files in the current repo, and one inspection script that validates a generated `.pptx` artifact.

Rationale:
- A skill that only describes a workflow still leaves repetitive setup work for future sessions.
- Scaffolding and inspection are the two recurring tasks that are broad enough to reuse across deck projects without hard-coding one repo's slide content.
- Keeping the scripts inside the global skill directory makes the skill self-contained and directly usable.

Alternatives considered:
- Embed large code blocks only in `SKILL.md` (rejected: less reusable, harder to invoke)
- Ship one monolithic generator script (rejected: too opinionated for “any pptx” use case)

Acceptance / test:
- The global skill directory contains helper scripts under `~/.codex/skills/pptx-presentation-builder/scripts/`
- The skill text references those scripts and their intended usage

## D-20260321-0826
Date: 2026-03-21 08:26
Inputs: [CR-20260321-0826](requests.md#cr-20260321-0826)
PRD: [Repository Licensing](PRD.md#repository-licensing-sources-cr-20260321-0826-d-20260321-0826)
Spec: [`specs/20260321-proprietary-license/spec.md`](specs/20260321-proprietary-license/spec.md)

Decision:
Implement the request by adding a repo-root `LICENSE` file with a proprietary "All Rights Reserved" notice, marking `package.json` as `UNLICENSED`, and updating the README license section to state that the project is not open source.

Rationale:
- A top-level `LICENSE` file is the clearest repository-wide statement of rights and restrictions.
- `package.json` metadata should match the repo-wide legal notice for tooling and package consumers.
- The README should make the status visible to human readers without requiring them to inspect metadata files.

Alternatives considered:
- Rely only on `"private": true` in `package.json` (rejected: private publication status is not the same as an explicit license notice)
- Add only a `LICENSE` file and leave existing README/package metadata unchanged (rejected: inconsistent signals across the repo)

Acceptance / test:
- `LICENSE` states the project is proprietary, not open source, and all rights are reserved
- `package.json` contains `"license": "UNLICENSED"`
- `README.md` license section matches the proprietary status

## D-20260321-0831
Date: 2026-03-21 08:31
Inputs: [CR-20260321-0831](requests.md#cr-20260321-0831)
PRD: [Main Publication](PRD.md#main-publication-sources-cr-20260321-0831-d-20260321-0831)
Spec: [`specs/20260321-main-publication/spec.md`](specs/20260321-main-publication/spec.md)

Decision:
Publish the current repo-scoped March 21 work by committing the tracked deck-export, licensing, and ATHENA-doc changes on `main`, pushing them to `origin/main`, and excluding the duplicate renamed PPTX and Office lock file from the commit.

Rationale:
- The repo requirements and scripts consistently target `deck.pptx`; the duplicate `cortege-AI-Agents-Week-long-Hack.pptx` is not referenced by the repo and would be redundant in source control.
- The `~$...pptx` file is a transient Office lock artifact and should never be checked in.
- The requested outcome is a clean publication of the current real work to the remote default branch.

Alternatives considered:
- Commit every untracked file in the repo root indiscriminately (rejected: would publish temp/redundant local artifacts)
- Push without a local commit (rejected: there is no local commit to publish yet)

Acceptance / test:
- A local commit records the intended March 21 repo changes with ATHENA traceability
- `origin/main` advances to that commit
- The pushed commit excludes `cortege-AI-Agents-Week-long-Hack.pptx` and `~$cortege-AI-Agents-Week-long-Hack.pptx`

## D-20260321-0836
Date: 2026-03-21 08:36
Inputs: [CR-20260321-0836](requests.md#cr-20260321-0836)
PRD: [PowerPoint Deck Export](PRD.md#powerpoint-deck-export-sources-cr-20260321-0801-cr-20260321-0836-d-20260321-0801-d-20260321-0836)
Spec: [`specs/20260321-pptx-artifact-swap/spec.md`](specs/20260321-pptx-artifact-swap/spec.md)

Decision:
Interpret the requested `demo.pptx` removal as removal of the currently tracked repo deck artifact `deck.pptx`, because no `demo.pptx` exists. Make `cortege-AI-Agents-Week-long-Hack.pptx` the canonical repo deck artifact and update the generator, verification script, and current docs to target that filename.

Rationale:
- The user explicitly named `cortege-AI-Agents-Week-long-Hack.pptx` as the file to use.
- There is no `demo.pptx` in the repository, so the nearest current PPTX artifact to remove is `deck.pptx`.
- Updating the generator and verification script keeps future repo behavior aligned with the canonical artifact name instead of leaving the filename swap as a one-off manual exception.

Alternatives considered:
- Ask a clarifying question before acting (rejected: the repo context makes the intended swap reasonably inferable)
- Keep `deck.pptx` as the generated artifact and treat `cortege-AI-Agents-Week-long-Hack.pptx` as a one-off manual export (rejected: inconsistent repo contract)

Acceptance / test:
- `deck.pptx` is removed from source control
- `cortege-AI-Agents-Week-long-Hack.pptx` remains the tracked deck artifact
- The deck generator and verification script target `cortege-AI-Agents-Week-long-Hack.pptx`

## D-20260323-1000
Date: 2026-03-23 10:00
Inputs: CR-20260323-1000
PRD: WARDEN Agent — Data Broker Removal

Decision:
Implement WARDEN as a separate server-side subsystem (`server/warden/`), not as an AgentInstance subclass. Browser automation uses Playwright (already installed). CAPTCHA escalation uses screenshot + direct-link approach (not live CDP proxy). Social graph discovery is read-only — extracts "associated people" from broker listings and surfaces as suggested household members, never auto-removes. Broker-specific opt-out procedures stored as declarative JSON files. Ten initial brokers: WhitePages, Spokeo, MyLife, FastPeopleSearch, BeenVerified, Intelius, TruePeopleSearch, Radaris, USSearch, PeopleSearch.

Rationale:
- Existing AgentInstance pattern is reactive (event → Claude → assessment). WARDEN is proactive (schedule → browser → form submission), requiring a different execution model.
- Declarative JSON broker steps allow adding new brokers without code changes.
- Screenshot + direct link for CAPTCHA is simpler to implement at hackathon scope; full CDP proxy is a post-hackathon enhancement.
- Read-only social graph discovery avoids consent issues — household member explicitly opts in by clicking "Add to Household."

Alternatives considered:
- AgentInstance subclass (rejected: hollow override of every meaningful method, wrong conceptual fit)
- Live CDP browser proxy for CAPTCHA (rejected: too complex for hackathon; screenshot polling with direct link demonstrates the concept adequately)
- Auto-remove all associated people (rejected: consent requirements — only registered household members should have PII removed on their behalf)

Acceptance / test:
- `server/warden/` subsystem starts/stops cleanly with the orchestrator
- Declarative broker steps execute against a Playwright session
- CAPTCHA detection emits L3 escalation → CaptchaAssist modal appears in UI
- Discovered associates appear in UI with Add to Household action


## D-20260324-1000
Date: 2026-03-24 10:00
Inputs: [CR-20260324-1000](requests.md#cr-20260324-1000)
PRD: [Companion Agent Creation Bug](PRD.md#companion-agent-creation-bug)
Spec: [`specs/20260324-companion-agent-creation-bug/spec.md`](specs/20260324-companion-agent-creation-bug/spec.md)

Decision:
The root cause is that the orchestrator activates the first household alphabetically at startup, which is currently an E2E test household with 0 members. The Seattle Parsons household exists with 4 members but is not being activated. The fix is to either: (1) set DEFAULT_HOUSEHOLD_ID in .env to the desired household, or (2) clean up test households after E2E runs, or (3) change the default selection logic to skip empty households.

Rationale:
- The agent factory code is working correctly - it creates one instance per member
- The household store correctly decrypts all 4 members from the encrypted JSON
- The orchestrator correctly calls `createInstances(templates, members)` with the active household's members
- The problem is that the wrong household is being activated at startup
- Test households created by E2E tests are persisting and interfering with the demo

Alternatives considered:
- Bug in agent factory (rejected - code is correct, creates one instance per member)
- Bug in household decryption (rejected - all 4 members are properly decrypted)
- Bug in orchestrator activation (rejected - activation logic is correct)

Acceptance / test:
- Set DEFAULT_HOUSEHOLD_ID=hh_fab2e400 in .env
- Restart server
- Verify 4 companion agents are created for the Seattle Parsons household
- Verify all 4 members show in the UI companion section


## D-20260325-1000
Date: 2026-03-25 10:00
Inputs: [CR-20260325-1000](requests.md#cr-20260325-1000)
PRD: [WARDEN Agent](PRD.md#warden-agent)
Spec: [`.kiro/specs/warden-headed-browser-mode/requirements.md`](../.kiro/specs/warden-headed-browser-mode/requirements.md)

Decision:
Implement headed/headless browser mode selection for WARDEN data broker scans with priority-based resolution: user override > broker config > env var > default. Run comprehensive security audit before merge.

Rationale:
- Cloudflare-protected brokers (Spokeo, CyberBackgroundChecks) require manual CAPTCHA resolution
- Headed mode (visible browser) allows household members to solve CAPTCHAs
- Headless mode (background browser) provides automated scanning for non-protected brokers
- Priority-based resolution provides flexibility: per-scan override, per-broker defaults, global config
- Security audit ensures PII protection, input validation, and browser session security before production
- Mode tracking in scan history provides audit trail for compliance

Alternatives considered:
- Always use headed mode (rejected — wastes resources on non-CAPTCHA brokers)
- Always use headless mode (rejected — fails on Cloudflare-protected brokers)
- Manual mode selection only (rejected — no per-broker defaults, poor UX)
- Skip security audit (rejected — PII handling and browser security are critical)

Acceptance / test:
- ModeResolver implements priority-based resolution (7 unit tests)
- WARDEN Engine integrates mode resolution with session tracking
- Broker Scan Store persists mode in scan history
- POST /api/warden/scan/headed endpoint validates inputs and queues headed scans
- Spokeo and CyberBackgroundChecks flagged with requires_headed_mode: true
- Security audit: NO CRITICAL ISSUES FOUND
- All 224 tests passing (221 pass, 3 skip, 0 fail)
- OWASP Top 10 compliance verified
- Privacy and data protection requirements met
- Documentation: API.md, .env.example, IMPLEMENTATION_SUMMARY.md, WARDEN_SECURITY_AUDIT_2026-03-25.md

## D-20260819-1922
Date: 2026-08-19 19:22
Inputs: [CR-20260819-1922](requests.md#cr-20260819-1922), [CR-20260819-1924](requests.md#cr-20260819-1924)
PRD: [WARDEN Mobile App](PRD.md#warden-mobile-app-shipaton-spinoff-sources-cr-20260819-1922-d-20260819-1922-cr-20260819-1924)
Spec: [`specs/20260819-warden-mobile-app/spec.md`](specs/20260819-warden-mobile-app/spec.md)

Decision:
Spin WARDEN's data-broker-scan engine out into a standalone Expo/React Native mobile app, extending the existing CORTEGE Node server rather than extracting or rebuilding it. MVP: free one-time broker-exposure scan, paid subscription unlocks continuous re-scan/monitoring (no automated removal filing or family plan tier in v1). Sign-in via Apple/Google only (no email/password or magic link). Single RevenueCat entitlement ("Monitoring", monthly + annual packages). On-device/local-model inference scoped to exposure summarization only (platform-native APIs — iOS Foundation Models, Android Gemini Nano — with a plain template-string fallback; no bundled cross-platform LLM). New `mobile/` Expo project added inside this repo, no separate repo or monorepo tooling.

Rationale:
- Built as a real product decision, not a hackathon scramble — user explicitly chose "real product, hackathon is opportunistic" over "Shipaton deadline drives scope"
- Expo/React Native is the closest framework to the team's existing Vite/React stack and has first-party RevenueCat support
- WARDEN's broker-scan crawling requires real browser automation (Playwright) against 44 external sites — this cannot run on-device, so it must stay server-side regardless of any local-model requirement
- The user's "must run locally using a local model" constraint was ambiguous between (a) on-device scam/fraud call/text triage (a return to CORTEGE's original ANCHOR/SENTINEL/SCOUT concept) and (b) local summarization of already-fetched scan results; ai-pm ML-strategy analysis found (a) carries high false-negative risk on real fraud detection plus platform-fragmentation risk (Android on-device models are largely flagship-only) and reopens the "scope too broad" criticism from the prior judged round (see `docs/cortege-judge-feedback.md`) — user confirmed (b), the low-stakes option
- Single-tier MVP (free scan / paid monitoring only) matches the already-narrow scope decision and keeps the RevenueCat paywall configuration simple
- Apple/Google sign-in avoids building and owning email-sending infrastructure or password-reset flows, and Apple requires "Sign in with Apple" anyway if any other social login is offered on iOS
- Extending the existing server (vs. extracting WARDEN into its own service, or building a new backend) reuses the working scan engine directly and matches the "real product but move fast" framing — there's minimal code to share between the Vite web app and an Expo app either way, so a second repo/monorepo tooling isn't justified

Alternatives considered:
- Flutter or native iOS/Android (rejected — no overlap with the team's existing React stack; native also doubles the build into two codebases)
- Extract WARDEN into its own service, or build a new backend and port WARDEN logic in (rejected — real extraction/rebuild work with no v1 payoff; revisit if the mobile product outgrows the shared server)
- Full concept in v1 (free scan + paid monitoring + automated removal + family plan) (rejected — largest scope option; deferred past v1 per the "scope too broad" lesson)
- On-device scam/fraud call/text triage as the flagship local-model feature (rejected for v1 — high-severity ML risk per ai-pm analysis; a candidate for a deliberate future feature, not bolted onto the broker-scan app)
- Email + magic link or email + password for auth (rejected — magic link needs email-sending infra to build/own; password needs reset-flow ownership; both convert worse on mobile than native social sign-in)
- Bundled cross-platform local LLM (llama.cpp/GGUF or MLX) for summarization (rejected — adds app size and eval burden disproportionate to a feature that isn't privacy- or latency-critical, since broker listings are public data)

Acceptance / test:
- `mobile/` Expo project exists inside `cortege-hackathon`, builds and runs against the existing CORTEGE server
- A free scan can be triggered from the mobile app and returns broker-exposure results sourced from the existing WARDEN engine
- RevenueCat "Monitoring" entitlement gates continuous re-scan/monitoring; unentitled users see scan results only, no re-scan
- Sign-in works via Apple on iOS and Google on Android with no email/password path present
- Exposure summarization uses the platform-native on-device API where available and falls back to a template string where not, with no bundled model shipped in the app binary
