# Feature Spec: 20260819-warden-mobile-app

Status: Draft
Created: 2026-08-19 19:22
Inputs: CR-20260819-1922, CR-20260819-1924, CR-20260819-1926
Decisions: D-20260819-1922

## Summary
Spin WARDEN's data-broker-scan engine out into a standalone Expo/React Native mobile app. The
app extends the existing CORTEGE Node server rather than extracting or rebuilding it. v1 is a
single-tier product: a free one-time scan shows a user's exposure across WARDEN's broker list,
and a paid subscription (single RevenueCat entitlement, "Monitoring") unlocks continuous
re-scan/monitoring. Automated removal filing and a family plan tier are explicitly out of scope
for v1. Built as a real product decision — the RevenueCat Shipaton 2026 hackathon is an
opportunistic submission target if the app is ready in time, not the driver of scope.

## User Stories & Acceptance

### US1: Free exposure scan (Priority: P1)
Narrative:
- As a new user, I want to see where I'm exposed across data-broker sites without paying, so
  that I understand the problem before being asked to subscribe.

Acceptance scenarios:
1. Given a signed-in user with no active subscription, When they run their first scan, Then the
   app shows their broker-exposure results (listed / not found per broker) with no re-scan
   scheduled. (Verifies: FR-001, FR-002)
2. Given a user with no active subscription, When they try to trigger a second scan, Then the
   app presents the paywall instead of running another scan. (Verifies: FR-003)

### US2: Paid continuous monitoring (Priority: P1)
Narrative:
- As a subscriber, I want WARDEN to keep re-checking my exposure and tell me when I reappear on
  a broker site, so that I don't have to remember to check manually.

Acceptance scenarios:
1. Given a user with an active "Monitoring" entitlement, When a scheduled re-scan finds a
   broker listing that was previously "not found," Then the app surfaces a re-listing alert.
   (Verifies: FR-004, FR-005)
2. Given a user without an active entitlement, When a scheduled re-scan would otherwise run for
   them, Then no re-scan is triggered. (Verifies: FR-005)

### US3: Sign-in and subscription purchase (Priority: P1)
Narrative:
- As a user, I want to sign in with Apple or Google and subscribe without creating a new
  password, so that signup friction doesn't stop me from converting.

Acceptance scenarios:
1. Given a new user on iOS, When they choose to sign in, Then only Sign in with Apple is
   offered (Google offered on Android), with no email/password path. (Verifies: FR-006)
2. Given a signed-in free user, When they purchase the "Monitoring" subscription (monthly or
   annual), Then RevenueCat grants the entitlement and continuous monitoring activates
   immediately. (Verifies: FR-007, FR-008)

### US4: On-device exposure summary (Priority: P3)
Narrative:
- As a user, I want a plain-language summary of my scan results, so that I don't have to parse
  a per-broker status list myself.

Acceptance scenarios:
1. Given a device with a supported on-device model (iOS Foundation Models / Android Gemini
   Nano), When scan results are shown, Then a natural-language summary is generated on-device.
   (Verifies: FR-009)
2. Given a device without a supported on-device model, When scan results are shown, Then a
   template-string summary is shown instead, with no bundled model downloaded or invoked.
   (Verifies: FR-010)

## Requirements

Functional requirements:
- FR-001: The mobile app SHALL let a signed-in user trigger a broker-exposure scan via the
  existing WARDEN engine on the CORTEGE server. (Sources: CR-20260819-1922; D-20260819-1922)
- FR-002: The free tier SHALL return full scan results for exactly one scan per user with no
  subscription required. (Sources: CR-20260819-1922; D-20260819-1922)
- FR-003: The app SHALL block a second scan attempt for a user without an active "Monitoring"
  entitlement and present the RevenueCat paywall instead. (Sources: CR-20260819-1922;
  D-20260819-1922)
- FR-004: For entitled users, the server SHALL run scheduled re-scans and detect status
  transitions (e.g., not_found -> listed / re_listed) per existing WARDEN status semantics.
  (Sources: CR-20260819-1922; D-20260819-1922)
- FR-005: Scheduled re-scans SHALL only run for users holding an active "Monitoring"
  entitlement. (Sources: CR-20260819-1922; D-20260819-1922)
- FR-006: Sign-in SHALL support Sign in with Apple (iOS) and Sign in with Google (Android) only;
  no email/password or magic-link flow SHALL be implemented in v1. (Sources: CR-20260819-1924;
  D-20260819-1922)
- FR-007: Subscription purchase and status SHALL be managed through a single RevenueCat
  entitlement named "Monitoring" with monthly and annual package options. (Sources:
  CR-20260819-1924; D-20260819-1922)
- FR-008: Granting the "Monitoring" entitlement SHALL immediately enable scheduled re-scans for
  that user without requiring a manual re-scan trigger. (Sources: CR-20260819-1924;
  D-20260819-1922)
- FR-009: Where a platform-native on-device model is available (iOS Foundation Models, Android
  Gemini Nano/AICore), the app SHALL use it to generate a plain-language exposure summary.
  (Sources: CR-20260819-1924; D-20260819-1922)
- FR-010: Where no platform-native on-device model is available, the app SHALL fall back to a
  template-string summary and SHALL NOT bundle or download a cross-platform LLM to compensate.
  (Sources: CR-20260819-1924; D-20260819-1922)

Non-functional requirements:
- NFR-001: WARDEN's broker-scan crawling SHALL remain server-side (Playwright-based); no scan
  logic SHALL be reimplemented on-device. (Sources: CR-20260819-1924; D-20260819-1922)
- NFR-002: The mobile app SHALL live at `mobile/` inside the existing `cortege-hackathon` repo;
  no separate repository or monorepo tooling SHALL be introduced for v1. (Sources:
  CR-20260819-1924; D-20260819-1922)

## Edge cases
- On-device model check reports available but generation fails at runtime -> fall back to the
  template-string summary rather than blocking the results screen. (Verifies: FR-010)
- User's entitlement expires between scheduled re-scans -> next scheduled re-scan SHALL be
  skipped for that user until the entitlement is renewed. (Verifies: FR-005)
- Apple/Google OAuth setup is unavailable during development -> see intervention in
  `artifacts/agentic_workflow/2026-08-20T02:12:49Z.json` (fall back to a test-only auth path,
  Apple/Google remains the v1 ship target). (Verifies: FR-006)

## Open questions (not yet resolved)
- Full design has not received an explicit "yes, proceed" from the user — brainstorming was
  interrupted by the ai-pm detour and the "create the pitch" request. Confirm before writing an
  implementation plan.
- Pricing for the monthly/annual "Monitoring" packages is not yet set.
