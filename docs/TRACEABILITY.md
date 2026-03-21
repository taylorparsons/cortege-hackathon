# Traceability (How to follow the audit trail)

Start here:
1) Find the relevant raw request in [`requests.md`](requests.md) (CR-...).
2) Read linked interpretations/tradeoffs in [`decisions.md`](decisions.md) (D-...).
3) Open the feature spec at [`specs/<FEATURE_ID>/spec.md`](specs/).
   - Requirements use IDs (FR-...) and include `Sources: CR-...; D-...`.
   - Acceptance scenarios include `Verifies: FR-...`.
4) Open the feature task list at [`specs/<FEATURE_ID>/tasks.md`](specs/).
   - Tasks include `Implements: FR-...`.
5) Review execution notes in [`progress.txt`](progress.txt) for commands, outcomes, and completion.

## Document Index

| Document | Path | Purpose |
|---|---|---|
| PRD | [`PRD.md`](PRD.md) | Product requirements and current state |
| Requests | [`requests.md`](requests.md) | Raw customer requests (CR-*) |
| Decisions | [`decisions.md`](decisions.md) | Design decisions with rationale (D-*) |
| Progress | [`progress.txt`](progress.txt) | Execution log |
| Hackathon Setup | [`specs/20260314-hackathon-setup/spec.md`](specs/20260314-hackathon-setup/spec.md) | Project scaffolding spec |
| Skill Setup | [`specs/20260314-skill-setup/spec.md`](specs/20260314-skill-setup/spec.md) | Project-local skills spec |
| Superpowers Setup | [`specs/20260314-superpowers-setup/spec.md`](specs/20260314-superpowers-setup/spec.md) | Superpowers plugin skills spec |
| Agent Orchestration | [`superpowers/specs/2026-03-14-agent-orchestration-design.md`](superpowers/specs/2026-03-14-agent-orchestration-design.md) | Agent system design spec |
| Agent Diagrams | [`superpowers/specs/2026-03-14-agent-orchestration-diagrams.md`](superpowers/specs/2026-03-14-agent-orchestration-diagrams.md) | Mermaid system diagrams |
| Frontend API Integration | [`specs/20260319-frontend-api-integration/spec.md`](specs/20260319-frontend-api-integration/spec.md) | Replace mock data with live API data |
| Frontend Dev Connectivity | [`specs/20260319-frontend-dev-connectivity/spec.md`](specs/20260319-frontend-dev-connectivity/spec.md) | Make localhost UI reach the live backend through the Vite origin |
| Gitignore Backup File | [`specs/20260319-gitignore-backup-file/spec.md`](specs/20260319-gitignore-backup-file/spec.md) | Ignore the requested local SQLite backup artifact |
| Design Branch Push | [`specs/20260319-design-branch-push/spec.md`](specs/20260319-design-branch-push/spec.md) | Add detailed shipped summary and push the current design branch |
| Add Household Feature | [`specs/20260319-add-household-feature/spec.md`](specs/20260319-add-household-feature/spec.md) | Multi-household management with CRUD API, selector UI, migration |
| PII Encryption + Location Model | [`specs/20260320-pii-encryption-location-model/spec.md`](specs/20260320-pii-encryption-location-model/spec.md) | Encrypt household/member/location PII, add `location_id`, and sanitize logs + LLM calls |
| README Alignment | [`specs/20260320-readme-alignment/spec.md`](specs/20260320-readme-alignment/spec.md) | Align top-level onboarding docs with the shipped privacy and location model |
| Main Branch Push | [`specs/20260320-main-branch-push/spec.md`](specs/20260320-main-branch-push/spec.md) | Commit pending docs alignment, merge into `main`, and push `origin/main` |
| Release v0.3.0 | [`specs/20260320-release-v030/spec.md`](specs/20260320-release-v030/spec.md) | Update `v0.3.0` release notes, retag current `main`, and publish the GitHub release |
| API Docs Alignment | [`specs/20260320-api-docs-alignment/spec.md`](specs/20260320-api-docs-alignment/spec.md) | Align `docs/API.md` and served `/api/docs` with the latest route behavior |
| Household Editor UI | [`specs/20260320-household-editor-ui/spec.md`](specs/20260320-household-editor-ui/spec.md) | Add an explicit selected-household editor to the existing household selector modal |
| Member Phone Input UX | [`specs/20260320-member-phone-input/spec.md`](specs/20260320-member-phone-input/spec.md) | Normalize common member phone input formats in the UI and surface add/edit errors |
| Active Household Companions | [`specs/20260320-active-household-companions/spec.md`](specs/20260320-active-household-companions/spec.md) | Keep dashboard companion cards aligned with the selected household |
| Cypress Test Artifacts | [`specs/20260320-cypress-artifacts/spec.md`](specs/20260320-cypress-artifacts/spec.md) | Enable Cypress run videos and failure screenshots and verify artifact output |
| README Localhost Validation Artifacts | [`specs/20260320-readme-localhost-artifacts/spec.md`](specs/20260320-readme-localhost-artifacts/spec.md) | Document the localhost Cypress artifact workflow in `README.md` and check in the current local changes |
| Live Feed Household Data | [`specs/20260320-live-feed-household-data/spec.md`](specs/20260320-live-feed-household-data/spec.md) | Fix hard-coded live-feed members and stale companion activity inherited from pre-creation history |
| Live Feed Patch Release | [`specs/20260320-live-feed-patch-release/spec.md`](specs/20260320-live-feed-patch-release/spec.md) | Check in the live-feed bugfix, update `README.md`, and publish a new patch release |
| Twilio Docs Publication | [`specs/20260320-twilio-docs-publication/spec.md`](specs/20260320-twilio-docs-publication/spec.md) | Commit and push the Twilio household-number doc rewrite and clarified diagrams |
| Household Fraud Case Demo | [`specs/20260320-household-fraud-case-demo/spec.md`](specs/20260320-household-fraud-case-demo/spec.md) | Pivot the hackathon demo to a household-scoped fraud case built from a live call plus one manual evidence item |
| PowerPoint Deck Export | [`specs/20260321-deck-pptx-export/spec.md`](specs/20260321-deck-pptx-export/spec.md) | Generate a native PowerPoint deck from `deck.html` with the shipped screenshots embedded |
| Global Codex PPTX Skill | [`specs/20260321-pptx-codex-skill/spec.md`](specs/20260321-pptx-codex-skill/spec.md) | Install a reusable global Codex skill for future PPTX generation work |
| Repository Licensing | [`specs/20260321-proprietary-license/spec.md`](specs/20260321-proprietary-license/spec.md) | Declare the repo as proprietary, not open source, and all rights reserved |
