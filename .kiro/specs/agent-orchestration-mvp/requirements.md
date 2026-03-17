# Requirements: Agent Orchestration MVP

**Feature:** agent-orchestration-mvp  
**Derived from:** [Agent Orchestration Design Spec](../../../docs/superpowers/specs/2026-03-14-agent-orchestration-design.md)  
**Status:** Draft

## Overview

Implement a use-case-agnostic agent orchestration framework where companion agents are defined as markdown templates, instantiated by a factory, and coordinated by a central orchestrator. Agents are powered by Claude API with accumulated behavioral memory that makes them smarter over time.

## Functional Requirements

### FR-1: Agent Template System

**FR-1.1** The system SHALL support agent definition via markdown files with YAML frontmatter and markdown body

**FR-1.2** Agent templates SHALL be stored in `agents/<name>/agent.md` directory structure

**FR-1.3** YAML frontmatter SHALL include: name, designation, role, description, profile_type, events (array), threat_model (array), escalation (object), learning (object)

**FR-1.4** Markdown body SHALL become the Claude system prompt

**FR-1.5** The system SHALL provide a starter template at `agents/_template/agent.md`

**FR-1.6** The system SHALL validate templates on startup and hot-reload

**FR-1.7** Invalid templates SHALL log errors with file path and validation reason, then be skipped (non-fatal)

**FR-1.8** Template validation SHALL check: required frontmatter fields, valid event types, non-empty markdown body

### FR-2: Agent Factory

**FR-2.1** The Agent Factory SHALL scan `agents/` directory on startup

**FR-2.2** The Agent Factory SHALL parse each `agent.md` file using gray-matter

**FR-2.3** The Agent Factory SHALL create agent instances paired to household members based on profile_type matching

**FR-2.4** The Agent Factory SHALL support hot-reload via `POST /api/agents/reload`

**FR-2.5** The Agent Factory SHALL read household configuration from `data/household.json`

**FR-2.6** Each agent instance SHALL have a unique identifier in format `<agent>-<member>` (e.g., "anchor-mom")

### FR-3: Event Bus

**FR-3.1** The Event Bus SHALL be implemented using Node.js EventEmitter

**FR-3.2** The Event Bus SHALL persist events to append-only JSONL files at `data/events/YYYY-MM-DD.jsonl`

**FR-3.3** Each event SHALL conform to CoreEvent schema: id, type, source, timestamp, target_member, payload, metadata

**FR-3.4** The Event Bus SHALL support event replay by reading JSONL files in chronological order

**FR-3.5** The Event Bus SHALL support these event types: inbound_call, inbound_sms, inbound_email, financial_transaction, contact_request, login_attempt, scheduled_review, baseline_update, escalation, household_signal, memory_snapshot, stage_transition



### FR-4: Orchestrator

**FR-4.1** The Orchestrator SHALL load agent templates on startup

**FR-4.2** The Orchestrator SHALL route events to agents based on their event subscriptions

**FR-4.3** The Orchestrator SHALL manage agent lifecycle (instantiation, state, shutdown)

**FR-4.4** The Orchestrator SHALL handle escalation routing between agents

**FR-4.5** The Orchestrator SHALL expose REST API on port 3001

**FR-4.6** The Orchestrator SHALL expose WebSocket API at ws://localhost:3001/ws

**FR-4.7** The Orchestrator SHALL emit WebSocket events: event:received, agent:processing, agent:response, escalation:fired, memory:updated, stage:transition, companion:status, agent:error

### FR-5: Memory Store

**FR-5.1** Each agent instance SHALL have a dedicated JSON memory file at `data/memories/<agent>-<member>.json`

**FR-5.2** Memory store SHALL include: agent, member, member_id, created, stage, events_processed, depth_score, trusted_contacts, communication_patterns, financial_baseline, blocked_contacts, threat_history, learned_patterns, observations

**FR-5.3** The system SHALL support these memory update operations: add_trusted_contact, remove_trusted_contact, add_threat_record, update_pattern, update_baseline, block_contact, add_observation

**FR-5.4** Memory SHALL be injected into Claude prompt on each agent call

**FR-5.5** Memory SHALL be updated based on Claude's memory_updates response field

**FR-5.6** The system SHALL calculate depth_score as weighted average of: trusted_contacts_count, days_active, events_processed, learned_patterns_count

**FR-5.7** The system SHALL support four maturity stages: Baseline (0.0-0.25), Pattern Recognition (0.25-0.50), Predictive (0.50-0.75), Cortege Mode (0.75-1.0)

**FR-5.8** Stage transitions SHALL be automatic based on depth_score thresholds

### FR-6: Claude Integration

**FR-6.1** The system SHALL use @anthropic-ai/sdk for Claude API calls

**FR-6.2** Each agent evaluation SHALL make one Claude API request

**FR-6.3** System prompt SHALL be constructed from: template markdown body + serialized memory store

**FR-6.4** User message SHALL be the event payload

**FR-6.5** Response SHALL use structured output via tool_use with tool name "submit_assessment"

**FR-6.6** The submit_assessment tool SHALL enforce schema with fields: event_id, agent, instance, threat_level (0-4), confidence (0-1), assessment, signals (array), actions (array), memory_updates (object), stage_check (object)

**FR-6.7** Action types SHALL include: log, monitor, soft_block, hard_block, escalate, log_evidence

**FR-6.8** Default model SHALL be claude-haiku-4-5-20251001 (configurable via CLAUDE_MODEL env var)

**FR-6.9** Agent templates MAY override model via frontmatter "model" field

**FR-6.10** Claude API timeout SHALL be 30 seconds

**FR-6.11** Failed requests SHALL retry once after 2s delay

**FR-6.12** Rate limit (429) SHALL trigger exponential backoff: 2s, 4s, 8s (max 3 retries)

**FR-6.13** Malformed responses SHALL be logged and treated as L1 (log only)

**FR-6.14** Exhausted retries SHALL log as unprocessed_event and emit agent:error

### FR-7: Escalation Handler

**FR-7.1** The Escalation Handler SHALL route agent decisions by threat level

**FR-7.2** Level 0-1 SHALL log only

**FR-7.3** Level 2 SHALL flag for monitoring

**FR-7.4** Level 3 SHALL notify primary companion via WebSocket

**FR-7.5** Level 4 SHALL trigger emergency relay + evidence capture

**FR-7.6** Escalations SHALL be pushed to React UI via WebSocket

### FR-8: Event Ingestion

**FR-8.1** The system SHALL support three ingestion sources: Event Simulator, Manual Injection API, Twilio Webhook

**FR-8.2** Event Simulator SHALL read scenario files from `scenarios/` directory

**FR-8.3** Scenario files SHALL be JSON with fields: name, description, target_member, learning_boost, events (array with delay_ms and event payload)

**FR-8.4** Manual injection SHALL be available via `POST /ingest/manual`

**FR-8.5** Twilio webhook SHALL be available at `POST /ingest/twilio/voice` (plug in later)

**FR-8.6** All sources SHALL normalize to CoreEvent format before hitting event bus

### FR-9: Scheduler

**FR-9.1** The system SHALL use node-cron for scheduled tasks

**FR-9.2** Default scheduled tasks SHALL include: baseline_update (every 24 simulated hours), memory_snapshot (every 12 simulated hours)

**FR-9.3** Agents MAY define custom schedules in template frontmatter via "schedule" field

**FR-9.4** Schedules SHALL use simulated time governed by LEARNING_TIME_MULTIPLIER

### FR-10: REST API

**FR-10.1** The system SHALL expose these REST endpoints:
- GET /api/household - household + member data
- GET /api/companions - all active companion instances
- GET /api/companions/:id - single companion detail
- GET /api/companions/:id/memory - agent's learned knowledge
- GET /api/companions/:id/activity - event + assessment history
- GET /api/events - event log
- POST /api/events - manual event injection
- POST /api/scenarios/:name/run - play a scenario
- GET /api/agents - registered agent templates
- POST /api/agents/reload - hot-reload templates from disk

### FR-11: Household Configuration

**FR-11.1** Household configuration SHALL be stored in `data/household.json`

**FR-11.2** Configuration SHALL include: household_id, name, location, created, members (array)

**FR-11.3** Each member SHALL have: id, name, age, profile_type, companion, is_primary, primary_contact (optional)

**FR-11.4** profile_type SHALL be matched against agent template profile_type for pairing

**FR-11.5** is_primary member SHALL receive escalation relays from other companions

### FR-12: Accelerated Learning

**FR-12.1** The system SHALL support time acceleration via LEARNING_TIME_MULTIPLIER env var (default: 1440)

**FR-12.2** The system SHALL support event weight boost via LEARNING_EVENT_WEIGHT env var (default: 10)

**FR-12.3** The system SHALL support fast mode via LEARNING_FAST_MODE env var (default: true)

**FR-12.4** Fast mode SHALL use lower stage thresholds: Baseline→Pattern at 0.10, Pattern→Predictive at 0.25, Predictive→Cortege at 0.50

**FR-12.5** Scenario files MAY include learning_boost field to multiply event weight for specific events

### FR-13: Agent Templates (Proof of Concept)

**FR-13.1** The system SHALL include one fully working agent: ANCHOR

**FR-13.2** ANCHOR agent SHALL protect seniors from voice fraud, grandparent scams, and financial scams

**FR-13.3** ANCHOR agent SHALL subscribe to: inbound_call, inbound_sms, financial_transaction, contact_request

**FR-13.4** ANCHOR agent SHALL track: communication_patterns, financial_baseline, trusted_contacts, call_frequency_by_hour

**FR-13.5** The system SHALL include starter templates for: SCOUT (child protection), SENTINEL (adult protection)

### FR-14: Demo Scenarios

**FR-14.1** The system SHALL include a grandparent-scam scenario demonstrating learning progression

**FR-14.2** The scenario SHALL include at least 5 events showing: normal baseline, pattern learning, threat detection, escalation

**FR-14.3** The system SHALL include a normal-day scenario for baseline establishment

## Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1** Claude API calls SHALL timeout after 30 seconds

**NFR-1.2** WebSocket events SHALL be emitted within 100ms of state changes

**NFR-1.3** Event ingestion latency SHALL be logged in metadata

### NFR-2: Reliability

**NFR-2.1** No silent failures - all errors SHALL be logged and surfaced

**NFR-2.2** Invalid templates SHALL not crash the server

**NFR-2.3** Failed Claude API calls SHALL be retried with exponential backoff

**NFR-2.4** Unprocessed events SHALL be logged and surfaced in UI

### NFR-3: Auditability

**NFR-3.1** All events SHALL be persisted to append-only JSONL files

**NFR-3.2** Event files SHALL be organized by date (YYYY-MM-DD.jsonl)

**NFR-3.3** Memory updates SHALL be traceable to source events

**NFR-3.4** Threat assessments SHALL include signals and confidence scores

### NFR-4: Extensibility

**NFR-4.1** New agent types SHALL be addable by creating a markdown file

**NFR-4.2** No code changes SHALL be required to add new agent types

**NFR-4.3** Agent templates SHALL be hot-reloadable

**NFR-4.4** Event types SHALL be extensible via configuration

### NFR-5: Security

**NFR-5.1** ANTHROPIC_API_KEY SHALL be stored in .env file (gitignored)

**NFR-5.2** Twilio credentials SHALL be stored in .env file (gitignored)

**NFR-5.3** Sensitive data in memory stores SHALL not be logged

### NFR-6: Developer Experience

**NFR-6.1** Template validation errors SHALL include file path and specific failure reason

**NFR-6.2** WebSocket events SHALL be human-readable for debugging

**NFR-6.3** Memory stores SHALL be human-readable JSON

**NFR-6.4** Scenario files SHALL be self-documenting with name and description fields

## Acceptance Criteria

### AC-1: Agent Template System
- [ ] Create an agent.md file in agents/my-agent/ directory
- [ ] File includes valid YAML frontmatter with required fields
- [ ] File includes markdown body for system prompt
- [ ] Server loads and validates template on startup
- [ ] Invalid template logs error but doesn't crash server
- [ ] POST /api/agents/reload hot-reloads templates

### AC-2: Event Processing Flow
- [ ] Inject event via POST /api/events
- [ ] Event persists to JSONL file
- [ ] Event routes to subscribed agent instances
- [ ] Agent makes Claude API call with template + memory + event
- [ ] Claude returns structured assessment via submit_assessment tool
- [ ] Memory store updates based on memory_updates field
- [ ] Escalation routes based on threat_level
- [ ] WebSocket events fire at each step

### AC-3: Learning Progression
- [ ] Agent starts in Baseline stage (depth_score 0.0)
- [ ] Process 5 events from grandparent-scam scenario
- [ ] Memory store grows with each event
- [ ] depth_score increases
- [ ] Stage transitions when threshold crossed
- [ ] WebSocket emits stage:transition event
- [ ] UI shows updated stage badge

### AC-4: Escalation Routing
- [ ] L0-L1 threat logs only
- [ ] L2 threat flags for monitoring
- [ ] L3 threat notifies primary companion via WebSocket
- [ ] L4 threat triggers emergency relay + evidence capture
- [ ] Escalation appears in UI dashboard

### AC-5: Scenario Playback
- [ ] POST /api/scenarios/grandparent-scam/run
- [ ] Events fire with specified delays
- [ ] Each event processes through full pipeline
- [ ] learning_boost multiplier applies
- [ ] Scenario completion emits final status

### AC-6: REST API
- [ ] GET /api/household returns household config
- [ ] GET /api/companions returns all agent instances
- [ ] GET /api/companions/anchor-mom/memory returns memory store
- [ ] GET /api/companions/anchor-mom/activity returns event history
- [ ] GET /api/events returns event log
- [ ] GET /api/agents returns registered templates

### AC-7: Error Handling
- [ ] Claude API timeout (>30s) retries once
- [ ] Rate limit (429) triggers exponential backoff
- [ ] Malformed response logs and treats as L1
- [ ] Exhausted retries log as unprocessed_event
- [ ] agent:error WebSocket event fires for all error cases

### AC-8: ANCHOR Agent
- [ ] ANCHOR template exists at agents/anchor/agent.md
- [ ] ANCHOR pairs with senior profile_type members
- [ ] ANCHOR subscribes to inbound_call, inbound_sms, financial_transaction, contact_request
- [ ] ANCHOR detects grandparent scam pattern
- [ ] ANCHOR escalates at L3 for confirmed threats
- [ ] ANCHOR updates memory with threat records and learned patterns

## Out of Scope

- Full implementation of SCOUT and SENTINEL agents (starter templates only)
- Twilio integration (endpoint exists but not wired)
- React UI components (backend API only)
- Production database (SQLite/PostgreSQL)
- Multi-household support
- Agent-to-agent direct communication
- Voice biometric enrollment
- Real-time call interception

## Dependencies

- @anthropic-ai/sdk - Claude API client
- express - REST API server
- ws - WebSocket server
- gray-matter - YAML frontmatter parser
- node-cron - Scheduled tasks
- twilio - Voice webhook (future)

## References

- [Agent Orchestration Design Spec](../../../docs/superpowers/specs/2026-03-14-agent-orchestration-design.md)
- [System Diagrams](../../../docs/superpowers/specs/2026-03-14-agent-orchestration-diagrams.md)
- [PRD](../../../docs/PRD.md)
- [Decisions](../../../docs/decisions.md)
