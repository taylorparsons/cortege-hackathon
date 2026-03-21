# Twilio Household Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add household `twilio_number` support and make the Twilio voice webhook resolve `household_id` from `To` before emitting a normalized inbound-call event.

**Architecture:** Keep the first slice backend-only. Household create/read/update flows expose a unique E.164 `twilio_number`, and the Twilio webhook uses that value to find the household, emit an `inbound_call` event onto the existing event bus, and reject unknown numbers instead of falling back.

**Tech Stack:** Node.js, Express, node:test, supertest, file-based household store, existing event bus

---

### Task 1: Capture the runtime slice in ATHENA docs

**Files:**
- Modify: `docs/requests.md`
- Modify: `docs/decisions.md`
- Modify: `docs/PRD.md`
- Modify: `docs/specs/working-demo-with-twilio/spec.md`
- Modify: `docs/specs/working-demo-with-twilio/tasks.md`
- Modify: `docs/progress.txt`

- [ ] **Step 1: Append the verbatim request and scope decision**
- [ ] **Step 2: Update the Twilio PRD/spec/tasks to show the current runtime slice**
- [ ] **Step 3: Add a new progress session with `T-003` in progress**

### Task 2: Add RED tests for household `twilio_number`

**Files:**
- Modify: `server/tests/household-store.test.js`
- Modify: `server/tests/household-api.test.js`

- [ ] **Step 1: Write the failing store test for round-tripping `twilio_number`**
- [ ] **Step 2: Write the failing API test for create/update/read with `twilio_number` and duplicate rejection**
- [ ] **Step 3: Run `node --test server/tests/household-store.test.js server/tests/household-api.test.js` and confirm RED**

### Task 3: Add RED tests for webhook household routing

**Files:**
- Create: `server/tests/twilio-webhook.test.js`

- [ ] **Step 1: Write the failing webhook test for mapped `To -> household_id` routing**
- [ ] **Step 2: Write the failing webhook test for unknown `To` rejection**
- [ ] **Step 3: Run `node --test server/tests/twilio-webhook.test.js` and confirm RED**

### Task 4: Implement household `twilio_number`

**Files:**
- Modify: `server/storage/household-store.js`
- Modify: `server/api/routes.js`

- [ ] **Step 1: Add `twilio_number` to store create/list/get/update encode/decode paths**
- [ ] **Step 2: Normalize and validate `twilio_number` in household create/update routes**
- [ ] **Step 3: Reject duplicate Twilio numbers in the household API**
- [ ] **Step 4: Run `node --test server/tests/household-store.test.js server/tests/household-api.test.js` and confirm GREEN**

### Task 5: Implement webhook household routing and event emission

**Files:**
- Modify: `server/ingestion/twilio-webhook.js`
- Modify: `server/index.js`
- Test: `server/tests/twilio-webhook.test.js`

- [ ] **Step 1: Pass the orchestrator/event bus dependencies into the Twilio router**
- [ ] **Step 2: Resolve household by normalized `To` number**
- [ ] **Step 3: Emit a normalized `inbound_call` event with `household_id`**
- [ ] **Step 4: Reject unknown `To` numbers without emitting**
- [ ] **Step 5: Run `node --test server/tests/twilio-webhook.test.js` and confirm GREEN**

### Task 6: Final verification and ATHENA reconciliation

**Files:**
- Modify: `docs/progress.txt`

- [ ] **Step 1: Run `node --test server/tests/household-store.test.js server/tests/household-api.test.js server/tests/twilio-webhook.test.js`**
- [ ] **Step 2: Update `docs/progress.txt` with commands, outcomes, and task completion**
- [ ] **Step 3: Reconcile task/spec status if `T-003` and `T-004` are complete**

### Task 7: Surface live Twilio events and single-target routing

**Files:**
- Modify: `server/storage/db.js`
- Modify: `server/storage/storage-adapter.js`
- Modify: `server/api/routes.js`
- Modify: `server/ingestion/twilio-webhook.js`
- Modify: `server/tests/household-api.test.js`
- Modify: `server/tests/twilio-webhook.test.js`

- [ ] **Step 1: Write a failing API test showing `/api/events` returns the recent live Twilio event from active storage**
- [ ] **Step 2: Write a failing Twilio webhook test showing inbound household calls target exactly one member**
- [ ] **Step 3: Run the targeted tests and confirm RED**
- [ ] **Step 4: Add recent-event reads to the active storage backend and update `/api/events` to use them**
- [ ] **Step 5: Set `target_member` in the Twilio webhook using primary-member fallback, then first-member fallback**
- [ ] **Step 6: Rerun the targeted tests and confirm GREEN**
