# Changelog

## [2026-03-24]

### Features
-  add proprietary license, PPTX deck, and docs updates
-  replace demo video with Playwright recording (app-only, no runner UI)
-  add hackathon pitch deck, demo video, and recording script
-  ship twilio household fraud-case demo
-  align household demo flows and localhost review artifacts
-  ship privacy-first household data model
-  member management UI, schema fixes, data-testid attrs, E2E gitignore
-  add SQLite storage implementation with tamper-evident audit trail
-  add hash chain validation script
-  add SQLite schema with events, memory_snapshots, triggers
-  add better-sqlite3 dependency for SQLite storage

### Bug Fixes
-  update fraud stats to 2025 GASA report ($64B, 77% daily exposure)
-  patch live-feed household scoping and cut v0.3.1
-  code review fixes — field allowlisting, delete 404, gitignore, README, design docs
-  address spec + code quality review findings (Feature: 20260319-frontend-api-integration)
-  allow NULL target_member in events table for broadcast events
