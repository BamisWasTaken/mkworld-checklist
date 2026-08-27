import { CONSTANTS } from '../constants';
import { PageAnimationDirection } from './models';

/** Where a horizontal drag should take the album, or `null` when it does not qualify as a swipe. */
export type DragIntent = 'prev' | 'next' | null;

export interface PageTarget {
  page: number;
  animate: boolean;
}

export interface PageTransition {
  direction: PageAnimationDirection;
  translateXOut: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Only the two fields the layout math reads, so tests do not have to build a whole DOMRect. */
export interface RectLike {
  left: number;
  top: number;
  right?: number;
  bottom?: number;
  width?: number;
}

const PAGE_SLIDE_DISTANCE = 20;

/** Map dimensions the jump-to-collectible offset was calibrated against. */
const MAP_FOCUS_WIDTH = 1024;
const MAP_FOCUS_HEIGHT = 1281;

export function resolveDragIntent(deltaX: number, deltaY: number): DragIntent {
  const dragDistance = Math.abs(deltaX);
  if (dragDistance < CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD || dragDistance <= Math.abs(deltaY)) {
    return null;
  }
  // Stryker disable next-line EqualityOperator: the threshold check above rejects a zero delta,
  // so `> 0` and `>= 0` cannot differ here.
  return deltaX > 0 ? 'prev' : 'next';
}

/** `null` means there is nowhere to go — a single page cannot be paged away from. */
export function resolvePreviousPage(pageNumber: number, pageCount: number): PageTarget | null {
  if (pageCount <= 1) {
    return null;
  }
  // Wrapping to the far end skips the slide, which would otherwise animate the wrong way.
  return pageNumber > 0
    ? { page: pageNumber - 1, animate: true }
    : { page: pageCount - 1, animate: false };
}

export function resolveNextPage(pageNumber: number, pageCount: number): PageTarget | null {
  if (pageCount <= 1) {
    return null;
  }
  return pageNumber < pageCount - 1
    ? { page: pageNumber + 1, animate: true }
    : { page: 0, animate: false };
}

export function resolvePageTransition(
  currentPage: number,
  newPage: number,
  animate: boolean
): PageTransition {
  const direction =
    newPage > currentPage ? PageAnimationDirection.LEFT : PageAnimationDirection.RIGHT;
  const slideDistance = animate ? PAGE_SLIDE_DISTANCE : 0;

  return {
    direction,
    translateXOut: direction === PageAnimationDirection.RIGHT ? slideDistance : -slideDistance,
  };
}

/** Stickers on the top row get their tooltip below them so it stays on screen. */
export function shouldPositionTooltipAbove(indexOnPage: number, stickersPerRow: number): boolean {
  return Math.floor(indexOnPage / stickersPerRow) !== 0;
}

export function calculateTooltipAnchor(rect: RectLike, above: boolean): Point {
  return {
    x: rect.left + (rect.width ?? 0) / 2,
    y: above ? rect.top : (rect.bottom ?? rect.top),
  };
}

/** The "first" half of a FLIP: how far the element has to be pushed back to its old position. */
export function calculateFlipDelta(previousRect: RectLike, currentRect: RectLike): Point {
  return {
    x: previousRect.left - currentRect.left,
    y: previousRect.top - currentRect.top,
  };
}

export interface EntryOffsetInput {
  positionOnPage: number;
  stickersPerRow: number;
  stickersPerColumn: number;
  newStickersAtPageEnd: number;
  pageWidth: number;
  /**
   * Columns the offset is divided into. The album passes 8 (the desktop row width) on every
   * viewport, so a mobile row of 5 is spaced against the wrong divisor — preserved as-is.
   */
  offsetColumns: number;
}

/** How far a sticker arriving at the end of the page starts off to the right before sliding in. */
export function calculateEntryOffset({
  positionOnPage,
  stickersPerRow,
  stickersPerColumn,
  newStickersAtPageEnd,
  pageWidth,
  offsetColumns,
}: EntryOffsetInput): number {
  const currentStickerRow = Math.ceil((positionOnPage + 1) / stickersPerRow);
  const newStickersInRow =
    newStickersAtPageEnd - stickersPerRow * (stickersPerColumn - currentStickerRow);

  // A full row starts a whole page-width out; a partial row only needs to clear its own stickers.
  // Stryker disable next-line EqualityOperator: at exactly `offsetColumns` both branches evaluate
  // to `pageWidth`, so `<` and `<=` are indistinguishable.
  return newStickersInRow < offsetColumns
    ? (pageWidth / offsetColumns) * newStickersInRow
    : pageWidth;
}

/** Panzoom offset that centres the map on a collectible; the caller negates both components. */
export function calculateMapFocus(xPercentage: number, yPercentage: number): Point {
  return {
    x: (MAP_FOCUS_WIDTH / 100) * ((xPercentage - 25) * 2),
    y: (MAP_FOCUS_HEIGHT / 100) * ((yPercentage - 25) * 2),
  };
}
