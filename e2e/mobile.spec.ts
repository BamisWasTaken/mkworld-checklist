import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test.describe('mobile journeys', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('should change album page on a horizontal swipe', async ({ page }) => {
    const album = page.locator('mkworld-sticker-album');
    const firstSticker = page.locator('mkworld-sticker-album .sticker').first();
    const firstId = await firstSticker.getAttribute('id');

    const box = await album.boundingBox();
    expect(box).toBeTruthy();

    await page.mouse.move(box!.x + box!.width - 30, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + 30, box!.y + box!.height / 2, { steps: 12 });
    await page.mouse.up();

    await expect(page.locator('mkworld-sticker-album .sticker').first()).not.toHaveAttribute(
      'id',
      firstId ?? ''
    );
  });

  test('should open and close a map tooltip by tapping outside', async ({ page }) => {
    await page.locator('.collectible').first().click({ force: true });
    await expect(page.locator('mkworld-tooltip')).toBeAttached();

    await page.locator('mkworld-todo-section').click({ position: { x: 8, y: 8 }, force: true });
    await expect(page.locator('mkworld-tooltip')).toHaveCount(0);
  });
});
