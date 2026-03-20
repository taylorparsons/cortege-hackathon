# Privacy-First Household Data Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship encrypted household/member/location PII persistence, canonical `location_id` household references, guarded location CRUD, and sanitized logging/LLM boundaries without breaking legacy household data flows.

**Architecture:** Keep the existing JSON-backed household model, but introduce a dedicated privacy helper layer and a separate encrypted `LocationStore`. Households reference locations by `location_id`, trusted API reads expand decrypted views for the UI, and all external/logging boundaries use sanitized aliases instead of raw PII.

**Tech Stack:** Node.js, Express, React, Vite, JSON file storage, `node:crypto`, existing household/location UI and API test suites.

---

## Chunk 1: Privacy Primitives and Encrypted Storage

### Task 1: Harden privacy helpers and member/location encryption contracts

**Files:**
- Modify: `server/privacy/pii.js`
- Test: `server/tests/privacy.test.js`

- [ ] **Step 1: Write failing privacy helper tests**

Run: `node --test server/tests/privacy.test.js`
Expected: FAIL because `server/tests/privacy.test.js` does not exist yet.

- [ ] **Step 2: Add privacy helper tests for encryption, tokenization, and sanitization**

Cover:
- string round-trip encryption/decryption
- deterministic token stability for equal phone values
- `sanitizeEventForLLM()` strips raw phone, DOB, name, and address strings
- `redactForLogs()` masks direct phone/address values

- [ ] **Step 3: Tighten `server/privacy/pii.js` to satisfy the tests**

Implementation focus:
- keep AES-256-GCM field encryption helpers
- keep deterministic `phone_token` generation
- keep strict E.164 validation helpers
- ensure sanitizers handle member/location context consistently

- [ ] **Step 4: Re-run privacy helper tests**

Run: `node --test server/tests/privacy.test.js`
Expected: PASS

### Task 2: Finish encrypted household/member persistence and compatibility reads

**Files:**
- Modify: `server/storage/household-store.js`
- Test: `server/tests/household-store.test.js`

- [ ] **Step 1: Add failing storage assertions for encrypted member persistence**

Extend tests to cover:
- raw household file does not contain plaintext member name/phone/date_of_birth
- `getHousehold()` returns decrypted values
- legacy plaintext records still load

- [ ] **Step 2: Run the focused store tests**

Run: `node --test server/tests/household-store.test.js`
Expected: FAIL on missing encrypted persistence behavior or incompatible test harness assumptions.

- [ ] **Step 3: Update `HouseholdStore` implementation**

Implementation focus:
- new household writes persist encrypted household name and encrypted member fields
- `listHouseholds()` returns decrypted summaries
- compatibility reads continue to accept legacy `location`, `address`, `name`, `phone`, and `date_of_birth`
- keep `member.id`, `profile_type`, `companion`, `primary_contact` plaintext

- [ ] **Step 4: Re-run store tests**

Run: `node --test server/tests/household-store.test.js`
Expected: PASS

### Task 3: Finish encrypted named-location storage and legacy location creation

**Files:**
- Modify: `server/storage/location-store.js`
- Test: `server/tests/location-store.test.js`

- [ ] **Step 1: Write failing location store tests**

Add tests for:
- encrypted location name/address at rest
- decrypted list/get responses
- `ensureLegacyLocation()` creating a usable location record

- [ ] **Step 2: Run focused location store tests**

Run: `node --test server/tests/location-store.test.js`
Expected: FAIL because the test file and/or required behaviors are missing.

- [ ] **Step 3: Update `LocationStore`**

Implementation focus:
- encrypted write model only
- list payload includes `location_id`, `name`, `address_summary`
- get payload includes decrypted address
- add helper support for household usage queries if API delete checks need it

- [ ] **Step 4: Re-run location store tests**

Run: `node --test server/tests/location-store.test.js`
Expected: PASS

---

## Chunk 2: API Integrity and Referential Rules

### Task 4: Complete household/location API routes for canonical `location_id`

**Files:**
- Modify: `server/api/routes.js`
- Modify: `server/orchestrator/orchestrator.js`
- Test: `server/tests/household-api.test.js`

- [ ] **Step 1: Add failing API tests for canonical household/location reads**

Cover:
- `POST /api/households` requires `location_id`
- `GET /api/households` expands `location_name`, `address_summary`, `location_details`
- legacy `GET /api/household` still normalizes old data

- [ ] **Step 2: Run focused household API tests**

Run: `node --test server/tests/household-api.test.js`
Expected: FAIL on missing location normalization/expansion behavior.

- [ ] **Step 3: Finish route/orchestrator integration**

Implementation focus:
- route helpers normalize legacy household responses
- orchestrator wires both `householdStore` and `locationStore`
- errors use safe messages without decrypted payload values

- [ ] **Step 4: Re-run focused API tests**

Run: `node --test server/tests/household-api.test.js`
Expected: PASS

### Task 5: Add guarded `DELETE /api/locations/:id` with blocking household details

**Files:**
- Modify: `server/api/routes.js`
- Modify: `server/storage/household-store.js`
- Test: `server/tests/household-api.test.js`

- [ ] **Step 1: Add failing API tests for location delete behavior**

Cover:
- deleting an unused location returns `200`
- deleting a referenced location returns `409`
- `409` body includes blocking household IDs/names

- [ ] **Step 2: Run the focused delete tests**

Run: `node --test server/tests/household-api.test.js`
Expected: FAIL because delete route/usage lookup does not exist yet.

- [ ] **Step 3: Implement location usage lookup and guarded delete**

Implementation focus:
- add a `findHouseholdsByLocationId()` or equivalent helper in `HouseholdStore`
- add `DELETE /api/locations/:id`
- return `409 Conflict` with blocking household metadata when references exist

- [ ] **Step 4: Re-run focused delete tests**

Run: `node --test server/tests/household-api.test.js`
Expected: PASS

---

## Chunk 3: Frontend Location Management and Reassignment

### Task 6: Expand the household hook for location CRUD and reassignment operations

**Files:**
- Modify: `src/hooks/useHouseholds.js`
- Test: `e2e/helpers.js`
- Test: `e2e/household-crud.spec.js`

- [ ] **Step 1: Add failing integration expectations**

Update helpers/spec assumptions so they expect:
- location-backed household creation
- location fetch/update/delete operations
- household reassignment via `PUT /api/households/:id`

- [ ] **Step 2: Run the household Playwright spec**

Run: `npm run test:e2e:pw -- e2e/household-crud.spec.js`
Expected: FAIL because helper and hook contracts still assume partial location support.

- [ ] **Step 3: Update `useHouseholds.js`**

Implementation focus:
- add `updateLocation()`
- add `deleteLocation()`
- add `updateHousehold()`
- return structured conflict payloads for blocked location deletes

- [ ] **Step 4: Re-run the household Playwright spec**

Run: `npm run test:e2e:pw -- e2e/household-crud.spec.js`
Expected: PASS or move failure into the next UI task.

### Task 7: Add location list/edit/delete/reassignment UI

**Files:**
- Modify: `src/components/HouseholdSelector.jsx`
- Create: `src/components/LocationManager.jsx`
- Test: `e2e/household-crud.spec.js`
- Test: `cypress/e2e/household-crud.cy.js`

- [ ] **Step 1: Add failing UI scenarios**

Cover:
- listing saved locations
- editing location name/address
- blocked delete messaging with referenced households
- household reassignment to a different location before delete

- [ ] **Step 2: Run focused UI E2E specs**

Run: `npm run test:e2e:pw -- e2e/household-crud.spec.js`
Run: `npx cypress run --spec cypress/e2e/household-crud.cy.js`
Expected: FAIL because no dedicated location UI exists yet.

- [ ] **Step 3: Implement the UI**

Implementation focus:
- keep household creation form working
- add a `LocationManager` section inside or adjacent to `HouseholdSelector`
- show location name, address summary, and usage count
- provide edit fields for name/address
- on blocked delete, surface the households that must be reassigned first
- allow household reassignment from saved locations

- [ ] **Step 4: Re-run focused UI E2E specs**

Run: `npm run test:e2e:pw -- e2e/household-crud.spec.js`
Run: `npx cypress run --spec cypress/e2e/household-crud.cy.js`
Expected: PASS

### Task 8: Bring member and household E2E helpers up to the new contract

**Files:**
- Modify: `e2e/helpers.js`
- Modify: `e2e/member-crud.spec.js`
- Modify: `cypress/e2e/member-crud.cy.js`

- [ ] **Step 1: Add failing expectations for required phone format and updated creation payloads**

Cover:
- E.164 phone input in member tests
- helper-driven household creation through `location_id` or location creation first

- [ ] **Step 2: Run focused member specs**

Run: `npm run test:e2e:pw -- e2e/member-crud.spec.js`
Run: `npx cypress run --spec cypress/e2e/member-crud.cy.js`
Expected: FAIL where tests still use legacy phone/location values.

- [ ] **Step 3: Update helpers and specs**

Implementation focus:
- use valid E.164 test numbers
- stop posting raw household `location`
- align assertions to `location_name` / `address_summary`

- [ ] **Step 4: Re-run focused member specs**

Run: `npm run test:e2e:pw -- e2e/member-crud.spec.js`
Run: `npx cypress run --spec cypress/e2e/member-crud.cy.js`
Expected: PASS

---

## Chunk 4: LLM and Logging Boundaries

### Task 9: Sanitize external Claude payloads and memory serialization

**Files:**
- Modify: `server/agents/memory-store.js`
- Modify: `server/agents/agent-instance.js`
- Test: `server/tests/memory-store.test.js`
- Test: `server/tests/integration.test.js`

- [ ] **Step 1: Add failing tests for sanitized LLM payloads**

Cover:
- serialized memory for LLM excludes raw trusted contact PII
- agent request payload does not contain raw member name/phone/DOB/address strings

- [ ] **Step 2: Run focused LLM-boundary tests**

Run: `node --test server/tests/memory-store.test.js server/tests/integration.test.js`
Expected: FAIL on raw serialization behavior.

- [ ] **Step 3: Update memory and agent request building**

Implementation focus:
- use `serializeForLLM()`
- wrap event payloads with `sanitizeEventForLLM()`
- keep enough role/profile/event semantics for model usefulness

- [ ] **Step 4: Re-run focused LLM-boundary tests**

Run: `node --test server/tests/memory-store.test.js server/tests/integration.test.js`
Expected: PASS

### Task 10: Sanitize logs and ingestion paths

**Files:**
- Modify: `server/escalation/escalation-handler.js`
- Modify: `server/ingestion/manual.js`
- Modify: `server/ingestion/twilio-webhook.js`
- Test: `server/tests/escalation-handler.test.js`

- [ ] **Step 1: Add failing tests or log assertions for redaction**

Cover:
- escalation logs redact text fields
- manual ingestion logs redact payloads
- Twilio logs alias `From` and `To`

- [ ] **Step 2: Run focused log-boundary tests**

Run: `node --test server/tests/escalation-handler.test.js`
Expected: FAIL on missing redaction expectations or require new assertions.

- [ ] **Step 3: Finish log redaction integration**

Implementation focus:
- route all human-readable log fields through `sanitizeString()` or `redactForLogs()`
- never log raw phone numbers or full addresses in ingestion paths

- [ ] **Step 4: Re-run focused log-boundary tests**

Run: `node --test server/tests/escalation-handler.test.js`
Expected: PASS

---

## Chunk 5: Docs, Fixtures, and Final Verification

### Task 11: Update docs and fixtures to the shipped contract

**Files:**
- Modify: `docs/API.md`
- Modify: `README.md`
- Modify: `data/household.json`
- Modify: `scripts/migrate-household.js`

- [ ] **Step 1: Update stale examples and fixtures**

Fix:
- raw `location` household examples
- raw/invalid phone examples
- legacy `age` / `profileType` examples where current flows use `date_of_birth` / `profile_type`

- [ ] **Step 2: Run a grep-based sanity check**

Run: `rg -n '"location"|"age"|"profileType"|555-010' README.md docs/API.md data/household.json e2e cypress server/tests`
Expected: only intentional legacy-compat references remain.

### Task 12: Run final verification and update ATHENA progress

**Files:**
- Modify: `docs/progress.txt`
- Modify: `docs/specs/20260320-pii-encryption-location-model/tasks.md`

- [ ] **Step 1: Run repo-native verification**

Run: `npm run build`
Expected: PASS

Run: `npm test`
Expected: PASS, or document any pre-existing test harness mismatch explicitly.

Run: `npm run test:e2e:pw`
Expected: PASS

- [ ] **Step 2: Record results in ATHENA docs**

Update:
- completed task statuses in `docs/specs/20260320-pii-encryption-location-model/tasks.md`
- commands, outcomes, and open risks in `docs/progress.txt`

- [ ] **Step 3: Commit**

```bash
git add docs/requests.md docs/decisions.md docs/progress.txt docs/specs/20260320-pii-encryption-location-model/tasks.md docs/superpowers/plans/2026-03-20-pii-encryption-location-model.md
git commit -m "docs: add execution plan for privacy-first household data"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-20-pii-encryption-location-model.md`. Ready to execute?
