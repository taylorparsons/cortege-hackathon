# Decisions (append-only)

## D-20260314-1320
Date: 2026-03-14 13:20
Inputs: CR-20260314-1320
PRD: Project Setup

Decision:
Scaffold as a Vite + React project since the existing prototype is a JSX React component. Add a .gitignore for Node.js projects.

Rationale:
The existing cortege-v2-prototype.jsx imports React hooks and exports a default component — it's designed for a React build pipeline. Vite is the fastest way to get a working dev environment for a hackathon.

Alternatives considered:
- Next.js (rejected because the prototype is a single-page SPA with no routing or SSR needs)
- Create React App (rejected — deprecated)

Acceptance / test:
- `npm run dev` starts a dev server that renders the CORTEGE prototype

## D-20260314-1500
Date: 2026-03-14 15:00
Inputs: CR-20260314-1500
PRD: Skills Setup

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
- Include all global skills (rejected — keeps CLAUDE.md clean and relevant)

Acceptance / test:
- Each skill's SKILL.md readable from .claude/skills/<skill>/SKILL.md
- CLAUDE.md lists all four skills with correct paths and triggers

## D-20260314-1510
Date: 2026-03-14 15:10
Inputs: CR-20260314-1510
PRD: Skills Setup — Superpowers

Decision:
Copy all 14 non-deprecated superpowers skills from the plugin cache (v5.0.2) into .claude/skills/superpowers/<name>/. Also create a project-level settings.json enabling the superpowers plugin explicitly. Skip deprecated aliases (execute-plan, brainstorm, write-plan).

Rationale:
- Makes the project self-contained — skills work without depending on global plugin state
- settings.json ensures the plugin is active even if a collaborator's global config differs
- Copying from the current cached version (5.0.2) pins a known-good snapshot for the hackathon

Alternatives considered:
- Symlink to plugin cache (rejected — paths are machine-specific)
- Rely only on global plugin enablement (rejected — not portable, no local audit trail)

Acceptance / test:
- All 14 superpowers/*/SKILL.md files present in .claude/skills/superpowers/
- .claude/settings.json has enabledPlugins.superpowers@claude-plugins-official = true
- CLAUDE.md lists all skills with triggers

## D-20260314-1600
Date: 2026-03-14 16:00
Inputs: CR-20260314-1600
PRD: Agent Orchestration System

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
- Design spec passes automated review (3 passes)
- Spec covers: template format, architecture, learning system, event model, API contracts, household config, accelerated learning, model config, validation, error handling
- Architecture supports any use case via swappable agent templates and scenario files
