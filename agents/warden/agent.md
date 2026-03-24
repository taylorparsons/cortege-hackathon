---
name: WARDEN
designation: ε
role: Data Broker Removal Agent
description: >
  Proactively scans commercial data broker websites for household member
  PII (name, phone, address), submits opt-out requests via headless browser,
  discovers social graph associates, and escalates CAPTCHA challenges to
  household members as L3 issues.
profile_type: service
agent_type: proactive
---

# WARDEN — Data Broker Removal Agent

WARDEN is a proactive service agent — not an AgentInstance subclass. It does not
respond to real-time events; it runs on a schedule and manages its own browser
sessions. It integrates with the escalation handler and WebSocket infrastructure
as a peer to the reactive companion agents.

## Designation

ε (epsilon) — the fifth agent in the CORTEGE household protection layer.

## Purpose

Household PII published on data broker websites (WhitePages, Spokeo, MyLife, etc.)
increases the attack surface for every threat CORTEGE defends against:
social engineering, voice fraud, physical targeting. WARDEN systematically
removes that exposure — and keeps it removed.

## Capabilities

- **Scan**: discovers household member listings across 10+ data broker sites
- **Opt-out**: submits removal requests via headless Playwright browser sessions
- **Social graph discovery**: extracts "associated people" / "relatives" from broker listings and surfaces them as suggested household members
- **CAPTCHA escalation**: when a broker blocks automation, pauses the session, screenshots the challenge, and raises an L3 issue so the household member can resolve it in their own browser
- **Status tracking**: maintains per-member, per-broker scan history with timestamps and attempt counts

## Schedule

WARDEN manages its own `node-cron` schedule operating on real-world time.
Default: `0 12 * * *` (noon daily) — chosen so household members are available
to resolve CAPTCHA challenges if they arise.

Does NOT use the existing `Scheduler` class, which operates on simulated time
via `LEARNING_TIME_MULTIPLIER`.

## Escalation Model

| Condition | Level | Action |
|-----------|-------|--------|
| CAPTCHA / bot challenge detected | L3 | `captcha_assist` → `warden:captcha_required` WebSocket event + CaptchaAssist modal |
| Scan error (network, parse failure) | Internal | Logged, retried on next run |
| Member re-listed after confirmed removal | L3 | `warden:status_update` event, status → `re_listed` |

## PII Handling

- Member data decrypted via `decryptMemberFromStorage()` only at scan-job start
- Decrypted PII held in local job scope only — not stored on WardenEngine instance
- All log output uses `sanitizeString()` from `server/privacy/pii.js`
- Screenshots stored in memory only — served via WebSocket as base64, never persisted to disk
- PII references released when the scan job completes

## Broker Coverage

Initial set (10 brokers): WhitePages, Spokeo, MyLife, FastPeopleSearch, BeenVerified,
Intelius, TruePeopleSearch, Radaris, USSearch, PeopleSearch.

Adding a new broker requires only a JSON definition in `server/warden/brokers/`.
No code changes needed.

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `WARDEN_ENABLED` | `true` | Enable/disable WARDEN entirely |
| `WARDEN_SCAN_CRON` | `0 12 * * *` | Cron schedule for automatic scans |
| `WARDEN_CAPTCHA_TIMEOUT_MINUTES` | `10` | Minutes before CAPTCHA session expires |
| `WARDEN_MAX_CONCURRENT_SESSIONS` | `2` | Max concurrent Playwright browser sessions |

## Source

`server/warden/` — separate subsystem, not part of `server/orchestrator/agents/`.
