# CORTEGE Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Integration Options](#integration-options)
3. [Recommended Path: Call Forwarding](#recommended-path-call-forwarding)
4. [Twilio Account Setup](#twilio-account-setup)
5. [Server Deployment](#server-deployment)
6. [Demo to Production Transition](#demo-to-production-transition)
7. [Security Best Practices](#security-best-practices)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through deploying CORTEGE from demo mode (event simulator) to live production with real phone call monitoring via Twilio.

**Current State**: Demo mode with simulated events  
**Target State**: Production with real phone calls analyzed in real-time

**Prerequisites**:
- CORTEGE system running and tested in demo mode
- Twilio account (free trial or paid)
- Production server with Node.js 18+ and HTTPS
- Domain name with SSL certificate

---

## Integration Options

CORTEGE supports four integration approaches for accessing mobile calls and SMS. Choose based on your deployment timeline, user experience requirements, and technical constraints.

### Option 1: Call Forwarding (Recommended for MVP)

**How it works**:
1. User keeps their existing carrier number (e.g., T-Mobile 555-1234)
2. Provision a Twilio proxy number (e.g., 555-9999)
3. User sets up call forwarding: all calls → Twilio number first
4. Twilio sends call data to CORTEGE webhook
5. CORTEGE analyzes the call in real-time
6. Twilio forwards call to user's original number
7. User receives call normally (transparent to caller)

**Setup time**: 15-30 minutes

**Pros**:
- Fastest path to production
- User keeps their existing phone number
- Works with any carrier (T-Mobile, Verizon, AT&T, etc.)
- No app installation required
- Reversible (disable forwarding anytime)

**Cons**:
- Adds ~1-2 second delay to incoming calls
- User must manually set up call forwarding
- May incur carrier forwarding charges ($0-5/month depending on carrier)
- Requires user action to enable

**Best for**: MVP launch, pilot programs, users comfortable with call forwarding

---

### Option 2: Number Porting to Twilio

**How it works**:
1. Port (transfer) user's existing number from carrier to Twilio
2. Twilio now owns the number
3. All calls/SMS go through Twilio → CORTEGE → user's device
4. Most seamless user experience

**Setup time**: 1-7 days (porting process)

**Pros**:
- Most seamless experience (no forwarding delays)
- Full control over call routing
- No carrier forwarding charges
- User doesn't need to do anything after initial port

**Cons**:
- User loses their carrier plan for that number
- Porting takes 1-7 business days
- Can't use carrier-specific features (WiFi calling, visual voicemail)
- Harder to reverse (requires porting back to carrier)
- May require carrier account number and PIN

**Best for**: Dedicated protection numbers, users willing to switch carriers, long-term deployments

---

### Option 3: Mobile App with Permissions

**How it works**:
1. User installs CORTEGE companion app on their phone
2. App requests permissions (call log, SMS, phone state)
3. App monitors calls/SMS in real-time
4. App sends events to CORTEGE backend via API

**Setup time**: App development: 2-4 weeks; User setup: 5 minutes

**Pros**:
- Works with existing carrier number
- No call forwarding needed
- Can access call metadata without transcription
- Can show real-time alerts on device

**Cons**:
- Requires app development (iOS + Android)
- Requires app installation and permissions
- Battery usage concerns
- Can't intercept calls before they reach user

**Best for**: Consumer-facing product, users comfortable with apps

**Status**: Future roadmap (not implemented in MVP)

---

### Option 4: Carrier Partnerships

**How it works**:
1. Partner with T-Mobile, Verizon, AT&T
2. Offer CORTEGE as a carrier service (like spam blocking)
3. Network-level integration (no user setup)

**Setup time**: 6-12 months (partnership negotiations)

**Pros**:
- Most seamless experience (zero user setup)
- Network-level integration
- Can reach millions of users

**Cons**:
- Requires carrier partnerships (long sales cycle)
- Revenue sharing with carrier
- Carrier-specific implementations

**Best for**: Scale (millions of users), enterprise deployments

**Status**: Long-term roadmap (not implemented in MVP)

---

## Recommended Path: Call Forwarding

For MVP deployment, we recommend **Option 1: Call Forwarding** as the fastest path to production.

### Call Forwarding Setup by Carrier

#### T-Mobile

1. Open Phone app on user's device
2. Dial: `*72` + Twilio proxy number (e.g., `*725559999`)
3. Press Call
4. Wait for confirmation tone
5. Hang up

**To disable**: Dial `*73` and press Call

**Cost**: Free (included in most plans)

---

#### Verizon

1. Open Phone app on user's device
2. Dial: `*72` + Twilio proxy number (e.g., `*725559999`)
3. Press Call
4. Wait for confirmation tone
5. Hang up

**To disable**: Dial `*73` and press Call

**Cost**: Free (included in most plans)

---

#### AT&T

1. Open Phone app on user's device
2. Dial: `*21*` + Twilio proxy number + `#` (e.g., `*21*5559999#`)
3. Press Call
4. Wait for confirmation message

**To disable**: Dial `##21#` and press Call

**Cost**: Free (included in most plans)

---

## Twilio Account Setup

### Step 1: Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial or paid account
3. Verify your email and phone number
4. Note your Account SID and Auth Token (found in Console Dashboard)

### Step 2: Provision Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Buy a Number**
2. Select country (e.g., United States)
3. Check capabilities: **Voice** (required), **SMS** (optional for future)
4. Search for available numbers
5. Purchase number (free trial: $0, paid: ~$1/month)
6. Note the phone number (e.g., +1-555-999-9999)

### Step 3: Configure Webhook

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click your purchased number
3. Scroll to **Voice & Fax** section
4. Under **A Call Comes In**, set:
   - **Webhook**: `https://your-domain.com/ingest/twilio/voice`
   - **HTTP Method**: POST
5. Click **Save**

**Important**: Webhook URL must be HTTPS (not HTTP) in production

---

## Server Deployment

See full deployment instructions in the guide above.

Key steps:
1. Install Node.js 18+, PM2, nginx, certbot
2. Clone CORTEGE repository
3. Configure environment variables (.env)
4. Set up SSL with Let's Encrypt
5. Configure nginx reverse proxy
6. Start with PM2

---

## Demo to Production Transition

### Disable Demo Mode

Edit `.env`:

```env
LEARNING_TIME_MULTIPLIER=1     # Real-time (was 1440)
LEARNING_EVENT_WEIGHT=1        # Normal weight (was 10)
LEARNING_FAST_MODE=false       # Normal thresholds (was true)
```

### Archive Demo Data

```bash
mkdir -p data/archive
mv data/memories/*.json data/archive/
mv data/events/*.jsonl data/archive/
```

### Update Household Configuration

Edit `data/household.json` with real member information.

---

## SQLite Migration Guide

CORTEGE now supports SQLite storage with tamper-evident audit trails. This section guides you through migrating from JSON storage to SQLite.

### Why Migrate to SQLite?

**Benefits:**
- **Tamper-evident audit trail**: SHA-256 hash chain prevents event modification
- **Fast queries**: Indexed queries by member, threat level, time range, signals
- **Crash recovery**: WAL mode ensures data integrity
- **Atomic transactions**: Memory snapshots tied to events
- **Production-ready**: Better performance and reliability than JSONL files

**When to migrate:**
- Before production launch (recommended)
- When audit compliance is required
- When query performance becomes an issue
- When you need tamper detection

---

### Migration Strategy: Five-Phase Approach

#### Phase 1: Backup (5 minutes)

**Goal**: Create backup of existing JSON data

```bash
# Stop the server
pm2 stop cortege

# Create backup directory with timestamp
BACKUP_DIR="data/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup JSON files
cp -r data/events "$BACKUP_DIR/"
cp -r data/memories "$BACKUP_DIR/"

# Verify backup
ls -lh "$BACKUP_DIR/events/"
ls -lh "$BACKUP_DIR/memories/"

echo "Backup created at: $BACKUP_DIR"
```

**Verification:**
- Confirm backup directory exists
- Confirm all JSONL and JSON files copied
- Note backup path for rollback

---

#### Phase 2: Dual-Write Mode (1-7 days)

**Goal**: Write to both SQLite and JSON simultaneously to build confidence

**Step 1: Enable dual-write mode**

Edit `.env`:

```env
# Enable dual-write mode
STORAGE_MODE=dual-write

# SQLite database path
SQLITE_DB_PATH=data/cortege.db

# Enable JSON fallback on SQLite errors
ENABLE_JSON_FALLBACK=true
```

**Step 2: Migrate historical data**

```bash
# Run migration script (reconstructs hash chain from JSON)
node scripts/migrate-to-sqlite.js

# Expected output:
# Migrating events from JSON to SQLite...
# Found 1523 events across 45 days
# Migrated 1523 events with hash chain
# Migration completed in 2.3s
```

**Step 3: Restart server**

```bash
pm2 restart cortege
pm2 logs cortege --lines 50
```

**Step 4: Monitor dual-write period**

Run for 1-7 days depending on confidence level:

```bash
# Check SQLite database size
ls -lh data/cortege.db

# Validate hash chain daily
node scripts/validate-hash-chain.js

# Expected output:
# Validating hash chain...
# ✓ Validated 1523 events
# ✓ Hash chain is valid
# No tampering detected
```

**Verification checklist:**
- [ ] Server starts without errors
- [ ] New events appear in both SQLite and JSON
- [ ] Hash chain validation passes daily
- [ ] No SQLite write errors in logs
- [ ] Query performance acceptable

---

#### Phase 3: SQLite-Only Mode (Cutover)

**Goal**: Switch to SQLite as primary storage

**Step 1: Enable SQLite mode**

Edit `.env`:

```env
# Switch to SQLite-only mode
STORAGE_MODE=sqlite

# Keep JSON fallback for reads during transition
ENABLE_JSON_FALLBACK=true

# SQLite database path
SQLITE_DB_PATH=data/cortege.db
```

**Step 2: Restart server**

```bash
pm2 restart cortege
pm2 logs cortege --lines 50
```

**Step 3: Verify SQLite-only writes**

```bash
# Trigger test event
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test",
    "target_member": "member-001",
    "content": "SQLite cutover test"
  }'

# Verify event in SQLite
sqlite3 data/cortege.db "SELECT event_id, type, timestamp FROM events ORDER BY id DESC LIMIT 5;"

# Verify NO new JSONL entries (check file modification time)
ls -lt data/events/*.jsonl | head -5
```

**Verification:**
- [ ] New events only in SQLite (not in JSONL)
- [ ] Hash chain validation passes
- [ ] API queries return correct data
- [ ] WebSocket events broadcast correctly

---

#### Phase 4: Deprecate JSON Storage (1-7 days)

**Goal**: Run SQLite-only for observation period

**Monitor for 1-7 days:**

```bash
# Daily validation
node scripts/validate-hash-chain.js

# Check for any JSON fallback reads in logs
pm2 logs cortege | grep "falling back to JSON"

# Verify query performance
curl "http://localhost:3001/api/events/query?member_id=member-001&threat_level_min=3"
```

**If issues arise:**
- Check logs for SQLite errors
- Verify database file permissions (should be 0600)
- Ensure disk space available
- Consider rollback if critical issues

---

#### Phase 5: Archive JSON Files (Final)

**Goal**: Archive old JSON files after successful SQLite operation

```bash
# Create archive directory
mkdir -p data/archive-json

# Move JSON files to archive
mv data/events/*.jsonl data/archive-json/
mv data/memories/*.json data/archive-json/

# Disable JSON fallback
# Edit .env:
# ENABLE_JSON_FALLBACK=false

# Restart server
pm2 restart cortege
```

**Final verification:**
- [ ] Server runs without JSON files
- [ ] All queries work correctly
- [ ] Hash chain validation passes
- [ ] No errors in logs

---

### Rollback Procedure

If issues arise during migration, rollback to JSON storage:

**Step 1: Stop server**

```bash
pm2 stop cortege
```

**Step 2: Restore JSON files from backup**

```bash
# Replace with your backup directory
BACKUP_DIR="data/backup-20260318-120000"

# Restore JSON files
cp -r "$BACKUP_DIR/events/"* data/events/
cp -r "$BACKUP_DIR/memories/"* data/memories/
```

**Step 3: Switch back to JSON mode**

Edit `.env`:

```env
STORAGE_MODE=json
```

**Step 4: Restart server**

```bash
pm2 restart cortege
pm2 logs cortege --lines 50
```

**Step 5: Verify rollback**

```bash
# Check recent events
curl "http://localhost:3001/api/events?limit=10"

# Verify server health
curl http://localhost:3001/health
```

---

### Storage Mode Configuration Reference

**Environment Variables:**

```env
# Storage mode: sqlite | json | dual-write
STORAGE_MODE=sqlite

# SQLite database path (default: data/cortege.db)
SQLITE_DB_PATH=data/cortege.db

# Enable JSON fallback on SQLite errors (default: false)
ENABLE_JSON_FALLBACK=false
```

**Storage Mode Comparison:**

| Feature | JSON | SQLite | Dual-Write |
|---------|------|--------|------------|
| Tamper detection | ❌ | ✅ | ✅ |
| Fast queries | ❌ | ✅ | ✅ |
| Crash recovery | ❌ | ✅ | ✅ |
| Audit compliance | ❌ | ✅ | ✅ |
| Production-ready | ❌ | ✅ | ⚠️ (migration only) |
| Disk usage | Low | Medium | High (2x) |

---

### Hash Chain Validation

**Manual validation:**

```bash
node scripts/validate-hash-chain.js
```

**Automated validation (cron job):**

```bash
# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * cd /path/to/cortege && node scripts/validate-hash-chain.js >> logs/hash-validation.log 2>&1
```

**API endpoint:**

```bash
curl http://localhost:3001/api/events/validate-chain
```

**Expected output (valid chain):**

```json
{
  "valid": true,
  "total_events": 1523,
  "validated_at": "2026-03-18T17:00:00.000Z"
}
```

**Expected output (tampering detected):**

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

**Response to tampering:**
1. Alert security team immediately
2. Preserve database file as evidence
3. Investigate access logs
4. Restore from last known good backup
5. Review security controls

---

### SQLite Database Maintenance

**Check database size:**

```bash
ls -lh data/cortege.db
du -h data/cortege.db*
```

**Vacuum database (reclaim space):**

```bash
sqlite3 data/cortege.db "VACUUM;"
```

**Check WAL file size:**

```bash
ls -lh data/cortege.db-wal
```

**Checkpoint WAL (merge into main database):**

```bash
sqlite3 data/cortege.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

**Backup database:**

```bash
# Online backup (safe while server running)
sqlite3 data/cortege.db ".backup data/cortege-backup-$(date +%Y%m%d).db"
```

**Inspect database:**

```bash
# Open SQLite CLI
sqlite3 data/cortege.db

# Useful queries:
.schema events
.schema memory_snapshots
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM memory_snapshots;
SELECT * FROM events ORDER BY id DESC LIMIT 10;
```

---

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS with valid SSL certificate
2. **Twilio Signature Validation**: Enabled automatically when `TWILIO_AUTH_TOKEN` is set
3. **API Key Management**: Store in `.env`, never commit to Git, rotate quarterly
4. **Rate Limiting**: Configure nginx to limit webhook requests
5. **Firewall**: Only open ports 22, 80, 443
6. **Database Security**:
   - SQLite file permissions: 0600 (owner read/write only)
   - Regular hash chain validation (daily cron job)
   - Backup database before maintenance
   - Monitor for tampering alerts
7. **Access Control**:
   - Restrict SSH access to authorized IPs
   - Use SSH keys (disable password auth)
   - Audit database access logs
   - Implement API authentication for production

---

## Monitoring & Health Checks

Health check endpoint: `GET /health`

Track:
- Events per hour
- Escalations per day
- Claude API latency
- WebSocket connection status
- SQLite database size and WAL file size
- Hash chain validation status (daily)
- Storage mode and fallback usage

**Recommended Monitoring:**

```bash
# Daily hash chain validation (cron job)
0 2 * * * cd /path/to/cortege && node scripts/validate-hash-chain.js >> logs/hash-validation.log 2>&1

# Weekly database backup
0 3 * * 0 cd /path/to/cortege && sqlite3 data/cortege.db ".backup data/backups/cortege-$(date +\%Y\%m\%d).db"

# Disk space monitoring
df -h /path/to/cortege/data
```

**Alert on:**
- Hash chain validation failures (immediate)
- SQLite write errors (immediate)
- Disk space < 10% (warning)
- WAL file > 100MB (checkpoint needed)
- Escalation rate spike (investigate)

---

## Troubleshooting

Common errors and solutions documented in full guide above.

### SQLite-Specific Issues

**Issue: "Database is locked"**

```bash
# Check for long-running queries
sqlite3 data/cortege.db "PRAGMA busy_timeout = 5000;"

# Checkpoint WAL to release locks
sqlite3 data/cortege.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

**Issue: "Hash chain validation failed"**

```bash
# Run validation script for details
node scripts/validate-hash-chain.js

# Check for tampering
sqlite3 data/cortege.db "SELECT id, event_id, hash, prev_hash FROM events WHERE id >= [first_invalid_id] LIMIT 10;"

# If tampering confirmed:
# 1. Alert security team
# 2. Preserve database as evidence
# 3. Restore from backup
```

**Issue: "SQLite file permissions error"**

```bash
# Fix permissions
chmod 600 data/cortege.db
chmod 600 data/cortege.db-wal
chmod 600 data/cortege.db-shm

# Verify
ls -l data/cortege.db*
```

**Issue: "Disk full"**

```bash
# Check disk usage
df -h

# Vacuum database to reclaim space
sqlite3 data/cortege.db "VACUUM;"

# Archive old JSON files
mkdir -p data/archive
mv data/events/*.jsonl data/archive/
```

---

**Last Updated**: 2026-03-18  
**Version**: 1.1.0  
**Sources**: SPEC-20260318-sqlite-auditability
