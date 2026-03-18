# Agent Orchestration System — System Diagrams

Companion diagrams for the [Agent Orchestration Design Spec](2026-03-14-agent-orchestration-design.md).

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Sources["Event Sources"]
        TW["Twilio Webhook\nPOST /ingest/twilio/voice"]
        SIM["Event Simulator\nscenarios/*.json"]
        MAN["Manual Injection\nPOST /ingest/manual"]
        SCH["Scheduler\nnode-cron"]
    end

    subgraph Bus["Event Bus"]
        EB["Typed EventEmitter\n+ SQLite Storage"]
    end

    subgraph Orch["Orchestrator"]
        RT["Event Router"]
        LC["Lifecycle Manager"]
        API["REST API\nExpress :3001"]
        WS["WebSocket\nws://localhost:3001/ws"]
    end

    subgraph Factory["Agent Factory"]
        TP["Template Parser\ngray-matter"]
        MD["agents/*.md\nYAML + markdown"]
        HH["household.json\nmember profiles"]
    end

    subgraph Agents["Agent Pools"]
        subgraph Pool1["ANCHOR Pool"]
            A1["anchor-mom"]
        end
        subgraph Pool2["SCOUT Pool"]
            A2["scout-alex"]
        end
        subgraph Pool3["SENTINEL Pool"]
            A3["sentinel-taylor"]
        end
    end

    subgraph Intelligence["Claude Integration"]
        CL["Claude API\n@anthropic-ai/sdk"]
        TOOL["submit_assessment\ntool_use response"]
    end

    subgraph Memory["Memory Store"]
        MS["SQLite + Storage Adapter\ndata/cortege.db"]
        DS["Depth Score\n0.0 - 1.0"]
        HC["Hash Chain\nSHA-256 tamper evidence"]
    end

    subgraph Escalation["Escalation Handler"]
        EH["Level Router"]
        L01["L0-L1: Log Only"]
        L2["L2: Monitor"]
        L3["L3: Notify Primary"]
        L4["L4: Emergency Relay"]
    end

    subgraph UI["React Frontend"]
        DASH["Companion Dashboard"]
        EF["Event Feed"]
        MV["Memory Viewer"]
        SR["Scenario Runner"]
        EI["Event Injector"]
    end

    TW --> EB
    SIM --> EB
    MAN --> EB
    SCH --> EB

    EB --> RT
    MD --> TP
    HH --> TP
    TP --> LC
    LC --> Agents

    RT --> A1
    RT --> A2
    RT --> A3

    A1 <--> CL
    A2 <--> CL
    A3 <--> CL
    CL --> TOOL

    TOOL --> MS
    MS --> DS
    TOOL --> EH

    EH --> L01
    EH --> L2
    EH --> L3
    EH --> L4

    API --> UI
    WS --> UI
    L3 --> WS
    L4 --> WS

    MS -.->|"injected into\nnext Claude call"| CL
```

## 2. Event Processing Flow

```mermaid
sequenceDiagram
    participant S as Event Source
    participant EB as Event Bus
    participant O as Orchestrator
    participant AI as Agent Instance
    participant CL as Claude API
    participant MS as Memory Store
    participant EH as Escalation Handler
    participant WS as WebSocket
    participant UI as React UI

    S->>EB: CoreEvent (type, payload, target_member)
    EB->>EB: Persist to SQLite with hash chain
    EB->>O: Emit typed event
    O->>WS: event:received

    O->>O: Match event.type to agent subscriptions
    O->>AI: Route event to matching agent instance
    O->>WS: agent:processing

    AI->>MS: Load current memory
    MS-->>AI: trusted_contacts, patterns, history

    AI->>CL: API call (system prompt + memory + event)
    Note over CL: system prompt = template.md body + serialized memory store

    CL-->>AI: tool_use: submit_assessment
    Note over AI: threat_level, confidence, assessment, signals, actions, memory_updates

    AI->>MS: Apply memory_updates
    MS->>MS: Recalculate depth_score
    O->>WS: memory:updated

    alt depth crosses stage threshold
        MS->>O: stage_transition event
        O->>WS: stage:transition
    end

    AI->>EH: Forward actions + threat_level

    alt threat_level 0-1
        EH->>EH: Log only
    else threat_level 2
        EH->>EH: Flag for monitoring
    else threat_level 3
        EH->>WS: escalation:fired
        WS->>UI: Alert primary companion
    else threat_level 4
        EH->>WS: escalation:fired
        EH->>EH: Evidence capture
        WS->>UI: Emergency relay
    end

    O->>WS: agent:response
    WS->>UI: Update dashboard
```

## 3. Agent Factory and Template Processing

```mermaid
graph LR
    subgraph Templates["agents/ directory"]
        T1["_template/agent.md"]
        T2["anchor/agent.md"]
        T3["scout/agent.md"]
        T4["sentinel/agent.md"]
        T5["my-agent/agent.md\nhackathon participant"]
    end

    subgraph Parser["Template Parser"]
        FM["Parse YAML\nFrontmatter"]
        MB["Extract Markdown\nBody"]
        VAL["Validate"]
    end

    subgraph Config["Extracted Config"]
        EV["events: bus subscriptions"]
        TM["threat_model: classification"]
        ESC["escalation: level routing"]
        LRN["learning: memory init"]
        PT["profile_type: member matching"]
    end

    subgraph Prompt["Claude System Prompt"]
        ID["Identity"]
        TE["Threat Expertise"]
        EV2["Evaluation Rules"]
        TL["Threat Levels"]
        LR["Learning Rules"]
    end

    subgraph HH["household.json"]
        M1["Alex, 14, child"]
        M2["Mom, 71, senior"]
        M3["Taylor, 38, adult"]
    end

    subgraph Instances["Agent Instances"]
        I1["scout-alex"]
        I2["anchor-mom"]
        I3["sentinel-taylor"]
    end

    T2 --> FM
    T3 --> FM
    T4 --> FM
    T5 --> FM

    FM --> VAL
    MB --> VAL

    VAL -->|frontmatter| Config
    VAL -->|markdown| Prompt

    PT -.->|match profile_type| HH
    M1 --> I1
    M2 --> I2
    M3 --> I3

    EV --> I1
    EV --> I2
    EV --> I3
```

## 4. Learning and Depth Curve

```mermaid
stateDiagram-v2
    [*] --> Baseline: Day 1

    state Baseline {
        [*] --> Observe_B: Process events
        Observe_B --> Build_B: Build behavioral model
        Build_B --> Observe_B: Memory grows
    }

    Baseline --> PatternRecognition: depth >= 0.25

    state PatternRecognition {
        [*] --> Observe_PR: Process events
        Observe_PR --> Deviation_PR: Detect deviations
        Deviation_PR --> Baseline_PR: Update baseline norms
        Baseline_PR --> Observe_PR: Refined model
    }

    PatternRecognition --> Predictive: depth >= 0.50

    state Predictive {
        [*] --> Observe_P: Process events
        Observe_P --> Anticipate_P: Anticipate threat windows
        Anticipate_P --> Steer_P: Proactive steering
        Steer_P --> Observe_P: Continuous refinement
    }

    Predictive --> CortegeMode: depth >= 0.75

    state CortegeMode {
        [*] --> Observe_CM: Process events
        Observe_CM --> Proxy_CM: Act as digital proxy
        Proxy_CM --> Shrink_CM: Shrink threat surface
        Shrink_CM --> Observe_CM: Deep protection
    }
```

## 5. Escalation and Household Relay

```mermaid
graph TB
    subgraph Event["Incoming Threat Event"]
        EV["CoreEvent: inbound_call\nfrom unknown number"]
    end

    subgraph Agent["ANCHOR Agent - Mom"]
        ASSESS["Claude Assessment\nthreat_level: 3\nconfidence: 0.89"]
        SIGNALS["Signals Detected"]
        S1["unknown_caller"]
        S2["urgency_language"]
        S3["secrecy_request"]
        S4["financial_request"]
        S5["voice_mismatch"]
    end

    subgraph Actions["Actions Taken"]
        BLOCK["hard_block\n+1-555-9999"]
        ESC["escalate\nlevel 3 to primary"]
        LOG["log_evidence"]
    end

    subgraph EscHandler["Escalation Handler"]
        ROUTE["Level Router"]
    end

    subgraph Household["Household Companion Network"]
        SENTINEL_T["SENTINEL - Taylor\nis_primary: true"]
        SCOUT_A["SCOUT - Alex\nhousehold signal"]
    end

    subgraph Response["System Response"]
        WS_PUSH["WebSocket Push\nescalation:fired"]
        UI_ALERT["UI Alert on\nTaylor Dashboard"]
        MEM["Memory Updated\nblocked number\nthreat record\npattern confidence +0.15"]
    end

    EV --> ASSESS
    ASSESS --> SIGNALS
    SIGNALS --> S1
    SIGNALS --> S2
    SIGNALS --> S3
    SIGNALS --> S4
    SIGNALS --> S5

    ASSESS --> BLOCK
    ASSESS --> ESC
    ASSESS --> LOG

    ESC --> ROUTE
    ROUTE -->|"L3: notify primary"| SENTINEL_T
    ROUTE -.->|"household signal"| SCOUT_A

    SENTINEL_T --> WS_PUSH
    WS_PUSH --> UI_ALERT
    BLOCK --> MEM
    LOG --> MEM
```

## 6. Data Flow and Storage

```mermaid
graph TB
    subgraph Runtime["Runtime Data Flow"]
        EV["CoreEvent"] -->|append| SQLITE["data/cortege.db\nSQLite with hash chain"]
        EV --> AGENT["Agent Instance"]
        AGENT -->|read via adapter| MEM_R["Storage Adapter\nsqlite/json/dual-write"]
        AGENT -->|Claude API| CLAUDE["Claude Response"]
        CLAUDE -->|memory_updates| MEM_W["Storage Adapter\natomic transactions"]
        CLAUDE -->|actions| ESC["Escalation Handler"]
        ESC -->|WebSocket| UICOMP["React UI"]
    end

    subgraph TemplateLayer["Template Layer - git tracked"]
        AGT["agents/anchor/agent.md"]
        SCN["scenarios/grandparent-scam.json"]
        HH["data/household.json"]
    end

    subgraph SQLiteSchema["SQLite Schema"]
        EVENTS["events table\nappend-only with triggers"]
        SNAPSHOTS["memory_snapshots table\nlinked to events"]
        HASH["hash chain\nSHA-256 tamper evidence"]
        INDEXES["indexes\nmember, timestamp, type"]
    end

    subgraph MemStructure["Memory Store Schema"]
        TC["trusted_contacts"]
        CP["communication_patterns"]
        FB["financial_baseline"]
        BC["blocked_contacts"]
        TH["threat_history"]
        LP["learned_patterns"]
        OB["observations"]
    end

    subgraph MemOps["Memory Update Operations"]
        OP1["add_trusted_contact"]
        OP2["remove_trusted_contact"]
        OP3["add_threat_record"]
        OP4["update_pattern"]
        OP5["update_baseline"]
        OP6["block_contact"]
        OP7["add_observation"]
    end

    AGT -->|parsed on startup| AGENT
    HH -->|member pairing| AGENT
    SCN -->|replay events| EV

    SQLITE --> EVENTS
    SQLITE --> SNAPSHOTS
    EVENTS --> HASH
    EVENTS --> INDEXES

    MEM_W --> SQLiteSchema
    MEM_W --> MemStructure
    MemOps -->|applied by orchestrator| MEM_W
```

## 7. API Surface

```mermaid
graph LR
    subgraph REST["REST API - Express :3001"]
        G1["GET /api/household"]
        G2["GET /api/companions"]
        G3["GET /api/companions/:id"]
        G4["GET /api/companions/:id/memory"]
        G5["GET /api/companions/:id/activity"]
        G6["GET /api/events"]
        P1["POST /api/events"]
        P2["POST /api/scenarios/:name/run"]
        G7["GET /api/agents"]
        P3["POST /api/agents/reload"]
    end

    subgraph WSEvents["WebSocket Events"]
        W1["event:received"]
        W2["agent:processing"]
        W3["agent:response"]
        W4["escalation:fired"]
        W5["memory:updated"]
        W6["stage:transition"]
        W7["companion:status"]
        W8["agent:error"]
    end

    subgraph Ingest["Ingestion Endpoints"]
        I1["POST /ingest/twilio/voice"]
        I2["POST /ingest/manual"]
    end

    subgraph Frontend["React Components"]
        DASH["Cortege.jsx"]
        EF["EventFeed.jsx"]
        AS["AgentStatus.jsx"]
        MV["MemoryViewer.jsx"]
        SR["ScenarioRunner.jsx"]
        EI["EventInjector.jsx"]
    end

    G1 --> DASH
    G2 --> DASH
    G3 --> DASH
    G4 --> MV
    G5 --> EF
    P1 --> EI
    P2 --> SR
    G7 --> AS

    W1 --> EF
    W2 --> AS
    W3 --> EF
    W4 --> DASH
    W5 --> MV
    W6 --> DASH
    W7 --> AS
```
