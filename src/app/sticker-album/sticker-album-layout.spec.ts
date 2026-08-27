import { CONSTANTS } from '../constants';
import { PageAnimationDirection } from './models';
import {
  calculateEntryOffset,
  calculateFlipDelta,
  calculateMapFocus,
  calculateTooltipAnchor,
  resolveDragIntent,
  resolveNextPage,
  resolvePageTransition,
  resolvePreviousPage,
  shouldPositionTooltipAbove,
} from './sticker-album-layout';

const THRESHOLD = CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD;

describe('resolveDragIntent', () => {
  it('should page forward on a leftward drag past the threshold', () => {
    expect(resolveDragIntent(-THRESHOLD, 0)).toBe('next');
  });

  it('should page back on a rightward drag past the threshold', () => {
    expect(resolveDragIntent(THRESHOLD, 0)).toBe('prev');
  });

  it('should treat a drag exactly at the threshold as a swipe', () => {
    expect(resolveDragIntent(THRESHOLD, 0)).not.toBeNull();
    expect(resolveDragIntent(THRESHOLD - 1, 0)).toBeNull();
  });

  it('should ignore a vertical-dominant drag', () => {
    expect(resolveDragIntent(THRESHOLD, THRESHOLD + 1)).toBeNull();
  });

  it('should ignore a drag that is equally horizontal and vertical', () => {
    expect(resolveDragIntent(THRESHOLD, THRESHOLD)).toBeNull();
  });

  it('should ignore a drag that did not move', () => {
    expect(resolveDragIntent(0, 0)).toBeNull();
  });
});

describe('resolvePreviousPage', () => {
  it('should step back one page', () => {
    expect(resolvePreviousPage(2, 5)).toEqual({ page: 1, animate: true });
  });

  it('should wrap to the last page without animating', () => {
    expect(resolvePreviousPage(0, 5)).toEqual({ page: 4, animate: false });
  });

  it('should refuse to page when there is only one page', () => {
    expect(resolvePreviousPage(0, 1)).toBeNull();
  });

  it('should refuse to page when there are no pages', () => {
    expect(resolvePreviousPage(0, 0)).toBeNull();
  });
});

describe('resolveNextPage', () => {
  it('should step forward one page', () => {
    expect(resolveNextPage(2, 5)).toEqual({ page: 3, animate: true });
  });

  it('should wrap to the first page without animating', () => {
    expect(resolveNextPage(4, 5)).toEqual({ page: 0, animate: false });
  });

  it('should refuse to page when there is only one page', () => {
    expect(resolveNextPage(0, 1)).toBeNull();
  });
});

describe('resolvePageTransition', () => {
  it('should slide left when moving to a later page', () => {
    expect(resolvePageTransition(0, 1, true)).toEqual({
      direction: PageAnimationDirection.LEFT,
      translateXOut: -20,
    });
  });

  it('should slide right when moving to an earlier page', () => {
    expect(resolvePageTransition(3, 1, true)).toEqual({
      direction: PageAnimationDirection.RIGHT,
      translateXOut: 20,
    });
  });

  it('should slide right when the page does not actually change', () => {
    expect(resolvePageTransition(2, 2, true).direction).toBe(PageAnimationDirection.RIGHT);
  });

  it('should keep the direction but drop the distance when not animating', () => {
    expect(resolvePageTransition(0, 4, false)).toEqual({
      direction: PageAnimationDirection.LEFT,
      translateXOut: -0,
    });
    expect(resolvePageTransition(4, 0, false).translateXOut).toBe(0);
  });
});

describe('shouldPositionTooltipAbove', () => {
  it('should place the tooltip below stickers on the first row', () => {
    expect(shouldPositionTooltipAbove(0, 8)).toBe(false);
    expect(shouldPositionTooltipAbove(7, 8)).toBe(false);
  });

  it('should place the tooltip above stickers from the second row on', () => {
    expect(shouldPositionTooltipAbove(8, 8)).toBe(true);
    expect(shouldPositionTooltipAbove(31, 8)).toBe(true);
  });

  it('should follow the mobile row width', () => {
    expect(shouldPositionTooltipAbove(4, 5)).toBe(false);
    expect(shouldPositionTooltipAbove(5, 5)).toBe(true);
  });
});

describe('calculateTooltipAnchor', () => {
  const rect = { left: 100, top: 40, right: 160, bottom: 90, width: 60 };

  it('should anchor to the top edge when positioned above', () => {
    expect(calculateTooltipAnchor(rect, true)).toEqual({ x: 130, y: 40 });
  });

  it('should anchor to the bottom edge when positioned below', () => {
    expect(calculateTooltipAnchor(rect, false)).toEqual({ x: 130, y: 90 });
  });
});

describe('calculateFlipDelta', () => {
  it('should return the offset that puts an element back where it was', () => {
    expect(calculateFlipDelta({ left: 100, top: 50 }, { left: 130, top: 20 })).toEqual({
      x: -30,
      y: 30,
    });
  });

  it('should return no offset when nothing moved', () => {
    expect(calculateFlipDelta({ left: 10, top: 10 }, { left: 10, top: 10 })).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('calculateEntryOffset', () => {
  const desktop = {
    stickersPerRow: 8,
    stickersPerColumn: 4,
    pageWidth: 800,
    offsetColumns: 8,
  };

  it('should offset a full incoming row by the whole page width', () => {
    // Last row, 8 new stickers in it: 8 - 8 * (4 - 4) = 8, which is not below the 8 columns.
    expect(calculateEntryOffset({ ...desktop, positionOnPage: 24, newStickersAtPageEnd: 8 })).toBe(
      800
    );
  });

  it('should offset a partial incoming row by only its own share', () => {
    // 3 new stickers in the last row: (800 / 8) * 3.
    expect(calculateEntryOffset({ ...desktop, positionOnPage: 29, newStickersAtPageEnd: 3 })).toBe(
      300
    );
  });

  it('should scale down rows above the last one', () => {
    // Row 3 of 4 with 10 new stickers at the end: 10 - 8 * (4 - 3) = 2.
    expect(calculateEntryOffset({ ...desktop, positionOnPage: 16, newStickersAtPageEnd: 10 })).toBe(
      200
    );
  });

  it('should cap the offset at one page width for an over-full row', () => {
    // 12 new stickers in the last row: more than the 8 columns, so the whole page width applies.
    expect(calculateEntryOffset({ ...desktop, positionOnPage: 24, newStickersAtPageEnd: 12 })).toBe(
      800
    );
  });

  it('should divide by the offset columns rather than the row width', () => {
    // Documents the mismatch on mobile: 5 stickers per row, still spaced against 8 columns.
    const mobile = {
      positionOnPage: 20,
      stickersPerRow: 5,
      stickersPerColumn: 5,
      newStickersAtPageEnd: 5,
      pageWidth: 400,
      offsetColumns: 8,
    };
    expect(calculateEntryOffset(mobile)).toBe((400 / 8) * 5);
  });
});

describe('calculateMapFocus', () => {
  it('should return no offset for the calibration point', () => {
    expect(calculateMapFocus(25, 25)).toEqual({ x: 0, y: 0 });
  });

  it('should scale a percentage into map pixels', () => {
    expect(calculateMapFocus(50, 50)).toEqual({
      x: (1024 / 100) * 50,
      y: (1281 / 100) * 50,
    });
  });

  it('should go negative above and left of the calibration point', () => {
    const focus = calculateMapFocus(0, 0);
    expect(focus.x).toBeLessThan(0);
    expect(focus.y).toBeLessThan(0);
  });
});
