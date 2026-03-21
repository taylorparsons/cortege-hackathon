/**
 * Demo Recording Script — Playwright
 *
 * Records a ~3-minute demo video following RECORDING-SCRIPT.md.
 * Only captures the app viewport — no test runner UI.
 * Run: npx playwright test --config=playwright.demo.config.js
 */
import { test } from '@playwright/test';

const BASE = 'http://localhost:3001';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let householdId;

test.describe('Demo Recording', () => {
  test.beforeAll(async ({ request }) => {
    // Find or create the Rivera Family household
    const res = await request.get(`${BASE}/api/households`);
    const households = await res.json();
    const rivera = households.find((h) => h.name === 'Rivera Family');
    if (rivera) {
      householdId = rivera.household_id;
    } else {
      const locRes = await request.post(`${BASE}/api/locations`, {
        data: {
          name: 'Rivera Family Home',
          address: { line1: '742 Evergreen Terrace', city: 'Seattle', region: 'WA', postal_code: '98101', country: 'US' },
        },
      });
      const loc = await locRes.json();
      const hhRes = await request.post(`${BASE}/api/households`, {
        data: { name: 'Rivera Family', location_id: loc.location_id },
      });
      const hh = await hhRes.json();
      householdId = hh.household_id;
      for (const m of [
        { name: 'Mom', phone: '+12065550101', date_of_birth: '1952-06-15', profile_type: 'senior', companion: 'anchor', is_primary: true },
        { name: 'Jamie', phone: '+12065550102', date_of_birth: '1990-03-22', profile_type: 'adult', companion: 'sentinel' },
        { name: 'Alex', phone: '+12065550103', date_of_birth: '2010-09-08', profile_type: 'child', companion: 'scout' },
      ]) {
        await request.post(`${BASE}/api/households/${householdId}/members`, { data: m });
      }
    }
  });

  test('full demo walkthrough', async ({ page }) => {
    // ─── [0:00] Load app ─────────────────────────────────────────────
    await page.goto('/');
    await wait(2000);

    // Select Rivera Family (clicking the row auto-closes the modal)
    await page.getByTestId('btn-switch-household').click();
    await wait(1500);
    const riveraRow = page.locator(`[data-testid="household-row-${householdId}"]`);
    if (await riveraRow.isVisible()) {
      await riveraRow.click();
    }
    await wait(1500);

    // ─── [0:00–0:20] INTRO — Household tab with companion cards ─────
    // "CORTEGE is an AI security companion system..."
    await page.getByTestId('tab-household').click();
    await wait(8000);

    // ─── [0:20–0:50] THE PROBLEM + SOLUTION — Hover each companion ──
    // "Americans lost 64 billion... Each family member is paired..."
    const cards = page.locator('[data-testid="companion-grid"] > div');
    const n = await cards.count();
    for (let i = 0; i < n; i++) {
      await cards.nth(i).hover();
      await wait(5000);
    }
    await wait(3000);

    // ─── [0:50–1:30] Click companion cards → show detail panels ─────
    // "Each companion has its own memory and learning stage..."
    // Mom / ANCHOR
    if (n > 0) {
      await cards.nth(0).click();
      await wait(6000);
    }
    // Jamie / SENTINEL
    if (n > 1) {
      await cards.nth(1).click();
      await wait(6000);
    }
    // Alex / SCOUT
    if (n > 2) {
      await cards.nth(2).click();
      await wait(6000);
      // Close detail panel
      await cards.nth(2).click();
      await wait(2000);
    }

    // ─── [1:30–1:40] Pause on household overview ────────────────────
    // "Households are the core unit..."
    await wait(7000);

    // ─── [1:40–2:20] Live Feed — inject a scam event ────────────────
    // "Here's the live threat feed..."
    await page.getByTestId('tab-livefeed').click();
    await wait(3000);

    // Select inbound_call type
    const form = page.getByTestId('form-event-injector');
    const selects = form.locator('select');
    await selects.nth(0).selectOption('inbound_call');
    await wait(1500);

    // Target Mom (senior — most compelling for scam demo)
    const momValue = await selects.nth(1).locator('option', { hasText: 'Mom' }).getAttribute('value');
    if (momValue) {
      await selects.nth(1).selectOption(momValue);
    }
    await wait(1500);

    // Replace payload with grandparent scam
    const textarea = form.locator('textarea');
    await textarea.click();
    await textarea.fill(JSON.stringify({
      from: '+1-888-555-0199',
      caller_name: 'Unknown Caller',
      duration_seconds: 180,
      voicemail: false,
      transcript: "Hi Grandma, it's me, your grandson. I got arrested and I need $5,000 for bail. Please wire it right away and don't tell Mom."
    }, null, 2));
    await wait(3000);

    // Submit event
    // "The agent processes the event, runs it through Claude..."
    await page.getByTestId('btn-inject-event').click();
    await wait(10000);

    // Scroll to see event feed response
    const eventFeed = page.getByTestId('event-feed');
    await eventFeed.scrollIntoViewIfNeeded();
    await wait(7000);

    // Scroll to agent status
    const agentStatus = page.getByTestId('agent-status');
    await agentStatus.scrollIntoViewIfNeeded();
    await wait(7000);

    // ─── [2:20–2:40] Companion Network tab ──────────────────────────
    // "What makes CORTEGE a platform, not just an app..."
    await page.getByTestId('tab-network').click();
    await wait(10000);

    // ─── [2:40–2:55] The Model (philosophy) tab ─────────────────────
    // "Under the hood: SQLite with an append-only hash chain..."
    await page.getByTestId('tab-philosophy').click();
    await wait(10000);

    // ─── [2:55–3:05] Back to Household for closing shot ─────────────
    // "CORTEGE starts with family security... Thank you."
    await page.getByTestId('tab-household').click();
    await wait(8000);
  });
});
