# CORTEGE v0.3.0 - Privacy-First Household Management and Auditability

**Release Date:** March 20, 2026

## Overview

Version `0.3.0` is the first release that brings the core CORTEGE demo into a more complete product shape. Since `v0.2.0`, the project moved beyond the initial simulated-agent demo and added durable auditability, live frontend/backend integration, multi-household management, saved locations, encrypted PII at rest, and full browser E2E coverage.

This release is cut from current `main` and supersedes the earlier SQLite-only draft notes.

## What's New

### Tamper-evident SQLite storage

- SQLite storage with append-only event log and SHA-256 hash chain
- Database triggers that reject event `UPDATE` and `DELETE`
- Atomic memory snapshot persistence and crash-safe WAL mode
- Migration and validation scripts:
  - `scripts/migrate-to-sqlite.js`
  - `scripts/validate-hash-chain.js`

### Live frontend connected to the real backend

- Replaced hardcoded mock dashboard data with live REST and WebSocket data
- Added localhost-safe relative API/WebSocket URL handling
- Added Vite proxy support so the frontend works cleanly in development
- Extended companion status payloads with richer metadata for the UI

### Multi-household management

- Household CRUD API and frontend switching flow
- Member CRUD UI with improved schema handling and validation
- Backward-compatible `GET /api/household` fallback path
- Migration from legacy `data/household.json` into the multi-household store

### Saved locations and reassignment flows

- Canonical saved-location model behind `location_id`
- Location CRUD API:
  - `GET /api/locations`
  - `POST /api/locations`
  - `GET /api/locations/:id`
  - `PUT /api/locations/:id`
  - `DELETE /api/locations/:id`
- Guarded location deletion with `409 Conflict` when households still reference a location
- Frontend location manager for list, edit, delete, and household reassignment flows

### Privacy-first household data model

- Member full name, phone number, and date of birth encrypted at rest
- Saved location name and structured address encrypted at rest
- Deterministic phone tokens for equality matching without storing plaintext phone values
- Redacted logging and sanitized external LLM payloads so raw household/member PII is not sent out in clear text
- `PII_MASTER_KEY` support for production deployments

### Stronger testing and release confidence

- Playwright E2E suite added for navigation, household CRUD, member CRUD, companion cards, and live feed flows
- Cypress E2E suite added for the same major user journeys
- Household/location/privacy tests moved into the repo-native `node --test` path
- Current verification on `main`:
  - `npm test` -> `162` passing, `3` skipped

## API and Data Model Highlights

### Household and member schema

- Household creation now uses `location_id`
- Members now support:
  - `phone` in E.164 format
  - `date_of_birth` in `YYYY-MM-DD`
  - validated `profile_type` / `companion` flows

### Documentation and onboarding

- Updated `README.md` for the shipped location/privacy model
- Expanded `docs/API.md` with current household, member, and location endpoints
- ATHENA traceability documents now cover the shipped household/privacy work and release correction

## Included in v0.3.0

### Major shipped areas since v0.2.0

- SQLite auditability implementation
- Frontend API integration and localhost connectivity fixes
- Multi-household management
- Saved-location management and reassignment
- Privacy-first PII protection for household data
- Cypress and Playwright E2E coverage
- Updated README/API/docs alignment

## Upgrade Notes

### Environment

The app now supports these important environment variables in addition to the earlier Claude and storage settings:

```bash
STORAGE_MODE=sqlite
SQLITE_DB_PATH=data/cortege.db
ENABLE_JSON_FALLBACK=false
PII_MASTER_KEY=
DEFAULT_HOUSEHOLD_ID=
```

### Legacy compatibility

- Legacy `data/household.json` still has a compatibility path
- New household flows are based on `location_id` and saved locations
- SQLite remains the default storage mode

## Known limitations

- Twilio integration is still not a fully shipped production workflow
- Authentication, rate limiting, and hardened production access controls are still future work
- Development mode falls back to a dev-only PII key when `PII_MASTER_KEY` is unset; production should always set a real key

## Documentation

- [README.md](README.md)
- [docs/API.md](docs/API.md)
- [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)
- [docs/TRACEABILITY.md](docs/TRACEABILITY.md)
- [docs/specs/20260320-pii-encryption-location-model/spec.md](docs/specs/20260320-pii-encryption-location-model/spec.md)

## Contributors

Built for the CORTEGE hackathon with AI-assisted implementation and ATHENA traceability.

## License

No license is specified yet.

---

**Full Changelog:** https://github.com/taylorparsons/cortege-hackathon/compare/v0.2.0...v0.3.0
