import { test, expect } from '@playwright/test';
import { createTestHousehold, cleanupTestHouseholds } from './helpers.js';

test.describe('Navigation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestHouseholds(request);
  });

  test('all 4 nav tabs render', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('tab-household')).toBeVisible();
    await expect(page.getByTestId('tab-network')).toBeVisible();
    await expect(page.getByTestId('tab-philosophy')).toBeVisible();
    await expect(page.getByTestId('tab-livefeed')).toBeVisible();
  });

  test('clicking tabs switches content via section eyebrow text', async ({ page }) => {
    await page.goto('/');

    // Click Network tab
    await page.getByTestId('tab-network').click();
    await expect(page.locator('.section-eyebrow').first()).toHaveText('Household Signal Layer');

    // Click Philosophy tab
    await page.getByTestId('tab-philosophy').click();
    await expect(page.locator('.section-eyebrow').first()).toHaveText('Product Philosophy');

    // Click Live Feed tab
    await page.getByTestId('tab-livefeed').click();
    await expect(page.locator('.section-eyebrow').first()).toHaveText('Real-Time Backend');

    // Click back to Household tab
    await page.getByTestId('tab-household').click();
    // Household tab eyebrow is dynamic — just verify we can see the tab is active
    await expect(page.getByTestId('tab-household')).toHaveClass(/active/);
  });

  test('household bar shows name when household exists', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Nav ${ts}`, 'Test City');

    await page.goto('/');

    // Switch to the created household via the selector
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();
    // Close modal by clicking overlay
    await page.mouse.click(10, 10);

    await expect(page.getByTestId('household-name')).toBeVisible();
    await expect(page.getByTestId('household-bar')).toBeVisible();
  });
});
