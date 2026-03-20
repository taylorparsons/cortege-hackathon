# Feature Spec: 20260320-pii-encryption-location-model

Status: Done
Created: 2026-03-20 11:47
Inputs: CR-20260320-1147, CR-20260320-1203
Decisions: D-20260320-1147, D-20260320-1203

## Summary
Implement a privacy-first household data model that encrypts protected household/member/location PII at rest, replaces household `location` as a primary write field with normalized `location_id`, and sanitizes logs plus external LLM requests so raw PII is never emitted outside trusted server read paths.

## User Stories & Acceptance

### US1: Household and member PII is encrypted at rest (Priority: P1)
Narrative:
- As a product owner, I want full name, phone, date of birth, location name, and structured address encrypted at rest, so that storage compromise does not expose cleartext household data.

Acceptance scenarios:
1. Given I create a household with a named location and a member with name, phone, and date of birth, When the records are persisted, Then the on-disk household/location data does not contain those values in clear text. (Verifies: FR-001, FR-002, FR-003, FR-004)
2. Given I read the same household through trusted API paths, When the server loads the records, Then it returns decrypted values needed by the UI. (Verifies: FR-005, FR-006)

### US2: Household location is normalized behind `location_id` (Priority: P1)
Narrative:
- As an operator, I want households to reference locations by ID, so that address data is centralized and no longer duplicated inline on household records.

Acceptance scenarios:
1. Given I create a new named location, When I create a household, Then the household stores `location_id` rather than an inline canonical location string. (Verifies: FR-007, FR-008, FR-009)
2. Given an existing legacy household with `location` or inline `address`, When I migrate or read it through compatibility paths, Then the system resolves or creates a location record and preserves the household. (Verifies: FR-010, FR-011)

### US3: External LLM calls never receive raw PII (Priority: P1)
Narrative:
- As a security-conscious operator, I want all external LLM calls sanitized, so that raw names, phones, addresses, and birthdays are never sent to a third-party model.

Acceptance scenarios:
1. Given an inbound event referencing a protected member, When the agent builds a Claude request, Then the event and memory payload use aliases/tokens instead of raw PII. (Verifies: FR-012, FR-013)
2. Given memory contains trusted contacts or blocked phone numbers, When the memory is serialized for the LLM, Then those identifiers are tokenized or omitted. (Verifies: FR-013, FR-014)

### US4: Logs and operational events do not emit cleartext PII (Priority: P1)
Narrative:
- As an engineer, I want logs and operational diagnostics to be safe by default, so that observability does not leak user data.

Acceptance scenarios:
1. Given member CRUD, manual event injection, or escalation processing occurs, When logs are emitted, Then they do not contain raw name, phone, address, or date of birth. (Verifies: FR-015, FR-016)
2. Given the Twilio webhook or manual API receives PII-bearing payloads, When the request is logged or rejected, Then the logged representation is redacted. (Verifies: FR-016, FR-017)

### US5: Operators can fully manage saved locations without breaking household references (Priority: P1)
Narrative:
- As an operator, I want full location CRUD in both the API and the UI, so that saved locations remain manageable after households are created and reassigned.

Acceptance scenarios:
1. Given saved locations exist, When I open the location management UI, Then I can list locations and edit a location name or address through trusted decrypted read/write paths. (Verifies: FR-008, FR-018, FR-019)
2. Given a location is still referenced by one or more households, When I try to delete it, Then the API rejects the delete with blocking household details and the UI requires reassignment first. (Verifies: FR-020, FR-021, FR-022)

## Requirements

Functional requirements:
- FR-001: The system SHALL encrypt member full name at rest. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-002: The system SHALL encrypt member phone and persist a deterministic phone token for matching. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-003: The system SHALL encrypt member date of birth at rest. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-004: The system SHALL encrypt location name and structured address at rest. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-005: Trusted household and member read paths SHALL decrypt protected fields for UI/API responses. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-006: Startup SHALL fail in protected server mode when `PII_MASTER_KEY` is missing. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-007: Household records SHALL reference locations by `location_id`. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-008: The system SHALL provide location CRUD operations for named locations with structured addresses. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-009: Household create and update APIs SHALL use `location_id` as the canonical location input. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-010: Compatibility paths SHALL read legacy `location` / inline `address` household data without breaking existing deployments. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-011: The migration script SHALL create or resolve location records for legacy households and backfill `location_id`. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-012: External Claude calls SHALL use sanitized event payloads that exclude raw protected PII. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-013: External Claude calls SHALL use sanitized memory serialization that excludes raw protected PII. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-014: Sanitized LLM payloads SHALL use deterministic aliases or tokens for member/contact references when context is required. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-015: Application logging SHALL use redacted or tokenized values for protected PII fields. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-016: Ingestion and escalation paths SHALL not log raw phone numbers, addresses, names, or birthdays. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-017: Error responses and error logs SHALL avoid embedding decrypted PII values. (Sources: CR-20260320-1147; D-20260320-1147)
- FR-018: The UI SHALL list saved locations with enough metadata to select and manage them. (Sources: CR-20260320-1203; D-20260320-1203)
- FR-019: The UI SHALL support editing location name and structured address fields through trusted API flows. (Sources: CR-20260320-1203; D-20260320-1203)
- FR-020: The API SHALL provide `DELETE /api/locations/:id` and reject deletion when the location is still referenced by households. (Sources: CR-20260320-1203; D-20260320-1203)
- FR-021: The API SHALL return `409 Conflict` with blocking household identifiers when a referenced location delete is rejected. (Sources: CR-20260320-1203; D-20260320-1203)
- FR-022: The UI SHALL support household reassignment to another `location_id` before a blocked location delete can succeed. (Sources: CR-20260320-1203; D-20260320-1203)

Non-functional requirements:
- NFR-001: Privacy helpers SHALL centralize encryption, decryption, tokenization, and redaction logic to avoid field-by-field drift. (Sources: CR-20260320-1147; D-20260320-1147)
- NFR-002: The feature SHALL preserve phone-based routing behavior via deterministic lookup tokens. (Sources: CR-20260320-1147; D-20260320-1147)
- NFR-003: Tests SHALL verify that persisted artifacts and LLM payloads do not contain cleartext protected PII. (Sources: CR-20260320-1147; D-20260320-1147)
- NFR-004: The implementation SHALL remain backward-compatible with existing household JSON input during migration/read paths. (Sources: CR-20260320-1147; D-20260320-1147)
- NFR-005: Location management flows SHALL preserve referential integrity between households and locations under create, update, reassignment, and delete operations. (Sources: CR-20260320-1203; D-20260320-1203)

## Edge Cases
- Legacy members may still contain plaintext `name`, `phone`, `age`, or `date_of_birth`; compatibility loaders must normalize them before write-back. (Verifies: FR-010, FR-011)
- Existing logs/tests may assert raw strings; regression coverage must be updated to assert redaction instead. (Verifies: FR-015, FR-016, NFR-003)
- External LLM prompts still need enough behavioral context to remain useful even after redaction. (Verifies: FR-012, FR-013, FR-014)
- Deleting a location that is the only assigned location for one or more households must fail until those households are reassigned. (Verifies: FR-020, FR-021, FR-022, NFR-005)
