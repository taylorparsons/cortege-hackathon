# WARDEN Demo & Testing Guide

**Feature:** Automated data broker removal agent  
**Branch:** feat/warden-agent

## 🎥 Demo Video

**Main demo video:** `demo/cortege-demo.mp4`

This is the full Cortege demo that includes WARDEN functionality. The video shows:
- Household management
- Companion cards
- Live feed
- **Network tab with BrokerStatus** (WARDEN UI)
- **CAPTCHA assist modal** (WARDEN human-in-the-loop)

## 🧪 Running WARDEN Tests

### E2E Tests (Playwright)

WARDEN has comprehensive E2E test coverage:

**1. Broker Status Tests** (`e2e/broker-status.spec.js`)
- 11 tests covering WARDEN API and UI
- Tests broker registry, scan status, and UI components

**2. CAPTCHA Assist Tests** (`e2e/captcha-assist.spec.js`)
- 10 tests covering CAPTCHA modal behavior
- Tests WebSocket events, modal display, and resolution flow

### Run All WARDEN Tests

```bash
# Run all WARDEN-related E2E tests
npx playwright test broker-status captcha-assist

# Run with UI (see tests in browser)
npx playwright test broker-status captcha-assist --ui

# Run specific test
npx playwright test -g "WARDEN API"
```

### Run Demo Recording

```bash
# Record a full demo video (includes WARDEN)
npx playwright test --config playwright.demo.config.js

# Output: demo/playwright-results/video.webm
```

## 🎬 Recording Your Own WARDEN Demo

### Option 1: Manual Recording

1. **Start the app:**
   ```bash
   ./run-local.sh
   ```

2. **Open http://localhost:5173**

3. **Create a test household:**
   - Click "Switch Household"
   - Create new household with location
   - Add 2-3 family members

4. **Navigate to Network tab:**
   - Click "Network" in the nav bar
   - Shows BrokerStatus card

5. **Trigger a scan:**
   - Click "Scan Now" button
   - Watch status updates in real-time

6. **Demonstrate CAPTCHA handling:**
   - If CAPTCHA is detected, modal appears
   - Shows broker name, screenshot, and "Open broker" link
   - User can mark as resolved

### Option 2: Automated Recording (Playwright)

Create a custom test file:

```javascript
// e2e/warden-demo.spec.js
import { test } from '@playwright/test';

test('WARDEN demo walkthrough', async ({ page }) => {
  await page.goto('/');
  
  // Create household
  await page.getByTestId('btn-switch-household').click();
  await page.getByTestId('btn-create-household').click();
  // ... fill form ...
  
  // Navigate to Network tab
  await page.getByTestId('tab-network').click();
  
  // Trigger scan
  await page.getByTestId('btn-scan-now').click();
  
  // Wait for status updates
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'demo/warden-scan.png' });
});
```

Run with video recording:

```bash
npx playwright test warden-demo --config playwright.demo.config.js
```

## 📸 Screenshots

### Taking Screenshots During Tests

```javascript
// In any Playwright test
await page.screenshot({ 
  path: 'demo/warden-broker-status.png',
  fullPage: true 
});
```

### Manual Screenshots

1. Open http://localhost:5173
2. Navigate to Network tab
3. Use browser DevTools or OS screenshot tool

## 🔍 What to Show in a Demo

### 1. Broker Registry (11 Brokers)

**API endpoint:**
```bash
curl http://localhost:3001/api/warden/brokers | jq
```

**Shows:**
- 11 data broker definitions
- Each with name, opt-out URL, required PII
- Includes new CyberBackgroundChecks broker

### 2. Scan Status UI

**Location:** Network tab → BrokerStatus card

**Shows:**
- Per-member scan status
- Aggregate stats (listed, removed, pending)
- Last scan timestamp
- "Scan Now" button

### 3. CAPTCHA Assist Modal

**Trigger:** When scan detects CAPTCHA

**Shows:**
- Broker name requiring CAPTCHA
- Screenshot of CAPTCHA (if available)
- "Open broker" link to solve CAPTCHA
- "Mark as Resolved" button
- "Dismiss" button

### 4. Associate Discovery

**Shows:**
- Family members found on broker sites
- Relationship labels (e.g., "Relative", "Associate")
- Deduplication (existing household members filtered out)

### 5. Real-Time Updates

**WebSocket events:**
- `warden:scan_started`
- `warden:status_update`
- `warden:captcha_required`
- `warden:captcha_resolved`
- `warden:associate_discovered`

## 🎯 Demo Script

### 5-Minute WARDEN Demo

**1. Introduction (30 seconds)**
- "WARDEN automates data broker removal across 11 sites"
- "Zero API costs - pure browser automation"
- "Human-in-the-loop for CAPTCHAs"

**2. Show Broker Registry (1 minute)**
```bash
curl http://localhost:3001/api/warden/brokers | jq '.brokers[] | {id, name, opt_out_url}'
```
- Point out 11 brokers
- Mention declarative JSON definitions
- Show web_search → navigate → fill → submit workflow

**3. Create Test Household (1 minute)**
- Switch Household → Create New
- Add location
- Add 2 family members with real-looking data

**4. Trigger Scan (2 minutes)**
- Navigate to Network tab
- Click "Scan Now"
- Watch status updates in real-time
- Show aggregate stats

**5. CAPTCHA Demo (30 seconds)**
- If CAPTCHA detected, show modal
- Explain human-in-the-loop workflow
- Show "Open broker" link
- Mark as resolved

**6. Wrap-up (30 seconds)**
- "Fully automated, zero API costs"
- "Saves $1,650/year per household vs. manual"
- "Privacy-first: PII encrypted at rest"

## 📊 Test Coverage

### WARDEN E2E Tests

**Broker Status (11 tests):**
- ✅ GET /api/warden/brokers returns all brokers
- ✅ Includes CyberBackgroundChecks
- ✅ GET /api/warden/status with/without household_id
- ✅ GET /api/warden/captcha returns sessions
- ✅ GET /api/warden/associates returns associates
- ✅ POST /api/warden/scan queues scan
- ✅ 404 for unknown CAPTCHA sessions
- ✅ BrokerStatus card visible on Network tab
- ✅ "Scan Now" button sends POST /api/warden/scan
- ✅ Shows "Awaiting first scan" when no data
- ✅ Shows member rows when scan data exists

**CAPTCHA Assist (10 tests):**
- ✅ Modal not visible on initial load
- ✅ Modal appears on warden:captcha_required
- ✅ Shows broker name
- ✅ Shows "Open broker" link with correct URL
- ✅ Screenshot not rendered when null
- ✅ Dismiss button closes modal
- ✅ "Mark as Resolved" calls resolve API
- ✅ Second CAPTCHA replaces first
- ✅ warden:captcha_expired removes modal

**Total: 21 E2E tests passing**

### Unit Tests

**Broker Registry (8 tests):**
- ✅ Loads 11 broker definitions
- ✅ getBroker returns definition by id
- ✅ getBroker returns null for unknown id
- ✅ listBrokers returns all brokers
- ✅ getBrokersForMember filters by PII
- ✅ Skips invalid broker definitions
- ✅ Skips unknown step actions
- ✅ Skips malformed JSON

**Broker Scan Store (15 tests):**
- ✅ updateBrokerStatus creates household doc
- ✅ Sets timestamps on status transitions
- ✅ Rejects invalid status
- ✅ All VALID_STATUSES accepted
- ✅ getMemberScans returns brokers
- ✅ Aggregate recalculates correctly
- ✅ markFullScan sets timestamp
- ✅ upsertAssociate adds/deduplicates
- ✅ dismissAssociate hides associate

**WARDEN Engine (6 tests):**
- ✅ Enqueue scan produces status entries
- ✅ Status transitions work correctly
- ✅ Re-listed status detected
- ✅ CAPTCHA timeout sets status
- ✅ Associate discovery deduplicates
- ✅ Returns error when household store missing

**Total: 29 unit tests passing**

## 🚀 Quick Start for Demo

```bash
# 1. Start the app
./run-local.sh

# 2. Run WARDEN tests (optional - verify everything works)
npx playwright test broker-status captcha-assist

# 3. Open browser
open http://localhost:5173

# 4. Create household and demo!
```

## 📝 Demo Checklist

Before recording/presenting:

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Test household created with 2-3 members
- [ ] Network tab accessible
- [ ] BrokerStatus card visible
- [ ] "Scan Now" button works
- [ ] WebSocket connection active (check browser console)
- [ ] WARDEN_ENABLED=true in .env

## 🎥 Video Recording Tips

**For screen recording:**
- Use 1280x720 resolution (matches Playwright config)
- Record at 30fps minimum
- Include audio narration
- Show browser DevTools Network tab for WebSocket events
- Zoom in on important UI elements

**For Playwright recording:**
- Use `--headed` flag to see browser
- Add `slowMo: 500` for slower, clearer actions
- Use `page.pause()` for manual intervention
- Take screenshots at key moments

## 🔗 Related Files

- **E2E Tests:** `e2e/broker-status.spec.js`, `e2e/captcha-assist.spec.js`
- **Unit Tests:** `server/tests/broker-registry.test.js`, `server/tests/broker-scan-store.test.js`, `server/tests/warden-engine.test.js`
- **Broker Definitions:** `server/warden/brokers/*.json` (11 files)
- **UI Components:** `src/components/BrokerStatus.jsx`, `src/components/CaptchaAssist.jsx`
- **Backend:** `server/warden/warden-engine.js`, `server/warden/scan-executor.js`
- **Cost Analysis:** `docs/WARDEN_COST_ANALYSIS.md`

---

**Need help?** Check the test files for working examples of WARDEN functionality.
