import { expect, type Locator, type Page } from '@playwright/test';

export const STICKERS_PER_PAGE = 32;

/**
 * The init script runs on every navigation, so the sessionStorage guard keeps a `page.reload()`
 * inside a test from wiping the progress that test just made.
 */
export async function openApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-started')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-started', '1');
    }
  });
  await page.goto('/');
  await page.locator('mkworld-sticker-album .sticker').first().waitFor();
}

/** The map settings panel stays in the DOM when closed, so its controls need it opened first. */
export async function setMapSettingsOpen(page: Page, open: boolean): Promise<void> {
  const toggle = page.locator('.settings-toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== String(open)) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', String(open));
}

/** Collected stickers are shown by default, so hide them to make the album react to collecting. */
export async function hideCollectedStickers(page: Page): Promise<void> {
  await page.locator('mkworld-sticker-album .filter-toggle').click();
  await expect(page.locator('mkworld-sticker-album .filter-toggle input')).not.toBeChecked();
}

export async function runQuickAction(page: Page, action: string): Promise<void> {
  await page.getByTitle('Quick actions').click();
  await page.getByText(action, { exact: true }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
}

/**
 * The map only renders markers inside the current viewport, so tests must start from a marker that
 * is actually in the DOM rather than picking an index and hoping it is on screen.
 */
export async function firstUncollectedMarkerIndex(page: Page): Promise<string> {
  const marker = page.locator('.collectible:not(.collected)').first();
  await marker.waitFor();
  const index = await marker.getAttribute('data-collectible-index');
  expect(index).toBeTruthy();
  return index!;
}

/**
 * 744 markers overlap heavily, so a positional click lands on whichever one is topmost at that
 * point. Dispatching straight at the element is the only way to address a specific marker.
 */
export async function clickMarker(page: Page, index: string): Promise<void> {
  await page.locator(`[data-collectible-index="${index}"]`).dispatchEvent('click');
}

export function marker(page: Page, index: string): Locator {
  return page.locator(`[data-collectible-index="${index}"]`);
}

/** The todo title is the one progress readout that viewport culling cannot skew. */
export async function collectedStickerCount(page: Page): Promise<number> {
  const title = await page.locator('.todo-title').innerText();
  return Number(title.split('/')[0].trim());
}

export function albumStickers(page: Page): Locator {
  return page.locator('mkworld-sticker-album .sticker');
}

export function albumPageDots(page: Page): Locator {
  return page.locator('mkworld-sticker-album span.w-3.h-3.rounded-full');
}

export async function searchAlbum(page: Page, term: string): Promise<number> {
  await page.locator('.sticker-search-input').fill(term);
  // Debounced by STICKER_SEARCH_DEBOUNCE_TIME; a filtered result set is below one full page.
  await expect.poll(() => albumStickers(page).count()).toBeLessThan(STICKERS_PER_PAGE);
  return albumStickers(page).count();
}

/** The last achievement in the todo list, matched on the `current / total` counter in its title. */
export function lastAchievement(page: Page): Locator {
  return page.locator('mkworld-todo-section li').filter({ hasText: '/' }).last();
}

/** Maps a marker's `<type> marker` alt text onto the labels the todo list and header use for it. */
export const COLLECTIBLE_LABELS: Record<string, { todoAlt: string; uncheckAll: string }> = {
  'p-switch': { todoAlt: 'P-Switch', uncheckAll: 'Uncheck all P-Switches' },
  'peach-coin': { todoAlt: 'Peach Medallion', uncheckAll: 'Uncheck all Peach Medallions' },
  'questionmark-panel': { todoAlt: 'Questionmark Panel', uncheckAll: 'Uncheck all ? Panels' },
};

export function todoCollectibleRow(page: Page, todoAlt: string): Locator {
  return page.locator('mkworld-todo-section li.todo-item', {
    has: page.locator(`img[alt="${todoAlt}"]`),
  });
}

/** Reads the `collected / total` counter off one collectible row in the todo list. */
export async function collectedCountForType(page: Page, todoAlt: string): Promise<number> {
  const text = await todoCollectibleRow(page, todoAlt).locator('span.flex-1').innerText();
  return Number(text.split('/')[0].trim());
}

export function albumSticker(page: Page, index: string): Locator {
  return page.locator(`mkworld-sticker-album #sticker-${index}`);
}

export async function albumStickerIndexes(page: Page): Promise<string[]> {
  return albumStickers(page).evaluateAll(nodes =>
    nodes.map(node => node.id.replace('sticker-', ''))
  );
}
