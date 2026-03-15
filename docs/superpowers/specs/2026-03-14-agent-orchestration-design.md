# Agent Orchestration System — Design Spec

**Date:** 2026-03-14
**Status:** Draft
**Scope:** Architecture design + lightweight proof-of-concept for the CORTEGE companion agent system
**Diagrams:** [System Diagrams](2026-03-14-agent-orchestration-diagrams.md)

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
| `designation` | Display label for UI (e.g., α, β, γ) — cosmetic only, not used by framework routing |
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

1. **Event Bus** — Typed EventEmitter with append-only JSONL persistence. Each event is written as one JSON line to `data/events/YYYY-MM-DD.jsonl` (one file per day). Supports replay by reading files in chronological order. Events are JSON objects with `type`, `source`, `target_member`, `payload`, `timestamp`.

2. **Orchestrator** — Loads agent templates on startup. Routes events based on agent subscriptions. Manages scheduled tasks (timed checks). Exposes REST/WebSocket API to React UI. Handles escalation routing between agents.

3. **Agent Factory** — Scans `agents/` directory. Parses each `agent.md` — frontmatter becomes config, markdown body becomes Claude system prompt. Creates agent instances paired to household members. File watcher for hot-reload.

4. **Memory Store** — Per-agent-instance JSON file. Stores learned patterns: trusted contacts, behavioral baselines, temporal patterns, past threat assessments. Injected into Claude prompt on each call so the agent "remembers." Grows over time = learning.

5. **Claude Integration** — Each agent call = one Claude API request. System prompt = template markdown + accumulated memory. User message = event payload. Response = structured JSON via tool_use: threat_level, assessment, actions, memory_updates.

6. **Escalation Handler** — Routes agent decisions by level: L0-L1 → log only. L2 → monitor. L3 → notify primary companion. L4 → emergency relay + evidence capture. Pushes updates to React UI via WebSocket.

7. **Scheduler** — Cron-like timer that fires internal events on a schedule. Default scheduled tasks:
   - `baseline_update` — every 24 simulated hours. Triggers each agent to recalculate behavioral norms from accumulated observations.
   - `memory_snapshot` — every 12 simulated hours. Backs up agent memory to a timestamped copy for rollback.
   - Custom schedules can be defined per-agent in the template frontmatter via a `schedule` field (e.g., `schedule: { daily_review: "0 0 * * *" }`). For the PoC, schedules use simulated time governed by `LEARNING_TIME_MULTIPLIER`.

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

  "trusted_contacts": {
    "+1-555-0101": {
      "name": "Taylor",
      "relationship": "child",
      "call_frequency": "3x/week",
      "typical_hours": ["09:00-11:00", "18:00-21:00"],
      "voice_enrolled": true,
      "confidence": 0.95,
      "last_contact": "2026-03-14T09:15:00Z"
    }
  },

  "communication_patterns": {
    "typical_call_hours": ["08:00-12:00", "14:00-17:00"],
    "avg_calls_per_day": 4.2,
    "weekend_pattern": "reduced",
    "known_quiet_hours": ["21:00-07:00"],
    "preferred_platforms": ["phone", "sms"]
  },

  "financial_baseline": {
    "typical_transactions": ["grocery", "pharmacy", "utilities"],
    "unusual_channels": ["wire_transfer", "gift_card", "crypto"],
    "max_normal_amount": 500,
    "regular_payees": ["safeway", "cvs", "seattle_city_light"]
  },

  "blocked_contacts": {
    "+1-555-9999": {
      "reason": "Confirmed grandparent scam",
      "blocked_at": "2026-03-14T14:30:22Z"
    }
  },

  "threat_history": [
    {
      "timestamp": "2026-03-14T14:22:00Z",
      "event_id": "evt_20260314_142200_b3c1",
      "event_type": "inbound_call",
      "threat_level": 3,
      "pattern": "grandparent_scam",
      "signals": ["unknown_number", "urgency", "secrecy", "financial_request"],
      "action_taken": "hard_block",
      "outcome": "confirmed_threat"
    }
  ],

  "learned_patterns": [
    {
      "key": "evening_scam_correlation",
      "observation": "Calls after 9pm from unknown numbers are 4x more likely to be scam attempts",
      "learned_from": "12 events over 14 days",
      "confidence": 0.78,
      "created": "2026-03-14T12:00:00Z",
      "updated": "2026-03-14T14:30:00Z"
    }
  ],

  "observations": [
    {
      "category": "communication_patterns",
      "detail": "Mom receives most calls between 9-11am, rarely after 5pm",
      "timestamp": "2026-03-14T11:00:00Z"
    }
  ]
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

The `memory_updates` field is an object with operation keys. The orchestrator applies each operation to the agent's memory store.

**Supported memory update operations:**

| Operation | Schema | Effect |
|---|---|---|
| `add_trusted_contact` | `{ "id": string, "name": string, "relationship": string, "confidence": number }` | Adds or updates a contact in `trusted_contacts` |
| `remove_trusted_contact` | `{ "id": string }` | Removes a contact from `trusted_contacts` |
| `add_threat_record` | `{ "pattern": string, "signals": string[], "source": string, "threat_level": number }` | Appends to `threat_history` array |
| `update_pattern` | `{ "key": string, "observation": string, "confidence_delta": number }` | Upserts into `learned_patterns` by key. Creates if new, adjusts confidence if exists. |
| `update_baseline` | `{ "track": string, "field": string, "value": any }` | Updates a field within a learning track (e.g., `communication_patterns.avg_calls_per_day`) |
| `block_contact` | `{ "id": string, "reason": string }` | Adds to blocked contacts list |
| `add_observation` | `{ "category": string, "detail": string }` | General-purpose observation appended to a log within the relevant learning track |

Example response:

```json
{
  "memory_updates": {
    "add_threat_record": {
      "pattern": "grandparent_scam",
      "signals": ["unknown_number", "urgency", "secrecy", "financial_request"],
      "source": "+1-555-9999",
      "threat_level": 3
    },
    "update_pattern": {
      "key": "evening_scam_correlation",
      "observation": "Third scam attempt after 9pm this month",
      "confidence_delta": 0.15
    },
    "block_contact": {
      "id": "+1-555-9999",
      "reason": "Confirmed grandparent scam pattern"
    }
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

Every agent returns this structure, enforced via Claude tool_use. The tool definition sent to Claude:

```json
{
  "name": "submit_assessment",
  "description": "Submit your threat assessment for the event you just evaluated.",
  "input_schema": {
    "type": "object",
    "required": ["event_id", "agent", "instance", "threat_level", "confidence", "assessment", "signals", "actions", "memory_updates", "stage_check"],
    "properties": {
      "event_id": { "type": "string", "description": "ID of the event being assessed" },
      "agent": { "type": "string", "description": "Agent type name (e.g., anchor)" },
      "instance": { "type": "string", "description": "Agent instance ID (e.g., anchor-mom)" },
      "threat_level": { "type": "integer", "minimum": 0, "maximum": 4, "description": "0=normal, 1=low anomaly, 2=elevated, 3=high, 4=critical" },
      "confidence": { "type": "number", "minimum": 0, "maximum": 1, "description": "Confidence in this assessment" },
      "assessment": { "type": "string", "description": "Human-readable explanation of the assessment" },
      "signals": { "type": "array", "items": { "type": "string" }, "description": "List of signals that triggered this assessment" },
      "actions": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["type"],
          "properties": {
            "type": { "type": "string", "enum": ["log", "monitor", "soft_block", "hard_block", "escalate", "log_evidence"] },
            "target": { "type": "string" },
            "level": { "type": "integer" },
            "to": { "type": "string" },
            "reason": { "type": "string" },
            "summary": { "type": "string" }
          }
        }
      },
      "memory_updates": { "type": "object", "description": "Memory update operations (see Memory Update Operations table)" },
      "stage_check": {
        "type": "object",
        "required": ["current_depth"],
        "properties": {
          "current_depth": { "type": "number" },
          "stage_transition": { "type": ["string", "null"] }
        }
      }
    }
  }
}
```

Example response:

```json
{
  "event_id": "evt_20260314_143022_a7f3",
  "agent": "anchor",
  "instance": "anchor-mom",
  "threat_level": 3,
  "confidence": 0.89,
  "assessment": "Human-readable explanation...",
  "signals": ["unknown_caller", "urgency_language", "secrecy_request"],
  "actions": [
    { "type": "hard_block", "target": "+1-555-9999", "reason": "Confirmed grandparent scam" },
    { "type": "escalate", "level": 3, "to": "primary_companion", "summary": "Active scam attempt on Mom" }
  ],
  "memory_updates": {
    "add_threat_record": { "pattern": "grandparent_scam", "signals": ["..."], "source": "+1-555-9999", "threat_level": 3 },
    "update_pattern": { "key": "evening_scam_correlation", "observation": "...", "confidence_delta": 0.15 }
  },
  "stage_check": {
    "current_depth": 0.32,
    "stage_transition": null
  }
}
```

### Action Type Required Fields

| Action Type | Required Fields | Optional Fields | Effect |
|---|---|---|---|
| `log` | — | `reason` | Write to activity log only |
| `monitor` | `target` | `reason`, `duration` | Flag for elevated monitoring |
| `soft_block` | `target`, `reason` | — | Silently deprioritize/filter contact |
| `hard_block` | `target`, `reason` | — | Block contact entirely |
| `escalate` | `level`, `to`, `summary` | — | Route to another companion or household member |
| `log_evidence` | `reason` | `target` | Capture event details as evidence package |

### Scenario File Format

Scenario files define a scripted sequence of events for demo playback. Stored in `scenarios/<name>.json`.

```json
{
  "name": "grandparent-scam",
  "description": "5-event sequence: normal baseline calls then escalating scam attempt",
  "target_member": "member_002",
  "learning_boost": 5,
  "events": [
    {
      "delay_ms": 0,
      "event": {
        "type": "inbound_call",
        "payload": {
          "caller_id": "+1-555-0101",
          "caller_name": "Taylor",
          "duration_seconds": 180,
          "transcript": "Hi Mom, just checking in. How was your doctor appointment?"
        }
      }
    },
    {
      "delay_ms": 3000,
      "event": {
        "type": "inbound_call",
        "payload": {
          "caller_id": "+1-555-9999",
          "caller_name": null,
          "duration_seconds": 45,
          "transcript": "Grandma? It's me, your grandson. I'm in trouble and I need help right now. Please don't tell Mom. Can you send $2,000 in gift cards?"
        }
      }
    }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Scenario identifier, matches filename |
| `description` | Yes | Human-readable description |
| `target_member` | No | Default target member for all events (overridable per event) |
| `learning_boost` | No | Multiplier for event weight during this scenario (default: 1) |
| `events` | Yes | Ordered array of timed events |
| `events[].delay_ms` | Yes | Milliseconds to wait before firing this event (relative to previous) |
| `events[].event` | Yes | CoreEvent payload (without `id`, `source`, `timestamp` — simulator adds these) |
| `events[].event.target_member` | No | Override the scenario-level `target_member` for this event |

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

## 6. Household Configuration

Household members and companion pairings are defined in `data/household.json`. The Agent Factory reads this on startup to instantiate agent instances.

```json
{
  "household_id": "hh_parsons_001",
  "name": "The Parsons Household",
  "location": "Seattle, WA",
  "created": "2026-03-14T10:00:00Z",
  "members": [
    {
      "id": "member_001",
      "name": "Alex",
      "age": 14,
      "profile_type": "child",
      "companion": "scout",
      "is_primary": false
    },
    {
      "id": "member_002",
      "name": "Mom",
      "age": 71,
      "profile_type": "senior",
      "companion": "anchor",
      "is_primary": false,
      "primary_contact": "member_003"
    },
    {
      "id": "member_003",
      "name": "Taylor",
      "age": 38,
      "profile_type": "adult",
      "companion": "sentinel",
      "is_primary": true
    }
  ]
}
```

| Field | Purpose |
|---|---|
| `profile_type` | Matched against agent template `profile_type` to determine which agent type pairs with this member |
| `companion` | Explicit override — which agent template to use for this member |
| `is_primary` | The primary household member receives escalation relays from other companions |
| `primary_contact` | Which member to notify for L3+ escalations (defaults to `is_primary` member) |

## 7. Accelerated Learning for Demo

The depth curve spans a year in production. For the hackathon demo, learning is accelerated:

- **Time acceleration:** `LEARNING_TIME_MULTIPLIER` env var (default: `1440`). Each real minute counts as one simulated day. A 5-minute demo covers ~5 simulated days.
- **Event weight boost:** `LEARNING_EVENT_WEIGHT` env var (default: `10`). Each event processed counts as 10 for depth score calculation.
- **Threshold override:** `LEARNING_FAST_MODE` env var (default: `true`). When enabled, stage transitions occur at lower absolute thresholds: Baseline→Pattern at depth 0.10, Pattern→Predictive at 0.25, Predictive→Cortege at 0.50.
- **Scenario files** can include a `"learning_boost"` field that further multiplies event weight for specific dramatic moments in the demo.

This means a 5-event demo sequence can show a visible stage transition from Baseline to Pattern Recognition.

## 8. Claude Model Configuration

Model selection is configurable via environment variable:

- **`CLAUDE_MODEL`** env var, default: `claude-haiku-4-5-20251001`
- **Development:** Haiku — fast and cheap for iteration
- **Demo:** Switch to `claude-sonnet-4-6` for higher quality assessments
- **Override per agent:** Agent template frontmatter can include `model: claude-sonnet-4-6` to override the default for specific agent types that need deeper reasoning

## 9. Template Validation

On startup and hot-reload, the Agent Factory validates each `agent.md`:

- **Required frontmatter fields:** `name`, `events`, `threat_model`, `escalation`, `learning`
- **Events must be valid:** Each entry in `events` must be a recognized event type (see Event Types in Section 4)
- **Markdown body must be non-empty:** An agent with no prompt content is rejected
- **Failure mode:** Invalid templates log a clear error with the file path and validation failure reason, then are skipped. The server continues to start with valid agents. This is a warning, not a crash.

## 10. Error Handling

**Claude API failures:**
- Timeout (>30s): Log the event as unprocessed, emit `agent:error` WebSocket event, retry once after 2s
- Rate limit (429): Queue the event for retry with exponential backoff (2s, 4s, 8s, max 3 retries)
- Malformed response (tool_use output doesn't match schema): Log the raw response for debugging, treat as L1 (log only), emit `agent:error`
- After max retries exhausted: Log as `unprocessed_event` in the event store, surface in the UI as a system health indicator

**No silent failures.** Every error path either retries or surfaces to the event log and WebSocket.

## Remaining Open Questions

1. **Which demo use case?** Architecture is ready for any agent type. ANCHOR/grandparent scam is designed but the team may choose a different scenario.
2. **Twilio timing** — account exists, will be wired in later. Event simulator is the default ingestion source.
