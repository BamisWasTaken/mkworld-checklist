import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  clickMarker,
  firstUncollectedMarkerIndex,
  lastAchievement,
  marker,
  openApp,
  runQuickAction,
  setMapSettingsOpen,
} from './helpers';

test.describe('save file', () => {
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

    await runQuickAction(page, 'Reset all progress');
    await expect(checkbox).not.toBeChecked();

    await page.locator('input[type="file"]').setInputFiles(path!);
    await expect(checkbox).toBeChecked();
  });

  test('should round-trip stickers, collectibles, achievements and settings', async ({ page }) => {
    await openApp(page);

    const stickerCheckbox = page.locator('mkworld-sticker-album .sticker-checkbox').first();
    await stickerCheckbox.click();
    await expect(stickerCheckbox).toBeChecked();

    const index = await firstUncollectedMarkerIndex(page);
    await clickMarker(page, index);
    await page.locator('mkworld-tooltip .collect-button').click({ force: true });
    await expect(marker(page, index)).toHaveCount(0);

    const achievement = lastAchievement(page);
    await achievement.locator('.todo-item').first().click();
    const milestone = achievement.locator('.milestone-item input[type="checkbox"]').first();
    await milestone.click();
    await expect(milestone).toBeChecked();

    await setMapSettingsOpen(page, true);
    await page.locator('label[for="show-peach-coins-map"]').click();
    await expect(page.locator('.collectible img[alt="peach-coin marker"]')).toHaveCount(0);

    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle('Download save file').click();
    const download = await downloadPromise;
    const savePath = await download.path();
    const saveFile = JSON.parse(await readFile(savePath!, 'utf8'));

    expect(Object.keys(saveFile).sort()).toEqual([
      'achievementStates',
      'checklistModelStates',
      'settings',
    ]);
    // The sticker search term is deliberately ephemeral and must never reach the save file.
    expect(JSON.stringify(saveFile).toLowerCase()).not.toContain('search');

    await runQuickAction(page, 'Reset all progress');
    await expect(stickerCheckbox).not.toBeChecked();
    await expect(marker(page, index)).toHaveCount(1);
    await setMapSettingsOpen(page, true);
    await page.locator('label[for="show-peach-coins-map"]').click();
    await expect(page.locator('.collectible img[alt="peach-coin marker"]').first()).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(savePath!);

    await expect(stickerCheckbox).toBeChecked();
    await expect(marker(page, index)).toHaveCount(0);
    await expect(page.locator('.collectible img[alt="peach-coin marker"]')).toHaveCount(0);
    await expect(
      page.locator('mkworld-todo-section .milestone-item input[type="checkbox"]:checked')
    ).not.toHaveCount(0);
  });
});
