# Tasks: Working Demo with Twilio on Localhost

Status: Not Started
Created: 2026-03-18 16:40
Spec: spec.md

## Task Breakdown

### Phase 1: Localhost Setup with ngrok

- [ ] 1.1 Install and configure ngrok
  - [ ] 1.1.1 Install ngrok (brew install ngrok or download from ngrok.com) (Implements: FR-001)
  - [ ] 1.1.2 Start ngrok tunnel: `ngrok http 3001` (Implements: FR-001)
  - [ ] 1.1.3 Note the HTTPS URL (e.g., https://abc123.ngrok.io) (Implements: FR-001)
  - [ ] 1.1.4 Update Twilio webhook to point to ngrok URL (Implements: FR-002)

### Phase 2: Twilio Webhook Implementation

- [ ] 2.1 Wire Twilio webhook to event bus
  - [ ] 2.1.1 Import eventBus into `server/ingestion/twilio-webhook.js` (Implements: FR-007)
  - [ ] 2.1.2 Implement CoreEvent normalization (type: inbound_call, source: twilio, payload mapping) (Implements: FR-008)
  - [ ] 2.1.3 Call eventBus.emit() with normalized event (Implements: FR-007)
  - [ ] 2.1.4 Extract call transcription from Twilio payload (TranscriptionText field) (Implements: FR-009)
  - [ ] 2.1.5 Handle missing transcription gracefully (transcript: null, log warning) (Implements: FR-009)

- [ ] 2.2 Test with real Twilio call
  - [ ] 2.2.1 Set up call forwarding from test phone to Twilio number (Implements: FR-003)
  - [ ] 2.2.2 Make test call and verify webhook receives data (Implements: FR-010)
  - [ ] 2.2.3 Verify event appears in event bus logs (Implements: FR-007)
  - [ ] 2.2.4 Verify agent processes the call (Implements: FR-008)

### Phase 3: UI Updates for Real Use Cases

- [ ] 3.1 Update UI to show only working features
  - [ ] 3.1.1 Remove placeholder/mock data from EventFeed component (Implements: FR-011)
  - [ ] 3.1.2 Show real events from Twilio webhook (Implements: FR-011)
  - [ ] 3.1.3 Update MemoryViewer to show actual learned patterns (Implements: FR-012)
  - [ ] 3.1.4 Update AgentStatus to show real agent processing (Implements: FR-012)

- [ ] 3.2 Add real use case scenarios
  - [ ] 3.2.1 Create UI panel for triggering grandparent scam scenario (Implements: FR-013)
  - [ ] 3.2.2 Create UI panel for triggering bank fraud scenario (Implements: FR-013)
  - [ ] 3.2.3 Show escalation alerts for L3/L4 threats (Implements: FR-014)
  - [ ] 3.2.4 Display real call transcripts in event feed (Implements: FR-015)

### Phase 4: Documentation Updates

- [ ] 4.1 Update PRODUCTION_DEPLOYMENT.md for localhost
  - [ ] 4.1.1 Add ngrok setup section (Implements: FR-016)
  - [ ] 4.1.2 Update Twilio webhook configuration for ngrok URL (Implements: FR-016)
  - [ ] 4.1.3 Add localhost testing instructions (Implements: FR-016)
  - [ ] 4.1.4 Document how to test with real phone calls (Implements: FR-016)

## Notes

- Focus on localhost demo, not full production deployment
- Use ngrok for Twilio webhook testing (no need for production server)
- UI should show only working features with real data
- Real use cases: grandparent scam, bank fraud, Medicare scam
- Call forwarding is fastest integration method for testing

## Estimated Effort

- Phase 1: 0.5 days (ngrok setup)
- Phase 2: 1 day (Twilio webhook implementation + testing)
- Phase 3: 1 day (UI updates for real use cases)
- Phase 4: 0.5 days (documentation updates)

Total: 3 days

## Success Criteria

- [ ] ngrok tunnel running and accessible
- [ ] Twilio webhook wired to event bus
- [ ] Real phone call processed end-to-end on localhost
- [ ] UI shows only working features with real data
- [ ] At least 2 real use case scenarios working (grandparent scam, bank fraud)
- [ ] Documentation updated for localhost testing

- [ ] 1.1 Create production deployment guide
  - [ ] 1.1.1 Create `docs/PRODUCTION_DEPLOYMENT.md` with table of contents (Implements: FR-001)
  - [ ] 1.1.2 Document Twilio account setup (account creation, phone number provisioning) (Implements: FR-001)
  - [ ] 1.1.3 Document Twilio webhook configuration (webhook URL, HTTP POST, TwiML response) (Implements: FR-001)
  - [ ] 1.1.4 Document environment variables for production (Implements: FR-002)

- [ ] 1.2 Call forwarding setup instructions
  - [ ] 1.2.1 Document T-Mobile call forwarding setup (*72 + Twilio number) (Implements: FR-003)
  - [ ] 1.2.2 Document Verizon call forwarding setup (*72 + Twilio number) (Implements: FR-003)
  - [ ] 1.2.3 Document AT&T call forwarding setup (*72 + Twilio number) (Implements: FR-003)
  - [ ] 1.2.4 Create call forwarding flow diagram (user → Twilio → CORTEGE → user) (Implements: FR-004)

- [ ] 1.3 Live server deployment instructions
  - [ ] 1.3.1 Document Node.js server setup (install Node 18+, clone repo, npm install) (Implements: FR-005)
  - [ ] 1.3.2 Document process manager setup (PM2 or systemd service) (Implements: FR-005, NFR-005)
  - [ ] 1.3.3 Document HTTPS/SSL configuration (Let's Encrypt, nginx reverse proxy) (Implements: FR-005, NFR-002)
  - [ ] 1.3.4 Document firewall configuration (open ports 80, 443, 3001) (Implements: FR-005)

- [ ] 1.4 Monitoring and health checks
  - [ ] 1.4.1 Document monitoring recommendations (WebSocket status, event latency, API errors) (Implements: FR-006)
  - [ ] 1.4.2 Document log aggregation setup (journalctl, PM2 logs, or external service) (Implements: FR-006, NFR-007)
  - [ ] 1.4.3 Document metrics to track (events/hour, escalations/day, Claude API cost) (Implements: FR-006, NFR-008)

### Phase 2: Integration Options Documentation

- [ ] 2.1 Document integration options
  - [ ] 2.1.1 Document Option 1: Call Forwarding (description, setup, pros/cons, time estimate) (Implements: FR-011, FR-012)
  - [ ] 2.1.2 Document Option 2: Number Porting (description, setup, pros/cons, time estimate) (Implements: FR-011, FR-012)
  - [ ] 2.1.3 Document Option 3: Mobile App (description, permissions, pros/cons, future roadmap) (Implements: FR-011, FR-012)
  - [ ] 2.1.4 Document Option 4: Carrier Partnerships (description, long-term strategy, pros/cons) (Implements: FR-011, FR-012)
  - [ ] 2.1.5 Add recommendation matrix (use case → recommended option) (Implements: FR-013)

### Phase 3: Twilio Webhook Implementation

- [ ] 3.1 Wire Twilio webhook to event bus
  - [ ] 3.1.1 Import eventBus into `server/ingestion/twilio-webhook.js` (Implements: FR-007)
  - [ ] 3.1.2 Implement CoreEvent normalization (type: inbound_call, source: twilio, payload mapping) (Implements: FR-008)
  - [ ] 3.1.3 Call eventBus.emit() with normalized event (Implements: FR-007)
  - [ ] 3.1.4 Extract call transcription from Twilio payload (TranscriptionText field) (Implements: FR-009)
  - [ ] 3.1.5 Handle missing transcription gracefully (transcript: null, log warning) (Implements: FR-009, EC1)

- [ ] 3.2 Implement Twilio signature validation
  - [ ] 3.2.1 Install `twilio` npm package (Implements: FR-014)
  - [ ] 3.2.2 Import `validateRequest` from twilio SDK (Implements: FR-014)
  - [ ] 3.2.3 Implement signature validation middleware (check X-Twilio-Signature header) (Implements: FR-014)
  - [ ] 3.2.4 Return 403 Forbidden for invalid signatures (Implements: FR-015)
  - [ ] 3.2.5 Log security events for invalid signatures (Implements: FR-015, NFR-007)
  - [ ] 3.2.6 Make signature validation optional in dev mode (skip if TWILIO_AUTH_TOKEN not set) (Implements: FR-014)

- [ ] 3.3 Async event processing
  - [ ] 3.3.1 Implement async event processing (return 200 OK immediately, process in background) (Implements: NFR-004, EC3)
  - [ ] 3.3.2 Add timeout guard (respond to Twilio within 10s even if Claude is slow) (Implements: NFR-004)

### Phase 4: Security & Compliance

- [ ] 4.1 Security best practices documentation
  - [ ] 4.1.1 Document HTTPS requirement (no HTTP in production) (Implements: FR-016, NFR-002)
  - [ ] 4.1.2 Document API key management (use .env, never commit, rotate quarterly) (Implements: FR-016, NFR-003)
  - [ ] 4.1.3 Document webhook signature validation (always enable in production) (Implements: FR-016, NFR-001)
  - [ ] 4.1.4 Document rate limiting recommendations (nginx limit_req, Twilio IP whitelist) (Implements: FR-016)

- [ ] 4.2 Health check endpoint
  - [ ] 4.2.1 Implement GET /health endpoint (returns 200 OK + system status) (Implements: NFR-006)
  - [ ] 4.2.2 Include WebSocket connection status in health check (Implements: NFR-006)
  - [ ] 4.2.3 Include event bus status in health check (Implements: NFR-006)
  - [ ] 4.2.4 Include Claude API connectivity check (Implements: NFR-006)

### Phase 5: Demo to Production Transition

- [ ] 5.1 Demo mode configuration
  - [ ] 5.1.1 Document how to disable demo mode (set LEARNING_TIME_MULTIPLIER=1) (Implements: FR-017)
  - [ ] 5.1.2 Document how to disable fast learning (set LEARNING_FAST_MODE=false) (Implements: FR-017)
  - [ ] 5.1.3 Document how to reset event weight (set LEARNING_EVENT_WEIGHT=1) (Implements: FR-017)
  - [ ] 5.1.4 Create production .env.example file (Implements: FR-002, FR-017)

- [ ] 5.2 Ingestion source transition
  - [ ] 5.2.1 Document how to disable event simulator (don't call POST /api/scenarios) (Implements: FR-018)
  - [ ] 5.2.2 Document how to verify Twilio webhook is primary source (check event logs for source: twilio) (Implements: FR-018)
  - [ ] 5.2.3 Document manual injection API for testing (POST /api/events still available) (Implements: FR-018)

- [ ] 5.3 Data migration
  - [ ] 5.3.1 Document how to archive demo memory stores (move data/memories/*.json to data/archive/) (Implements: FR-019)
  - [ ] 5.3.2 Document how to archive demo event logs (move data/events/*.jsonl to data/archive/) (Implements: FR-019)
  - [ ] 5.3.3 Document how to start fresh in production (delete data/memories/, data/events/) (Implements: FR-019, EC8)
  - [ ] 5.3.4 Document household.json update for production (real member names, phone numbers) (Implements: FR-019)

### Phase 6: Testing & Validation

- [ ] 6.1 Unit tests
  - [ ] 6.1.1 Test Twilio webhook signature validation (valid signature → 200, invalid → 403) (Verifies: FR-014, FR-015)
  - [ ] 6.1.2 Test CoreEvent normalization (Twilio payload → CoreEvent format) (Verifies: FR-008)
  - [ ] 6.1.3 Test missing transcription handling (transcript: null, warning logged) (Verifies: FR-009, EC1)
  - [ ] 6.1.4 Test async event processing (webhook returns 200 before Claude call completes) (Verifies: NFR-004, EC3)

- [ ] 6.2 Integration tests
  - [ ] 6.2.1 Test end-to-end Twilio webhook flow (POST /ingest/twilio/voice → event bus → agent) (Verifies: FR-007, FR-008)
  - [ ] 6.2.2 Test health check endpoint (GET /health → 200 OK + status) (Verifies: NFR-006)

- [ ] 6.3 Live production test
  - [ ] 6.3.1 Deploy to live server with HTTPS (Verifies: FR-005, NFR-002)
  - [ ] 6.3.2 Configure Twilio webhook to point to live server (Verifies: FR-001)
  - [ ] 6.3.3 Set up call forwarding from real phone number (Verifies: FR-003, FR-004)
  - [ ] 6.3.4 Make test call and verify end-to-end flow (call → Twilio → CORTEGE → agent → escalation) (Verifies: all FRs)
  - [ ] 6.3.5 Verify signature validation in production (invalid signature → 403) (Verifies: FR-015, NFR-001)

### Phase 7: Documentation Polish

- [ ] 7.1 Troubleshooting section
  - [ ] 7.1.1 Document common error: "Twilio webhook returns 400" (missing required fields) (Implements: NFR-010)
  - [ ] 7.1.2 Document common error: "Twilio webhook returns 403" (invalid signature) (Implements: NFR-010)
  - [ ] 7.1.3 Document common error: "Call forwarding loop" (user forwarded Twilio back to self) (Implements: NFR-010, EC2)
  - [ ] 7.1.4 Document common error: "No transcription in webhook" (Twilio transcription not enabled) (Implements: NFR-010)
  - [ ] 7.1.5 Document debugging steps (check logs, verify env vars, test webhook with curl) (Implements: NFR-010)

- [ ] 7.2 Screenshots and diagrams
  - [ ] 7.2.1 Add Twilio console screenshots (phone number provisioning, webhook config) (Implements: NFR-009)
  - [ ] 7.2.2 Add call forwarding setup screenshots (T-Mobile, Verizon, AT&T) (Implements: NFR-009)
  - [ ] 7.2.3 Add architecture diagram (production deployment with Twilio) (Implements: NFR-009)

## Task Dependencies

```
Phase 1 (Documentation) → Phase 2 (Integration Options)
Phase 3 (Twilio Implementation) → Phase 4 (Security)
Phase 4 (Security) → Phase 5 (Demo to Production)
Phase 5 (Demo to Production) → Phase 6 (Testing)
Phase 6 (Testing) → Phase 7 (Documentation Polish)
```

## Notes

- Phase 1-2 (documentation) can be done in parallel with Phase 3 (implementation)
- Phase 6.3 (live production test) requires a real Twilio account and phone number
- Twilio signature validation is critical for production security (NFR-001)
- Call forwarding is the recommended path for MVP (fastest setup, user keeps number)
- Number porting and mobile app are documented as future options

## Estimated Effort

- Phase 1: 1 day (documentation)
- Phase 2: 0.5 days (integration options)
- Phase 3: 1 day (Twilio webhook implementation)
- Phase 4: 0.5 days (security)
- Phase 5: 0.5 days (demo to production transition)
- Phase 6: 1 day (testing + live production test)
- Phase 7: 0.5 days (documentation polish)

Total: 5 days

## Success Criteria

- [ ] Production deployment guide complete and reviewed
- [ ] Twilio webhook wired to event bus and tested
- [ ] Twilio signature validation implemented and tested
- [ ] Health check endpoint implemented
- [ ] Live production test successful (real call → CORTEGE → agent → escalation)
- [ ] All integration options documented with tradeoffs
- [ ] Security best practices documented
- [ ] Troubleshooting section complete
