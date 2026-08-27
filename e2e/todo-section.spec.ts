import { expect, test } from '@playwright/test';
import { lastAchievement, openApp } from './helpers';

test.describe('todo section', () => {
  test('should persist an achievement milestone across a reload', async ({ page }) => {
    await openApp(page);

    const achievement = lastAchievement(page);
    const titleBefore = await achievement.locator('span.flex-1').first().innerText();

    await achievement.locator('.todo-item').first().click();
    const milestone = achievement.locator('.milestone-item input[type="checkbox"]').first();
    await milestone.click();
    await expect(milestone).toBeChecked();
    await expect(achievement.locator('span.flex-1').first()).not.toHaveText(titleBefore);

    await page.reload();
    await page.locator('mkworld-sticker-album .sticker').first().waitFor();

    const reloaded = lastAchievement(page);
    await expect(reloaded.locator('span.flex-1').first()).not.toHaveText(titleBefore);
    await expect(reloaded.locator('.milestone-item input[type="checkbox"]').first()).toBeChecked();
  });
});
