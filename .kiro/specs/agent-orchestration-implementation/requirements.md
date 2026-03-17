# Feature Spec: Agent Orchestration Implementation

Status: Draft
Created: 2026-03-17 14:00
Inputs: CR-20260317-1400
Decisions: D-20260314-1600
Design: docs/superpowers/specs/2026-03-14-agent-orchestration-design.md

## Summary

Implementation of the agent orchestration framework for CORTEGE v2 companion agents. This framework provides event-driven agent coordination with Claude API-powered intelligence, markdown-based agent templates, per-instance memory stores, and learning capabilities. The system is use-case agnostic — agents, scenarios, and household configurations are swappable without code changes.

Sources: CR-20260317-1400; D-20260314-1600

## User Stories & Acceptance

### US1: Agent Template System (Priority: P0)
Narrative:
- As a hackathon participant, I want to create a new agent type by writing a markdown file, so that I can extend the system without writing code.

Acceptance scenarios:
1. Given an `agents/my-agent/agent.md` file with valid YAML frontmatter and markdown body, When the orchestrator starts or reloads, Then the agent type is registered and available for instantiation. (Verifies: FR-001, FR-002, FR-003)
2. Given an agent template with `events: [inbound_call]`, When an `inbound_call` event is emitted, Then the agent instance receives the event. (Verifies: FR-004)
3. Given an invalid agent template (missing required fields), When the orchestrator loads templates, Then the template is skipped with a clear error message and the server continues. (Verifies: FR-005)

### US2: Event-Driven Processing (Priority: P0)
Narrative:
- As the orchestrator, I want to route events to subscribed agents, so that agents only process relevant events.

Acceptance scenarios:
1. Given multiple agent instances with different event subscriptions, When an event is emitted, Then only agents subscribed to that event type receive it. (Verifies: FR-006, FR-007)
2. Given an event with `target_member: "member_002"`, When the event is routed, Then only the agent instance paired with member_002 processes it. (Verifies: FR-008)
3. Given an event source (simulator, manual, Twilio), When an event is ingested, Then it is normalized to CoreEvent format and persisted to JSONL before routing. (Verifies: FR-009, FR-010)


### US3: Claude Integration & Structured Responses (Priority: P0)
Narrative:
- As an agent instance, I want to call Claude API with my template prompt and memory, so that I can make intelligent threat assessments.

Acceptance scenarios:
1. Given an agent instance with a template prompt and memory store, When an event is processed, Then the Claude API is called with system prompt = template body + serialized memory. (Verifies: FR-011, FR-012)
2. Given a Claude API response with tool_use: submit_assessment, When the response is parsed, Then the structured AgentResponse is extracted and validated against the schema. (Verifies: FR-013, FR-014)
3. Given a Claude API timeout (>30s), When the call fails, Then the event is retried once after 2s and an agent:error WebSocket event is emitted. (Verifies: FR-015)

### US4: Memory Store & Learning (Priority: P0)
Narrative:
- As an agent instance, I want to accumulate behavioral knowledge over time, so that my assessments improve with experience.

Acceptance scenarios:
1. Given an agent instance with no prior memory, When the first event is processed, Then a memory store JSON file is created at `data/memories/<agent>-<member>.json`. (Verifies: FR-016)
2. Given a Claude response with `memory_updates`, When the orchestrator applies updates, Then the memory store is updated with the specified operations (add_trusted_contact, update_pattern, etc.). (Verifies: FR-017, FR-018)
3. Given an agent with accumulated memory, When the next event is processed, Then the memory is serialized and injected into the Claude prompt. (Verifies: FR-019)
4. Given an agent's depth_score crossing a stage threshold (0.25, 0.50, 0.75), When memory is updated, Then a stage:transition WebSocket event is emitted. (Verifies: FR-020, FR-021)

### US5: Escalation Handling (Priority: P0)
Narrative:
- As the orchestrator, I want to route agent actions by threat level, so that high-severity threats reach the primary companion.

Acceptance scenarios:
1. Given an agent response with threat_level 0-1, When actions are processed, Then they are logged only. (Verifies: FR-022)
2. Given an agent response with threat_level 3, When actions include escalate, Then an escalation:fired WebSocket event is sent to the primary companion's UI. (Verifies: FR-023, FR-024)
3. Given an agent response with threat_level 4, When actions are processed, Then evidence is captured and an emergency relay is triggered. (Verifies: FR-025)


### US6: Scenario Runner & Event Simulator (Priority: P0)
Narrative:
- As a demo presenter, I want to replay scripted event sequences, so that I can show learning progression in a controlled demo.

Acceptance scenarios:
1. Given a scenario file at `scenarios/grandparent-scam.json`, When `POST /api/scenarios/grandparent-scam/run` is called, Then events are fired in sequence with specified delays. (Verifies: FR-026, FR-027)
2. Given a scenario with `learning_boost: 5`, When events are processed, Then each event's weight is multiplied by 5 for depth score calculation. (Verifies: FR-028)
3. Given `LEARNING_TIME_MULTIPLIER=1440`, When 1 real minute passes, Then the simulated time advances by 1 day. (Verifies: FR-029)

### US7: REST & WebSocket API (Priority: P0)
Narrative:
- As the React frontend, I want to query agent state and receive real-time updates, so that the UI reflects current system status.

Acceptance scenarios:
1. Given active agent instances, When `GET /api/companions` is called, Then a list of all companions with current status is returned. (Verifies: FR-030)
2. Given an agent instance ID, When `GET /api/companions/:id/memory` is called, Then the agent's memory store is returned as JSON. (Verifies: FR-031)
3. Given a WebSocket connection, When an event is processed, Then event:received, agent:processing, and agent:response events are emitted in sequence. (Verifies: FR-032, FR-033)
4. Given a WebSocket connection, When a memory update occurs, Then a memory:updated event is emitted with the agent instance ID. (Verifies: FR-034)

### US8: Household Configuration & Agent Pairing (Priority: P0)
Narrative:
- As the orchestrator, I want to pair household members with appropriate agent types, so that each member has a dedicated companion.

Acceptance scenarios:
1. Given `data/household.json` with 3 members, When the orchestrator starts, Then 3 agent instances are created (one per member). (Verifies: FR-035, FR-036)
2. Given a member with `profile_type: "senior"` and an agent template with `profile_type: "senior"`, When pairing occurs, Then the member is assigned that agent type. (Verifies: FR-037)
3. Given a member with `companion: "anchor"` override, When pairing occurs, Then the explicit agent type is used regardless of profile_type. (Verifies: FR-038)


## Requirements

### Functional Requirements

#### Agent Template System
- FR-001: The system SHALL scan `agents/` directory on startup and register all agent types found. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-002: Each agent template SHALL be a markdown file with YAML frontmatter (config) and markdown body (Claude system prompt). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-003: Required frontmatter fields: `name`, `events`, `threat_model`, `escalation`, `learning`. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-004: The `events` field SHALL define which event types the agent subscribes to. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-005: Invalid templates SHALL be skipped with a clear error message; the server SHALL continue with valid agents. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-006: The system SHALL support hot-reload via `POST /api/agents/reload` without server restart. (Sources: CR-20260317-1400; D-20260314-1600)

#### Event Bus & Routing
- FR-007: The event bus SHALL be implemented using Node.js EventEmitter with typed event channels. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-008: Events SHALL be routed to agent instances based on: (1) event type subscription, (2) target_member matching. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-009: All events SHALL be normalized to CoreEvent format before routing. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-010: Events SHALL be persisted to `data/events/YYYY-MM-DD.jsonl` (one JSON object per line, one file per day). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-011: The event bus SHALL support replay by reading JSONL files in chronological order. (Sources: CR-20260317-1400; D-20260314-1600)

#### Claude Integration
- FR-012: Each agent call SHALL be one Claude API request with system prompt = template markdown + serialized memory. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-013: The system SHALL use Claude tool_use with `submit_assessment` tool definition to enforce structured responses. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-014: AgentResponse schema SHALL include: event_id, agent, instance, threat_level (0-4), confidence, assessment, signals, actions, memory_updates, stage_check. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-015: Claude API failures SHALL be handled: timeout (>30s) → retry once after 2s; rate limit (429) → exponential backoff (2s, 4s, 8s, max 3 retries); malformed response → log as L1, emit agent:error. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-016: The default Claude model SHALL be `claude-haiku-4-5-20251001` (configurable via `CLAUDE_MODEL` env var). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-017: Agent templates MAY override the model via `model` field in frontmatter. (Sources: CR-20260317-1400; D-20260314-1600)


#### Memory Store & Learning
- FR-018: Each agent instance SHALL have a dedicated memory store at `data/memories/<agent>-<member>.json`. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-019: Memory store structure SHALL include: agent, member, member_id, created, stage, events_processed, depth_score, trusted_contacts, communication_patterns, financial_baseline, blocked_contacts, threat_history, learned_patterns, observations. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-020: The system SHALL support memory update operations: add_trusted_contact, remove_trusted_contact, add_threat_record, update_pattern, update_baseline, block_contact, add_observation. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-021: Memory updates SHALL be applied atomically after each Claude response. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-022: Depth score SHALL be calculated as weighted average of: trusted_contacts_count, days_active, events_processed, learned_patterns_count. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-023: Four maturity stages SHALL be defined: Baseline (0.0-0.25), Pattern Recognition (0.25-0.50), Predictive (0.50-0.75), Cortege Mode (0.75-1.0). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-024: Stage transitions SHALL emit a `stage:transition` WebSocket event. (Sources: CR-20260317-1400; D-20260314-1600)

#### Escalation Handling
- FR-025: The escalation handler SHALL route actions by threat level: L0-L1 → log only; L2 → monitor; L3 → notify primary companion; L4 → emergency relay + evidence capture. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-026: L3 and L4 escalations SHALL emit `escalation:fired` WebSocket events. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-027: The primary companion SHALL be determined from `household.json` (`is_primary: true` or `primary_contact` field). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-028: Action types SHALL include: log, monitor, soft_block, hard_block, escalate, log_evidence. (Sources: CR-20260317-1400; D-20260314-1600)

#### Event Ingestion
- FR-029: The system SHALL support three ingestion sources: event simulator, manual injection API, Twilio voice webhook. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-030: Event simulator SHALL read scenario files from `scenarios/` directory. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-031: Scenario files SHALL define: name, description, target_member, learning_boost, events array with delay_ms and event payload. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-032: Manual injection SHALL be exposed via `POST /api/events` and a UI panel. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-033: Twilio webhook SHALL be exposed at `POST /ingest/twilio/voice` (plug in when account is configured). (Sources: CR-20260317-1400; D-20260314-1600)


#### REST & WebSocket API
- FR-034: REST API SHALL expose: GET /api/household, GET /api/companions, GET /api/companions/:id, GET /api/companions/:id/memory, GET /api/companions/:id/activity, GET /api/events, POST /api/events, POST /api/scenarios/:name/run, GET /api/agents, POST /api/agents/reload. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-035: WebSocket SHALL emit events: event:received, agent:processing, agent:response, escalation:fired, memory:updated, stage:transition, companion:status, agent:error. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-036: WebSocket SHALL be exposed at `ws://localhost:3001/ws`. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-037: REST API SHALL run on Express at port 3001 (configurable via `PORT` env var). (Sources: CR-20260317-1400; D-20260314-1600)

#### Household Configuration
- FR-038: Household configuration SHALL be stored in `data/household.json`. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-039: Each member SHALL have: id, name, age, profile_type, companion (optional override), is_primary, primary_contact (optional). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-040: Agent pairing SHALL match member `profile_type` to agent template `profile_type`, or use explicit `companion` override. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-041: One agent instance SHALL be created per household member. (Sources: CR-20260317-1400; D-20260314-1600)

#### Accelerated Learning (Demo Mode)
- FR-042: `LEARNING_TIME_MULTIPLIER` env var SHALL accelerate simulated time (default: 1440 = 1 real minute = 1 simulated day). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-043: `LEARNING_EVENT_WEIGHT` env var SHALL multiply event weight for depth score calculation (default: 10). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-044: `LEARNING_FAST_MODE` env var SHALL lower stage transition thresholds (default: true; Baseline→Pattern at 0.10, Pattern→Predictive at 0.25, Predictive→Cortege at 0.50). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-045: Scenario files MAY include `learning_boost` field to further multiply event weight for specific events. (Sources: CR-20260317-1400; D-20260314-1600)

#### Scheduler
- FR-046: The scheduler SHALL support cron-like timed events using `node-cron`. (Sources: CR-20260317-1400; D-20260314-1600)
- FR-047: Default scheduled tasks: `baseline_update` (every 24 simulated hours), `memory_snapshot` (every 12 simulated hours). (Sources: CR-20260317-1400; D-20260314-1600)
- FR-048: Agent templates MAY define custom schedules via `schedule` field in frontmatter. (Sources: CR-20260317-1400; D-20260314-1600)


### Non-Functional Requirements

#### Performance
- NFR-001: Claude API calls SHALL timeout after 30 seconds. (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-002: Event routing SHALL complete within 100ms (excluding Claude API call time). (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-003: Memory store updates SHALL be atomic (write to temp file, then rename). (Sources: CR-20260317-1400; D-20260314-1600)

#### Reliability
- NFR-004: No silent failures — all error paths SHALL either retry or surface to event log and WebSocket. (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-005: After max retries exhausted, events SHALL be logged as `unprocessed_event` in the event store. (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-006: Invalid agent templates SHALL not crash the server. (Sources: CR-20260317-1400; D-20260314-1600)

#### Auditability
- NFR-007: All events SHALL be persisted to append-only JSONL files. (Sources: CR-20260317-1400; D-20260314-1600; D-20260315-1202)
- NFR-008: Event log SHALL support full replay for audit trails. (Sources: CR-20260317-1400; D-20260314-1600; D-20260315-1202)
- NFR-009: Memory snapshots SHALL be timestamped for rollback capability. (Sources: CR-20260317-1400; D-20260314-1600)

#### Extensibility
- NFR-010: New agent types SHALL be addable without code changes (markdown file only). (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-011: New event types SHALL be addable by updating agent template subscriptions. (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-012: The framework SHALL be use-case agnostic — agents, scenarios, and household configs are swappable. (Sources: CR-20260317-1400; D-20260314-1600)

#### Security
- NFR-013: `ANTHROPIC_API_KEY` SHALL be stored in `.env` file (gitignored). (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-014: Twilio webhook SHALL validate request signatures when configured. (Sources: CR-20260317-1400; D-20260314-1600)
- NFR-015: Memory stores SHALL not be exposed via public API without authentication (future enhancement). (Sources: CR-20260317-1400; D-20260314-1600)


## Edge Cases

### EC1: Concurrent Event Processing
- Given two events for the same agent instance arriving simultaneously, When both are routed, Then they SHALL be processed sequentially (queue per agent instance). (Verifies: FR-008, NFR-002)

### EC2: Memory Store Corruption
- Given a corrupted memory store JSON file, When the agent instance loads, Then it SHALL initialize with a fresh memory store and log the corruption error. (Verifies: FR-018, NFR-004)

### EC3: Missing Household Member
- Given an event with `target_member` that doesn't exist in `household.json`, When the event is routed, Then it SHALL be logged as unroutable and emit an agent:error event. (Verifies: FR-008, NFR-004)

### EC4: Claude API Rate Limit Exhaustion
- Given Claude API rate limit (429) persisting after max retries, When the event processing fails, Then it SHALL be logged as `unprocessed_event` and surfaced in UI health indicator. (Verifies: FR-015, NFR-005)

### EC5: Scenario File with Invalid JSON
- Given a scenario file with malformed JSON, When `POST /api/scenarios/:name/run` is called, Then it SHALL return 400 Bad Request with a clear error message. (Verifies: FR-031, NFR-004)

### EC6: Agent Template Hot-Reload During Event Processing
- Given an agent instance processing an event, When `POST /api/agents/reload` is called, Then the reload SHALL wait for in-flight events to complete before reloading templates. (Verifies: FR-006, NFR-002)

### EC7: WebSocket Disconnection During Escalation
- Given a WebSocket client disconnected, When an L3/L4 escalation occurs, Then the escalation SHALL be queued and delivered when the client reconnects. (Verifies: FR-026, NFR-004)

### EC8: Depth Score Calculation with Zero Events
- Given an agent instance with zero events processed, When depth score is calculated, Then it SHALL return 0.0 without division by zero errors. (Verifies: FR-022, NFR-004)

### EC9: Multiple Primary Companions
- Given `household.json` with multiple members having `is_primary: true`, When escalations are routed, Then the first primary member in the array SHALL receive escalations. (Verifies: FR-027, NFR-004)

### EC10: Twilio Webhook with Missing Fields
- Given a Twilio webhook payload missing required fields (e.g., `CallSid`), When the webhook is processed, Then it SHALL return 400 Bad Request and log the validation error. (Verifies: FR-033, NFR-004)


## Dependencies

### External Dependencies
- `@anthropic-ai/sdk` — Claude API client
- `express` — REST API server
- `ws` — WebSocket server
- `gray-matter` — YAML frontmatter parser for agent templates
- `node-cron` — Scheduler for timed events
- `twilio` — Twilio SDK (when webhook is configured)

### Internal Dependencies
- Design documents: `docs/superpowers/specs/2026-03-14-agent-orchestration-design.md`, `docs/superpowers/specs/2026-03-14-agent-orchestration-diagrams.md`
- Existing React UI: `src/Cortege.jsx` (will be wired to backend via WebSocket)
- Athena framework: `.claude/skills/athena/` (for spec conventions and traceability)

### Environment Variables
- `ANTHROPIC_API_KEY` (required) — Claude API key
- `CLAUDE_MODEL` (optional, default: `claude-haiku-4-5-20251001`) — Claude model to use
- `PORT` (optional, default: `3001`) — REST API port
- `LEARNING_TIME_MULTIPLIER` (optional, default: `1440`) — Time acceleration for demos
- `LEARNING_EVENT_WEIGHT` (optional, default: `10`) — Event weight multiplier
- `LEARNING_FAST_MODE` (optional, default: `true`) — Lower stage transition thresholds
- `TWILIO_ACCOUNT_SID` (optional) — Twilio account SID
- `TWILIO_AUTH_TOKEN` (optional) — Twilio auth token

### File System Structure
```
cortege-hackathon/
├── agents/                         ← Agent templates (swappable)
│   ├── _template/agent.md
│   ├── anchor/agent.md
│   ├── scout/agent.md
│   └── sentinel/agent.md
├── scenarios/                      ← Event sequences (swappable)
│   ├── _template.json
│   ├── grandparent-scam.json
│   └── normal-day.json
├── server/                         ← Node.js backend (framework)
│   ├── index.js
│   ├── orchestrator/
│   ├── agents/
│   ├── claude/
│   ├── ingestion/
│   ├── escalation/
│   └── api/
├── data/                           ← Runtime data (gitignored)
│   ├── memories/
│   ├── events/
│   └── household.json
└── .env                            ← Environment variables (gitignored)
```

## Out of Scope

- Production-grade authentication/authorization (future enhancement)
- Horizontal scaling / multi-instance orchestrator (single household per instance is sufficient)
- Graph database for relationship queries (future enhancement per D-20260315-1252)
- Voice biometric enrollment (Twilio integration is webhook-only for PoC)
- Mobile app (React web UI only)
- Multi-language support (English only for PoC)

