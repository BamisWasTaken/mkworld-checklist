import { expect, test } from '@playwright/test';
import {
  albumPageDots,
  collectedStickerCount,
  hideCollectedStickers,
  openApp,
  runQuickAction,
} from './helpers';

test.describe('quick actions', () => {
  test('should propagate a quick action to the album, map and todo list', async ({ page }) => {
    await openApp(page);
    await hideCollectedStickers(page);

    const pSwitchPins = page.locator('.collectible img[alt="p-switch marker"]');
    const pSwitchTodoRow = page.locator('mkworld-todo-section li.todo-item', {
      has: page.locator('img[alt="P-Switch"]'),
    });

    await expect(pSwitchPins.first()).toBeVisible();
    await expect(pSwitchTodoRow).toHaveCount(1);
    const collectedBefore = await collectedStickerCount(page);
    const pageDotsBefore = await albumPageDots(page).count();

    await runQuickAction(page, 'Check all P-Switches');

    // Every surface reads the same checklist signal, so all four must move together.
    await expect(pSwitchPins).toHaveCount(0);
    await expect(pSwitchTodoRow).toHaveCount(0);
    await expect.poll(() => collectedStickerCount(page)).toBeGreaterThan(collectedBefore);
    await expect.poll(() => albumPageDots(page).count()).toBeLessThan(pageDotsBefore);

    await runQuickAction(page, 'Uncheck all P-Switches');

    await expect(pSwitchTodoRow).toHaveCount(1);
    await expect(pSwitchPins.first()).toBeVisible();
    await expect.poll(() => collectedStickerCount(page)).toBe(collectedBefore);
    await expect.poll(() => albumPageDots(page).count()).toBe(pageDotsBefore);
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
