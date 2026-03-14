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
