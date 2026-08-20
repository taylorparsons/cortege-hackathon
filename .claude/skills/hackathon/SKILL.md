---
name: hackathon
description: Evaluate whether a hackathon or sponsor challenge is a good fit for CORTEGE, scope a submission down to one demoable use case, and prep the submission package (demo script, video, README entry point). Use when the user asks "is [hackathon] a good fit," wants to plan/scope a hackathon submission for this project, or is prepping a demo, recording, or pitch deck for CORTEGE.
---

# Hackathon Submission Playbook (CORTEGE)

CORTEGE has already been judged once (see `docs/cortege-judge-feedback.md`). The lessons from
that round are distilled in `references/lessons-from-judges.md` — read it before scoping a new
submission so the same mistakes aren't repeated.

## 1. Fit check

Before committing to a hackathon, check three things against the hackathon's official rules page:

1. **Audience/theme type** — is it a *build-with-[tool] hackathon* (must use a specific SDK/API),
   a general AI hackathon, or a vertical-specific one (fintech, health, etc.)? CORTEGE is a
   Node/React web app with a Claude-powered multi-agent backend, a Playwright/Cypress-driven
   browser agent (WARDEN), Twilio voice ingestion, and a SQLite hash-chain audit trail — no native
   mobile app, no payments/subscription layer.
2. **Required sponsor tech overlap** — does the hackathon require integrating a specific SDK
   (e.g., RevenueCat, a specific cloud AI platform)? If CORTEGE doesn't naturally use it, factor in
   the cost of bolting it on vs. the prize/opportunity — don't force a fit.
3. **Prize category alignment** — do any categories match what CORTEGE already does well (agents,
   privacy/security, browser automation, voice/Twilio) vs. what it doesn't have (mobile, payments,
   consumer growth loops)?

Give a direct recommendation with the main tradeoff — don't produce an exhaustive pro/con list
unless asked.

## 2. Scope to one demoable flow

Judge feedback flagged CORTEGE's scope as too broad and its core functionality as unclear. For any
new submission:

- Pick **one** agent flow that can be shown start-to-finish in under 3 minutes (e.g., WARDEN's
  broker-scan-to-removal flow, or an ANCHOR scam-call interception). Do not pitch the full
  household-companion platform as the demo.
- State the one-sentence problem the flow solves before touching the code or the deck.
- Everything else in the repo (other agents, other tabs) is context, not the pitch.

## 3. Submission package checklist

Pulled directly from what judges flagged as missing or broken last round:

- [ ] Demo video and any deck are **publicly accessible links** (not Google Drive with default
      permissions) — multiple judges last round couldn't open the materials at all.
- [ ] README has one obvious entry point for a reviewer: what to run, what to click, in what
      order. Don't make a judge spelunk through `docs/` to find the demo path.
- [ ] One paragraph on business model / go-to-market — who pays, how it competes with existing
      tools in the space. This was called out as entirely absent last round.
- [ ] If the pitch involves continuous monitoring or PII (it usually does for CORTEGE), state the
      privacy/data-handling approach explicitly — judges raised this unprompted.
- [ ] If built with Kiro or another sponsor IDE/tool, include a short reflection on the experience
      — judges specifically look for this when it's present in the repo but undiscussed.

## 4. Demo script

Use `references/demo-script-template.md` as the structural template (problem → solution → live
demo → technical depth → close, ~3 minutes). `RECORDING-SCRIPT.md` and `DEMO.md` at the repo root
are the most recent worked examples — reuse their cadence and timing rather than starting from
scratch.

## 5. Repo hygiene

Judges explicitly called the repo layout "kitchen-sink" with no clear entry point. Before
submitting: confirm the README's Quick Start still matches `run-local.sh` behavior, and that
there's exactly one obvious path through the app for a reviewer with no prior context.
