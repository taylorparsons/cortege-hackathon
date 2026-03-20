import { test, expect } from '@playwright/test';
import {
  createTestHousehold,
  addTestMember,
  cleanupTestHouseholds,
} from './helpers.js';

test.describe('Member CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestHouseholds(request);
  });

  test('add a member via the form and verify member row appears', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Member Add ${ts}`, 'Test City');

    await page.goto('/');

    // Open selector and select the household
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();

    // Re-open modal — MemberManager is shown when a household is selected
    await page.getByTestId('btn-switch-household').click();

    // Open add member form
    await page.getByTestId('btn-add-member').click();
    await expect(page.getByTestId('form-add-member')).toBeVisible();

    // Fill form
    const memberName = `E2E Member ${ts}`;
    await page.getByTestId('input-member-name').fill(memberName);
    await page.getByTestId('input-member-phone').fill('+15551234567');
    await page.getByTestId('select-profile-type').selectOption('adult');
    await page.getByTestId('btn-submit-member').click();

    // The form closes and the member list re-fetches asynchronously
    // Wait for the form to disappear first, then check for the member row
    await expect(page.getByTestId('form-add-member')).not.toBeVisible({ timeout: 5000 });
    await expect(
      page.locator(`[data-testid^="member-row-"]`).filter({ hasText: memberName })
    ).toBeVisible({ timeout: 10000 });
  });

  test('edit a member and verify updated name', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Member Edit ${ts}`, 'Test City');
    const member = await addTestMember(request, hh.household_id, {
      name: `E2E Original ${ts}`,
      profile_type: 'adult',
    });

    await page.goto('/');

    // Select the household
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();

    // Re-open modal
    await page.getByTestId('btn-switch-household').click();

    // Click edit for the member
    await page.getByTestId(`btn-edit-member-${member.id}`).click();

    // The member row should now show an edit form — find the name input within it
    const memberRow = page.getByTestId(`member-row-${member.id}`);
    const nameInput = memberRow.locator('input[type="text"]').first();
    await nameInput.fill(`E2E Updated ${ts}`);

    // Click Save
    await memberRow.getByRole('button', { name: 'Save' }).click();

    // Updated name should appear
    await expect(page.locator(`[data-testid^="member-row-"]`).filter({ hasText: `E2E Updated ${ts}` })).toBeVisible();
  });

  test('remove a member via confirm dialog and verify row gone', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Member Remove ${ts}`, 'Test City');
    const member = await addTestMember(request, hh.household_id, {
      name: `E2E Remove Me ${ts}`,
      profile_type: 'senior',
    });

    await page.goto('/');

    // Select the household
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();

    // Re-open modal
    await page.getByTestId('btn-switch-household').click();

    // Set up confirm dialog handler BEFORE clicking remove
    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId(`btn-remove-member-${member.id}`).click();

    // Member row should be gone
    await expect(page.getByTestId(`member-row-${member.id}`)).not.toBeVisible();
  });

  test('selecting profile type "child" shows "scout" as companion', async ({ page, request }) => {
    const ts = Date.now();
    const hh = await createTestHousehold(request, `E2E Test Profile Type ${ts}`, 'Test City');

    await page.goto('/');

    // Select the household
    await page.getByTestId('btn-switch-household').click();
    await page.getByTestId(`household-row-${hh.household_id}`).click();

    // Re-open modal
    await page.getByTestId('btn-switch-household').click();

    // Open add member form
    await page.getByTestId('btn-add-member').click();

    // Select "child" profile type
    await page.getByTestId('select-profile-type').selectOption('child');

    // The select option text includes the companion type derivation
    // Options are rendered as: "child (companion: scout)"
    const selectedOption = page.getByTestId('select-profile-type').locator('option[value="child"]');
    await expect(selectedOption).toHaveText('child (companion: scout)');
  });
});
