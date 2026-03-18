# CORTEGE Demo Guide

## Quick Start

The CORTEGE agent orchestration system is now running!

### What's Running

- **Backend Server**: http://localhost:3001 (REST API + WebSocket)
- **Frontend UI**: http://localhost:5173 (React dashboard)

### Current Status

✅ 3 Agent instances active:
- `scout-alex` (SCOUT agent for Alex - child)
- `anchor-mom` (ANCHOR agent for Mom - senior)
- `sentinel-taylor` (SENTINEL agent for Taylor - adult)

✅ Demo scenario executed successfully:
- Mom's agent progressed to **predictive** stage (depth score: 0.25)
- Blocked scam number: `+1-555-9999`
- Processed 5 events with learning boost

## Try the Demo

### 1. View the Dashboard

Open http://localhost:5173 in your browser to see:
- Real-time event feed
- Agent status and learning progression
- Memory viewer showing learned patterns
- Escalation alerts

### 2. Run a Scenario

```bash
# Run the grandparent scam scenario
curl -X POST http://localhost:3001/api/scenarios/grandparent-scam/run

# Run the normal day scenario
curl -X POST http://localhost:3001/api/scenarios/normal-day/run
```

### 3. Inject a Manual Event

```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inbound_call",
    "target_member": "member_002",
    "source": "manual",
    "payload": {
      "caller_id": "+1-555-1234",
      "caller_name": "Unknown",
      "duration_seconds": 30,
      "transcript": "Hi, this is a test call."
    }
  }'
```

### 4. Check Agent Status

```bash
# View all companions
curl http://localhost:3001/api/companions | python3 -m json.tool

# View Mom's memory
curl http://localhost:3001/api/companions/anchor-mom/memory | python3 -m json.tool

# View Mom's activity log
curl http://localhost:3001/api/companions/anchor-mom/activity | python3 -m json.tool
```

## Learning Stages

Watch agents progress through 4 maturity stages:

1. **baseline** (0.0 - 0.1) - Initial learning
2. **pattern_recognition** (0.1 - 0.25) - Identifying patterns
3. **predictive** (0.25 - 0.5) - Making predictions
4. **cortege_mode** (0.5+) - Full autonomy

## Escalation Levels

Agents can escalate threats at different levels:

- **L0-L1**: Logged only
- **L2**: Monitoring status
- **L3**: Notify primary companion
- **L4**: Emergency alert with evidence

## What Just Happened

The grandparent-scam scenario simulated 5 phone calls to Mom:
1. Normal call from family
2. Normal call from doctor
3. Suspicious Medicare scam
4. Suspicious bank scam
5. Grandparent scam attempt

The ANCHOR agent:
- Learned to recognize scam patterns
- Blocked the scam number
- Progressed from baseline → pattern_recognition → predictive stage
- Would have escalated to the primary companion (if configured)

## Next Steps

- Open the React UI at http://localhost:5173
- Watch the WebSocket events in real-time
- Create your own agent template in `agents/`
- Create your own scenario in `scenarios/`
- Modify `data/household.json` to add more family members

## Stop the Demo

To stop the servers, press Ctrl+C in each terminal or run:

```bash
# Stop backend
pkill -f "node server/index.js"

# Stop frontend
pkill -f "vite"
```
