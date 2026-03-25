# Requirements Document

## Introduction

This document specifies requirements for implementing headed/headless browser mode selection for WARDEN data broker scans. The feature enables two distinct execution paths: fully automated headless scanning for brokers without bot protection, and user-initiated headed (visible browser) scanning for CAPTCHA-protected brokers that require human interaction.

Currently, WARDEN has partial headed mode support via the `WARDEN_HEADED_MODE=true` environment variable, which launches all browser sessions visibly. However, this is a global setting that affects all scans. The system needs per-broker mode selection, allowing some brokers to always use headed mode while others remain headless, with proper UI controls for users to manually trigger headed scans when needed.

## Glossary

- **WARDEN_Engine**: The orchestrator component that manages broker scan scheduling, queuing, and execution
- **Browser_Session**: Playwright-based browser automation wrapper that supports both headless and headed modes
- **Broker_Definition**: JSON configuration file defining how to search and opt-out from a specific data broker
- **Broker_Registry**: Component that loads and validates broker definitions
- **Headed_Mode**: Browser execution with visible UI, allowing user interaction with CAPTCHAs and bot challenges
- **Headless_Mode**: Browser execution without visible UI, fully automated
- **CAPTCHA_Manager**: Component that manages CAPTCHA resolution sessions and coordinates with the UI
- **Scan_Job**: A queued task to scan one member against one broker
- **Bot_Protection**: Security measures (CAPTCHA, Cloudflare challenges) that block automated headless browsers

## Requirements

### Requirement 1: Broker Mode Configuration

**User Story:** As a system administrator, I want to configure which brokers require headed mode, so that bot-protected brokers automatically use visible browsers while others remain fully automated.

#### Acceptance Criteria

1. THE Broker_Definition SHALL include an optional `requires_headed_mode` boolean field
2. WHEN `requires_headed_mode` is true, THE WARDEN_Engine SHALL launch Browser_Session in headed mode for that broker
3. WHEN `requires_headed_mode` is false or omitted, THE WARDEN_Engine SHALL launch Browser_Session in headless mode
4. THE Broker_Registry SHALL validate that `requires_headed_mode` is a boolean when present
5. WHERE a broker has Cloudflare or reCAPTCHA protection, THE Broker_Definition SHOULD set `requires_headed_mode` to true

### Requirement 2: Per-Scan Mode Override

**User Story:** As a household member, I want to manually trigger a headed scan for a specific broker, so that I can interact with CAPTCHAs and complete the opt-out process.

#### Acceptance Criteria

1. THE WARDEN_Engine SHALL accept an optional `headed` parameter in scan requests
2. WHEN `headed` parameter is true, THE WARDEN_Engine SHALL launch Browser_Session in headed mode regardless of broker configuration
3. WHEN `headed` parameter is false, THE WARDEN_Engine SHALL launch Browser_Session in headless mode regardless of broker configuration
4. WHEN `headed` parameter is omitted, THE WARDEN_Engine SHALL use the broker's `requires_headed_mode` setting
5. THE Scan_Job SHALL store the resolved mode (headed or headless) for audit purposes

### Requirement 3: Headed Scan API Endpoint

**User Story:** As a frontend developer, I want an API endpoint to trigger headed scans, so that users can manually initiate visible browser sessions from the UI.

#### Acceptance Criteria

1. THE API SHALL provide a `POST /api/warden/scan/headed` endpoint
2. WHEN the endpoint receives a request with `household_id`, `member_id`, and `broker_id`, THE API SHALL enqueue a Scan_Job with `headed: true`
3. THE API SHALL return HTTP 200 with `{ queued: true, job_id: string }` on success
4. IF `household_id`, `member_id`, or `broker_id` is missing, THEN THE API SHALL return HTTP 400 with error details
5. IF the specified broker or member does not exist, THEN THE API SHALL return HTTP 404

### Requirement 4: Headed Scan UI Controls

**User Story:** As a household member, I want a button to start a headed scan for a specific broker, so that I can manually complete CAPTCHAs when automated scans fail.

#### Acceptance Criteria

1. THE UI SHALL display a "Scan with Browser" button for each broker in the member's scan status view
2. WHEN the user clicks "Scan with Browser", THE UI SHALL call `POST /api/warden/scan/headed` with the member and broker IDs
3. THE UI SHALL display a loading indicator while the headed scan is queued
4. WHEN the scan is queued successfully, THE UI SHALL show a notification that the browser will open shortly
5. WHERE a broker has `requires_headed_mode: true`, THE UI SHOULD indicate that this broker requires manual interaction

### Requirement 5: Browser Session Mode Selection

**User Story:** As the WARDEN engine, I want to launch browser sessions in the correct mode based on broker configuration and user override, so that scans execute with appropriate automation levels.

#### Acceptance Criteria

1. THE Browser_Session SHALL accept a `headless` parameter in the `launch()` method
2. WHEN `headless` is true, THE Browser_Session SHALL launch Chromium with `headless: true`
3. WHEN `headless` is false, THE Browser_Session SHALL launch Chromium with `headless: false`
4. THE WARDEN_Engine SHALL determine the `headless` parameter from Scan_Job configuration before launching Browser_Session
5. THE WARDEN_Engine SHALL log the browser mode (headed/headless) when starting each scan job

### Requirement 6: Headed Mode Session Management

**User Story:** As a system administrator, I want headed browser sessions to be properly managed and cleaned up, so that visible browser windows don't accumulate or block the scan queue.

#### Acceptance Criteria

1. THE WARDEN_Engine SHALL enforce the `WARDEN_MAX_CONCURRENT_SESSIONS` limit for both headed and headless sessions
2. WHEN a headed Browser_Session completes or times out, THE WARDEN_Engine SHALL close the browser window
3. WHEN a headed Browser_Session encounters an error, THE WARDEN_Engine SHALL close the browser window and mark the scan as failed
4. THE WARDEN_Engine SHALL track active headed sessions separately for monitoring purposes
5. WHERE multiple headed scans are queued, THE WARDEN_Engine SHALL process them sequentially to avoid overwhelming the user with browser windows

### Requirement 7: Broker Definition Migration

**User Story:** As a system administrator, I want existing broker definitions to work without modification, so that the headed mode feature is backward compatible.

#### Acceptance Criteria

1. WHEN a Broker_Definition omits `requires_headed_mode`, THE Broker_Registry SHALL treat it as `requires_headed_mode: false`
2. THE Broker_Registry SHALL load all existing broker definitions without errors after the feature is deployed
3. THE WARDEN_Engine SHALL continue to respect the global `WARDEN_HEADED_MODE` environment variable when `requires_headed_mode` is not specified
4. WHERE `WARDEN_HEADED_MODE=true` and `requires_headed_mode` is false, THE WARDEN_Engine SHALL use headless mode (per-broker setting takes precedence)
5. THE system SHALL log a deprecation warning when `WARDEN_HEADED_MODE` is used without per-broker configuration

### Requirement 8: Headed Scan Status Tracking

**User Story:** As a household member, I want to see when a scan is running in headed mode, so that I know to watch for the browser window and interact with it.

#### Acceptance Criteria

1. THE Broker_Scan_Store SHALL store the browser mode (headed/headless) for each scan execution
2. WHEN a headed scan is in progress, THE WebSocket SHALL emit `warden:scan_started` with `{ mode: 'headed' }`
3. THE UI SHALL display a "Browser Open" indicator when a headed scan is active
4. WHEN a headed scan completes, THE WebSocket SHALL emit `warden:scan_completed` with the final status
5. THE scan history SHALL record whether each scan was executed in headed or headless mode

### Requirement 9: Headed Mode Error Handling

**User Story:** As a system administrator, I want headed scans to fail gracefully when the browser cannot be launched, so that the system remains stable and provides clear error messages.

#### Acceptance Criteria

1. IF Browser_Session fails to launch in headed mode, THEN THE WARDEN_Engine SHALL mark the scan as `error` with reason `browser_launch_failed`
2. THE WARDEN_Engine SHALL log the browser launch error with full details for debugging
3. THE WebSocket SHALL emit `warden:scan_error` with `{ broker_id, member_id, error: 'browser_launch_failed', mode: 'headed' }`
4. THE UI SHALL display a user-friendly error message when headed browser launch fails
5. WHERE headed mode fails, THE UI SHOULD suggest checking system permissions and display configuration

### Requirement 10: Cloudflare-Protected Broker Flagging

**User Story:** As a system administrator, I want Cloudflare-protected brokers to be automatically flagged for headed mode, so that scans don't repeatedly fail against bot protection.

#### Acceptance Criteria

1. THE Broker_Definition for CyberBackgroundChecks SHALL set `requires_headed_mode: true`
2. THE Broker_Definition for Spokeo SHALL set `requires_headed_mode: true`
3. WHERE a broker definition includes `detect_captcha` steps with Cloudflare selectors, THE documentation SHOULD recommend setting `requires_headed_mode: true`
4. THE Broker_Registry SHALL load and validate the updated broker definitions without errors
5. WHEN WARDEN_Engine scans CyberBackgroundChecks or Spokeo, THE Browser_Session SHALL launch in headed mode by default

