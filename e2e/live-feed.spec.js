import { test, expect } from '@playwright/test';
import { cleanupTestHouseholds } from './helpers.js';

test.describe('Live Feed', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestHouseholds(request);
  });

  test('Live Feed tab shows event-feed and agent-status components', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('tab-livefeed').click();

    await expect(page.getByTestId('event-feed')).toBeVisible();
    await expect(page.getByTestId('agent-status')).toBeVisible();
  });

  test('event injector form is visible and has submit button', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('tab-livefeed').click();

    await expect(page.getByTestId('form-event-injector')).toBeVisible();
    await expect(page.getByTestId('btn-inject-event')).toBeVisible();
  });
});
