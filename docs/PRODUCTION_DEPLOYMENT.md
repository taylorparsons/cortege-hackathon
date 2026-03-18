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

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS with valid SSL certificate
2. **Twilio Signature Validation**: Enabled automatically when `TWILIO_AUTH_TOKEN` is set
3. **API Key Management**: Store in `.env`, never commit to Git, rotate quarterly
4. **Rate Limiting**: Configure nginx to limit webhook requests
5. **Firewall**: Only open ports 22, 80, 443

---

## Monitoring & Health Checks

Health check endpoint: `GET /health`

Track:
- Events per hour
- Escalations per day
- Claude API latency
- WebSocket connection status

---

## Troubleshooting

Common errors and solutions documented in full guide above.

---

**Last Updated**: 2026-03-18  
**Version**: 1.0.0
