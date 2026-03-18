# CORTEGE API Documentation

Base URL: `http://localhost:3001`

## Table of Contents
- [Household](#household)
- [Companions (Agent Instances)](#companions-agent-instances)
- [Events](#events)
- [Scenarios](#scenarios)
- [Agents](#agents)
- [Manual Event Injection](#manual-event-injection)
- [Twilio Webhooks](#twilio-webhooks)
- [WebSocket](#websocket)
- [Error Codes](#error-codes)

---

## Household

### GET /api/household

Returns the household members array.

**Query Parameters:** None

**Response:**
```json
[
  {
    "id": "member-001",
    "name": "Dorothy Chen",
    "age": 78,
    "role": "grandmother",
    "phone": "+1-555-0101",
    "email": "dorothy.chen@example.com",
    "agents": ["anchor"]
  },
  {
    "id": "member-002",
    "name": "Marcus Chen",
    "age": 45,
    "role": "son",
    "phone": "+1-555-0102",
    "email": "marcus.chen@example.com",
    "agents": ["sentinel"]
  }
]
```

**Example:**
```bash
curl http://localhost:3001/api/household
```

---

## Companions (Agent Instances)

### GET /api/companions

Returns status snapshot for all agent instances.

**Query Parameters:** None

**Response:**
```json
[
  {
    "id": "anchor-member-001",
    "agentName": "anchor",
    "memberId": "member-001",
    "memberName": "Dorothy Chen",
    "stage": "pattern-recognition",
    "depth": 0.15,
    "eventCount": 42,
    "lastActivity": "2026-03-18T16:30:00.000Z",
    "status": "active"
  }
]
```

**Example:**
```bash
curl http://localhost:3001/api/companions
```

---

### GET /api/companions/:id

Returns status snapshot for a single agent instance.

**Path Parameters:**
- `id` (string, required): Agent instance ID (format: `{agentName}-{memberId}`)

**Response:**
```json
{
  "id": "anchor-member-001",
  "agentName": "anchor",
  "memberId": "member-001",
  "memberName": "Dorothy Chen",
  "stage": "pattern-recognition",
  "depth": 0.15,
  "eventCount": 42,
  "lastActivity": "2026-03-18T16:30:00.000Z",
  "status": "active"
}
```

**Errors:**
- `404`: Companion not found

**Example:**
```bash
curl http://localhost:3001/api/companions/anchor-member-001
```

---

### GET /api/companions/:id/memory

Returns the full memory store for a single agent instance.

**Path Parameters:**
- `id` (string, required): Agent instance ID

**Response:**
```json
{
  "stage": "pattern-recognition",
  "depth": 0.15,
  "event_count": 42,
  "last_updated": "2026-03-18T16:30:00.000Z",
  "baseline": {
    "typical_contacts": ["Marcus Chen", "Dr. Sarah Kim"],
    "typical_times": ["09:00-11:00", "14:00-16:00"],
    "typical_topics": ["family", "health", "gardening"]
  },
  "patterns": [
    {
      "pattern_id": "P-001",
      "type": "contact_frequency",
      "description": "Calls from Marcus Chen every Tuesday and Friday",
      "confidence": 0.85,
      "first_seen": "2026-02-15T10:00:00.000Z",
      "occurrences": 12
    }
  ],
  "predictions": [],
  "cortege_insights": []
}
```

**Errors:**
- `404`: Companion not found or no memory available

**Example:**
```bash
curl http://localhost:3001/api/companions/anchor-member-001/memory
```

---

### GET /api/companions/:id/activity

Returns the last N events for a household member.

**Path Parameters:**
- `id` (string, required): Agent instance ID

**Query Parameters:**
- `limit` (integer, optional): Max events to return (default: 20, max: 200)

**Response:**
```json
[
  {
    "event_id": "evt-20260318-163045-abc123",
    "timestamp": "2026-03-18T16:30:45.000Z",
    "event_type": "inbound_call",
    "target_member": "member-001",
    "caller_id": "+1-555-9999",
    "caller_name": "Unknown",
    "content": "This is the IRS. You owe back taxes.",
    "metadata": {
      "duration_seconds": 45,
      "recording_url": null
    }
  }
]
```

**Example:**
```bash
curl "http://localhost:3001/api/companions/anchor-member-001/activity?limit=50"
```

---

## Events

### GET /api/events

Returns recent events from storage (SQLite or JSONL).

**Query Parameters:**
- `limit` (integer, optional): Max events to return (default: 50, max: 500)
- `date` (string, optional): Filter by date in YYYY-MM-DD format

**Response:**
```json
[
  {
    "event_id": "evt-20260318-163045-abc123",
    "timestamp": "2026-03-18T16:30:45.000Z",
    "event_type": "inbound_call",
    "target_member": "member-001",
    "caller_id": "+1-555-9999",
    "caller_name": "Unknown",
    "content": "This is the IRS. You owe back taxes.",
    "metadata": {}
  }
]
```

**Errors:**
- `400`: Invalid date format (must be YYYY-MM-DD)

**Example:**
```bash
# Get last 100 events
curl "http://localhost:3001/api/events?limit=100"

# Get events for specific date
curl "http://localhost:3001/api/events?date=2026-03-18"
```

---

### GET /api/events/query

Query events from SQLite storage with advanced filters (requires SQLite mode).

**Query Parameters:**
- `member_id` (string, optional): Filter by household member ID
- `threat_level_min` (integer, optional): Minimum threat level (0-5)
- `start_time` (string, optional): Start timestamp (ISO 8601 format)
- `end_time` (string, optional): End timestamp (ISO 8601 format)
- `signals` (string, optional): Comma-separated list of signals to match (e.g., "urgency,authority")

**Response:**
```json
[
  {
    "id": 42,
    "event_id": "evt-20260318-163045-abc123",
    "type": "inbound_call",
    "source": "twilio",
    "target_member": "member-001",
    "payload": "{\"caller_id\":\"+1-555-9999\",\"content\":\"This is the IRS...\",\"threat_level\":4,\"signals\":[\"urgency\",\"authority\"]}",
    "timestamp": "2026-03-18T16:30:45.000Z",
    "hash": "a3f5b8c2d1e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    "prev_hash": "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5"
  }
]
```

**Errors:**
- `400`: Invalid query parameters
- `501`: SQLite storage not enabled (STORAGE_MODE must be 'sqlite' or 'dual-write')

**Example:**
```bash
# Query high-threat events for a specific member
curl "http://localhost:3001/api/events/query?member_id=member-001&threat_level_min=3"

# Query events in a time range with specific signals
curl "http://localhost:3001/api/events/query?start_time=2026-03-18T00:00:00Z&end_time=2026-03-18T23:59:59Z&signals=urgency,authority"

# Query all events for a member
curl "http://localhost:3001/api/events/query?member_id=member-001"
```

---

### GET /api/events/validate-chain

Validate the integrity of the event hash chain (requires SQLite mode).

**Query Parameters:** None

**Response:**
```json
{
  "valid": true,
  "total_events": 1523,
  "validated_at": "2026-03-18T17:00:00.000Z"
}
```

**Response (if tampering detected):**
```json
{
  "valid": false,
  "total_events": 1523,
  "first_invalid_id": 842,
  "first_invalid_event_id": "evt-20260315-120000-xyz789",
  "error": "Hash mismatch at event 842",
  "validated_at": "2026-03-18T17:00:00.000Z"
}
```

**Errors:**
- `501`: SQLite storage not enabled

**Example:**
```bash
curl http://localhost:3001/api/events/validate-chain
```

**Recommended Schedule:**
- Run daily via cron job
- Alert on validation failures
- Investigate tampering immediately

---

## Scenarios

### POST /api/scenarios/:name/run

Runs a named scenario via EventSimulator.

**Path Parameters:**
- `name` (string, required): Scenario name (without .json extension)

**Request Body:** None

**Response:**
```json
{
  "scenario": "grandparent-scam",
  "events_generated": 5,
  "duration_ms": 1250,
  "status": "completed"
}
```

**Errors:**
- `400`: Scenario not found or invalid
- `500`: Scenario execution failed

**Example:**
```bash
curl -X POST http://localhost:3001/api/scenarios/grandparent-scam/run
```

**Available Scenarios:**
- `grandparent-scam`: Emergency scam targeting elderly member
- `bank-fraud`: Fake bank security call
- `tech-support`: Tech support scam
- (Add more scenarios as JSON files in `scenarios/` directory)

---

## Agents

### GET /api/agents

Returns loaded agent template names.

**Query Parameters:** None

**Response:**
```json
["anchor", "sentinel", "scout"]
```

**Example:**
```bash
curl http://localhost:3001/api/agents
```

---

### POST /api/agents/reload

Triggers agent factory hot-reload (reloads agent templates from disk).

**Request Body:** None

**Response:**
```json
{
  "reloaded": true,
  "timestamp": "2026-03-18T16:45:00.000Z"
}
```

**Errors:**
- `501`: Hot-reload not configured on this orchestrator

**Example:**
```bash
curl -X POST http://localhost:3001/api/agents/reload
```

---

## Manual Event Injection

### POST /api/events

Submit a manual event to the event bus.

**Request Body:**
```json
{
  "event_type": "inbound_call",
  "target_member": "member-001",
  "caller_id": "+1-555-1234",
  "caller_name": "John Doe",
  "content": "Hi, this is John calling about your car warranty.",
  "metadata": {
    "source": "manual",
    "notes": "Test event for demo"
  }
}
```

**Response:**
```json
{
  "event_id": "evt-20260318-164500-xyz789",
  "status": "queued",
  "timestamp": "2026-03-18T16:45:00.000Z"
}
```

**Required Fields:**
- `event_type` (string): Type of event (e.g., "inbound_call", "sms", "email")
- `target_member` (string): Member ID from household config

**Optional Fields:**
- `caller_id` (string): Phone number or identifier
- `caller_name` (string): Display name
- `content` (string): Event content/message
- `metadata` (object): Additional context

**Example:**
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "inbound_call",
    "target_member": "member-001",
    "caller_id": "+1-555-1234",
    "content": "Test call"
  }'
```

---

## Twilio Webhooks

### POST /ingest/twilio/voice

Twilio voice webhook endpoint for inbound calls.

**Request Body:** (Twilio TwiML format)
```
From=+15551234567
To=+15559876543
CallSid=CA1234567890abcdef
CallStatus=ringing
Direction=inbound
```

**Response:** (TwiML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please hold while we analyze this call.</Say>
  <Dial>+15559876543</Dial>
</Response>
```

**Security:**
- Validates Twilio signature (X-Twilio-Signature header)
- Rejects requests with invalid signatures

**Example:**
```bash
# Twilio will POST to this endpoint automatically
# For testing, use Twilio CLI or ngrok
```

---

## WebSocket

### WS /

WebSocket connection for real-time updates.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

**Messages Received:**
```json
{
  "type": "event",
  "data": {
    "event_id": "evt-20260318-163045-abc123",
    "event_type": "inbound_call",
    "target_member": "member-001",
    "timestamp": "2026-03-18T16:30:45.000Z"
  }
}
```

```json
{
  "type": "assessment",
  "data": {
    "event_id": "evt-20260318-163045-abc123",
    "agent": "anchor",
    "instance": "anchor-member-001",
    "threat_level": "L3",
    "assessment": "Likely IRS impersonation scam",
    "actions": [
      {
        "type": "block",
        "reason": "High-confidence scam pattern"
      }
    ]
  }
}
```

```json
{
  "type": "memory_update",
  "data": {
    "instance": "anchor-member-001",
    "stage": "pattern-recognition",
    "depth": 0.15,
    "event_count": 43
  }
}
```

**Message Types:**
- `event`: New event ingested
- `assessment`: Agent assessment completed
- `memory_update`: Agent memory updated
- `escalation`: Escalation triggered
- `error`: Error occurred

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message.type, message.data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

---

## Error Codes

### 400 Bad Request
Invalid request parameters or body.

```json
{
  "error": "Invalid date format — use YYYY-MM-DD"
}
```

### 404 Not Found
Resource not found.

```json
{
  "error": "Companion \"invalid-id\" not found"
}
```

### 500 Internal Server Error
Server error during request processing.

```json
{
  "error": "Internal server error"
}
```

### 501 Not Implemented
Feature not configured or available.

```json
{
  "error": "Hot-reload not configured on this orchestrator"
}
```

---

## Rate Limiting

Currently no rate limiting is enforced. For production deployment, consider:
- Rate limiting per IP address
- API key authentication
- Request throttling for expensive operations

---

## Authentication

Currently no authentication is required (localhost development only).

For production deployment, implement:
- API key authentication
- JWT tokens for WebSocket connections
- Role-based access control (RBAC)

---

## CORS

CORS is not currently configured. For production deployment with separate frontend:
- Configure CORS headers in Express
- Whitelist allowed origins
- Handle preflight OPTIONS requests

---

## Versioning

API version: `v1` (implicit, no version prefix in URLs)

Future versions may use `/api/v2/` prefix for breaking changes.

---

## Storage Configuration

CORTEGE supports multiple storage backends for events and memory snapshots.

### Storage Modes

Configure via environment variables in `.env`:

```env
# Storage mode: sqlite | json | dual-write
STORAGE_MODE=sqlite

# SQLite database path (default: data/cortege.db)
SQLITE_DB_PATH=data/cortege.db

# Enable JSON fallback on SQLite errors (default: false)
ENABLE_JSON_FALLBACK=false
```

**Storage Modes:**

1. **sqlite** (recommended for production)
   - All events and memory snapshots stored in SQLite
   - Tamper-evident hash chain for audit trail
   - Fast queries with indexes
   - Crash recovery with WAL mode

2. **json** (legacy mode)
   - Events stored in `data/events/*.jsonl`
   - Memory snapshots in `data/memories/*.json`
   - No hash chain validation
   - Suitable for development only

3. **dual-write** (migration mode)
   - Writes to both SQLite and JSON
   - Reads from SQLite (with JSON fallback)
   - Use during migration period
   - Switch to sqlite mode after validation

### Migration from JSON to SQLite

See [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md#sqlite-migration-guide) for step-by-step migration instructions.

---

## Support

For issues or questions:
- Check server logs: `node server/index.js`
- Review event storage: 
  - SQLite: `data/cortege.db` (use `sqlite3` CLI or DB Browser)
  - JSON: `data/events/*.jsonl`
- Review memory storage:
  - SQLite: Query `memory_snapshots` table
  - JSON: `data/memories/*.json`
- Run tests: `npm test`
- Validate hash chain: `node scripts/validate-hash-chain.js`

---

**Last Updated:** 2026-03-18  
**Sources:** CR-20260318-1700; D-20260318-1700; SPEC-20260318-sqlite-auditability
