import { test, expect } from '@playwright/test';
import { createTestHousehold, cleanupTestHouseholds } from './helpers.js';

test.describe('Household CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestHouseholds(request);
  });

  test('open household selector modal via btn-switch-household', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('btn-switch-household').click();

    await expect(page.getByTestId('modal-household-selector')).toBeVisible();
    await expect(page.getByTestId('household-selector')).toBeVisible();
  });

  test('create a new household and verify it appears in the list', async ({ page }) => {
    const ts = Date.now();
    const name = `E2E Test Create ${ts}`;

    await page.goto('/');
    await page.getByTestId('btn-switch-household').click();

    // Open the create form
    await page.getByTestId('btn-new-household').click();
    await expect(page.getByTestId('form-create-household')).toBeVisible();

    // Fill and submit
    await page.getByTestId('input-household-name').fill(name);
    await page.getByTestId('input-household-location').fill('Test City');
    await page.getByTestId('btn-create-household').click();

    // After creation, onSelect is called which selects the new household and closes the modal.
    // Verify that household-name in the nav bar now shows the new household name.
    await expect(page.getByTestId('household-name')).toHaveText(name);
  });

  test('switch to a different household and verify household-name updates', async ({ page, request }) => {
    const ts = Date.now();
    const hh1 = await createTestHousehold(request, `E2E Test Switch A ${ts}`, 'City A');
    const hh2 = await createTestHousehold(request, `E2E Test Switch B ${ts}`, 'City B');

    await page.goto('/');

    // Select first household
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh1.household_id}`).click();

    // Wait for household name to update
    await expect(page.getByTestId('household-name')).toHaveText(hh1.name);

    // Now switch to second household
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh2.household_id}`).click();

    await expect(page.getByTestId('household-name')).toHaveText(hh2.name);
  });

  test('delete a household via confirm dialog', async ({ page, request }) => {
    const ts = Date.now();
    // Create a household to delete, and a second one (can't delete current household)
    const hhToKeep = await createTestHousehold(request, `E2E Test Keep ${ts}`, 'City A');
    const hhToDelete = await createTestHousehold(request, `E2E Test Delete ${ts}`, 'City B');

    await page.goto('/');

    // Select the household we want to keep as current
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hhToKeep.household_id}`).click();

    // Re-open modal — delete button is only shown for non-current households
    await page.getByTestId('btn-switch-household').click();

    // Accept the confirm dialog before clicking delete
    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId(`btn-delete-household-${hhToDelete.household_id}`).click();

    // Household row should be gone
    await expect(page.getByTestId(`household-row-${hhToDelete.household_id}`)).not.toBeVisible();
  });
});
