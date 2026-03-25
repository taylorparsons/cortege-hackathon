# WARDEN Headed/Headless Browser Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement per-broker and user-initiated headed browser mode for WARDEN data broker scans, enabling manual CAPTCHA resolution for bot-protected brokers.

**Architecture:** Add `ModeResolver` to determine browser mode from three sources (user override > broker config > env var). Extend scan jobs, broker definitions, and scan store to track mode. Add API endpoint and UI controls for manual headed scans.

**Tech Stack:** Node.js, Playwright, Express, React, WebSocket

**Spec:** `.kiro/specs/warden-headed-browser-mode/requirements.md`
**Design:** `.kiro/specs/warden-headed-browser-mode/design.md`

---

## File Structure

**New Files:**
- `server/warden/mode-resolver.js` - Mode resolution logic (override > broker > env)
- `server/tests/mode-resolver.test.js` - Unit tests for mode resolver
- `server/tests/warden-headed-mode.test.js` - Integration tests for headed scans
- `src/components/BrokerScanStatus.jsx` - UI component for broker scan status with headed scan button

**Modified Files:**
- `server/warden/warden-engine.js` - Add mode resolution, headed session tracking, mode in events
- `server/warden/broker-registry.js` - Validate `requires_headed_mode` field
- `server/warden/broker-scan-store.js` - Store mode in scan history
- `server/api/routes.js` - Add `POST /api/warden/scan/headed` endpoint
- `server/warden/brokers/cyberbackgroundchecks.json` - Add `requires_headed_mode: true`
- `server/warden/brokers/spokeo.json` - Add `requires_headed_mode: true`
- `.env.example` - Document `WARDEN_HEADED_MODE` deprecation

---

## Chunk 1: Mode Resolver Core


### Task 1: Create ModeResolver Module with Tests

**Files:**
- Create: `server/warden/mode-resolver.js`
- Create: `server/tests/mode-resolver.test.js`

- [ ] **Step 1: Write failing tests for ModeResolver**

```javascript
// server/tests/mode-resolver.test.js
import { describe, test, expect } from 'vitest';
import { ModeResolver } from '../warden/mode-resolver.js';

describe('ModeResolver', () => {
  test('user override true forces headed mode', () => {
    const job = { headedOverride: true };
    const broker = { requires_headed_mode: false };
    expect(ModeResolver.resolve(job, broker, false)).toBe('headed');
  });

  test('user override false forces headless mode', () => {
    const job = { headedOverride: false };
    const broker = { requires_headed_mode: true };
    expect(ModeResolver.resolve(job, broker, true)).toBe('headless');
  });

  test('broker config headed when no override', () => {
    const job = {};
    const broker = { requires_headed_mode: true };
    expect(ModeResolver.resolve(job, broker, false)).toBe('headed');
  });

  test('broker config headless when no override', () => {
    const job = {};
    const broker = { requires_headed_mode: false };
    expect(ModeResolver.resolve(job, broker, true)).toBe('headless');
  });

  test('env var headed when no override or broker config', () => {
    const job = {};
    const broker = {};
    expect(ModeResolver.resolve(job, broker, true)).toBe('headed');
  });

  test('defaults to headless when no config', () => {
    const job = {};
    const broker = {};
    expect(ModeResolver.resolve(job, broker, false)).toBe('headless');
  });

  test('logs deprecation warning when using env var', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const job = {};
    const broker = {};
    ModeResolver.resolve(job, broker, true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('deprecated WARDEN_HEADED_MODE')
    );
    consoleSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- mode-resolver.test.js`
Expected: FAIL with "Cannot find module '../warden/mode-resolver.js'"

- [ ] **Step 3: Implement ModeResolver**

```javascript
// server/warden/mode-resolver.js
/**
 * ModeResolver — Determines browser mode for WARDEN scans.
 * Priority: user override > broker config > env var > default (headless)
 */

export class ModeResolver {
  /**
   * Resolve browser mode for a scan job.
   * @param {object} job - Scan job with optional headedOverride
   * @param {object} brokerDef - Broker definition with optional requires_headed_mode
   * @param {boolean} globalHeadedMode - WARDEN_HEADED_MODE env var
   * @returns {'headed' | 'headless'}
   */
  static resolve(job, brokerDef, globalHeadedMode = false) {
    // Priority 1: User override
    if (job.headedOverride === true) return 'headed';
    if (job.headedOverride === false) return 'headless';
    
    // Priority 2: Broker configuration
    if (brokerDef.requires_headed_mode === true) return 'headed';
    if (brokerDef.requires_headed_mode === false) return 'headless';
    
    // Priority 3: Global env var (deprecated)
    if (globalHeadedMode) {
      console.warn(
        '[mode-resolver] Using deprecated WARDEN_HEADED_MODE env var. ' +
        'Use per-broker requires_headed_mode instead.'
      );
      return 'headed';
    }
    
    // Default: headless
    return 'headless';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- mode-resolver.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add server/warden/mode-resolver.js server/tests/mode-resolver.test.js
git commit -m "feat(warden): add ModeResolver for headed/headless browser mode selection

Implements: FR-001, FR-002, FR-005
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 2: Broker Registry Validation

### Task 2: Add Broker Definition Validation for requires_headed_mode

**Files:**
- Modify: `server/warden/broker-registry.js`
- Modify: `server/tests/broker-registry.test.js` (if exists, else create)

- [ ] **Step 1: Write failing test for broker validation**

```javascript
// Add to server/tests/broker-registry.test.js
test('validates requires_headed_mode is boolean', () => {
  const invalidBroker = {
    id: 'test',
    name: 'Test',
    search_url: 'https://example.com',
    opt_out_url: 'https://example.com/opt-out',
    requires_pii: ['name'],
    requires_headed_mode: 'yes', // Invalid: should be boolean
    steps: [],
  };
  
  expect(() => {
    registry._validateBroker(invalidBroker);
  }).toThrow('requires_headed_mode must be boolean');
});

test('accepts valid requires_headed_mode true', () => {
  const validBroker = {
    id: 'test',
    name: 'Test',
    search_url: 'https://example.com',
    opt_out_url: 'https://example.com/opt-out',
    requires_pii: ['name'],
    requires_headed_mode: true,
    steps: [],
  };
  
  expect(() => {
    registry._validateBroker(validBroker);
  }).not.toThrow();
});

test('accepts missing requires_headed_mode', () => {
  const validBroker = {
    id: 'test',
    name: 'Test',
    search_url: 'https://example.com',
    opt_out_url: 'https://example.com/opt-out',
    requires_pii: ['name'],
    steps: [],
  };
  
  expect(() => {
    registry._validateBroker(validBroker);
  }).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- broker-registry.test.js`
Expected: FAIL (validation not implemented)

- [ ] **Step 3: Add validation to BrokerRegistry**

```javascript
// In server/warden/broker-registry.js, add to _validateBroker method:

// After existing validation checks, add:
if ('requires_headed_mode' in def) {
  if (typeof def.requires_headed_mode !== 'boolean') {
    throw new Error(`Broker ${def.id}: requires_headed_mode must be boolean`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- broker-registry.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/warden/broker-registry.js server/tests/broker-registry.test.js
git commit -m "feat(warden): validate requires_headed_mode in broker definitions

Implements: FR-001, FR-007
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 3: WARDEN Engine Integration


### Task 3: Update WARDEN Engine to Use ModeResolver

**Files:**
- Modify: `server/warden/warden-engine.js`

- [ ] **Step 1: Import ModeResolver at top of file**

```javascript
// Add to imports section
import { ModeResolver } from './mode-resolver.js';
```

- [ ] **Step 2: Add headed session tracking to constructor**

```javascript
// In constructor, after this._activeSessions = 0;
this._activeHeadedSessions = 0;  // Track headed sessions separately
```

- [ ] **Step 3: Update enqueueScan to accept headed parameter**

```javascript
// Modify enqueueScan signature and job creation:
async enqueueScan(householdId, { memberId, brokerId, headed } = {}) {
  // ... existing validation code ...
  
  for (const member of members) {
    const piiAvailable = await this._checkPiiAvailability(member, household);
    const brokers = brokerId
      ? [this.brokerRegistry.getBroker(brokerId)].filter(Boolean)
      : this.brokerRegistry.getBrokersForMember(piiAvailable);

    for (const broker of brokers) {
      this._queue.push({
        id: `job_${randomUUID().slice(0, 8)}`,
        householdId,
        memberId: member.id,
        memberData: member,
        householdData: household,
        brokerId: broker.id,
        brokerDef: broker,
        priority: 1,
        enqueuedAt: new Date().toISOString(),
        headedOverride: headed,  // NEW: Store override
      });
      jobCount++;
    }
  }
  
  // ... rest of method ...
}
```

- [ ] **Step 4: Update _executeJob to resolve and use mode**

```javascript
// At start of _executeJob, after destructuring:
const mode = ModeResolver.resolve(
  job,
  brokerDef,
  process.env.WARDEN_HEADED_MODE === 'true'
);
const headless = mode === 'headless';

// Store resolved mode in job for audit
job.resolvedMode = mode;

console.log(`[warden] Starting scan job=${job.id} broker=${brokerId} member=${sanitizeString(memberId)} mode=${mode}`);

// Update event emissions to include mode:
this._emitEvent('broker_scan_started', { householdId, memberId, brokerId, mode });
this.ws('warden:scan_started', { householdId, memberId, brokerId, mode });
```

- [ ] **Step 5: Update browser launch and session tracking**

```javascript
// Replace: await session.launch({ headless: !HEADED_MODE });
// With:
try {
  await session.launch({ headless });
  
  // Track headed sessions
  if (!headless) {
    this._activeHeadedSessions++;
  }
} catch (err) {
  console.error(`[warden] Browser launch failed (mode=${mode}): ${sanitizeString(err.message)}`);
  this.brokerScanStore.updateBrokerStatus(
    householdId,
    memberId,
    brokerId,
    'error',
    { error: 'browser_launch_failed', mode }
  );
  this.ws('warden:scan_error', { householdId, memberId, brokerId, error: 'browser_launch_failed', mode });
  return;
}
```

- [ ] **Step 6: Update finally block to track headed sessions**

```javascript
// In finally block, before await session.close():
if (!headless) {
  this._activeHeadedSessions--;
}
```

- [ ] **Step 7: Update broker status storage to include mode**

```javascript
// Replace: this.brokerScanStore.updateBrokerStatus(householdId, memberId, brokerId, finalStatus, result.error ? { error: result.error } : {});
// With:
this.brokerScanStore.updateBrokerStatus(
  householdId,
  memberId,
  brokerId,
  finalStatus,
  { ...result.error ? { error: result.error } : {}, mode }
);
```

- [ ] **Step 8: Update completion events to include mode**

```javascript
// Replace completion event emissions:
this._emitEvent('broker_scan_completed', { householdId, memberId, brokerId, status: finalStatus, mode });
this.ws('warden:scan_completed', { householdId, memberId, brokerId, status: finalStatus, mode });
```

- [ ] **Step 9: Run existing tests to verify no breakage**

Run: `npm test -- warden-engine.test.js`
Expected: PASS (all existing tests still pass)

- [ ] **Step 10: Commit**

```bash
git add server/warden/warden-engine.js
git commit -m "feat(warden): integrate ModeResolver into WARDEN engine

- Add headed session tracking
- Resolve mode per job using ModeResolver
- Include mode in all scan events
- Track headed sessions separately

Implements: FR-002, FR-005, FR-006, FR-008
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 4: Storage Layer Updates

### Task 4: Update Broker Scan Store to Track Mode

**Files:**
- Modify: `server/warden/broker-scan-store.js`

- [ ] **Step 1: Update updateBrokerStatus to accept and store mode**

```javascript
// Modify updateBrokerStatus method signature and implementation:
updateBrokerStatus(householdId, memberId, brokerId, status, metadata = {}) {
  // ... existing code to load current data ...
  
  const now = new Date().toISOString();
  const brokerStatus = {
    status,
    last_scan_at: now,
    last_scan_mode: metadata.mode || 'headless',  // NEW: Track mode
    ...(metadata.error && { error: metadata.error }),
  };

  // ... existing code to update current.brokers[brokerId] ...
  
  // NEW: Add mode to scan history
  if (!current.brokers[brokerId].scan_history) {
    current.brokers[brokerId].scan_history = [];
  }
  current.brokers[brokerId].scan_history.push({
    timestamp: now,
    status,
    mode: metadata.mode || 'headless',  // NEW
  });
  
  // ... existing save code ...
}
```

- [ ] **Step 2: Write test for mode tracking**

```javascript
// Add to server/tests/broker-scan-store.test.js
test('stores mode in scan history', () => {
  const store = new BrokerScanStore('test-data');
  
  store.updateBrokerStatus('hh_test', 'mem_test', 'spokeo', 'not_found', { mode: 'headed' });
  
  const scans = store.getMemberScans('hh_test', 'mem_test');
  expect(scans.brokers.spokeo.last_scan_mode).toBe('headed');
  expect(scans.brokers.spokeo.scan_history[0].mode).toBe('headed');
});

test('defaults to headless when mode not provided', () => {
  const store = new BrokerScanStore('test-data');
  
  store.updateBrokerStatus('hh_test', 'mem_test', 'spokeo', 'not_found', {});
  
  const scans = store.getMemberScans('hh_test', 'mem_test');
  expect(scans.brokers.spokeo.last_scan_mode).toBe('headless');
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test -- broker-scan-store.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/warden/broker-scan-store.js server/tests/broker-scan-store.test.js
git commit -m "feat(warden): track browser mode in scan history

- Store last_scan_mode in broker status
- Add mode to scan_history entries
- Default to headless when not specified

Implements: FR-008
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 5: API Endpoint

### Task 5: Add POST /api/warden/scan/headed Endpoint

**Files:**
- Modify: `server/api/routes.js`

- [ ] **Step 1: Write failing integration test**

```javascript
// Add to server/tests/warden-headed-mode.test.js (create if doesn't exist)
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

describe('POST /api/warden/scan/headed', () => {
  test('returns 400 when household_id missing', async () => {
    const response = await request(app)
      .post('/api/warden/scan/headed')
      .send({ member_id: 'mem_test', broker_id: 'spokeo' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  test('returns 400 when member_id missing', async () => {
    const response = await request(app)
      .post('/api/warden/scan/headed')
      .send({ household_id: 'hh_test', broker_id: 'spokeo' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  test('returns 400 when broker_id missing', async () => {
    const response = await request(app)
      .post('/api/warden/scan/headed')
      .send({ household_id: 'hh_test', member_id: 'mem_test' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  test('returns 404 when household not found', async () => {
    const response = await request(app)
      .post('/api/warden/scan/headed')
      .send({
        household_id: 'hh_nonexistent',
        member_id: 'mem_test',
        broker_id: 'spokeo',
      });
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Household not found');
  });

  test('queues headed scan successfully', async () => {
    // Setup: create test household with member
    // ... setup code ...
    
    const response = await request(app)
      .post('/api/warden/scan/headed')
      .send({
        household_id: 'hh_test',
        member_id: 'mem_test',
        broker_id: 'spokeo',
      });
    
    expect(response.status).toBe(200);
    expect(response.body.queued).toBe(true);
    expect(response.body.message).toContain('Browser will open shortly');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- warden-headed-mode.test.js`
Expected: FAIL (endpoint not implemented)

- [ ] **Step 3: Implement POST /api/warden/scan/headed endpoint**

```javascript
// Add to server/api/routes.js, after existing WARDEN routes:

/**
 * POST /api/warden/scan/headed
 * Trigger a headed (visible browser) scan for a specific member and broker.
 */
router.post('/warden/scan/headed', async (req, res) => {
  const { household_id, member_id, broker_id } = req.body;

  // Validate required fields
  if (!household_id || !member_id || !broker_id) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['household_id', 'member_id', 'broker_id'],
    });
  }

  // Validate household exists
  const household = await householdStore.getHousehold(household_id).catch(() => null);
  if (!household) {
    return res.status(404).json({ error: 'Household not found' });
  }

  // Validate member exists
  const member = (household.members || []).find(m => m.id === member_id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  // Validate broker exists
  const broker = wardenEngine.brokerRegistry.getBroker(broker_id);
  if (!broker) {
    return res.status(404).json({ error: 'Broker not found' });
  }

  // Enqueue headed scan
  const result = await wardenEngine.enqueueScan(household_id, {
    memberId: member_id,
    brokerId: broker_id,
    headed: true,  // Force headed mode
  });

  if (result.queued) {
    res.json({
      queued: true,
      jobs: result.jobs,
      message: 'Headed scan queued. Browser will open shortly.',
    });
  } else {
    res.status(500).json({ error: result.error || 'Failed to queue scan' });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- warden-headed-mode.test.js`
Expected: PASS

- [ ] **Step 5: Update API documentation**

```markdown
// Add to docs/API.md under WARDEN section:

### POST /api/warden/scan/headed

Trigger a headed (visible browser) scan for a specific member and broker. Use this when a broker requires manual CAPTCHA resolution.

**Request Body:**
```json
{
  "household_id": "hh_fab2e400",
  "member_id": "mem_123",
  "broker_id": "spokeo"
}
```

**Response (200 OK):**
```json
{
  "queued": true,
  "jobs": 1,
  "message": "Headed scan queued. Browser will open shortly."
}
```

**Error Responses:**
- 400: Missing required fields
- 404: Household, member, or broker not found
- 500: Failed to queue scan
```

- [ ] **Step 6: Commit**

```bash
git add server/api/routes.js server/tests/warden-headed-mode.test.js docs/API.md
git commit -m "feat(warden): add POST /api/warden/scan/headed endpoint

- Validate household, member, and broker existence
- Queue scan with headed: true override
- Return success message with job count
- Update API documentation

Implements: FR-003
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 6: UI Component


### Task 6: Create BrokerScanStatus UI Component

**Files:**
- Create: `src/components/BrokerScanStatus.jsx`

- [ ] **Step 1: Create component with headed scan button**

```javascript
// src/components/BrokerScanStatus.jsx
import { useState } from 'react';
import { apiUrl } from '../lib/backend-url.js';

export function BrokerScanStatus({ householdId, memberId, broker, scanStatus }) {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleHeadedScan = async () => {
    setLoading(true);
    setNotification(null);
    
    try {
      const response = await fetch(apiUrl('/api/warden/scan/headed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: householdId,
          member_id: memberId,
          broker_id: broker.id,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Browser will open shortly. Please complete the CAPTCHA.',
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to start headed scan',
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="broker-scan-status" style={{
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      marginBottom: '12px',
    }}>
      <div className="broker-info">
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--cream, #f5f5f0)' }}>
          {broker.name}
        </h4>
        <div className="status" style={{ fontSize: '13px', marginBottom: '4px' }}>
          Status: <span className={`status-${scanStatus?.status || 'unknown'}`} style={{
            color: scanStatus?.status === 'not_found' ? '#4ECDC4' : 
                   scanStatus?.status === 'listed' ? '#E8A838' : '#888',
          }}>
            {scanStatus?.status || 'not_scanned'}
          </span>
        </div>
        {scanStatus?.last_scan_at && (
          <div className="last-scan" style={{ fontSize: '12px', color: '#888' }}>
            Last Scan: {new Date(scanStatus.last_scan_at).toLocaleString()}
            {scanStatus.last_scan_mode && (
              <span className="mode-badge" style={{
                marginLeft: '8px',
                padding: '2px 6px',
                background: scanStatus.last_scan_mode === 'headed' ? 'rgba(232,168,56,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${scanStatus.last_scan_mode === 'headed' ? '#E8A838' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '4px',
                fontSize: '11px',
              }}>
                {scanStatus.last_scan_mode}
              </span>
            )}
          </div>
        )}
      </div>

      {broker.requires_headed_mode && (
        <div className="warning" style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(232,168,56,0.1)',
          border: '1px solid rgba(232,168,56,0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#E8A838',
        }}>
          ⚠️ This broker requires manual interaction
        </div>
      )}

      <button
        onClick={handleHeadedScan}
        disabled={loading}
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(232,168,56,0.2)',
          border: '1px solid rgba(232,168,56,0.5)',
          borderRadius: '6px',
          color: '#E8A838',
          fontSize: '13px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {loading ? 'Queueing...' : 'Scan with Browser'}
      </button>

      {notification && (
        <div className={`notification notification-${notification.type}`} style={{
          marginTop: '12px',
          padding: '8px',
          background: notification.type === 'success' ? 'rgba(78,205,196,0.1)' : 'rgba(255,100,100,0.1)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(78,205,196,0.3)' : 'rgba(255,100,100,0.3)'}`,
          borderRadius: '4px',
          fontSize: '12px',
          color: notification.type === 'success' ? '#4ECDC4' : '#ff6464',
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test component manually**

1. Start dev server: `npm run dev`
2. Import and use component in a test page
3. Click "Scan with Browser" button
4. Verify API call is made
5. Verify notification appears

- [ ] **Step 3: Commit**

```bash
git add src/components/BrokerScanStatus.jsx
git commit -m "feat(warden): add BrokerScanStatus UI component

- Display broker name, status, last scan time
- Show mode badge (headed/headless)
- Warning for brokers requiring manual interaction
- Scan with Browser button triggers headed scan
- Success/error notifications

Implements: FR-004
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 7: Broker Definition Updates

### Task 7: Update Cloudflare-Protected Broker Definitions

**Files:**
- Modify: `server/warden/brokers/cyberbackgroundchecks.json`
- Modify: `server/warden/brokers/spokeo.json`

- [ ] **Step 1: Add requires_headed_mode to CyberBackgroundChecks**

```json
// server/warden/brokers/cyberbackgroundchecks.json
{
  "id": "cyberbackgroundchecks",
  "name": "CyberBackgroundChecks",
  "search_url": "https://www.cyberbackgroundchecks.com/people/{name}/{state}",
  "opt_out_url": "https://www.cyberbackgroundchecks.com/removal",
  "requires_pii": ["name", "state"],
  "requires_headed_mode": true,
  "verification_method": "none",
  "version": "2026-03-25",
  "last_verified": "2026-03-25",
  ...
}
```

- [ ] **Step 2: Add requires_headed_mode to Spokeo**

```json
// server/warden/brokers/spokeo.json
{
  "id": "spokeo",
  "name": "Spokeo",
  "search_url": "https://www.spokeo.com/{first_name}-{last_name}/{state_full}/{city}",
  "opt_out_url": "https://www.spokeo.com/optout",
  "requires_pii": ["name", "city", "state"],
  "requires_headed_mode": true,
  "verification_method": "email",
  "version": "2026-03-25",
  "last_verified": "2026-03-25",
  ...
}
```

- [ ] **Step 3: Verify broker registry loads without errors**

Run: `npm test -- broker-registry.test.js`
Expected: PASS (validation accepts requires_headed_mode: true)

- [ ] **Step 4: Test that these brokers now use headed mode by default**

```javascript
// Add test to server/tests/warden-headed-mode.test.js
test('Cloudflare-protected brokers use headed mode by default', () => {
  const spokeo = brokerRegistry.getBroker('spokeo');
  const cyberBg = brokerRegistry.getBroker('cyberbackgroundchecks');
  
  expect(spokeo.requires_headed_mode).toBe(true);
  expect(cyberBg.requires_headed_mode).toBe(true);
  
  // Verify mode resolution
  const job = {};
  expect(ModeResolver.resolve(job, spokeo, false)).toBe('headed');
  expect(ModeResolver.resolve(job, cyberBg, false)).toBe('headed');
});
```

- [ ] **Step 5: Run test to verify**

Run: `npm test -- warden-headed-mode.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/warden/brokers/cyberbackgroundchecks.json server/warden/brokers/spokeo.json server/tests/warden-headed-mode.test.js
git commit -m "feat(warden): flag Cloudflare-protected brokers for headed mode

- Set requires_headed_mode: true for CyberBackgroundChecks
- Set requires_headed_mode: true for Spokeo
- Update version and last_verified dates
- Add test to verify headed mode is used by default

Implements: FR-010
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 8: Documentation Updates

### Task 8: Update Environment Variable Documentation

**Files:**
- Modify: `.env.example`
- Modify: `docs/WARDEN_DEMO_GUIDE.md` (if exists)

- [ ] **Step 1: Update .env.example with deprecation notice**

```bash
# Add to .env.example:

# WARDEN Browser Mode
# DEPRECATED: Use per-broker requires_headed_mode in broker definitions instead
# When true, all scans use visible browser (headed mode)
# When false or omitted, scans use headless mode unless broker requires headed
WARDEN_HEADED_MODE=false

# Maximum concurrent browser sessions (applies to both headed and headless)
WARDEN_MAX_CONCURRENT_SESSIONS=2
```

- [ ] **Step 2: Update WARDEN demo guide (if exists)**

```markdown
// Add section to docs/WARDEN_DEMO_GUIDE.md:

## Headed vs Headless Browser Mode

WARDEN supports two browser modes:

- **Headless Mode** (default): Fully automated, no visible browser window
- **Headed Mode**: Visible browser window for manual CAPTCHA resolution

### Per-Broker Configuration

Brokers can specify `requires_headed_mode: true` in their definition to always use headed mode:

```json
{
  "id": "spokeo",
  "requires_headed_mode": true,
  ...
}
```

### Manual Headed Scans

Users can manually trigger headed scans via the UI:

1. Navigate to member's broker scan status
2. Click "Scan with Browser" button
3. Browser window opens
4. Complete CAPTCHA or bot challenge
5. Scan continues automatically

### API Endpoint

```bash
curl -X POST http://localhost:3001/api/warden/scan/headed \
  -H "Content-Type: application/json" \
  -d '{
    "household_id": "hh_fab2e400",
    "member_id": "mem_123",
    "broker_id": "spokeo"
  }'
```
```

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/WARDEN_DEMO_GUIDE.md
git commit -m "docs(warden): document headed/headless browser mode

- Add WARDEN_HEADED_MODE deprecation notice to .env.example
- Document per-broker configuration
- Document manual headed scan workflow
- Add API endpoint example

Implements: FR-007
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 9: Integration Testing

### Task 9: End-to-End Integration Tests

**Files:**
- Modify: `server/tests/warden-headed-mode.test.js`

- [ ] **Step 1: Add full integration test for headed scan flow**

```javascript
// Add to server/tests/warden-headed-mode.test.js
describe('Headed Scan Integration', () => {
  test('full headed scan flow with mode tracking', async () => {
    // Setup: Create test household with member
    const household = await householdStore.createHousehold({
      name: 'Test Household',
      location_id: 'loc_test',
    });
    
    const member = await householdStore.addMember(household.household_id, {
      name: 'Test Member',
      phone: '+15551234567',
    });

    // Trigger headed scan via API
    const response = await request(app)
      .post('/api/warden/scan/headed')
      .send({
        household_id: household.household_id,
        member_id: member.id,
        broker_id: 'spokeo',
      });
    
    expect(response.status).toBe(200);
    expect(response.body.queued).toBe(true);

    // Wait for scan to process (mock browser session)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify scan was executed in headed mode
    const scans = brokerScanStore.getMemberScans(household.household_id, member.id);
    expect(scans.brokers.spokeo).toBeDefined();
    expect(scans.brokers.spokeo.last_scan_mode).toBe('headed');
    expect(scans.brokers.spokeo.scan_history[0].mode).toBe('headed');

    // Cleanup
    await householdStore.deleteHousehold(household.household_id);
  });

  test('broker with requires_headed_mode uses headed by default', async () => {
    // Setup
    const household = await householdStore.createHousehold({
      name: 'Test Household',
      location_id: 'loc_test',
    });
    
    const member = await householdStore.addMember(household.household_id, {
      name: 'Test Member',
      phone: '+15551234567',
    });

    // Trigger regular scan (no headed override)
    await wardenEngine.enqueueScan(household.household_id, {
      memberId: member.id,
      brokerId: 'spokeo',  // Has requires_headed_mode: true
    });

    // Wait for scan
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify headed mode was used
    const scans = brokerScanStore.getMemberScans(household.household_id, member.id);
    expect(scans.brokers.spokeo.last_scan_mode).toBe('headed');

    // Cleanup
    await householdStore.deleteHousehold(household.household_id);
  });

  test('user override headless forces headless even for headed broker', async () => {
    // Setup
    const household = await householdStore.createHousehold({
      name: 'Test Household',
      location_id: 'loc_test',
    });
    
    const member = await householdStore.addMember(household.household_id, {
      name: 'Test Member',
      phone: '+15551234567',
    });

    // Trigger scan with headless override
    await wardenEngine.enqueueScan(household.household_id, {
      memberId: member.id,
      brokerId: 'spokeo',  // Has requires_headed_mode: true
      headed: false,  // Override to headless
    });

    // Wait for scan
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify headless mode was used despite broker config
    const scans = brokerScanStore.getMemberScans(household.household_id, member.id);
    expect(scans.brokers.spokeo.last_scan_mode).toBe('headless');

    // Cleanup
    await householdStore.deleteHousehold(household.household_id);
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npm test -- warden-headed-mode.test.js`
Expected: PASS (all integration tests)

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: PASS (all tests, no regressions)

- [ ] **Step 4: Commit**

```bash
git add server/tests/warden-headed-mode.test.js
git commit -m "test(warden): add end-to-end integration tests for headed mode

- Test full headed scan flow with mode tracking
- Test broker requires_headed_mode default behavior
- Test user override precedence
- Verify no regressions in existing tests

Implements: FR-001, FR-002, FR-005, FR-006, FR-008
Spec: .kiro/specs/warden-headed-browser-mode/requirements.md"
```

---

## Chunk 10: Final Verification

### Task 10: Manual Testing and Documentation Review

**Files:**
- None (manual testing)

- [ ] **Step 1: Manual test - Headed scan via UI**

1. Start server: `./run-local.sh`
2. Navigate to member's broker scan status
3. Find Spokeo or CyberBackgroundChecks
4. Click "Scan with Browser"
5. Verify browser window opens (headed mode)
6. Complete any CAPTCHA if present
7. Verify scan completes and status updates

- [ ] **Step 2: Manual test - Headless scan for non-protected broker**

1. Trigger scan for a broker without requires_headed_mode
2. Verify no browser window appears (headless mode)
3. Verify scan completes successfully

- [ ] **Step 3: Manual test - Mode indicators in UI**

1. Check scan history shows mode badges
2. Verify "headed" and "headless" badges display correctly
3. Verify warning appears for brokers requiring manual interaction

- [ ] **Step 4: Review all documentation**

1. Read `.kiro/specs/warden-headed-browser-mode/requirements.md`
2. Read `.kiro/specs/warden-headed-browser-mode/design.md`
3. Read `docs/API.md` WARDEN section
4. Read `docs/WARDEN_DEMO_GUIDE.md` headed mode section
5. Verify all documentation is accurate and complete

- [ ] **Step 5: Create summary document**

```markdown
// Create .kiro/specs/warden-headed-browser-mode/IMPLEMENTATION_SUMMARY.md

# WARDEN Headed/Headless Browser Mode - Implementation Summary

## Completed

✅ ModeResolver module with priority-based resolution
✅ Broker definition validation for requires_headed_mode
✅ WARDEN Engine integration with mode tracking
✅ Broker Scan Store mode persistence
✅ POST /api/warden/scan/headed API endpoint
✅ BrokerScanStatus UI component
✅ Cloudflare-protected broker flagging (Spokeo, CyberBackgroundChecks)
✅ Environment variable deprecation documentation
✅ Integration tests (7 unit tests + 3 integration tests)
✅ Manual testing verification

## Test Results

- Unit tests: 7/7 passing
- Integration tests: 3/3 passing
- Full test suite: All passing, no regressions

## Files Changed

**New Files (4):**
- server/warden/mode-resolver.js
- server/tests/mode-resolver.test.js
- server/tests/warden-headed-mode.test.js
- src/components/BrokerScanStatus.jsx

**Modified Files (7):**
- server/warden/warden-engine.js
- server/warden/broker-registry.js
- server/warden/broker-scan-store.js
- server/api/routes.js
- server/warden/brokers/cyberbackgroundchecks.json
- server/warden/brokers/spokeo.json
- .env.example

**Documentation (3):**
- docs/API.md
- docs/WARDEN_DEMO_GUIDE.md
- .kiro/specs/warden-headed-browser-mode/IMPLEMENTATION_SUMMARY.md

## Requirements Coverage

All 10 requirements implemented:
- FR-001: Broker Mode Configuration ✅
- FR-002: Per-Scan Mode Override ✅
- FR-003: Headed Scan API Endpoint ✅
- FR-004: Headed Scan UI Controls ✅
- FR-005: Browser Session Mode Selection ✅
- FR-006: Headed Mode Session Management ✅
- FR-007: Broker Definition Migration ✅
- FR-008: Headed Scan Status Tracking ✅
- FR-009: Headed Mode Error Handling ✅
- FR-010: Cloudflare-Protected Broker Flagging ✅

## Next Steps

- Monitor headed scan usage in production
- Consider adding session timeout configuration
- Consider adding batch headed scan queue UI
```

- [ ] **Step 6: Final commit**

```bash
git add .kiro/specs/warden-headed-browser-mode/IMPLEMENTATION_SUMMARY.md
git commit -m "docs(warden): add implementation summary for headed/headless mode

Complete implementation of headed/headless browser mode feature:
- 4 new files, 7 modified files, 3 documentation updates
- 10/10 requirements implemented
- All tests passing

Spec: .kiro/specs/warden-headed-browser-mode/requirements.md
Design: .kiro/specs/warden-headed-browser-mode/design.md
Plan: docs/superpowers/plans/2026-03-25-warden-headed-browser-mode.md"
```

---

## Plan Complete

**Total Tasks:** 10
**Total Steps:** 60
**Estimated Time:** 4-6 hours

**Execution Ready:** This plan is ready for execution using superpowers:subagent-driven-development or superpowers:executing-plans.

