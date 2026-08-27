import { expect, test, type Page } from '@playwright/test';
import {
  albumSticker,
  albumStickerIndexes,
  albumStickers,
  collectedCountForType,
  collectedStickerCount,
  COLLECTIBLE_LABELS,
  hideCollectedStickers,
  marker,
  openApp,
  runQuickAction,
  searchAlbum,
  todoCollectibleRow,
} from './helpers';

/**
 * Not every sticker is backed by a collectible, and the map only renders markers inside the current
 * viewport, so the one sticker this journey follows has to be picked from the overlap at runtime.
 */
async function searchResultWithVisibleMarker(page: Page): Promise<{ index: string; type: string }> {
  for (const index of await albumStickerIndexes(page)) {
    const pin = marker(page, index);
    if ((await pin.count()) === 1 && !(await pin.getAttribute('class'))?.includes('collected')) {
      const alt = await pin.locator('img').getAttribute('alt');
      return { index, type: alt!.replace(' marker', '') };
    }
  }
  throw new Error('no search result is backed by a marker currently on the map');
}

test.describe('collecting a sticker', () => {
  test('should update the album, map and todo list, and undo on a quick action', async ({
    page,
  }) => {
    await openApp(page);
    await hideCollectedStickers(page);

    const matches = await searchAlbum(page, 'cow');
    expect(matches).toBeGreaterThan(1);

    const { index, type } = await searchResultWithVisibleMarker(page);
    const labels = COLLECTIBLE_LABELS[type];
    expect(labels).toBeTruthy();

    const collectedBefore = await collectedStickerCount(page);
    const typeCountBefore = await collectedCountForType(page, labels.todoAlt);
    await expect(albumSticker(page, index)).toHaveCount(1);
    await expect(marker(page, index)).toHaveCount(1);

    await albumSticker(page, index).locator('.sticker-checkbox').click();

    // One click on one checkbox has to land on all three surfaces that read the same model.
    await expect(albumSticker(page, index)).toHaveCount(0);
    await expect(albumStickers(page)).toHaveCount(matches - 1);
    await expect(marker(page, index)).toHaveCount(0);
    await expect.poll(() => collectedStickerCount(page)).toBe(collectedBefore + 1);
    await expect.poll(() => collectedCountForType(page, labels.todoAlt)).toBe(typeCountBefore + 1);

    await runQuickAction(page, labels.uncheckAll);

    // Clearing the whole collectible type has to walk every one of those changes back.
    await expect(albumSticker(page, index)).toHaveCount(1);
    await expect(albumStickers(page)).toHaveCount(matches);
    await expect(marker(page, index)).toHaveCount(1);
    await expect(albumSticker(page, index).locator('.sticker-checkbox')).not.toBeChecked();
    await expect.poll(() => collectedStickerCount(page)).toBe(collectedBefore);
    await expect(todoCollectibleRow(page, labels.todoAlt)).toHaveCount(1);
    await expect.poll(() => collectedCountForType(page, labels.todoAlt)).toBe(typeCountBefore);
    await expect(page.locator('.sticker-search-input')).toHaveValue('cow');
  });
});
