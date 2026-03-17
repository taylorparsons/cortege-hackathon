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

