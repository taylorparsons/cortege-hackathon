# Frontend API Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded mock data in the CORTEGE frontend with live API data, making the dashboard show real system state that grows as agents learn.

**Architecture:** Extend backend `getStatus()` to include rich companion metadata (role, profile type, colors, last action, activity counts). Create a `useCortegeData` custom hook that fetches from `/api/household` and `/api/companions` on mount and merges WebSocket updates into the same state. The main Household tab consumes this hook instead of hardcoded constants. Detail panel fetches `/api/companions/:id/activity` and `/api/companions/:id/memory` on demand.

**Tech Stack:** React 19 (hooks), Express.js REST API, WebSocket (ws), existing SQLite storage layer.

**Feature:** 20260319-frontend-api-integration
**Input:** CR-20260319-1000
**Decision:** D-20260319-1000
**Spec:** docs/specs/20260319-frontend-api-integration/spec.md

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `server/agents/agent-instance.js` | Extend `getStatus()` with rich metadata + track last action |
| Modify | `server/api/routes.js` | Fix `/api/household` to return full household object (not just members) |
| Create | `src/hooks/useCortegeData.js` | Custom hook: fetches household + companions, merges WS |
| Create | `src/hooks/useCompanionDetail.js` | Custom hook: fetches activity + memory for detail panel |
| Create | `src/lib/companion-display.js` | Maps agent type → color, glow, ring, icon |
| Modify | `src/Cortege.jsx` | Remove mock constants, consume hooks, handle loading/empty |
| Modify | `server/tests/integration.test.js` | Add test for extended getStatus() |

**Note:** This project uses `node:test` (built-in Node.js test runner) with `assert` from `node:assert/strict`, NOT vitest/jest. All test commands use `node --test` or `npm test`.

---

### Task 1: Extend backend getStatus() with rich companion metadata

**Files:**
- Modify: `server/agents/agent-instance.js:52-63`
- Modify: `server/tests/integration.test.js`

- [ ] **Step 1: Write the failing test for extended getStatus()**

Add a test to `server/tests/integration.test.js` that verifies `getStatus()` returns the new fields.

```javascript
// Add to server/tests/integration.test.js (uses node:test + node:assert/strict)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentInstance } from '../agents/agent-instance.js';

describe('AgentInstance.getStatus() extended fields', () => {
  it('returns agentRole, profileType, designation, and memberName', () => {
    const instance = new AgentInstance({
      id: 'anchor-mom',
      agentName: 'anchor',
      memberId: 'member_002',
      memberName: 'Mom',
      config: { role: 'Senior Protection Agent', profile_type: 'senior', designation: 'β' },
      systemPrompt: 'test prompt',
    });
    instance.initMemory();

    const status = instance.getStatus();

    assert.equal(status.agentRole, 'Senior Protection Agent');
    assert.equal(status.profileType, 'senior');
    assert.equal(status.designation, 'β');
    assert.equal(status.memberName, 'Mom');
    assert.equal(status.lastAction, null);
    assert.equal(typeof status.eventsProcessed, 'number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/integration.test.js 2>&1 | tail -20`
Expected: FAIL — `status.agentRole` is undefined

- [ ] **Step 3: Implement extended getStatus()**

In `server/agents/agent-instance.js`, extend `getStatus()` and add a `_lastAction` tracker:

```javascript
// Add after constructor's existing properties (line ~30):
    this._lastAction = null; // { text, timestamp }

// Replace getStatus() (lines 52-63) with:
  getStatus() {
    const mem = this.memoryStore?.getMemory();
    return {
      id: this.id,
      agentName: this.agentName,
      memberId: this.memberId,
      memberName: this.memberName,
      stage: mem?.stage ?? 'baseline',
      depthScore: mem?.depth_score ?? 0,
      eventsProcessed: mem?.events_processed ?? 0,
      // Extended fields for frontend
      agentRole: this.config?.role ?? null,
      profileType: this.config?.profile_type ?? null,
      designation: this.config?.designation ?? null,
      lastAction: this._lastAction,
      trustedContactCount: Object.keys(mem?.trusted_contacts ?? {}).length,
      blockedContactCount: Object.keys(mem?.blocked_contacts ?? {}).length,
      threatHistoryCount: (mem?.threat_history ?? []).length,
      createdAt: mem?.created ?? null,
    };
  }
```

Then, in `_processOne()`, after line `agentResponse.instance = this.id;` (around line 176), add:

```javascript
    // Track last action for status display
    this._lastAction = {
      text: agentResponse.assessment ?? 'Event processed',
      timestamp: new Date().toISOString(),
      threatLevel: agentResponse.threat_level ?? 0,
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/integration.test.js 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Run full test suite to check for regressions**

Run: `npm test 2>&1 | tail -30`
Expected: All tests pass (131+ pass, 0 fail)

- [ ] **Step 6: Commit**

```bash
git add server/agents/agent-instance.js server/tests/integration.test.js
git commit -m "T-001: Extend getStatus() with rich companion metadata (Feature: 20260319-frontend-api-integration)"
```

---

### Task 1.5: Fix /api/household to return full household object

**Files:**
- Modify: `server/api/routes.js:99-106`
- Modify: `server/orchestrator/orchestrator.js` (or wherever `orchestrator.household` is set)

**Problem:** Currently `GET /api/household` returns `orchestrator.household` which is set to `householdData.members` (just the members array). The frontend needs the full household object with `name`, `location`, `created`.

- [ ] **Step 1: Check how household is loaded**

Read `server/orchestrator/orchestrator.js` and find where `this.household` is set. It's set to `householdData.members` — the raw members array from `data/household.json`.

- [ ] **Step 2: Modify the route to return full household data**

In `server/api/routes.js`, update the `/api/household` handler to load and return the full household JSON:

```javascript
  router.get('/api/household', (req, res) => {
    try {
      // Return full household object including name, location, created, and members
      const householdPath = path.resolve('data/household.json');
      if (fs.existsSync(householdPath)) {
        const data = JSON.parse(fs.readFileSync(householdPath, 'utf8'));
        res.json(data);
      } else {
        res.json({ name: 'Household', members: orchestrator.household ?? [] });
      }
    } catch (err) {
      console.error('[api] GET /api/household error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
```

This returns the full `data/household.json` which has `household_id`, `name`, `location`, `created`, and `members`.

- [ ] **Step 3: Run tests to verify no regressions**

Run: `npm test 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add server/api/routes.js
git commit -m "T-001.5: Fix /api/household to return full household object (Feature: 20260319-frontend-api-integration)"
```

---

### Task 2: Create companion display property mapping

**Files:**
- Create: `src/lib/companion-display.js`

- [ ] **Step 1: Create the display mapping module**

```javascript
/**
 * Maps agent type / profile type to display properties.
 * These are UI constants — they define how each agent TYPE renders,
 * not fake data about agent state.
 */

const AGENT_DISPLAY = {
  scout: {
    color: '#4ECDC4',
    glow: 'rgba(78,205,196,0.18)',
    ring: 'rgba(78,205,196,0.35)',
  },
  anchor: {
    color: '#E8A838',
    glow: 'rgba(232,168,56,0.15)',
    ring: 'rgba(232,168,56,0.3)',
  },
  sentinel: {
    color: '#7B9EC9',
    glow: 'rgba(123,158,201,0.15)',
    ring: 'rgba(123,158,201,0.3)',
  },
};

const DEFAULT_DISPLAY = {
  color: '#8C8272',
  glow: 'rgba(140,130,114,0.15)',
  ring: 'rgba(140,130,114,0.3)',
};

/**
 * Learning stages with display properties.
 * These define the learning model — not fake data.
 */
export const DEPTH_STAGES = [
  { label: 'Baseline', key: 'baseline', days: 'Day 1', color: '#7B9EC9', desc: 'Universal threat signatures active' },
  { label: 'Pattern Recognition', key: 'pattern_recognition', days: 'Day 30', color: '#4ECDC4', desc: 'Behavioral model building' },
  { label: 'Predictive', key: 'predictive', days: 'Day 90', color: '#9B7FD4', desc: 'Anticipating threats before they form' },
  { label: 'Cortege Mode', key: 'cortege_mode', days: 'Day 365', color: '#E8A838', desc: 'Full companion — deepest protection' },
];

/**
 * Returns display properties for an agent by name.
 * @param {string} agentName  e.g. "anchor", "scout", "sentinel"
 * @returns {{ color: string, glow: string, ring: string }}
 */
export function getAgentDisplay(agentName) {
  return AGENT_DISPLAY[agentName] ?? DEFAULT_DISPLAY;
}

/**
 * Returns the stage index (0-3) for a stage key.
 * @param {string} stageKey  e.g. "baseline", "pattern_recognition"
 * @returns {number}
 */
export function getStageIndex(stageKey) {
  const idx = DEPTH_STAGES.findIndex(s => s.key === stageKey);
  return idx >= 0 ? idx : 0;
}

/**
 * Formats a stage key for display.
 * @param {string} stageKey  e.g. "pattern_recognition"
 * @returns {string}  e.g. "Pattern Recognition"
 */
export function formatStageName(stageKey) {
  const stage = DEPTH_STAGES.find(s => s.key === stageKey);
  return stage?.label ?? stageKey?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Unknown';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/companion-display.js
git commit -m "T-002: Create companion display property mapping (Feature: 20260319-frontend-api-integration)"
```

---

### Task 3: Create useCortegeData custom hook

**Files:**
- Create: `src/hooks/useCortegeData.js`

- [ ] **Step 1: Create the hook**

```javascript
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';

/**
 * Custom hook that manages all CORTEGE data:
 * - Fetches household + companions from REST API on mount
 * - Connects WebSocket and merges real-time updates
 * - Re-fetches on WebSocket reconnect
 *
 * @returns {{
 *   household: object|null,
 *   companions: object[],
 *   liveEvents: object[],
 *   wsConnected: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   toast: string|null,
 *   processingStates: Map,
 *   refetch: () => void,
 * }}
 */
export function useCortegeData() {
  const [household, setHousehold] = useState(null);
  const [companions, setCompanions] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [processingStates, setProcessingStates] = useState(new Map());

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch household + companions from REST API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hhRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/api/household`),
        fetch(`${API_BASE}/api/companions`),
      ]);

      if (hhRes.ok) {
        const hhData = await hhRes.json();
        setHousehold(hhData);
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanions(Array.isArray(compData) ? compData : []);
      }
    } catch (err) {
      setError('Cannot reach backend');
      console.warn('[useCortegeData] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return;

    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      // Re-fetch on reconnect to sync state
      fetchData();
    };

    socket.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      const { event, data } = msg;

      if (event === 'event:received') {
        setLiveEvents(prev => [data, ...prev].slice(0, 50));
      } else if (event === 'escalation:fired') {
        const level = data?.level ?? data?.escalation_level ?? '';
        const member = data?.member_id ?? data?.target_member ?? '';
        showToast(`Escalation L${level} — ${member}`);
      } else if (event === 'stage:transition') {
        setCompanions(prev => prev.map(c =>
          c.id === data?.instanceId
            ? { ...c, stage: data.newStage ?? data.toStage ?? c.stage, depthScore: data.depthScore ?? c.depthScore }
            : c
        ));
      } else if (event === 'agent:processing') {
        setProcessingStates(prev => {
          const next = new Map(prev);
          next.set(data?.instanceId, true);
          return next;
        });
      } else if (event === 'agent:response') {
        setProcessingStates(prev => {
          const next = new Map(prev);
          next.set(data?.instanceId, false);
          return next;
        });
        // Update companion with latest data from response
        if (data?.instanceId) {
          setCompanions(prev => prev.map(c =>
            c.id === data.instanceId
              ? {
                  ...c,
                  eventsProcessed: (c.eventsProcessed ?? 0) + 1,
                  lastAction: {
                    text: data.response?.assessment ?? 'Event processed',
                    timestamp: new Date().toISOString(),
                    threatLevel: data.response?.threat_level ?? 0,
                  },
                }
              : c
          ));
        }
      } else if (event === 'agent:error') {
        setProcessingStates(prev => {
          const next = new Map(prev);
          next.set(data?.instanceId, false);
          return next;
        });
      } else if (event === 'companion:status') {
        setCompanions(prev => {
          const idx = prev.findIndex(c => c.id === data?.instanceId || c.id === data?.id);
          if (idx === -1) return [...prev, data];
          const next = [...prev];
          next[idx] = { ...next[idx], ...data };
          return next;
        });
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    socket.onerror = () => {
      setWsConnected(false);
      socket.close();
    };
  }, [fetchData, showToast]);

  // Initial WS connect (fetchData is called inside socket.onopen, so no separate call needed)
  useEffect(() => {
    connectWs();
    // Also fetch immediately in case WS connection is slow
    fetchData();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount — connectWs/fetchData are stable refs

  return {
    household,
    companions,
    liveEvents,
    wsConnected,
    loading,
    error,
    toast,
    processingStates,
    refetch: fetchData,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCortegeData.js
git commit -m "T-003: Create useCortegeData custom hook (Feature: 20260319-frontend-api-integration)"
```

---

### Task 4: Create useCompanionDetail hook

**Files:**
- Create: `src/hooks/useCompanionDetail.js`

- [ ] **Step 1: Create the detail hook**

```javascript
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

/**
 * Fetches activity + memory for a selected companion.
 * Only fetches when companionId changes (detail panel opened).
 *
 * @param {string|null} companionId  e.g. "anchor-mom" or null
 * @returns {{
 *   activity: object[],
 *   memory: object|null,
 *   loading: boolean,
 * }}
 */
export function useCompanionDetail(companionId) {
  const [activity, setActivity] = useState([]);
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companionId) {
      setActivity([]);
      setMemory(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/companions/${companionId}/activity?limit=20`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch(`${API_BASE}/api/companions/${companionId}/memory`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([actData, memData]) => {
      if (!cancelled) {
        setActivity(Array.isArray(actData) ? actData : []);
        setMemory(memData);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [companionId]);

  return { activity, memory, loading };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCompanionDetail.js
git commit -m "T-004: Create useCompanionDetail hook (Feature: 20260319-frontend-api-integration)"
```

---

### Task 5: Rewrite Cortege.jsx to consume API data

**Files:**
- Modify: `src/Cortege.jsx`

This is the largest task. It replaces mock constants with hook data and updates all components to work with the API shape.

- [ ] **Step 1: Replace imports and remove mock data**

At the top of `src/Cortege.jsx`:

1. Add new imports:
```javascript
import { useCortegeData } from './hooks/useCortegeData.js';
import { useCompanionDetail } from './hooks/useCompanionDetail.js';
import { getAgentDisplay, getStageIndex, formatStageName, DEPTH_STAGES } from './lib/companion-display.js';
```

2. Remove the `const WS_URL = ...` line (now in hook).

3. Remove the entire `// ─── MOCK DATA ──` section (lines 12-117):
   - Remove `HOUSEHOLD` constant
   - Remove `COMPANIONS` constant
   - Remove `DEPTH_STAGES` constant

- [ ] **Step 2: Update the main Cortege component to use hooks**

Replace the state/WebSocket section of the `Cortege()` function (lines 789-890) with:

```javascript
export default function Cortege() {
  const [tab, setTab] = useState("household");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // API data
  const {
    household,
    companions,
    liveEvents,
    wsConnected,
    loading,
    error,
    toast,
    processingStates,
  } = useCortegeData();

  // Detail panel data (fetches when a companion is selected)
  const { activity, memory: detailMemory, loading: detailLoading } = useCompanionDetail(selectedId);

  // Find selected companion from API data
  const selected = selectedId ? companions.find(c => c.id === selectedId) : null;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Derive household stats from real companion data
  const totalEventsToday = companions.reduce((s, c) => s + (c.eventsProcessed ?? 0), 0);
```

- [ ] **Step 3: Update the Household tab JSX**

Replace the household bar section to use API data:

```jsx
{tab === "household" && (
  <>
    {loading ? (
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", fontSize: 13 }}>
        Connecting to CORTEGE backend...
      </div>
    ) : error ? (
      <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", fontSize: 13 }}>
        {error} — start the backend with <code style={{ color: "var(--amber)" }}>npm run server</code>
      </div>
    ) : (
      <>
        {/* Household bar */}
        <div className="household-bar">
          <div className="hh-left">
            <div className="hh-crest">🏠</div>
            <div>
              <div className="hh-name">{household?.name ?? 'Household'}</div>
              <div className="hh-sub">
                {household?.location ?? ''}{household?.location ? ' · ' : ''}
                Cortege since {household?.created ? new Date(household.created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
          <div className="hh-stats">
            <div className="hh-stat">
              <div className="hh-stat-val">{companions.length}</div>
              <div className="hh-stat-lbl">Companions</div>
            </div>
            <div className="hh-stat">
              <div className="hh-stat-val">{totalEventsToday}</div>
              <div className="hh-stat-lbl">Events processed</div>
            </div>
            <div className="hh-stat">
              <div className="hh-stat-val" style={{ color: "#4ECDC4" }}>0</div>
              <div className="hh-stat-lbl">Reached family</div>
            </div>
          </div>
        </div>

        <div className="section-eyebrow">
          Companion Agents — {companions.length} {companions.length === 1 ? 'active' : 'active'}
        </div>

        {companions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>
            No companions loaded. Run a scenario to start.
          </div>
        ) : (
          <div className="companion-grid">
            {companions.map(c => {
              const display = getAgentDisplay(c.agentName);
              return (
                <CompanionCard
                  key={c.id}
                  c={{
                    ...c,
                    name: c.agentName?.toUpperCase() ?? c.id,
                    role: c.agentRole ?? c.agentName,
                    greek: c.designation ?? '',
                    paired: c.memberName ?? '',
                    color: display.color,
                    glow: display.glow,
                    ring: display.ring,
                    stage: formatStageName(c.stage),
                    stageIdx: getStageIndex(c.stage),
                    days: c.createdAt ? Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000) : 0,
                    lastAction: c.lastAction?.timestamp
                      ? timeAgo(c.lastAction.timestamp)
                      : 'No activity yet',
                    lastActionText: c.lastAction?.text ?? 'Waiting for events...',
                    silentActionsToday: c.eventsProcessed ?? 0,
                    silentActionsMonth: c.eventsProcessed ?? 0,
                    threatLevel: c.lastAction?.threatLevel ?? 0,
                    graph: {
                      trusted: c.trustedContactCount ?? 0,
                      monitored: 0,
                      blocked: c.blockedContactCount ?? 0,
                    },
                    depth: {
                      day30: getStageIndex(c.stage) >= 1,
                      day90: getStageIndex(c.stage) >= 2,
                      day365: getStageIndex(c.stage) >= 3,
                    },
                  }}
                  selected={selectedId === c.id}
                  processing={processingStates.get(c.id) ?? false}
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                />
              );
            })}
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <>
            <DetailPanel
              c={{
                ...selected,
                name: selected.agentName?.toUpperCase() ?? selected.id,
                role: selected.agentRole ?? selected.agentName,
                greek: selected.designation ?? '',
                paired: selected.memberName ?? '',
                age: '', // Age not tracked by API; omit from display
                days: selected.createdAt ? Math.floor((Date.now() - new Date(selected.createdAt).getTime()) / 86400000) : 0,
                ...getAgentDisplay(selected.agentName),
                stage: formatStageName(selected.stage),
                stageIdx: getStageIndex(selected.stage),
                recentActivity: detailLoading ? [] : activity.map(evt => ({
                  time: timeAgo(evt.timestamp),
                  icon: eventTypeIcon(evt.type),
                  text: evt.payload?.assessment ?? evt.payload?.description ?? `${evt.type} event`,
                  level: evt.payload?.threat_level ?? 0,
                })),
              }}
              onControl={(btn) => setModal(CONTROL_MODALS[btn.key])}
            />
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 20, padding: "24px 32px", marginBottom: 36,
            }}>
              <MemoryViewer
                companionId={selectedId}
                companionName={selected.agentName?.toUpperCase()}
              />
            </div>
          </>
        )}

        {!selected && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)", fontSize: 12, letterSpacing: 1 }}>
            Select a companion above to view their activity log
          </div>
        )}
      </>
    )}
  </>
)}
```

- [ ] **Step 4: Add helper functions at the bottom of the file (before export)**

```javascript
/** Formats an ISO timestamp as relative time (e.g., "3 min ago") */
function timeAgo(isoString) {
  if (!isoString) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 172800) return 'Yesterday';
  return `${Math.floor(seconds / 86400)} days ago`;
}

/** Maps event type to an emoji icon */
function eventTypeIcon(type) {
  const icons = {
    inbound_call: '📞',
    inbound_sms: '💬',
    inbound_email: '✉️',
    financial_transaction: '💳',
    contact_request: '👤',
    login_attempt: '🔐',
  };
  return icons[type] ?? '📋';
}
```

- [ ] **Step 5: Update the Live Feed tab to use shared data**

Replace the Live Feed tab section to use the hook data instead of separate state:

```jsx
{tab === "livefeed" && (
  <>
    <div className="section-eyebrow">System Activity</div>
    <div className="section-title">Live Feed</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <EventFeed events={liveEvents} wsConnected={wsConnected} />
      </div>
      <div>
        <AgentStatus
          companions={companions.map(c => ({
            ...c,
            instanceId: c.id,
            name: c.agentName?.toUpperCase(),
          }))}
          processingStates={processingStates}
        />
        <div style={{ marginTop: 20 }}>
          <ScenarioRunner />
        </div>
        <div style={{ marginTop: 20 }}>
          <EventInjector />
        </div>
      </div>
    </div>
  </>
)}
```

**Important:** `EventFeed` expects `wsConnected` as a separate prop. `AgentStatus` expects `processingStates` as a separate `Map` prop — do NOT embed processing state into each companion object.

- [ ] **Step 6: Remove old WebSocket code and liveCompanions state**

The old WebSocket setup (lines 795-881 in original) and `liveCompanions` state are now inside `useCortegeData`. Remove:
- `const [wsConnected, setWsConnected] = useState(false);`
- `const [liveEvents, setLiveEvents] = useState([]);`
- `const [toast, setToast] = useState(null);`
- `const [processingStates, setProcessingStates] = useState(new Map());`
- `const [liveCompanions, setLiveCompanions] = useState([]);`
- `const wsRef = useRef(null);`
- `const reconnectTimer = useRef(null);`
- The entire `connectWs` callback and its `useEffect`

**Also update the nav tab click handler** (line ~909 in original). Change:
```jsx
onClick={() => { setTab(t.id); setSelected(null); }}
```
To:
```jsx
onClick={() => { setTab(t.id); setSelectedId(null); }}
```

**Also remove the `useRef` import** if no longer needed (check if `useRef` is still used elsewhere in the file).

- [ ] **Step 7: Commit**

```bash
git add src/Cortege.jsx
git commit -m "T-005: Rewrite Cortege.jsx to consume API data instead of mock constants (Feature: 20260319-frontend-api-integration)"
```

---

### Task 6: Verify build compiles

**Files:**
- None (verification only)

- [ ] **Step 1: Run Vite build**

Run: `npx vite build 2>&1 | tail -10`
Expected: Build succeeds with no errors

- [ ] **Step 2: Fix any import/reference errors**

If build fails, fix the specific errors (missing imports, renamed variables, etc.).

- [ ] **Step 3: Commit fixes if any**

```bash
git add -A && git commit -m "fix: resolve build errors from API integration (Feature: 20260319-frontend-api-integration)"
```

---

### Task 7: Run full backend test suite

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test 2>&1 | tail -30`
Expected: All existing tests pass (131+ pass, 0 fail)

- [ ] **Step 2: Fix any regressions**

If tests fail, fix the issues and re-run.

---

### Task 8: End-to-end verification

**Files:**
- None (verification only)

- [ ] **Step 1: Start the backend**

Run: `npm run server` (in one terminal)

- [ ] **Step 2: Start the frontend**

Run: `npm run dev` (in another terminal)

- [ ] **Step 3: Verify empty state**

Open http://localhost:5173 — should see:
- Household header with real data from `household.json`
- Empty companion cards with real agent names/roles from API
- "No activity yet" states
- WebSocket connected indicator

- [ ] **Step 4: Run a demo scenario**

Go to Live Feed tab → ScenarioRunner → click "grandparent-scam"

- [ ] **Step 5: Verify Household tab updates**

Switch to Household tab — companion cards should show:
- Updated events processed count
- Last action text from the scenario
- Stage progression (if thresholds met)
- Real-time updates via WebSocket

- [ ] **Step 6: Verify detail panel**

Click a companion card — detail panel should show:
- Real activity from `/api/companions/:id/activity`
- Real memory from `/api/companions/:id/memory` (via MemoryViewer)

---

### Task 9: Clean up and final commit

**Files:**
- Modify: `src/Cortege.jsx` (remove any remaining mock references)

- [ ] **Step 1: Search for remaining mock data references**

Run: `grep -n "MOCK\|mock\|fake\|hardcode" src/Cortege.jsx`
Expected: No results (all mock data removed)

- [ ] **Step 2: Remove the old `const WS_URL` if still present**

Verify WS_URL is only defined in `useCortegeData.js`, not in `Cortege.jsx`.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "T-009: Clean up remaining mock data references (Feature: 20260319-frontend-api-integration)"
```

---

### Task 10: Update ATHENA docs

**Files:**
- Modify: `docs/specs/20260319-frontend-api-integration/tasks.md`
- Modify: `docs/progress.txt`

- [ ] **Step 1: Mark tasks as DONE in tasks.md**

Update each completed task with timestamp.

- [ ] **Step 2: Update progress.txt with session notes**

Add a new session entry with all completed tasks, commands run, and evidence.

- [ ] **Step 3: Update spec status to Done**

Set `Status: Done` in `docs/specs/20260319-frontend-api-integration/spec.md`.

- [ ] **Step 4: Reconcile PRD**

Mark the Frontend API Integration item as shipped in `docs/PRD.md`.

- [ ] **Step 5: Commit docs**

```bash
git add docs/
git commit -m "T-010: Update ATHENA docs for completed frontend API integration (Feature: 20260319-frontend-api-integration)"
```
