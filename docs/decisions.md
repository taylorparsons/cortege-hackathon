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
