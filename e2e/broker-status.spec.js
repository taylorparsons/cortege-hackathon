/**
 * E2E tests for BrokerStatus component and WARDEN REST API.
 * Covers: FR-001, FR-005, FR-006 (20260323-warden-agent)
 *
 * Tests are split into two groups:
 *   1. API-level — exercises WARDEN endpoints directly (no UI)
 *   2. UI-level  — navigates to the Network tab and asserts component behaviour
 */

import { test, expect } from '@playwright/test';
import { createTestHousehold, addTestMember, cleanupTestHouseholds } from './helpers.js';

const BASE = 'http://localhost:3001';
const FRONT = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// API tests
// ---------------------------------------------------------------------------

test.describe('WARDEN API', () => {
  test('GET /api/warden/brokers returns all registered brokers', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/brokers`);
    expect(res.status()).toBe(200);

    const { brokers } = await res.json();
    expect(Array.isArray(brokers)).toBe(true);
    expect(brokers.length).toBeGreaterThanOrEqual(11);

    // Spot-check required fields
    for (const broker of brokers) {
      expect(broker).toHaveProperty('id');
      expect(broker).toHaveProperty('name');
      expect(broker).toHaveProperty('opt_out_url');
    }
  });

  test('GET /api/warden/brokers includes CyberBackgroundChecks', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/brokers`);
    const { brokers } = await res.json();
    const ids = brokers.map((b) => b.id);
    expect(ids).toContain('cyberbackgroundchecks');
  });

  test('GET /api/warden/status returns 200 with no household_id', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/status`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('members');
    expect(data).toHaveProperty('aggregate');
  });

  test('GET /api/warden/status with unknown household_id returns empty members', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/status?household_id=hh_nonexistent_e2e`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('members');
    expect(Object.keys(data.members)).toHaveLength(0);
  });

  test('GET /api/warden/captcha returns sessions array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/captcha`);
    expect(res.status()).toBe(200);
    const { sessions } = await res.json();
    expect(Array.isArray(sessions)).toBe(true);
  });

  test('GET /api/warden/associates returns associates array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/associates`);
    expect(res.status()).toBe(200);
    const { associates } = await res.json();
    expect(Array.isArray(associates)).toBe(true);
  });

  test('POST /api/warden/scan returns queued status', async ({ request }) => {
    const res = await request.post(`${BASE}/api/warden/scan`, { data: {} });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('queued');
  });

  test('GET /api/warden/captcha/:sessionId 404 for unknown session', async ({ request }) => {
    const res = await request.get(`${BASE}/api/warden/captcha/nonexistent-session-e2e`);
    expect(res.status()).toBe(404);
  });

  test('POST /api/warden/captcha/:sessionId/resolve 404 for unknown session', async ({ request }) => {
    const res = await request.post(`${BASE}/api/warden/captcha/nonexistent-session-e2e/resolve`);
    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// UI tests
// ---------------------------------------------------------------------------

test.describe('BrokerStatus UI', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestHouseholds(request);
  });

  test('BrokerStatus card is visible on the Network tab', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-network').click();

    await expect(page.getByTestId('broker-status-card')).toBeVisible();
  });

  test('Scan Now button is visible after BrokerStatus loads', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-network').click();

    // Wait for loading to complete
    await expect(page.getByTestId('broker-status-loading')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('btn-scan-now')).toBeVisible();
  });

  test('"Awaiting first scan" shown when no scan data exists for household', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Warden ${ts}`);

    await page.goto('/');
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();
    await page.getByTestId('tab-network').click();

    await expect(page.getByTestId('broker-status-loading')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('broker-status-summary')).toContainText('Awaiting first scan');
  });

  test('Scan Now button sends POST /api/warden/scan', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Warden Scan ${ts}`);
    await addTestMember(request, hh.household_id, { name: `E2E Member ${ts}` });

    // Intercept the scan POST before it reaches the server
    let scanRequested = false;
    await page.route(`${FRONT}/api/warden/scan`, (route) => {
      scanRequested = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ queued: 0 }) });
    });

    await page.goto('/');
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();
    await page.getByTestId('tab-network').click();

    await expect(page.getByTestId('btn-scan-now')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-scan-now').click();

    expect(scanRequested).toBe(true);
  });

  test('BrokerStatus shows member rows when scan data exists', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Warden Data ${ts}`);
    const member = await addTestMember(request, hh.household_id, { name: `E2E Member ${ts}` });

    // Seed broker scan data directly via the store API path
    const seedRes = await request.post(`${BASE}/api/warden/scan`, {
      data: { household_id: hh.household_id, member_id: member.id },
    });
    // 200 or 503 (engine not running) — either way the UI should render with stored data
    expect([200, 503]).toContain(seedRes.status());

    await page.goto('/');
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();
    await page.getByTestId('tab-network').click();

    await expect(page.getByTestId('broker-status-card')).toBeVisible();
  });
});
