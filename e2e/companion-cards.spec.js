import { test, expect } from '@playwright/test';
import { createTestHousehold, cleanupTestHouseholds } from './helpers.js';

test.describe('Companion Cards', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestHouseholds(request);
  });

  test('companion grid renders or shows empty message on Household tab', async ({ page, request }) => {
    const ts = Date.now();
    await createTestHousehold(request, `E2E Test Companions ${ts}`, 'Test City');

    await page.goto('/');

    // Go to the Household tab (default tab)
    await page.getByTestId('tab-household').click();

    // Either the companion grid or the empty message should be visible
    // The companion grid only populates when agents are running, so both outcomes are valid
    const grid = page.getByTestId('companion-grid');
    const emptyMsg = page.locator('text=No companions loaded yet');

    const gridVisible = await grid.isVisible().catch(() => false);
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    // At least one of these states must be true
    expect(gridVisible || emptyVisible).toBe(true);
  });

  test('clicking a companion card shows the detail panel', async ({ page }) => {
    await page.goto('/');

    // Only run this test if companions are loaded
    const grid = page.getByTestId('companion-grid');
    const gridVisible = await grid.isVisible().catch(() => false);

    if (!gridVisible) {
      // If no companions, verify detail panel is not shown — test passes vacuously
      await expect(page.getByTestId('detail-panel')).not.toBeVisible();
      return;
    }

    // Click the first companion card
    const firstCard = grid.locator('.companion-card').first();
    await firstCard.click();

    // Detail panel should appear
    await expect(page.getByTestId('detail-panel')).toBeVisible();
  });

  test('clicking the same companion card again closes the detail panel', async ({ page }) => {
    await page.goto('/');

    const grid = page.getByTestId('companion-grid');
    const gridVisible = await grid.isVisible().catch(() => false);

    if (!gridVisible) {
      // No companions running — detail panel toggle not testable
      await expect(page.getByTestId('detail-panel')).not.toBeVisible();
      return;
    }

    const firstCard = grid.locator('.companion-card').first();

    // First click — opens detail panel
    await firstCard.click();
    await expect(page.getByTestId('detail-panel')).toBeVisible();

    // Second click on the same card — closes detail panel
    await firstCard.click();
    await expect(page.getByTestId('detail-panel')).not.toBeVisible();
  });
});
