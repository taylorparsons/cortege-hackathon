# Agent Orchestration System — Design Spec

**Date:** 2026-03-14
**Status:** Draft
**Scope:** Architecture design + lightweight proof-of-concept for the CORTEGE companion agent system

## Summary

A use-case-agnostic agent orchestration framework where companion agents are defined as markdown templates, instantiated by a factory, and coordinated by a central orchestrator. Agents are powered by Claude API calls with accumulated behavioral memory that makes them smarter over time. The framework supports event-driven processing, scheduled tasks, and multiple ingestion sources (Twilio webhooks, event simulator, manual injection).

Hackathon participants create new agent types by writing a markdown file. No code required.

## Decisions

- **Architecture:** Event Bus + Agent Pool (single-process Node.js, EventEmitter-based)
- **Runtime:** Hybrid — Node.js orchestrator handles plumbing, Claude API powers agent intelligence
- **Agent definition:** Markdown templates with YAML frontmatter (config) + markdown body (Claude system prompt)
- **Learning:** Per-agent-instance JSON memory store, injected into Claude prompt. Agent returns `memory_updates` with each response.
- **PoC scope:** One fully working agent demonstrating the full event → assess → learn → escalate loop. Architecture supports any use case.
- **Ingestion:** Event simulator (default), manual injection API, Twilio voice webhook (plug in later)
- **Demo strategy:** Show learning — feed a sequence of events, watch the agent get smarter across them

## 1. Agent Template Format

Each agent type lives in `agents/<name>/agent.md`. The framework scans this directory on startup and registers all agent types.

### Template Structure

**Frontmatter (YAML)** — structured config consumed by the framework:

```yaml
---
name: ANCHOR
designation: β
role: Senior Protection Agent
description: >
  Protects adults 60+ and digitally vulnerable users
  from voice fraud, impersonation, and financial scams.
profile_type: senior

events:
  - inbound_call
  - inbound_sms
  - financial_transaction
  - contact_request

threat_model:
  - voice_fraud_deepfake
  - grandparent_scam
  - wire_transfer_fraud
  - medicare_insurance_fraud
  - gift_card_scam
  - isolation_social_engineering

escalation:
  level_3: notify_primary_companion
  level_4: emergency_relay

learning:
  tracks:
    - communication_patterns
    - financial_baseline
    - trusted_contacts
    - call_frequency_by_hour
  baseline_period_days: 30
---
```

**Markdown body** — natural language that becomes the Claude system prompt:

- Identity section → system prompt preamble
- Threat Expertise → domain knowledge
- How You Evaluate → reasoning framework
- Threat Levels → output schema
- Learning Rules → memory update instructions

### Framework Processing

| Frontmatter Field | Framework Action |
|---|---|
| `events` | Subscribe agent to event bus channels |
| `threat_model` | Classify incoming events |
| `escalation` | Route agent decisions by level |
| `learning.tracks` | Initialize memory store sections |
| `profile_type` | Match to household members |

### Creating a New Agent (Hackathon Participant)

1. Copy `agents/_template/agent.md` → `agents/my-agent/agent.md`
2. Edit frontmatter: name, events, threat model
3. Write markdown body: identity, expertise, evaluation rules
4. Drop it in `agents/my-agent/agent.md`
5. `POST /api/agents/reload` or restart server — agent is live

## 2. System Architecture

### Components

```
EVENT SOURCES (Twilio, Simulator, Manual)
        │
        ▼
    EVENT BUS (typed EventEmitter + persistence)
        │
        ▼
    ORCHESTRATOR
    ├── Routes events to agents by subscription
    ├── Manages agent lifecycle
    ├── Handles escalations
    ├── Runs timed schedules
    └── Exposes API to React UI
        │
   ┌────┼────┐
   ▼    ▼    ▼
 AGENT POOLS (one pool per agent type, instances per member)
   │
   ├── Claude API call (template prompt + memory + event)
   ├── Structured response (threat_level, actions, memory_updates)
   └── Memory store updated (learning)
        │
        ▼
 ESCALATION HANDLER → React UI (WebSocket)
```

### Core Components

1. **Event Bus** — Typed EventEmitter with disk persistence. Events are JSON objects with `type`, `source`, `target_member`, `payload`, `timestamp`. All events logged for replay and debugging.

2. **Orchestrator** — Loads agent templates on startup. Routes events based on agent subscriptions. Manages scheduled tasks (timed checks). Exposes REST/WebSocket API to React UI. Handles escalation routing between agents.

3. **Agent Factory** — Scans `agents/` directory. Parses each `agent.md` — frontmatter becomes config, markdown body becomes Claude system prompt. Creates agent instances paired to household members. File watcher for hot-reload.

4. **Memory Store** — Per-agent-instance JSON file. Stores learned patterns: trusted contacts, behavioral baselines, temporal patterns, past threat assessments. Injected into Claude prompt on each call so the agent "remembers." Grows over time = learning.

5. **Claude Integration** — Each agent call = one Claude API request. System prompt = template markdown + accumulated memory. User message = event payload. Response = structured JSON via tool_use: threat_level, assessment, actions, memory_updates.

6. **Escalation Handler** — Routes agent decisions by level: L0-L1 → log only. L2 → monitor. L3 → notify primary companion. L4 → emergency relay + evidence capture. Pushes updates to React UI via WebSocket.

## 3. Learning System

### Memory Store Structure

Per-agent-instance JSON file at `data/memories/<agent>-<member>.json`:

```json
{
  "agent": "anchor",
  "member": "Mom",
  "member_id": "member_002",
  "created": "2026-03-14T10:00:00Z",
  "stage": "baseline",
  "events_processed": 47,
  "depth_score": 0.12,
  "trusted_contacts": { ... },
  "communication_patterns": { ... },
  "financial_baseline": { ... },
  "threat_history": [ ... ],
  "learned_patterns": [ ... ]
}
```

### Four Maturity Stages

Matches PRD depth curve. Stage transitions are automatic based on depth score.

| Stage | Trigger | Depth Score | Behavior |
|---|---|---|---|
| Baseline | Day 1 | 0.0 – 0.25 | Universal threat signatures only. Every event builds the model. |
| Pattern Recognition | ~Day 30 | 0.25 – 0.50 | Behavioral baseline established. Deviation detection active. |
| Predictive | ~Day 90 | 0.50 – 0.75 | Anticipates threat windows. Proactive steering enabled. |
| Cortege Mode | ~Day 365 | 0.75 – 1.0 | Deep behavioral fingerprint. Operates as true proxy. |

### Depth Score Calculation

```
depth = weighted_average(
  trusted_contacts_count / expected_contacts × 0.25,
  days_active / baseline_period_days × 0.25,
  events_processed / events_for_confidence × 0.25,
  learned_patterns_count / pattern_capacity × 0.25
)
```

### How Claude Returns Learning

Every Claude API response includes a `memory_updates` field. The orchestrator applies these updates to the agent's memory store. On the next event, the agent's prompt includes richer context — better decisions over time.

```json
{
  "memory_updates": {
    "add_threat_record": { ... },
    "update_pattern": {
      "key": "evening_scam_correlation",
      "observation": "Third scam attempt after 9pm this month",
      "confidence_delta": 0.15
    },
    "block_number": "+1-555-9999"
  }
}
```

### Demo Learning Sequence

1. **Event 1:** Normal call from known contact → log, add to trusted contacts. Memory grows.
2. **Event 2:** Normal call from another contact → log, learn weekday pattern. Memory grows.
3. **Event 3:** Unknown caller at 9pm, urgency language → flags L2 (not enough data yet). Memory grows.
4. **Event 4:** Same pattern, different number → flags L3 (learned from event 3). Learning visible.
5. **Event 5:** Full scam attempt → catches at L4, hard blocks, escalates. Full protection.
6. **Between events:** UI shows depth curve climbing, memory store growing, stage badge updating.

## 4. Event Model & API Contracts

### Universal Event Format (CoreEvent)

Every source normalizes to this shape before hitting the event bus:

```json
{
  "id": "evt_20260314_143022_a7f3",
  "type": "inbound_call",
  "source": "twilio",
  "timestamp": "2026-03-14T14:30:22Z",
  "target_member": "member_002",
  "payload": {
    "caller_id": "+1-555-9999",
    "caller_name": null,
    "duration_seconds": 45,
    "transcript": "...",
    "voice_match": {
      "enrolled_profiles_checked": ["Taylor", "Alex"],
      "match": false,
      "confidence": 0.02
    }
  },
  "metadata": {
    "twilio_call_sid": "CA1234567890abcdef",
    "ingestion_latency_ms": 230
  }
}
```

### Event Types

**External:** `inbound_call`, `inbound_sms`, `inbound_email`, `financial_transaction`, `contact_request`, `login_attempt`

**Internal:** `scheduled_review`, `baseline_update`, `escalation`, `household_signal`, `memory_snapshot`, `stage_transition`

### Agent Response Contract (AgentResponse)

Every agent returns this structure, enforced via Claude tool_use:

```json
{
  "event_id": "evt_20260314_143022_a7f3",
  "agent": "anchor",
  "instance": "anchor-mom",
  "threat_level": 3,
  "confidence": 0.89,
  "assessment": "Human-readable explanation...",
  "signals": ["unknown_caller", "urgency_language", "secrecy_request", "..."],
  "actions": [
    { "type": "hard_block", "target": "+1-555-9999", "reason": "..." },
    { "type": "escalate", "level": 3, "to": "primary_companion", "summary": "..." }
  ],
  "memory_updates": { ... },
  "stage_check": {
    "current_depth": 0.32,
    "stage_transition": null
  }
}
```

### Ingestion Interfaces

| Interface | Endpoint | Purpose |
|---|---|---|
| Twilio Webhook | `POST /ingest/twilio/voice` | Inbound calls + transcription. Plug in when Twilio account is configured. |
| Event Simulator | Internal module | Reads scenario files from `scenarios/`, fires events on a timeline. Supports accelerated time. |
| Manual Injection | `POST /ingest/manual` | Direct event submission for testing. Also exposed as a UI panel. |

### Orchestrator API

**REST:**

```
GET  /api/household              — household + member data
GET  /api/companions             — all active companion instances
GET  /api/companions/:id         — single companion detail
GET  /api/companions/:id/memory  — agent's learned knowledge
GET  /api/companions/:id/activity — event + assessment history
GET  /api/events                 — event log
POST /api/events                 — manual event injection
POST /api/scenarios/:name/run    — play a scenario
GET  /api/agents                 — registered agent templates
POST /api/agents/reload          — hot-reload templates from disk
```

**WebSocket (ws://localhost:3001/ws):**

```
→ event:received      — new event in bus
→ agent:processing    — agent evaluating
→ agent:response      — threat assessment complete
→ escalation:fired    — level 3/4 alert
→ memory:updated      — learning happened
→ stage:transition    — agent maturity change
→ companion:status    — heartbeat/state
```

## 5. Project Structure

### Framework vs. Use-Case

**Framework (we build):** Orchestrator, event bus, agent factory, template parser, memory store, Claude integration, response schema, ingestion interfaces, escalation handler, REST API, WebSocket, scenario runner, starter template.

**Use-case (swappable):** Specific agent.md templates, scenario files, household member profiles, threat model definitions, escalation rules per agent, dashboard theming per demo.

### File Layout

```
cortege-hackathon/
├── agents/                         ← Agent templates (the swappable layer)
│   ├── _template/agent.md
│   ├── anchor/agent.md
│   ├── scout/agent.md
│   └── sentinel/agent.md
├── scenarios/                      ← Scripted event sequences
│   ├── _template.json
│   ├── grandparent-scam.json
│   └── normal-day.json
├── server/                         ← Node.js backend (the framework)
│   ├── index.js
│   ├── orchestrator/
│   │   ├── orchestrator.js
│   │   ├── event-bus.js
│   │   └── scheduler.js
│   ├── agents/
│   │   ├── agent-factory.js
│   │   ├── agent-instance.js
│   │   ├── template-parser.js
│   │   └── memory-store.js
│   ├── claude/
│   │   ├── claude-client.js
│   │   └── response-schema.js
│   ├── ingestion/
│   │   ├── twilio-webhook.js
│   │   ├── simulator.js
│   │   └── manual.js
│   ├── escalation/
│   │   └── escalation-handler.js
│   └── api/
│       ├── routes.js
│       └── websocket.js
├── src/                            ← React frontend
│   ├── main.jsx
│   ├── Cortege.jsx
│   └── components/
│       ├── EventFeed.jsx
│       ├── AgentStatus.jsx
│       ├── MemoryViewer.jsx
│       ├── ScenarioRunner.jsx
│       └── EventInjector.jsx
├── data/                           ← Runtime data (gitignored)
│   ├── memories/
│   ├── events/
│   └── household.json
├── docs/
├── package.json
├── vite.config.js
└── .env                            ← ANTHROPIC_API_KEY, TWILIO_* (gitignored)
```

### Key Dependencies

**Backend:** `@anthropic-ai/sdk`, `express`, `ws`, `gray-matter`, `node-cron`, `twilio` (when ready)

**Frontend:** Existing React + Vite. WebSocket via native browser API. No new deps.

## Open Questions

1. **Which demo use case?** Architecture is ready for any agent type. ANCHOR/grandparent scam is designed but the team may choose a different scenario.
2. **Twilio timing** — account exists, will be wired in later. Event simulator is the default ingestion source.
3. **Household configuration** — how are household members and their companion pairings defined? Currently assumed to be a `data/household.json` file.
4. **Accelerated learning for demo** — the depth curve spans a year. For the hackathon demo, events should advance the depth score faster than real-time. Need to define the acceleration factor.
5. **Claude model selection** — which Claude model for agent calls? Haiku for speed/cost during development, Sonnet/Opus for demo quality?
