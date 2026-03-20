# Customer Requests (append-only)

## CR-20260314-1320
Date: 2026-03-14 13:20
Source: chat
Decision: [D-20260314-1320](decisions.md#d-20260314-1320)
Spec: [`specs/20260314-hackathon-setup/spec.md`](specs/20260314-hackathon-setup/spec.md)

Request (verbatim):
review the files in the folder, create a project for this hackathon and create, git init, change and push to https://github.com/taylorparsons/cortege-hackathon

Notes:
- Existing files: [`cortege-v2-prototype.jsx`](../cortege-v2-prototype.jsx) (React UI prototype) and [`GUARDIAN_PRD_v2_Addendum.docx`](../GUARDIAN_PRD_v2_Addendum.docx) (PRD for Companion Model)
- Goal: Initialize as a proper project, commit, and push to GitHub

## CR-20260314-1500
Date: 2026-03-14 15:00
Source: chat
Decision: [D-20260314-1500](decisions.md#d-20260314-1500)
Spec: [`specs/20260314-skill-setup/spec.md`](specs/20260314-skill-setup/spec.md)

Request (verbatim):
setup the skills needed for this project / max effort

Notes:
- Project is a Vite + React hackathon prototype for an AI security companion product
- Only athena is currently installed in `.claude/skills/`
- Global skills available: daisy, verification-before-completion, peas, skill-creator, taylor-style-voice, create-plan, career-graph-resume-writer, squarespace-brine-7

## CR-20260314-1510
Date: 2026-03-14 15:10
Source: chat
Decision: [D-20260314-1510](decisions.md#d-20260314-1510)
Spec: [`specs/20260314-superpowers-setup/spec.md`](specs/20260314-superpowers-setup/spec.md)

Request (verbatim):
add in all superskills

Notes:
- "superskills" interpreted as the superpowers plugin skills (superpowers@claude-plugins-official)
- Plugin is globally enabled; user wants them added to the project

## CR-20260314-1600
Date: 2026-03-14 16:00
Source: chat
Decision: [D-20260314-1600](decisions.md#d-20260314-1600)
Design spec: [`superpowers/specs/2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md)

Request (verbatim):
use the superpowers to brain storm on how create the group of agents that will run based on events and timing that will report back and a central orchestrator to interact with the user to assure that the account is protected. read the documentation to get the scope and offer options and of course work with Athena

Notes:
- User wants to design the companion agent system from the [GUARDIAN PRD v2](../GUARDIAN_PRD_v2_Addendum.docx)
- Agents should be event-driven and time-driven with a central orchestrator
- Must support hackathon participants creating new agents from a pattern
- Twilio integration for real inbound calls (account exists, plug in later)
- Demo should show agents learning over time
- Scope narrowed to: architecture design + lightweight PoC, one fully working agent, agent factory pattern for extensibility
## CR-20260314-1600
Date: 2026-03-14 16:00
Source: chat
Decision: [D-20260314-1600](decisions.md#d-20260314-1600)
Design spec: [`superpowers/specs/2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md)

Request (verbatim):
use the superpowers to brain storm on how create the group of agents that will run based on events and timing that will report back and a central orchestrator to interact with the user to assure that the account is protected. read the documentation to get the scope and offer options and of course work with Athena

Notes:
- User wants to design the companion agent system from the [GUARDIAN PRD v2](../GUARDIAN_PRD_v2_Addendum.docx)
- Agents should be event-driven and time-driven with a central orchestrator
- Must support hackathon participants creating new agents from a pattern
- Twilio integration for real inbound calls (account exists, plug in later)
- Demo should show agents learning over time
- Scope narrowed to: architecture design + lightweight PoC, one fully working agent, agent factory pattern for extensibility

## CR-20260315-1155
Date: 2026-03-15 11:55
Source: chat

Request (verbatim):
what type of storage would be a good fit for this?

Notes:
- User asked about storage options for the agent orchestration system design

## CR-20260315-1202
Date: 2026-03-15 12:02
Source: chat

Request (verbatim):
the system needs to be auditable

Notes:
- User added auditability as a non-functional requirement

## CR-20260315-1203
Date: 2026-03-15 12:03
Source: chat

Request (verbatim):
what about a mern stack ?

Notes:
- User asked about MERN stack as an alternative architecture

## CR-20260315-1252
Date: 2026-03-15 12:52
Source: chat

Request (verbatim):
will graph dp help as a knowledge store?

Notes:
- User asked about graph databases for the knowledge store

## CR-20260317-1400
Date: 2026-03-17 14:00
Source: chat

Request (verbatim):
can you create a spec and also use the Athena skill?

Notes:
- User wants to create an implementation spec for the agent orchestration system
- Design spec already exists at docs/superpowers/specs/2026-03-14-agent-orchestration-design.md
- Request follows review of MVP design documents

## CR-20260317-1400
Date: 2026-03-17 14:00
Source: chat
Spec: [`.kiro/specs/agent-orchestration-implementation/requirements.md`](../.kiro/specs/agent-orchestration-implementation/requirements.md)

Request (verbatim):
Create an implementation spec for the agent orchestration system based on the existing design documents.

Feature name: agent-orchestration-implementation

Context:
- This is a NEW FEATURE to build the agent orchestration framework
- Design documents already exist at:
  - docs/superpowers/specs/2026-03-14-agent-orchestration-design.md
  - docs/superpowers/specs/2026-03-14-agent-orchestration-diagrams.md
- User selected: Technical Design [High-Level Design, Low-Level Design]
- Customer request: CR-20260317-1400

The design includes:
- Event Bus + Agent Pool architecture (Node.js + EventEmitter)
- Agent templates as markdown files (YAML frontmatter + markdown body)
- Agent Factory pattern for extensibility
- Memory store with 4 maturity stages (Baseline → Pattern Recognition → Predictive → Cortege Mode)
- Claude API integration with structured responses
- REST + WebSocket API for React frontend
- Event simulator, manual injection, and Twilio webhook ingestion
- Escalation handler routing by threat level (L0-L4)
- Accelerated learning for hackathon demos

Reference the existing design documents and create the spec structure following Athena conventions.

Notes:
- Implementation spec derived from existing design documents
- Follows Design-First workflow (design → requirements → tasks)
- Spec created at `.kiro/specs/agent-orchestration-implementation/`
- 48 functional requirements, 15 non-functional requirements
- 10 edge cases documented
- 10 phases with 100+ implementation tasks
- Estimated effort: 10-17 days (2-3.5 weeks)

## CR-20260318-1000
Date: 2026-03-18 10:00
Source: chat

Request (verbatim):
Implement the following plan: Output Token Optimization + Prompt Caching. Reduce per-event cost by ~70-80% through output token reduction + input caching, without breaking any downstream consumer. Three changes: (1) Slim response schema — remove event_id, agent, instance, stage_check from submit_assessment tool, constrain assessment to 30 words, add signal enum codes. (2) Server backfills removed fields after parsing. (3) Prompt caching — split callClaude to accept templateBody + memoryText, use Anthropic system message array with cache_control on static template prefix.

Notes:
- Plan already brainstormed and written in plan mode
- Touches: response-schema.js, claude-client.js, agent-instance.js, all 3 agent templates, tests
- Cost target: 64% reduction per event with cache hits

## CR-20260318-1640
Date: 2026-03-18 16:40
Source: chat

Request (verbatim):
this folder name docs/specs/production-deployment and references to it should be called working demo with twillio. I want this workin in local host and to have the UI only show what is working with real use cases.

Notes:
- Context: User asked about Twilio integration with T-Mobile numbers and where it's documented
- Current state: System is running in demo mode with event simulator, Twilio webhook is stubbed
- Need: Working localhost demo with real Twilio integration (not full production deployment)
- Goal: Rename spec folder, wire Twilio webhook for localhost testing, update UI to show only working features with real use cases
- Focus on call forwarding as integration method for rapid testing


## CR-20260318-1700
Date: 2026-03-18 17:00
Source: chat

Request (verbatim):
yes use the athan skill to make this change for the API

Notes:
- Context: User asked if there's built-in API documentation (Swagger/OpenAPI)
- Current state: No built-in docs, but routes.js has good inline comments
- Need: Create comprehensive API documentation file (docs/API.md) with examples
- Available endpoints: household, companions, events, scenarios, agents, manual events, Twilio webhooks
- Documentation should include request/response examples and query parameters

## CR-20260318-1800
Date: 2026-03-18 18:00
Source: chat

Request (verbatim):
create a new spec for docs/superpowers/specs "For production, consider SQLite" ❌ (not implemented, future work)"For auditability, use SQLite with hash chain" ❌ (not implemented, future work)

Notes:
- Context: Verification revealed that 20260315-storage-auditability spec only documented decisions, did not implement SQLite or auditability features
- Current state: System uses mutable JSON files (data/memories/*.json, data/events/*.jsonl)
- Need: Implement production-ready SQLite storage with tamper-evident audit trail
- Referenced decisions: D-20260315-1155 (SQLite for production), D-20260315-1202 (auditability with hash chain)

## CR-20260319-1000
Date: 2026-03-19 10:00
Source: chat

Request (verbatim):
update the web app so that it only uses data from the API, mocked data use cases are ok, but nothing on the web app is 100% fake. I want it to be more of a trusted background app that builds trust over time

Notes:
- Current state: Main "Household" tab uses 100% hardcoded mock data (HOUSEHOLD, COMPANIONS constants in Cortege.jsx)
- Backend API exists and returns real data: GET /api/household, GET /api/companions, GET /api/companions/:id/activity, GET /api/companions/:id/memory
- WebSocket integration exists but only updates the "Live Feed" tab, not the main Household view
- Mock data includes rich fields (recentActivity, graph stats, silentActionsToday) that the API doesn't yet provide
- User wants: real data from the API, UI builds trust over time, nothing fake on display
- Demo scenarios running through the API = OK (that's real system data, not hardcoded)

## CR-20260319-1654
Date: 2026-03-19 16:54
Source: chat

Request (verbatim):
Implement the plan.

Notes:
- Context from same session: user asked to "use $athena to make the right fix" after confirming the UI still showed "Cannot reach backend" when started via `./run-local.sh`
- Verified root cause: frontend was calling absolute `http://localhost:3001` / `ws://localhost:3001/ws` from Vite dev origin `http://localhost:5173` with no Vite proxy and no backend CORS
- User goal remains: have the UI use real APIs locally rather than demo-only data

## CR-20260319-1707
Date: 2026-03-19 17:07
Source: chat

Request (verbatim):
add this to .gitignore data/cortege.db.backup.1773876131352

## CR-20260319-1709
Date: 2026-03-19 17:09
Source: chat

Request (verbatim):
add detailed commennt and what has changed and push it to remote on the design branch


## CR-20260319-1730
Date: 2026-03-19 17:30
Source: chat
Decision: [D-20260319-1730](decisions.md#d-20260319-1730)
Spec: [`specs/20260319-add-household-feature/spec.md`](specs/20260319-add-household-feature/spec.md)
Plan: [`superpowers/plans/2026-03-19-add-household-feature.md`](superpowers/plans/2026-03-19-add-household-feature.md)

Request (verbatim):
can you access the superpower planner?

using superpowers-writing-plans skillplan how to add a new house hold to the app

Use athena do document the change to implement this add household feature and use skill suerpowers executing-plans to complete the work

Notes:
- User wants to add multi-household management capability to CORTEGE
- Currently system supports single household in data/household.json
- Need to support creating, managing, and switching between multiple households
- Implementation plan already created at docs/superpowers/plans/2026-03-19-add-household-feature.md


## CR-20260320-1000
Date: 2026-03-20 10:00
Source: chat

Request (verbatim):
have you created end to end tests ?
playwright cypress with with athena and superpowers

Notes:
- User wants E2E tests using both Playwright and Cypress
- Tests should cover the full CORTEGE application (household management, companion dashboard, etc.)
- Follow ATHENA and superpowers workflows for implementation

## CR-20260320-1100
Date: 2026-03-20 11:00
Source: chat

Request (verbatim):
You are implementing Phase 2: Playwright Setup + E2E Tests for the CORTEGE hackathon project. Install Playwright, create playwright.config.js, create e2e/helpers.js, and write 5 test files: navigation.spec.js (3 tests), household-crud.spec.js (4 tests), member-crud.spec.js (4 tests), companion-cards.spec.js (3 tests), live-feed.spec.js (2 tests). Use the provided data-testid attributes. Each test should use beforeEach to clean up via API helpers. Add test:e2e:pw script to package.json.

Notes:
- Continuation of CR-20260320-1000 (E2E tests request)
- Phase 2 of 3 (Phase 1 data-testid work already done, Phase 3 is Cypress)
- Frontend: Vite + React on port 5173; Backend: Express on port 3001
- All data-testid attributes already present in components
- Detailed spec provided: exact file paths, test names, helper signatures, playwright.config.js content

## CR-20260320-1147
Date: 2026-03-20 11:47
Source: chat
Decision: [D-20260320-1147](decisions.md#d-20260320-1147)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Request (verbatim):
Implement the plan.

Notes:
- Context from same session:
  - User wants household location normalized behind `location_id`
  - User wants full name, phone, address, and date of birth treated as protected PII
  - User wants PII encrypted at rest
  - User wants no cleartext PII in logs
  - User wants no raw PII sent to external LLM calls
- Scope chosen for implementation:
  - Add privacy primitives for encryption, tokenization, redaction, and LLM sanitization
  - Add a location store and make household records reference `location_id`
  - Encrypt member and location PII fields in persisted household data
  - Update API and UI flows to use the new location model and trusted decrypted read paths

## CR-20260320-1203
Date: 2026-03-20 12:03
Source: chat
Decision: [D-20260320-1203](decisions.md#d-20260320-1203)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)

Request (verbatim):
yes fold into athena

Notes:
- Continuation of the active privacy/location feature
- User approved adding explicit full location CRUD coverage to the plan
- Added scope:
  - UI for listing saved locations
  - UI for editing a location name/address
  - UI for deleting a location with safeguards if households still reference it
  - API delete rule should reject deleting referenced locations until reassignment happens

## CR-20260320-1220
Date: 2026-03-20 12:20
Source: chat
Decision: [D-20260320-1220](decisions.md#d-20260320-1220)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)
Plan: [`superpowers/plans/2026-03-20-pii-encryption-location-model.md`](superpowers/plans/2026-03-20-pii-encryption-location-model.md)

Request (verbatim):
great do it

Notes:
- User approved converting the active privacy/location feature into a superpowers-grade execution plan
- Need: break the current ATHENA task list into smaller file-scoped tasks and save a planner document in docs/superpowers/plans/

## CR-20260320-1228
Date: 2026-03-20 12:28
Source: chat
Decision: [D-20260320-1228](decisions.md#d-20260320-1228)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)
Plan: [`superpowers/plans/2026-03-20-pii-encryption-location-model.md`](superpowers/plans/2026-03-20-pii-encryption-location-model.md)

Request (verbatim):
yes make it happen

Notes:
- Continuation of the same privacy/location feature after the superpowers planning pass
- User is now asking for implementation, not further planning

## CR-20260320-1248
Date: 2026-03-20 12:48
Source: chat
Decision: [D-20260320-1248](decisions.md#d-20260320-1248)
Spec: [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md)
Plan: [`superpowers/plans/2026-03-20-pii-encryption-location-model.md`](superpowers/plans/2026-03-20-pii-encryption-location-model.md)

Request (verbatim):
commit these changes with comment based on the athena docs and superpowers

Notes:
- User wants the completed privacy/location feature work committed now
- Commit message should be grounded in the ATHENA traceability docs and the superpowers execution context

## CR-20260320-1315
Date: 2026-03-20 13:15
Source: chat
Decision: [D-20260320-1315](decisions.md#d-20260320-1315)
Spec: [`specs/20260320-readme-alignment/spec.md`](specs/20260320-readme-alignment/spec.md)

Request (verbatim):
yes fit it

Notes:
- Continuation of the README review request in the same session
- User wants the top-level onboarding docs fixed so `README.md` reflects the shipped location/privacy implementation

## CR-20260320-1345
Date: 2026-03-20 13:45
Source: chat
Decision: [D-20260320-1345](decisions.md#d-20260320-1345)
Spec: [`specs/20260320-main-branch-push/spec.md`](specs/20260320-main-branch-push/spec.md)

Request (verbatim):
push to remote on the main branch

Notes:
- User explicitly requested publication to `origin/main`
- Current branch contains an uncommitted README/docs alignment follow-up on top of the verified privacy/location feature branch
