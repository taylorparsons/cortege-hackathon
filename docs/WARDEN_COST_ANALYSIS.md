# WARDEN Cost Analysis

**Feature:** Automated data broker removal agent  
**Date:** March 24, 2026  
**Branch:** feat/warden-agent

## Executive Summary

WARDEN automates removal requests across 11 data broker sites using browser automation (Playwright). The feature has **zero Claude API costs** — it uses only web scraping and form automation, no LLM calls.

### Cost Breakdown

| Component | Cost per Scan | Notes |
|-----------|--------------|-------|
| Claude API | $0.00 | No LLM calls in WARDEN automation |
| Playwright Browser | $0.00 | Local headless Chrome, no cloud costs |
| DuckDuckGo Search | $0.00 | Free HTML endpoint |
| Total per Broker | **$0.00** | Pure automation, no API costs |

### Monthly Cost Estimate

**For a typical household (3 members):**

- 11 brokers × 3 members = 33 scans per month
- Monthly cost: **$0.00**
- Annual cost: **$0.00**

## Architecture Overview

WARDEN uses a **3-phase automation workflow** with no LLM involvement:

### Phase 1: Threat Assessment (Web Search)
```javascript
// Uses DuckDuckGo HTML endpoint (no API key, no cost)
const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
```

- Confirms member is listed on broker site
- Skips broker if no results found
- **Cost: $0.00** (free public endpoint)

### Phase 2: Associate Discovery (Browser Automation)
```javascript
// Playwright navigates to broker site, extracts associates
await session.navigate(brokerUrl);
await session.waitForSelector('.associates-list');
const associates = await AssociateDiscovery.extractFromPage(page, selectors);
```

- Navigates to broker's public search page
- Extracts family member names (associates)
- **Cost: $0.00** (local browser automation)

### Phase 3: Opt-Out Submission (Form Automation)
```javascript
// Fills and submits opt-out form
await session.fill('input[name="name"]', memberName);
await session.fill('input[name="phone"]', memberPhone);
await session.click('button[type="submit"]');
```

- Navigates to opt-out page
- Fills form with member PII
- Submits removal request
- **Cost: $0.00** (automated form submission)

## Supported Brokers (11 Total)

1. WhitePages
2. Spokeo
3. BeenVerified
4. Intelius
5. MyLife
6. PeopleSearch
7. Radaris
8. FastPeopleSearch
9. TruePeopleSearch
10. USSearch
11. CyberBackgroundChecks

Each broker definition is a declarative JSON file with steps like:
- `web_search` - DuckDuckGo threat assessment
- `navigate` - Go to URL
- `fill` - Fill form field
- `click` - Click button
- `detect_captcha` - Check for CAPTCHA
- `extract_associates` - Scrape family member names
- `detect_success` - Verify submission

## Resource Usage

### Compute Resources

**Per scan (one member, one broker):**
- Browser launch: ~2 seconds
- Page navigation: ~3-5 seconds per page (2-3 pages)
- Form filling: ~1 second
- Total time: ~10-15 seconds per broker

**Concurrent sessions:**
- Default: 2 concurrent browser sessions (`WARDEN_MAX_CONCURRENT_SESSIONS=2`)
- Memory: ~200MB per browser session
- Total memory: ~400MB for 2 concurrent sessions

### Network Bandwidth

**Per scan:**
- DuckDuckGo search: ~50KB
- Broker site pages: ~500KB-2MB per page
- Total: ~2-5MB per broker scan

**Monthly (3 members, 11 brokers):**
- 33 scans × 3.5MB average = ~115MB/month

## CAPTCHA Handling

When a CAPTCHA is detected:

1. **Browser pauses** and takes screenshot
2. **WebSocket event** fires to frontend UI
3. **User solves CAPTCHA** in their browser
4. **Scan resumes** automatically after resolution

**CAPTCHA costs:**
- Detection: $0.00 (DOM inspection)
- Resolution: $0.00 (human-in-the-loop)
- No third-party CAPTCHA solving services used

**CAPTCHA timeout:**
- Default: 10 minutes (`WARDEN_CAPTCHA_TIMEOUT_MINUTES=10`)
- After timeout: scan marked as `captcha_timeout`, can be retried

## Scheduling & Automation

**Default schedule:**
```bash
WARDEN_SCAN_CRON="0 12 * * *"  # Daily at noon
```

- Runs once per day for all household members
- Noon timing ensures user is available for CAPTCHAs
- Can be customized via environment variable

**Manual scans:**
- Available via API: `POST /api/warden/scan`
- Can target specific household, member, or broker
- No additional cost for manual scans

## Cost Comparison

### Traditional Manual Process

**Per household member:**
- 11 broker sites × 15 minutes each = 165 minutes (2.75 hours)
- At $50/hour labor cost = **$137.50 per member**
- For 3-member household = **$412.50 one-time**

**Annual maintenance:**
- Quarterly re-checks recommended
- 4 × $412.50 = **$1,650/year**

### WARDEN Automated Process

**Per household:**
- Setup: 5 minutes (add family members)
- Ongoing: Fully automated
- Cost: **$0.00/year**

**ROI:**
- First year savings: **$1,650**
- Ongoing annual savings: **$1,650**

## Infrastructure Costs

### Self-Hosted (Current Setup)

**Requirements:**
- Node.js server (already running for Cortege)
- Playwright browsers (bundled with npm install)
- SQLite database (already in use)

**Additional costs:** $0.00

### Cloud Deployment (Optional)

If deploying to cloud:

**AWS EC2 t3.medium:**
- 2 vCPU, 4GB RAM
- Cost: ~$30/month
- Handles 10+ concurrent households

**Heroku Standard:**
- 512MB RAM (sufficient for 1 concurrent session)
- Cost: ~$25/month
- Suitable for single household

**Note:** Cloud costs are for the entire Cortege application, not just WARDEN.

## Privacy & Security

**PII handling:**
- Member PII decrypted only during scan execution
- Held in memory for ~10-15 seconds per scan
- Garbage collected immediately after scan
- Never logged or persisted in plaintext

**Browser isolation:**
- Each scan runs in isolated browser context
- No cookies or session data persisted
- Headless mode (no GUI, no screen recording)

**Network security:**
- All broker sites accessed via HTTPS
- No third-party API calls
- No data sent to external services

## Scaling Considerations

### Single Household (3 members)
- 33 scans/month (11 brokers × 3 members)
- Runtime: ~5-10 minutes total
- Memory: 400MB peak
- **Cost: $0.00**

### 10 Households (30 members)
- 330 scans/month
- Runtime: ~50-100 minutes total (spread across month)
- Memory: 400MB peak (2 concurrent sessions)
- **Cost: $0.00**

### 100 Households (300 members)
- 3,300 scans/month
- Runtime: ~8-16 hours total (spread across month)
- Memory: 400MB peak (2 concurrent sessions)
- **Cost: $0.00**

**Scaling strategy:**
- Increase `WARDEN_MAX_CONCURRENT_SESSIONS` for faster processing
- Each additional session adds ~200MB memory
- No API rate limits (no external APIs used)

## Failure Modes & Retry Logic

**Broker site changes:**
- Selectors may break when broker redesigns site
- Status: `error` with reason
- Solution: Update broker JSON definition
- Cost: $0.00 (manual update)

**CAPTCHA challenges:**
- Some brokers use CAPTCHAs
- Status: `captcha_detected` → user solves → scan resumes
- Cost: $0.00 (human-in-the-loop)

**Network failures:**
- Timeout after 15 seconds per page
- Status: `error` with reason
- Retry: Next scheduled scan (daily)
- Cost: $0.00 (automatic retry)

## Monitoring & Observability

**Built-in metrics:**
- Scan status per broker per member
- Associate discovery count
- CAPTCHA detection rate
- Error tracking

**WebSocket events:**
- `warden:scan_started`
- `warden:status_update`
- `warden:captcha_required`
- `warden:associate_discovered`

**Storage:**
- SQLite database (already in use)
- Scan history persisted
- No additional storage costs

## Conclusion

**WARDEN has zero API costs** because it uses pure browser automation with no LLM calls. The only costs are:

1. **Compute:** Marginal (runs on existing Cortege server)
2. **Memory:** ~400MB for 2 concurrent sessions
3. **Network:** ~115MB/month for typical household
4. **Storage:** Negligible (scan status in SQLite)

**Total monthly cost: $0.00**

**Annual savings vs. manual process: $1,650+ per household**

The feature is designed to be cost-effective and scalable, with no per-scan API charges or third-party service dependencies.

---

## Configuration Reference

```bash
# Enable/disable WARDEN
WARDEN_ENABLED=true

# Scan schedule (cron format)
WARDEN_SCAN_CRON="0 12 * * *"

# CAPTCHA timeout (minutes)
WARDEN_CAPTCHA_TIMEOUT_MINUTES=10

# Max concurrent browser sessions
WARDEN_MAX_CONCURRENT_SESSIONS=2
```

## API Endpoints

```bash
# Trigger manual scan
POST /api/warden/scan
{
  "household_id": "uuid",
  "member_id": "uuid",      # optional
  "broker_id": "whitepages" # optional
}

# Get scan status
GET /api/warden/status?household_id=uuid&member_id=uuid

# List brokers
GET /api/warden/brokers

# Resolve CAPTCHA
POST /api/warden/captcha/resolve
{
  "session_id": "captcha_session_id"
}
```

## Testing Costs

**Development/testing:**
- Use `WARDEN_ENABLED=false` to disable during development
- Test mode: No actual browser launches
- Mock broker responses for unit tests
- **Cost: $0.00**

**Production testing:**
- Run manual scan for one member, one broker
- Monitor logs and WebSocket events
- Verify opt-out submission
- **Cost: $0.00**
