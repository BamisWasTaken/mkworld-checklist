import { expect, test } from '@playwright/test';
import {
  albumStickers,
  clickMarker,
  firstUncollectedMarkerIndex,
  hideCollectedStickers,
  openApp,
  searchAlbum,
  setMapSettingsOpen,
} from './helpers';

test.describe('settings', () => {
  test('should keep the album and map "show collected" toggles independent', async ({ page }) => {
    await openApp(page);

    const markers = page.locator('.collectible');
    const markersBefore = await markers.count();

    const index = await firstUncollectedMarkerIndex(page);
    await clickMarker(page, index);
    await page.locator('mkworld-tooltip .collect-button').click({ force: true });
    await expect(markers).toHaveCount(markersBefore - 1);

    await setMapSettingsOpen(page, true);
    await page.locator('label[for="show-collected-map"]').click();
    await expect(page.locator('#show-collected-map')).toBeChecked();
    await expect(markers).toHaveCount(markersBefore);
    await setMapSettingsOpen(page, false);

    const matches = await searchAlbum(page, 'cow');
    await hideCollectedStickers(page);

    // Hiding collected stickers is an album-only concern; the map keeps every marker it had.
    await expect(albumStickers(page)).toHaveCount(matches);
    await expect(markers).toHaveCount(markersBefore);
  });

  test('should persist map settings across a reload', async ({ page }) => {
    await openApp(page);

    await setMapSettingsOpen(page, true);
    await page.locator('label[for="show-peach-coins-map"]').click();
    await page.locator('label[for="show-collected-map"]').click();
    await page.locator('button.toggle-switch[role="switch"]').click();

    await expect(page.locator('#show-collected-map')).toBeChecked();
    await expect(page.locator('button.toggle-switch[role="switch"]')).toHaveAttribute(
      'aria-checked',
      'false'
    );

    await page.reload();
    await page.locator('mkworld-sticker-album .sticker').first().waitFor();

    await expect(page.locator('.collectible img[alt="peach-coin marker"]')).toHaveCount(0);
    await expect(page.locator('#map-panzoom img[alt="Mario Kart World Map"]')).toHaveAttribute(
      'src',
      /\/map\.webp/
    );
    await setMapSettingsOpen(page, true);
    await expect(page.locator('#show-collected-map')).toBeChecked();
    await expect(page.locator('button.toggle-switch[role="switch"]')).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });
});
