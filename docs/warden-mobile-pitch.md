# WARDEN - Data Broker Exposure Monitoring (Mobile)

## Problem

Data broker sites publish home addresses, phone numbers, and family relationships in plain
search results. That listing is what scammers use to sound credible. A recent case in my own
family: a caller told my grandmother he was her grandson's friend, said there had been an
accident, then played a cloned voice of her daughter to get her to act. He had names and
relationships he could only have gotten from a people-search site.

Americans lost $64 billion to scams last year. 77% encounter fraud attempts daily. Less than
half of victims recover any money. The exposure that makes these calls convincing is sitting on
sites like Spokeo, Whitepages, and BeenVerified right now, and it comes back: a broker that
removes you today typically relists you within a few months as its database refreshes.

Nobody checks 44 broker sites on a recurring basis. That's the gap.

## Solution

WARDEN is a data-broker scan-and-removal engine already built and running inside CORTEGE. It
scans 44 broker sites per household member, tracks status per broker (listed, removal pending,
removal confirmed, re-listed), and files opt-out requests through headless browser automation,
falling back to a guided headed-browser flow when a site requires solving a CAPTCHA.

The mobile app puts this directly in a user's hands: enter your name and see where you're
exposed, in one scan.

## Product

**Free**: one scan across all 44 brokers, full per-broker results.

**Paid ("Monitoring", $X/mo or $Y/yr, pricing not yet set)**: scheduled re-scans, push alerts
when a broker relists you, and the account stays live between checks instead of going stale the
day after the free scan.

Sign-in is Apple on iOS and Google on Android only. No email, no password, no reset flow to
build or own. Subscriptions run through a single RevenueCat entitlement so there's one paywall
to configure, not a tiered pricing matrix.

Automated removal filing and a family plan (multiple members under one subscription) are the
next two features after v1, not in the first release. v1 proves the core loop: show exposure,
convert to paid monitoring, keep the account too valuable to cancel because it's still watching.

## How it's built

- **Client**: Expo / React Native. Closest framework to the existing CORTEGE web stack (Vite +
  React), with first-party RevenueCat SDK support.
- **Backend**: extends the existing CORTEGE Node server rather than a new service. WARDEN's scan
  engine, broker definitions, and status model are reused as-is.
- **Scanning**: stays server-side. Visiting 44 external sites requires real browser automation
  (Playwright), which can't run on a phone.
- **On-device model**: used only for turning scan results into a plain-language summary, on
  supported devices (iOS Foundation Models, Android Gemini Nano), with a template-string
  fallback everywhere else. Nothing safety-critical runs on-device, and no model ships bundled
  in the app.

## Why the subscription works

Most privacy tools sell a one-time cleanup. That's a bad subscription because the job looks
finished after the first pass. WARDEN's core fact is the opposite: brokers relist people on a
recurring cycle, so "still watching" is a real, recurring service, not a renewal notice for
something already done. The free scan proves the problem exists; the paid tier is the only way
to know if it comes back.

## Proof points already in hand

- WARDEN engine live and tested: 224 tests passing, 44 broker definitions, headed/headless mode
  resolution with CAPTCHA handoff.
- Independent security audit completed on the WARDEN headed-mode feature: no critical issues
  found, OWASP Top 10 reviewed.
- PII encrypted at rest, tamper-evident hash-chain audit trail already part of the underlying
  CORTEGE platform.
- This is not a concept. It's an existing, working system getting a mobile front door and a
  billing model.

## Hackathon fit

RevenueCat's Shipaton 2026 requires a mobile app with RevenueCat subscriptions integrated. This
product is being built to be a real app regardless of the hackathon; Shipaton is a submission
target if the timeline lines up, not the reason the app exists.

## What's next

1. Final design sign-off (framework, backend extension, auth, entitlement structure, on-device
   scope), drafted and pending confirmation.
2. Scaffold `mobile/` Expo project inside this repo.
3. Add auth (Apple/Google) and the free-scan flow against the existing WARDEN API.
4. Wire RevenueCat entitlement and paywall.
5. Ship v1: free scan, paid monitoring, nothing else.
