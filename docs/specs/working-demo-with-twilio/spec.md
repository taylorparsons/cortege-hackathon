# Feature Spec: Working Demo with Twilio on Localhost

Status: Draft
Created: 2026-03-18 16:40
Inputs: CR-20260318-1640
Decisions: D-20260318-1640
Design: docs/superpowers/specs/2026-03-14-agent-orchestration-design.md

## Summary

Working localhost demo with real Twilio integration showing actual use cases. Wire Twilio webhook to event bus, set up ngrok for localhost testing, implement call forwarding, and update UI to display only working features with real scenarios (grandparent scam, bank fraud, etc.).

Sources: CR-20260318-1640; D-20260318-1640

## User Stories & Acceptance

### US1: Production Deployment Documentation (Priority: P0)
Narrative:
- As a deployment engineer, I want comprehensive production deployment documentation, so that I can deploy CORTEGE to a live server with real phone call monitoring.

Acceptance scenarios:
1. Given the production deployment guide, When I follow the Twilio account setup instructions, Then I can provision a Twilio phone number and configure webhooks. (Verifies: FR-001, FR-002)
2. Given a user with a T-Mobile phone number, When I follow the call forwarding instructions, Then incoming calls are routed through Twilio to CORTEGE before reaching the user. (Verifies: FR-003, FR-004)
3. Given the deployment guide, When I follow the live server deployment instructions, Then CORTEGE runs on a production server with proper environment configuration. (Verifies: FR-005, FR-006)

### US2: Twilio Webhook Integration (Priority: P0)
Narrative:
- As the orchestrator, I want to receive real phone calls via Twilio webhook, so that agents can analyze live threats in real-time.

Acceptance scenarios:
1. Given a configured Twilio webhook, When an inbound call arrives, Then the webhook payload is normalized to CoreEvent format and emitted to the event bus. (Verifies: FR-007, FR-008)
2. Given a Twilio webhook payload with call transcription, When the event is processed, Then the agent receives the full transcript for analysis. (Verifies: FR-009)
3. Given an invalid Twilio webhook payload, When the webhook is called, Then it returns 400 Bad Request with validation errors. (Verifies: FR-010, EC1)

### US3: Integration Options Documentation (Priority: P1)
Narrative:
- As a product manager, I want documentation of all integration options with tradeoffs, so that I can choose the right approach for different customer segments.

Acceptance scenarios:
1. Given the integration options section, When I review call forwarding vs number porting, Then I understand the tradeoffs (setup time, user experience, carrier features). (Verifies: FR-011)
2. Given the mobile app integration option, When I review the documentation, Then I understand the permissions required and implementation approach. (Verifies: FR-012)
3. Given the carrier partnership option, When I review the documentation, Then I understand the long-term scaling strategy. (Verifies: FR-013)

### US4: Security & Compliance (Priority: P0)
Narrative:
- As a security engineer, I want Twilio webhook signature validation, so that only legitimate Twilio requests are processed.

Acceptance scenarios:
1. Given a Twilio webhook request with valid signature, When the webhook is called, Then the request is processed. (Verifies: FR-014, NFR-001)
2. Given a Twilio webhook request with invalid signature, When the webhook is called, Then the request is rejected with 403 Forbidden. (Verifies: FR-015, NFR-001)
3. Given the deployment guide, When I review security considerations, Then I understand HTTPS requirements, API key management, and webhook signature validation. (Verifies: FR-016, NFR-002)

## Requirements

### Functional Requirements

#### Production Deployment Documentation
- FR-001: The deployment guide SHALL include Twilio account setup instructions (account creation, phone number provisioning, webhook configuration). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-002: The deployment guide SHALL include environment variable configuration for production (ANTHROPIC_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, PORT, LEARNING_TIME_MULTIPLIER=1, LEARNING_FAST_MODE=false). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-003: The deployment guide SHALL include call forwarding setup instructions for major US carriers (T-Mobile, Verizon, AT&T). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-004: The deployment guide SHALL include call forwarding flow diagram (user number → Twilio proxy → CORTEGE webhook → forward to user). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-005: The deployment guide SHALL include live server deployment instructions (Node.js server setup, process management, HTTPS/SSL configuration). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-006: The deployment guide SHALL include monitoring and health check recommendations (WebSocket connection status, event processing latency, Claude API errors). (Sources: CR-20260318-1640; D-20260318-1640)

#### Twilio Webhook Integration
- FR-007: The Twilio webhook SHALL wire to eventBus.emit() when a valid inbound call is received. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-008: The Twilio webhook SHALL normalize Twilio payload to CoreEvent format (type: inbound_call, source: twilio, payload: {caller_id, caller_name, duration_seconds, transcript}). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-009: The Twilio webhook SHALL extract call transcription from Twilio payload when available. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-010: The Twilio webhook SHALL validate required fields (CallSid, From, To) and return 400 Bad Request if missing. (Sources: CR-20260318-1640; D-20260318-1640)

#### Integration Options Documentation
- FR-011: The deployment guide SHALL document four integration options: (1) Call forwarding, (2) Number porting, (3) Mobile app, (4) Carrier partnerships. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-012: Each integration option SHALL include: description, setup steps, pros/cons, estimated setup time, user experience impact. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-013: The deployment guide SHALL recommend call forwarding as the fastest path to production. (Sources: CR-20260318-1640; D-20260318-1640)

#### Security & Compliance
- FR-014: The Twilio webhook SHALL validate Twilio request signatures using TWILIO_AUTH_TOKEN. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-015: The Twilio webhook SHALL reject requests with invalid signatures (403 Forbidden). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-016: The deployment guide SHALL document security best practices (HTTPS only, API key rotation, webhook signature validation, rate limiting). (Sources: CR-20260318-1640; D-20260318-1640)

#### Demo to Production Transition
- FR-017: The deployment guide SHALL document how to disable demo mode (set LEARNING_TIME_MULTIPLIER=1, LEARNING_FAST_MODE=false, LEARNING_EVENT_WEIGHT=1). (Sources: CR-20260318-1640; D-20260318-1640)
- FR-018: The deployment guide SHALL document how to switch from event simulator to Twilio webhook as primary ingestion source. (Sources: CR-20260318-1640; D-20260318-1640)
- FR-019: The deployment guide SHALL document data migration considerations (existing memory stores, event logs). (Sources: CR-20260318-1640; D-20260318-1640)

### Non-Functional Requirements

#### Security
- NFR-001: Twilio webhook signature validation MUST be enabled in production. (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-002: Production deployment MUST use HTTPS with valid SSL certificates. (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-003: API keys and tokens MUST be stored in environment variables, never committed to Git. (Sources: CR-20260318-1640; D-20260318-1640)

#### Reliability
- NFR-004: Twilio webhook MUST respond within 10 seconds to avoid Twilio timeout. (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-005: Production server MUST use process manager (PM2, systemd) for automatic restart on crash. (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-006: Production deployment MUST include health check endpoint (GET /health). (Sources: CR-20260318-1640; D-20260318-1640)

#### Observability
- NFR-007: Production deployment MUST log all Twilio webhook requests (CallSid, From, To, timestamp). (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-008: Production deployment MUST expose metrics (events processed, Claude API latency, escalations fired). (Sources: CR-20260318-1640; D-20260318-1640)

#### Documentation
- NFR-009: Deployment guide MUST be written for non-technical users (step-by-step instructions with screenshots). (Sources: CR-20260318-1640; D-20260318-1640)
- NFR-010: Deployment guide MUST include troubleshooting section (common errors, debugging steps). (Sources: CR-20260318-1640; D-20260318-1640)

## Edge Cases

### EC1: Twilio Webhook with Missing Transcription
- Given a Twilio webhook payload without transcription, When the webhook is processed, Then the event is created with transcript: null and logged as a warning. (Verifies: FR-009, NFR-007)

### EC2: Call Forwarding Loop Detection
- Given a user who forwards their Twilio number back to their original number, When a call arrives, Then the system detects the loop and logs an error. (Verifies: FR-004, NFR-007)

### EC3: Twilio Webhook Timeout
- Given a Claude API call that takes >10 seconds, When the Twilio webhook is processing, Then the webhook returns 200 OK immediately and processes the event asynchronously. (Verifies: NFR-004)

### EC4: Invalid Twilio Signature in Production
- Given a production deployment with signature validation enabled, When a request with invalid signature arrives, Then the request is rejected and logged as a security event. (Verifies: FR-015, NFR-001, NFR-007)

### EC5: Multiple Household Members with Same Carrier
- Given multiple household members on T-Mobile, When setting up call forwarding, Then each member needs a separate Twilio proxy number. (Verifies: FR-003, FR-011)

### EC6: Carrier Call Forwarding Charges
- Given a user with T-Mobile call forwarding, When calls are forwarded to Twilio, Then the user may incur carrier forwarding charges (documented in guide). (Verifies: FR-003, FR-012)

### EC7: Number Porting Downtime
- Given a user porting their number to Twilio, When the port is in progress, Then the number may be unreachable for 1-7 days (documented in guide). (Verifies: FR-011, FR-012)

### EC8: Demo Mode Data in Production
- Given a production deployment with existing demo data, When transitioning from demo to production, Then the guide explains how to archive or delete demo memory stores. (Verifies: FR-019)

## Dependencies

### External Dependencies
- Twilio account with phone number provisioning
- Twilio Voice API with transcription enabled
- Production server with Node.js 18+ and HTTPS
- Domain name with SSL certificate (Let's Encrypt or commercial CA)
- Process manager (PM2 or systemd)

### Internal Dependencies
- Existing Twilio webhook stub at `server/ingestion/twilio-webhook.js`
- Event bus at `server/orchestrator/event-bus.js`
- CoreEvent schema validation
- Design documents: `docs/superpowers/specs/2026-03-14-agent-orchestration-design.md`

### Environment Variables (Production)
```
ANTHROPIC_API_KEY=<production key>
TWILIO_ACCOUNT_SID=<twilio account sid>
TWILIO_AUTH_TOKEN=<twilio auth token>
PORT=3001
LEARNING_TIME_MULTIPLIER=1
LEARNING_EVENT_WEIGHT=1
LEARNING_FAST_MODE=false
NODE_ENV=production
```

## Out of Scope

- Mobile app implementation (documented as future option only)
- Carrier partnership negotiations (documented as long-term strategy only)
- SMS webhook integration (voice calls only for MVP)
- Multi-region deployment (single region sufficient for MVP)
- Load balancing / horizontal scaling (single household per instance)
- Automated deployment pipeline (manual deployment sufficient for MVP)

## Success Criteria

- [ ] Production deployment guide created at `docs/PRODUCTION_DEPLOYMENT.md`
- [ ] Twilio webhook wired to event bus (FR-007, FR-008)
- [ ] Twilio signature validation implemented (FR-014, FR-015)
- [ ] Call forwarding instructions documented for T-Mobile, Verizon, AT&T (FR-003)
- [ ] Live server deployment instructions documented (FR-005)
- [ ] Demo to production transition documented (FR-017, FR-018, FR-019)
- [ ] All integration options documented with tradeoffs (FR-011, FR-012, FR-013)
- [ ] Security best practices documented (FR-016)
- [ ] Health check endpoint implemented (NFR-006)
- [ ] Production deployment tested on live server with real Twilio phone number
- [ ] At least one real phone call processed end-to-end (Twilio → CORTEGE → agent analysis → escalation)
