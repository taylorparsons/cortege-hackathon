# Household Fraud Case Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a live household call plus one manual evidence item into a persisted fraud case that the Live Feed tab can create and display tonight.

**Architecture:** Keep the existing Twilio household-ingress and event pipeline unchanged, then add one thin fraud-case layer: a file-backed case store, a deterministic analyzer, two API routes, and a focused Live Feed panel. Use conservative text-first evidence handling so the demo is believable and explainable.

**Tech Stack:** Express, existing CORTEGE API router, file-backed JSON storage, React/Vite, Cypress, Node test runner

---

### Task 1: Capture the pivot in docs

**Files:**
- Modify: `docs/requests.md`
- Modify: `docs/decisions.md`
- Modify: `docs/PRD.md`
- Modify: `docs/TRACEABILITY.md`
- Create: `docs/specs/20260320-household-fraud-case-demo/spec.md`
- Create: `docs/specs/20260320-household-fraud-case-demo/tasks.md`
- Modify: `docs/progress.txt`

- [ ] **Step 1: Write the doc changes**
- [ ] **Step 2: Verify the new spec/task files and traceability links exist**
Run: `rg -n "20260320-household-fraud-case-demo|Household Fraud Case Demo" docs`
Expected: PASS with matches in requests, decisions, PRD, TRACEABILITY, spec, and tasks

### Task 2: Build the backend case layer

**Files:**
- Create: `server/storage/fraud-case-store.js`
- Create: `server/risk/fraud-case-analyzer.js`
- Test: `server/tests/fraud-case-store.test.js`
- Test: `server/tests/fraud-case-api.test.js`

- [ ] **Step 1: Write the failing store/analyzer tests**
- [ ] **Step 2: Run them to verify they fail**
Run: `node --test server/tests/fraud-case-store.test.js server/tests/fraud-case-api.test.js`
Expected: FAIL because the store/analyzer/routes do not exist yet
- [ ] **Step 3: Write minimal store + analyzer implementation**
- [ ] **Step 4: Re-run the backend tests**
Run: `node --test server/tests/fraud-case-store.test.js server/tests/fraud-case-api.test.js`
Expected: PASS

### Task 3: Expose fraud-case API routes

**Files:**
- Modify: `server/api/routes.js`
- Test: `server/tests/fraud-case-api.test.js`

- [ ] **Step 1: Add failing API tests for create/list/scoping**
- [ ] **Step 2: Run the targeted API tests and watch them fail**
Run: `node --test server/tests/fraud-case-api.test.js`
Expected: FAIL on missing `/api/fraud-cases`
- [ ] **Step 3: Add `GET /api/fraud-cases` and `POST /api/fraud-cases`**
- [ ] **Step 4: Re-run the targeted API tests**
Run: `node --test server/tests/fraud-case-api.test.js`
Expected: PASS

### Task 4: Add the Live Feed case panel

**Files:**
- Create: `src/components/FraudCasePanel.jsx`
- Modify: `src/Cortege.jsx`
- Test: `cypress/e2e/fraud-case-demo.cy.js`

- [ ] **Step 1: Write the failing Cypress flow**
- [ ] **Step 2: Run it to verify it fails**
Run: `npx cypress run --spec cypress/e2e/fraud-case-demo.cy.js`
Expected: FAIL because the case panel does not exist yet
- [ ] **Step 3: Implement the minimal UI flow**
- [ ] **Step 4: Re-run the Cypress spec**
Run: `npx cypress run --spec cypress/e2e/fraud-case-demo.cy.js`
Expected: PASS

### Task 5: Final verification and docs alignment

**Files:**
- Modify: `README.md`
- Modify: `docs/progress.txt`

- [ ] **Step 1: Update README demo language**
- [ ] **Step 2: Run final verification**
Run: `node --test server/tests/fraud-case-store.test.js server/tests/fraud-case-api.test.js && npx cypress run --spec cypress/e2e/fraud-case-demo.cy.js && npm run build`
Expected: PASS
- [ ] **Step 3: Record commands and outcomes in `docs/progress.txt`**

---

Review note:
- The `writing-plans` skill normally requires a plan-review subagent. I am not dispatching one here because the current session does not include explicit user authorization for subagents. Proceeding with a single-plan best-effort implementation path instead.
