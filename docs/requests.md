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
