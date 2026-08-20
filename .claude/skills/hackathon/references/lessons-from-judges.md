# Lessons from CORTEGE's judged round

Distilled from `docs/cortege-judge-feedback.md` (8 judges, one prior submission). Full text
lives there — this is the actionable summary for scoping the next one.

## What judges rewarded

- Thoughtful, age-appropriate agent personas (ANCHOR/SENTINEL/SCOUT) — judges cited this by name
  as evidence of "genuine empathy for the end user."
- Real integration depth over toy demos: Twilio for actual call ingestion, tamper-evident
  hash-chain audit trail, PII encryption at rest, WebSocket live event feed.
- Strong internal documentation (PRD, API docs, traceability, 48 functional + 15 non-functional
  requirements) and a real E2E test suite (24+ Cypress tests) — judges called this "well beyond a
  typical hackathon prototype."
- A concrete, real-world problem statement (scam/fraud protection) rather than an abstract
  capability demo.

**Takeaway:** depth and specificity read as credibility. Don't strip these out to "look more like
a hackathon project" — the judges rewarded the opposite instinct.

## What cost points

1. **Inaccessible submission materials.** The single most-repeated complaint (5+ of 8 judges):
   demo video and pitch deck were Google Drive links with default permissions. Several judges
   scored based on the repo alone because they could not open anything else.
2. **No clear entry point / "kitchen-sink" repo.** Mixed storage modes (JSON, SQLite, dual-write),
   legacy files, and no guided path for a reviewer. A judge with 10 minutes and no context needs a
   README that says exactly what to run and click.
3. **Scope read as unclear, not ambitious.** "It may not be clear what the system does in its
   current form" — the multi-agent household platform pitch was too broad for a judge to form a
   one-sentence mental model of the product. Narrower demos read as more finished, not less
   impressive.
4. **No business model / go-to-market.** Zero mention of pricing, competition, or distribution.
   For an ambitious product pitch, this reads as unfinished thinking, not scope discipline.
5. **Unused narrative opportunities.** Kiro specs were present in the repo but undiscussed — a
   judge specifically wanted a reflection on the tool experience and didn't get one. If a
   submission uses a sponsor's tool/IDE, say so and say what it was like.

## Direct fixes for next time

- Publish demo video to a public YouTube/Vimeo/Loom link, or embed it directly — never gate it
  behind a Drive link with default sharing.
- Add a "Start Here" section at the very top of the README naming the one flow to click through.
- Pick one agent/flow as *the* pitch; mention the rest as "also in the repo" at most.
- Add a short "Business Model" or "Why This Wins" section: who pays, what it replaces, why now.
- If a sponsor tool was used, add 2-3 sentences on the experience — what helped, what you'd tell
  the sponsor's team.
