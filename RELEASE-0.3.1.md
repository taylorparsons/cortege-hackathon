# CORTEGE v0.3.1 - Live Feed Household Scoping Fixes

**Release Date:** March 20, 2026

## Overview

Version `0.3.1` is a patch release on top of `v0.3.0`. It fixes two demo-breaking household-scoping bugs in the Live Feed and companion-detail flows:

- the Live Feed event injector no longer shows the old hard-coded `Alex / Mom / Taylor` targets
- a newly created member no longer inherits stale activity from an older same-name companion instance

This release keeps the `v0.3.0` privacy/location work intact and tightens the demo behavior around real selected-household state.

## What's Fixed

### Live Feed event injector now uses the selected household

- `EventInjector` now derives its target dropdown from `household.members`
- Live Feed injections target the selected household’s real members instead of legacy static demo members
- Cypress coverage now verifies the selected-household target list directly

### New same-name members no longer inherit old activity

- Companion instance IDs now use the stable `member.id` instead of the member display name
- Memory and activity state are isolated per member record, even when two members share the same name
- Companion activity responses now exclude events older than the companion’s creation timestamp

### Documentation and release evidence

- `README.md` now documents the live-feed household targeting fix and stable companion identity behavior
- The localhost Cypress artifact section now includes `live-feed.cy.js` evidence links and MP4 output
- ATHENA traceability now covers the live-feed bugfix and this patch release

## Verification

The release commit was verified with:

- `node --test server/tests/companion-activity.test.js`
- `node --test server/tests/integration.test.js server/tests/demo-validation.test.js`
- `npx cypress run --spec cypress/e2e/member-crud.cy.js,cypress/e2e/companion-cards.cy.js,cypress/e2e/live-feed.cy.js`
- `npm run build`

## Documentation

- [README.md](README.md)
- [docs/API.md](docs/API.md)
- [docs/TRACEABILITY.md](docs/TRACEABILITY.md)
- [docs/specs/20260320-live-feed-household-data/spec.md](docs/specs/20260320-live-feed-household-data/spec.md)
- [docs/specs/20260320-live-feed-patch-release/spec.md](docs/specs/20260320-live-feed-patch-release/spec.md)

## License

No license is specified yet.

---

**Full Changelog:** https://github.com/taylorparsons/cortege-hackathon/compare/v0.3.0...v0.3.1
