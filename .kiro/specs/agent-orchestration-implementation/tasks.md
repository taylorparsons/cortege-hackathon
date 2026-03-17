# Tasks: Agent Orchestration Implementation

Status: Not Started
Created: 2026-03-17 14:00
Spec: requirements.md

## Task Breakdown

### Phase 1: Foundation & Core Infrastructure

- [x] 1.1 Project setup and dependencies
  - [x] 1.1.1 Initialize server/ directory structure (Implements: FR-001, FR-007)
  - [x] 1.1.2 Install backend dependencies (@anthropic-ai/sdk, express, ws, gray-matter, node-cron) (Implements: FR-012, FR-034, FR-046)
  - [x] 1.1.3 Create .env.example with required environment variables (Implements: NFR-013)
  - [x] 1.1.4 Create data/ directory structure (memories/, events/, household.json) (Implements: FR-010, FR-018, FR-038)

- [x] 1.2 Event Bus implementation
  - [x] 1.2.1 Create typed EventEmitter with CoreEvent schema (Implements: FR-007, FR-009)
  - [x] 1.2.2 Implement JSONL persistence (append-only, one file per day) (Implements: FR-010, NFR-007)
  - [x] 1.2.3 Implement event replay from JSONL files (Implements: FR-011, NFR-008)
  - [x] 1.2.4 Add event routing by type and target_member (Implements: FR-008)

- [x] 1.3 Agent Factory and Template Parser
  - [x] 1.3.1 Implement gray-matter parser for agent.md files (Implements: FR-002)
  - [x] 1.3.2 Implement template validation (required fields, event types) (Implements: FR-003, FR-005, NFR-006)
  - [x] 1.3.3 Implement agent type registration from agents/ directory (Implements: FR-001)
  - [x] 1.3.4 Implement hot-reload via file watcher (Implements: FR-006, EC6)


### Phase 2: Agent Instances & Memory

- [x] 2.1 Household configuration and agent pairing
  - [x] 2.1.1 Load household.json and parse member profiles (Implements: FR-038, FR-039)
  - [x] 2.1.2 Implement agent pairing logic (profile_type matching + companion override) (Implements: FR-040)
  - [x] 2.1.3 Create one agent instance per household member (Implements: FR-041)

- [x] 2.2 Memory Store implementation
  - [x] 2.2.1 Create memory store schema and initialization (Implements: FR-018, FR-019)
  - [x] 2.2.2 Implement memory update operations (add_trusted_contact, update_pattern, etc.) (Implements: FR-020, FR-021)
  - [x] 2.2.3 Implement atomic file writes (temp file + rename) (Implements: NFR-003)
  - [x] 2.2.4 Implement memory serialization for Claude prompt injection (Implements: FR-019)
  - [x] 2.2.5 Handle corrupted memory files (initialize fresh + log error) (Implements: EC2)

- [x] 2.3 Depth score and learning stages
  - [x] 2.3.1 Implement depth score calculation (weighted average) (Implements: FR-022, EC8)
  - [x] 2.3.2 Define four maturity stages with thresholds (Implements: FR-023)
  - [x] 2.3.3 Implement stage transition detection and WebSocket event (Implements: FR-024)
  - [x] 2.3.4 Implement accelerated learning env vars (LEARNING_TIME_MULTIPLIER, LEARNING_EVENT_WEIGHT, LEARNING_FAST_MODE) (Implements: FR-042, FR-043, FR-044)

### Phase 3: Claude Integration

- [x] 3.1 Claude API client
  - [x] 3.1.1 Initialize @anthropic-ai/sdk client with API key (Implements: FR-012, NFR-013)
  - [x] 3.1.2 Implement model selection (env var + template override) (Implements: FR-016, FR-017)
  - [x] 3.1.3 Implement 30s timeout (Implements: NFR-001)

- [x] 3.2 Structured response handling
  - [x] 3.2.1 Define submit_assessment tool schema (Implements: FR-013, FR-014)
  - [x] 3.2.2 Implement tool_use response parsing and validation (Implements: FR-013)
  - [x] 3.2.3 Implement error handling (timeout, rate limit, malformed response) (Implements: FR-015, EC4, NFR-004, NFR-005)

- [x] 3.3 Agent processing loop
  - [x] 3.3.1 Build Claude prompt (template body + serialized memory + event) (Implements: FR-012)
  - [x] 3.3.2 Call Claude API and parse AgentResponse (Implements: FR-013)
  - [x] 3.3.3 Apply memory updates from response (Implements: FR-021)
  - [x] 3.3.4 Implement per-agent-instance event queue (sequential processing) (Implements: EC1)


### Phase 4: Escalation & Actions

- [x] 4.1 Escalation handler
  - [x] 4.1.1 Implement level-based routing (L0-L1: log, L2: monitor, L3: notify, L4: emergency) (Implements: FR-025)
  - [x] 4.1.2 Determine primary companion from household.json (Implements: FR-027, EC9)
  - [x] 4.1.3 Emit escalation:fired WebSocket events for L3/L4 (Implements: FR-026)
  - [x] 4.1.4 Implement evidence capture for L4 (Implements: FR-025)

- [x] 4.2 Action processing
  - [x] 4.2.1 Implement action types (log, monitor, soft_block, hard_block, escalate, log_evidence) (Implements: FR-028)
  - [x] 4.2.2 Validate required fields per action type (Implements: FR-028)
  - [x] 4.2.3 Apply actions to memory store (e.g., hard_block → blocked_contacts) (Implements: FR-020)

### Phase 5: Event Ingestion

- [x] 5.1 Event simulator
  - [x] 5.1.1 Implement scenario file parser (JSON schema validation) (Implements: FR-030, FR-031, EC5)
  - [x] 5.1.2 Implement timed event playback (delay_ms between events) (Implements: FR-031)
  - [x] 5.1.3 Implement learning_boost multiplier (Implements: FR-045)
  - [x] 5.1.4 Normalize simulator events to CoreEvent format (Implements: FR-009)

- [x] 5.2 Manual injection API
  - [x] 5.2.1 Implement POST /api/events endpoint (Implements: FR-032)
  - [x] 5.2.2 Validate CoreEvent schema (Implements: FR-009)
  - [x] 5.2.3 Handle missing target_member (Implements: EC3)

- [x] 5.3 Twilio webhook (stub for later)
  - [x] 5.3.1 Implement POST /ingest/twilio/voice endpoint (Implements: FR-033)
  - [x] 5.3.2 Validate Twilio payload (CallSid, From, To, etc.) (Implements: EC10, NFR-014)
  - [x] 5.3.3 Normalize Twilio payload to CoreEvent format (Implements: FR-009)

### Phase 6: REST & WebSocket API

- [x] 6.1 REST API endpoints
  - [x] 6.1.1 Implement GET /api/household (Implements: FR-034)
  - [x] 6.1.2 Implement GET /api/companions (Implements: FR-034)
  - [x] 6.1.3 Implement GET /api/companions/:id (Implements: FR-034)
  - [x] 6.1.4 Implement GET /api/companions/:id/memory (Implements: FR-034)
  - [x] 6.1.5 Implement GET /api/companions/:id/activity (Implements: FR-034)
  - [x] 6.1.6 Implement GET /api/events (Implements: FR-034)
  - [x] 6.1.7 Implement POST /api/scenarios/:name/run (Implements: FR-034)
  - [x] 6.1.8 Implement GET /api/agents (Implements: FR-034)
  - [x] 6.1.9 Implement POST /api/agents/reload (Implements: FR-034, FR-006)

- [x] 6.2 WebSocket server
  - [x] 6.2.1 Initialize WebSocket server at ws://localhost:3001/ws (Implements: FR-036)
  - [x] 6.2.2 Implement event:received emission (Implements: FR-035)
  - [x] 6.2.3 Implement agent:processing emission (Implements: FR-035)
  - [x] 6.2.4 Implement agent:response emission (Implements: FR-035)
  - [x] 6.2.5 Implement memory:updated emission (Implements: FR-035)
  - [x] 6.2.6 Implement stage:transition emission (Implements: FR-035)
  - [x] 6.2.7 Implement companion:status emission (Implements: FR-035)
  - [x] 6.2.8 Implement agent:error emission (Implements: FR-035)
  - [x] 6.2.9 Handle WebSocket disconnection and reconnection (queue escalations) (Implements: EC7)


### Phase 7: Scheduler & Orchestrator

- [x] 7.1 Scheduler implementation
  - [x] 7.1.1 Initialize node-cron scheduler (Implements: FR-046)
  - [x] 7.1.2 Implement baseline_update scheduled task (every 24 simulated hours) (Implements: FR-047)
  - [x] 7.1.3 Implement memory_snapshot scheduled task (every 12 simulated hours) (Implements: FR-047, NFR-009)
  - [x] 7.1.4 Support custom schedules from agent template frontmatter (Implements: FR-048)
  - [x] 7.1.5 Respect LEARNING_TIME_MULTIPLIER for scheduled tasks (Implements: FR-042)

- [x] 7.2 Orchestrator integration
  - [x] 7.2.1 Wire event bus to agent instances (Implements: FR-008)
  - [x] 7.2.2 Wire agent responses to escalation handler (Implements: FR-025)
  - [x] 7.2.3 Wire escalation handler to WebSocket (Implements: FR-026)
  - [x] 7.2.4 Implement orchestrator startup sequence (load templates → pair agents → start scheduler → start API) (Implements: FR-001, FR-041)

### Phase 8: Agent Templates & Scenarios

- [x] 8.1 Create agent templates
  - [x] 8.1.1 Create agents/_template/agent.md (starter template for hackathon participants) (Implements: NFR-010)
  - [x] 8.1.2 Create agents/anchor/agent.md (ANCHOR agent for seniors) (Implements: FR-002)
  - [x] 8.1.3 Create agents/scout/agent.md (SCOUT agent for children) (Implements: FR-002)
  - [x] 8.1.4 Create agents/sentinel/agent.md (SENTINEL agent for adults) (Implements: FR-002)

- [x] 8.2 Create scenario files
  - [x] 8.2.1 Create scenarios/_template.json (starter template) (Implements: FR-031)
  - [x] 8.2.2 Create scenarios/grandparent-scam.json (5-event demo sequence) (Implements: FR-031)
  - [x] 8.2.3 Create scenarios/normal-day.json (baseline behavior sequence) (Implements: FR-031)

- [x] 8.3 Create household configuration
  - [x] 8.3.1 Create data/household.json with 3 members (Alex, Mom, Taylor) (Implements: FR-038, FR-039)

### Phase 9: Frontend Integration

- [x] 9.1 Wire React UI to backend
  - [x] 9.1.1 Update Cortege.jsx to connect to WebSocket (Implements: FR-036)
  - [x] 9.1.2 Create EventFeed.jsx component (listen to event:received, agent:response) (Implements: FR-035)
  - [x] 9.1.3 Create AgentStatus.jsx component (listen to agent:processing, companion:status) (Implements: FR-035)
  - [x] 9.1.4 Create MemoryViewer.jsx component (fetch from GET /api/companions/:id/memory) (Implements: FR-034)
  - [x] 9.1.5 Create ScenarioRunner.jsx component (POST /api/scenarios/:name/run) (Implements: FR-034)
  - [x] 9.1.6 Create EventInjector.jsx component (POST /api/events) (Implements: FR-032)

### Phase 10: Testing & Validation

- [ ] 10.1 Unit tests
  - [ ] 10.1.1 Test template parser with valid and invalid templates (Verifies: US1)
  - [ ] 10.1.2 Test event routing logic (Verifies: US2)
  - [ ] 10.1.3 Test memory update operations (Verifies: US4)
  - [ ] 10.1.4 Test depth score calculation (Verifies: US4, EC8)
  - [ ] 10.1.5 Test escalation routing by level (Verifies: US5)

- [ ] 10.2 Integration tests
  - [ ] 10.2.1 Test end-to-end event flow (simulator → agent → memory → escalation → WebSocket) (Verifies: US2, US3, US4, US5)
  - [ ] 10.2.2 Test scenario playback with learning progression (Verifies: US6)
  - [ ] 10.2.3 Test agent hot-reload (Verifies: US1, EC6)
  - [ ] 10.2.4 Test Claude API error handling (timeout, rate limit, malformed response) (Verifies: US3, EC4)

- [ ] 10.3 Demo validation
  - [ ] 10.3.1 Run grandparent-scam scenario and verify stage transition (Verifies: US4, US6)
  - [ ] 10.3.2 Verify WebSocket events in React UI (Verifies: US7)
  - [ ] 10.3.3 Verify memory viewer shows learned patterns (Verifies: US4, US7)


## Task Dependencies

```
Phase 1 (Foundation)
  └─> Phase 2 (Agent Instances & Memory)
       └─> Phase 3 (Claude Integration)
            └─> Phase 4 (Escalation & Actions)
                 └─> Phase 5 (Event Ingestion)
                      └─> Phase 6 (REST & WebSocket API)
                           └─> Phase 7 (Scheduler & Orchestrator)
                                └─> Phase 8 (Agent Templates & Scenarios)
                                     └─> Phase 9 (Frontend Integration)
                                          └─> Phase 10 (Testing & Validation)
```

## Notes

- Each phase builds on the previous phase
- Phase 8 (templates/scenarios) can be developed in parallel with Phase 7 (orchestrator)
- Phase 9 (frontend) requires Phase 6 (API) to be complete
- Phase 10 (testing) should be incremental — write tests as you build each phase
- Twilio webhook (5.3) is a stub for later — focus on simulator and manual injection first
- Use Haiku model during development for speed/cost, switch to Sonnet for final demo

## Estimated Effort

- Phase 1-2: 2-3 days (foundation + memory)
- Phase 3-4: 2-3 days (Claude integration + escalation)
- Phase 5-6: 2-3 days (ingestion + API)
- Phase 7: 1-2 days (scheduler + orchestrator wiring)
- Phase 8: 1-2 days (templates + scenarios)
- Phase 9: 1-2 days (frontend integration)
- Phase 10: 1-2 days (testing + demo validation)

Total: 10-17 days (2-3.5 weeks)

## Success Criteria

- [ ] All FR requirements implemented and verified
- [ ] All NFR requirements met (performance, reliability, auditability, extensibility, security)
- [ ] All edge cases handled
- [ ] Demo scenario (grandparent-scam) runs successfully and shows visible learning progression
- [ ] React UI displays real-time agent status, memory updates, and escalations
- [ ] Hackathon participants can create a new agent by copying _template/agent.md and editing it
- [ ] System is use-case agnostic — swapping agents/scenarios/household config works without code changes

