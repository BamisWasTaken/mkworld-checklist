import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-started')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-started', '1');
    }
  });
  await page.goto('/');
  await page.locator('mkworld-sticker-album .sticker').first().waitFor();
}

test.describe('desktop journeys', () => {
  test('should keep a checked sticker after reload', async ({ page }) => {
    await openApp(page);

    const checkbox = page.locator('mkworld-sticker-album .sticker-checkbox').first();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await page.reload();
    await page.locator('mkworld-sticker-album .sticker').first().waitFor();
    await expect(page.locator('mkworld-sticker-album .sticker-checkbox').first()).toBeChecked();
  });

  test('should collect a map pin from its tooltip', async ({ page }) => {
    await openApp(page);

    const pin = page.locator('.collectible').first();
    await pin.click({ force: true });
    const tooltip = page.locator('mkworld-tooltip');
    await expect(tooltip).toBeAttached();

    await tooltip.locator('.collect-button').click({ force: true });
    await expect(tooltip.locator('.collect-button')).toHaveClass(/checked/);
  });

  test('should hide peach coins when that filter is toggled off', async ({ page }) => {
    await openApp(page);

    await page.locator('.settings-toggle').click();
    const peachPins = page.locator('.collectible img[alt="peach-coin marker"]');
    await expect(peachPins.first()).toBeVisible();

    await page.locator('label[for="show-peach-coins-map"]').click();
    await expect(peachPins).toHaveCount(0, { timeout: 2000 });
  });

  test('should export and import a save file', async ({ page }) => {
    await openApp(page);

    const checkbox = page.locator('mkworld-sticker-album .sticker-checkbox').first();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle('Download save file').click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();

    await page.getByTitle('Quick actions').click();
    await page.getByText('Reset all progress').click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.locator('mkworld-sticker-album .sticker-checkbox').first()).not.toBeChecked();

    await page.locator('input[type="file"]').setInputFiles(path!);
    await expect(page.locator('mkworld-sticker-album .sticker-checkbox').first()).toBeChecked();
  });

  test('should leave data unchanged when a reset is cancelled', async ({ page }) => {
    await openApp(page);

    const checkbox = page.locator('mkworld-sticker-album .sticker-checkbox').first();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await page.getByTitle('Quick actions').click();
    await page.getByText('Reset all progress').click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(checkbox).toBeChecked();
  });
});
