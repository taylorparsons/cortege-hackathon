# CORTEGE — 3-Minute Demo Recording Script

## Setup Before Recording

1. `./run-local.sh` — start backend + frontend
2. Open http://localhost:5173 in Chrome (clean window, no bookmarks bar)
3. Open QuickTime or OBS for screen recording
4. Have this script on a second monitor or phone

## Script

### [0:00–0:15] INTRO — Say while on the dashboard

> "CORTEGE is an AI security companion system. Every member of a household gets their own dedicated AI agent that learns their behavior and silently protects them from scams and fraud."

### [0:15–0:45] THE PROBLEM + SOLUTION — Stay on dashboard, gesture at companion cards

> "Americans lost 12 and a half billion dollars to fraud last year. The most targeted are seniors and teens — people who trust easily. Current fraud filters catch known patterns, but they don't know your family. CORTEGE does."

> "Each family member is paired with a specialized agent. ANCHOR protects seniors with patience-first scam interception. SENTINEL coordinates household-wide threat response for adults. SCOUT defends teens from social engineering."

### [0:45–1:30] LIVE DEMO — Click through the app

**Click Household tab → show household editor:**
> "Households are the core unit. Each one has members, a home location, and optional Twilio phone routing for real call ingestion."

**Click a companion card → show detail panel:**
> "Each companion has its own memory and learning stage. It starts at baseline, learns contact patterns, and progresses through four stages until it reaches full Cortege Mode — where it can autonomously block threats."

**Click Live Feed tab → show event injector:**
> "Here's the live threat feed. I can inject events targeting specific household members and watch the companion respond in real time."

**Submit an event, watch it appear:**
> "The agent processes the event, runs it through Claude, scores the risk, and decides whether to escalate."

### [1:30–2:15] FRAUD CASE — Click Fraud Cases tab

> "Let me show the fraud case workflow. A suspicious Twilio call comes in. I attach evidence — a message excerpt, a suspicious URL. The system analyzes compound signals: urgency, secrecy, payment pressure, impersonation."

**Create a fraud case:**
> "It scores the severity, generates a rationale, and recommends a response. This is real heuristic analysis, not just an LLM opinion."

### [2:15–2:45] PLATFORM PITCH — Can stay on any screen

> "What makes CORTEGE a platform, not just an app: agent types are defined as Markdown templates with YAML config. You can create a new agent type in minutes. The event bus and orchestrator are generic — they work for any per-person behavioral agent."

> "Under the hood: SQLite with an append-only hash chain for tamper evidence, PII encryption at rest, five-tier escalation routing, and prompt caching that cuts Claude API costs by 64 percent. 174 tests passing. This isn't a hackathon demo — it's infrastructure."

### [2:45–3:00] CLOSE

> "CORTEGE starts with family security, but the architecture scales to any domain where people need personalized AI protection — health, finance, education. The longer a companion runs, the deeper its behavioral model gets, and the harder it is to replace. That's the moat."

> "Thank you."

## Tips

- **Don't rush.** 3 minutes is plenty. Pause between sections.
- **Click slowly.** Let the UI render before moving on.
- **If something breaks**, just narrate what it would do. Judges care about the architecture, not a perfect live demo.
- **Screen resolution:** 1280x720 or 1920x1080. Close other apps.
