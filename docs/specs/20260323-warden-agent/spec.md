# Feature Spec: 20260323-warden-agent

Status: Done
Created: 2026-03-23 10:00
Inputs: CR-20260323-1000
Decisions: D-20260323-1000

## Summary

WARDEN is a proactive data broker removal agent that scans commercial data broker websites for household members' PII (name, phone, address), submits opt-out requests via headless browser automation, escalates CAPTCHAs to household members as L3 issues, and discovers associated people from broker listings to surface as suggested household members.

## User Stories & Acceptance

### US1: Data Broker Discovery (Priority: P1)
Narrative:
- As a household primary member, I want CORTEGE to find where my household members' addresses and phone numbers are listed on data broker sites, so I can see our exposure at a glance.

Acceptance scenarios:
1. Given a household with registered members, When WARDEN runs a scan, Then each known data broker is searched for each member by name and address. (Verifies: FR-001, FR-002)
2. Given a completed scan, When I view the Companion Network tab, Then I see per-member, per-broker status with color-coded badges. (Verifies: FR-001, FR-006)

### US2: Automated Opt-Out (Priority: P1)
Narrative:
- As a household primary member, I want WARDEN to automatically submit opt-out requests on data broker sites on behalf of my household, so I don't have to manually navigate each site.

Acceptance scenarios:
1. Given a member is listed on a broker, When WARDEN processes the opt-out steps, Then it fills and submits the opt-out form using the member's PII. (Verifies: FR-003)
2. Given an opt-out is submitted, Then the broker status updates to `removal_pending`. (Verifies: FR-003, FR-005)

### US3: CAPTCHA Escalation (Priority: P1)
Narrative:
- As a household member, I want to be notified and guided when a bot blocker blocks WARDEN's opt-out attempt, so I can resolve it quickly without having to find the site myself.

Acceptance scenarios:
1. Given WARDEN detects a CAPTCHA on a broker page, When it fires an L3 escalation, Then the UI shows a CaptchaAssist modal with a screenshot and direct URL. (Verifies: FR-004, FR-007)
2. Given the household member clicks "Mark as Resolved," When WARDEN resumes, Then it retries the opt-out form submission. (Verifies: FR-004)
3. Given a CAPTCHA session expires after 10 minutes with no resolution, Then the broker status is set to `captcha_timeout` and re-queued. (Verifies: FR-004)

### US4: Social Graph Discovery (Priority: P2)
Narrative:
- As a household primary member, I want WARDEN to surface people listed as "associated" or "relatives" on broker sites, so I can discover who else in my household is exposed and extend protection.

Acceptance scenarios:
1. Given a broker listing shows associated people, When WARDEN extracts them, Then they appear in the UI as suggested household members with name, relationship, and which brokers found them. (Verifies: FR-008)
2. Given a discovered associate is already a registered household member, Then they are NOT surfaced as a new suggestion. (Verifies: FR-008)
3. Given I click "Add to Household" on a discovered associate, Then a new member is created via the existing household API. (Verifies: FR-008, FR-009)

### US5: Scheduled Re-monitoring (Priority: P2)
Narrative:
- As a household primary member, I want WARDEN to periodically re-check brokers for re-listings, so I get ongoing protection not just a one-time removal.

Acceptance scenarios:
1. Given `WARDEN_SCAN_CRON` is set, When the cron fires, Then a full household scan is triggered automatically. (Verifies: FR-010)
2. Given a member was previously `removal_confirmed` but is re-listed, Then status changes to `re_listed` and an event is emitted. (Verifies: FR-005, FR-010)

## Requirements

Functional requirements:
- FR-001: WARDEN scans a configurable registry of data broker sites for each household member by name, phone, and address. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-002: Broker definitions are stored as declarative JSON files (`server/warden/brokers/*.json`) with site-specific opt-out steps, field selectors, and associate selectors. Adding a new broker requires only a new JSON file. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-003: WARDEN uses Playwright headless browser to navigate opt-out flows, filling forms with decrypted member PII. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-004: When WARDEN detects a CAPTCHA (reCAPTCHA, hCaptcha, Cloudflare challenge), it pauses the browser session, fires an L3 escalation via the existing EscalationHandler, and sends a `warden:captcha_required` WebSocket event with a screenshot and the broker's opt-out URL. The household member clicks "Mark as Resolved" to resume. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-005: Per-member, per-broker scan status is persisted to `data/broker-scans/{householdId}.json`. Valid statuses: `not_checked`, `listed`, `removal_pending`, `removal_confirmed`, `re_listed`, `not_found`, `captcha_timeout`, `error`. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-006: The hardcoded "Household Data Broker Status" relay card in `src/Cortege.jsx` (lines 561–568) is replaced with a live `<BrokerStatus>` component showing real scan data. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-007: `<CaptchaAssist>` modal shows screenshot of blocked page, broker name, member name, direct URL to opt-out page, and "Mark as Resolved" button. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-008: During the search phase, WARDEN extracts "associated people" / "relatives" from broker search result pages and stores them in `discovered_associates[]` in the scan store. Associates already registered as household members are excluded. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-009: `<AssociateDiscovery>` component shows discovered associates with "Add to Household" (calls `POST /api/households/:id/members`) and "Dismiss" actions. (Sources: CR-20260323-1000; D-20260323-1000)
- FR-010: WARDEN runs scheduled scans via its own `node-cron` job (default: daily at 3 AM). Does NOT use the existing Scheduler (which runs on simulated time). (Sources: CR-20260323-1000; D-20260323-1000)

Non-functional requirements:
- NFR-001: Member PII is decrypted only at scan-job start, held in local scope, and never written to logs. All console output uses `sanitizeString()` from `server/privacy/pii.js`. (Sources: CR-20260323-1000; D-20260323-1000)
- NFR-002: Screenshots are held in memory only (not persisted to disk). (Sources: CR-20260323-1000; D-20260323-1000)
- NFR-003: Max 2 concurrent browser sessions (`WARDEN_MAX_CONCURRENT_SESSIONS`, default 2). (Sources: D-20260323-1000)
- NFR-004: CAPTCHA sessions timeout after 10 minutes (`WARDEN_CAPTCHA_TIMEOUT_MINUTES`, default 10). (Sources: D-20260323-1000)

## Edge Cases

- Member with no address linked (location_id is null): skip address-dependent brokers. (Verifies: FR-001)
- Broker site structure changes and selectors no longer match: scan returns `error` status, logged without crashing the engine. (Verifies: FR-002, FR-005)
- Two members have same name: separate scan jobs per member ID, not per name. (Verifies: FR-001, FR-003)
- Discovered associate name matches existing member name: cross-reference by name, skip if matched. (Verifies: FR-008)
