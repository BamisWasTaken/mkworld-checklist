import { expect, test } from '@playwright/test';
import {
  albumStickers,
  hideCollectedStickers,
  openApp,
  searchAlbum,
  STICKERS_PER_PAGE,
} from './helpers';

test.describe('sticker album', () => {
  test('should keep a checked sticker after reload', async ({ page }) => {
    await openApp(page);

    const checkbox = page.locator('mkworld-sticker-album .sticker-checkbox').first();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await page.reload();
    await page.locator('mkworld-sticker-album .sticker').first().waitFor();
    await expect(page.locator('mkworld-sticker-album .sticker-checkbox').first()).toBeChecked();
  });

  test('should keep a search active while a matching sticker is collected', async ({ page }) => {
    await openApp(page);

    const matches = await searchAlbum(page, 'cow');
    expect(matches).toBeGreaterThan(1);

    await albumStickers(page).first().locator('.sticker-checkbox').click();

    // Collected stickers are shown by default, so the filtered set holds until they are hidden.
    await expect(albumStickers(page)).toHaveCount(matches);
    await expect(albumStickers(page).first().locator('.sticker-checkbox')).toBeChecked();

    await hideCollectedStickers(page);
    await expect(albumStickers(page)).toHaveCount(matches - 1);
    await expect(page.locator('.sticker-search-input')).toHaveValue('cow');

    await page.locator('.sticker-search-clear').click();
    await expect(albumStickers(page)).toHaveCount(STICKERS_PER_PAGE);

    await page.reload();
    await page.locator('mkworld-sticker-album .sticker').first().waitFor();
    // The collection persists, the search term does not.
    await expect(page.locator('.sticker-search-input')).toHaveValue('');
    expect(await searchAlbum(page, 'cow')).toBe(matches - 1);
  });
});
