import { expect, test } from '@playwright/test';
import {
  clickMarker,
  collectedStickerCount,
  firstUncollectedMarkerIndex,
  marker,
  openApp,
  setMapSettingsOpen,
} from './helpers';

test.describe('map', () => {
  test('should collect a map pin from its tooltip', async ({ page }) => {
    await openApp(page);

    const index = await firstUncollectedMarkerIndex(page);
    await clickMarker(page, index);
    await expect(page.locator('mkworld-tooltip')).toBeAttached();

    await page.locator('mkworld-tooltip .collect-button').click({ force: true });
    await expect(marker(page, index)).toHaveCount(0);
  });

  test('should hide peach coins when that filter is toggled off', async ({ page }) => {
    await openApp(page);

    await setMapSettingsOpen(page, true);
    const peachPins = page.locator('.collectible img[alt="peach-coin marker"]');
    await expect(peachPins.first()).toBeVisible();

    await page.locator('label[for="show-peach-coins-map"]').click();
    await expect(peachPins).toHaveCount(0, { timeout: 2000 });
  });

  test('should close a tooltip only when its marker leaves the map', async ({ page }) => {
    await openApp(page);

    const tooltip = page.locator('mkworld-tooltip');
    const collectedBefore = await collectedStickerCount(page);

    const hiddenIndex = await firstUncollectedMarkerIndex(page);
    await clickMarker(page, hiddenIndex);
    await expect(tooltip).toBeAttached();
    await tooltip.locator('.collect-button').click({ force: true });

    // Collected markers are hidden by default, so the tooltip follows its marker off the map.
    await expect(tooltip).toHaveCount(0);
    await expect(marker(page, hiddenIndex)).toHaveCount(0);
    await expect.poll(() => collectedStickerCount(page)).toBe(collectedBefore + 1);

    await setMapSettingsOpen(page, true);
    await page.locator('label[for="show-collected-map"]').click();
    await expect(page.locator('#show-collected-map')).toBeChecked();
    await setMapSettingsOpen(page, false);

    const shownIndex = await firstUncollectedMarkerIndex(page);
    await clickMarker(page, shownIndex);
    await expect(tooltip).toBeAttached();
    await tooltip.locator('.collect-button').click({ force: true });

    // The marker stays, so the tooltip stays with its checked collect button as feedback.
    await expect(tooltip).toBeAttached();
    await expect(tooltip.locator('.collect-button')).toHaveClass(/checked/);
    await expect(marker(page, shownIndex)).toHaveClass(/collected/);
  });

  test('should zoom and pan the whole map in fullscreen', async ({ page }) => {
    // Aspect ratios above ~1.89 are what froze the fullscreen zoom, so pin a wide viewport.
    await page.setViewportSize({ width: 1400, height: 700 });
    await openApp(page);

    const readMatrix = (component: 'a' | 'f') =>
      page.evaluate(part => {
        const transform = getComputedStyle(document.getElementById('map-panzoom')!).transform;
        return new DOMMatrixReadOnly(transform)[part as 'a' | 'f'];
      }, component);
    const scale = () => readMatrix('a');
    const offsetY = () => readMatrix('f');

    await page.locator('.fullscreen-toggle').click();
    await expect(page.locator('#map-panzoom')).toHaveClass(/fullscreen-map-panzoom/);
    await expect.poll(scale).toBe(1);

    await page.mouse.move(700, 350);
    await page.mouse.wheel(0, -240);
    await expect.poll(scale).toBeGreaterThan(1);

    await page.mouse.wheel(0, 960);
    await expect.poll(scale).toBe(1);

    // The scene is taller than the viewport, so the bottom of the map has to be reachable.
    const panRange = await page.evaluate(() => {
      const element = document.getElementById('map-panzoom')!;
      return element.getBoundingClientRect().height - window.innerHeight;
    });
    expect(panRange).toBeGreaterThan(0);

    for (let step = 0; step < 6; step++) {
      await page.mouse.move(700, 600);
      await page.mouse.down();
      await page.mouse.move(700, 60, { steps: 8 });
      await page.mouse.up();
    }
    await expect.poll(offsetY).toBeLessThanOrEqual(-panRange + 1);

    await page.locator('.fullscreen-toggle').click({ force: true });
    await expect(page.locator('#map-panzoom')).not.toHaveClass(/fullscreen-map-panzoom/);
    await expect.poll(scale).toBe(1);
  });
});
