import { CONSTANTS } from '../constants';
import {
  calculateCollectibleScale,
  calculateTooltipScale,
  calculateVisibleBounds,
} from './map-section-geometry';

const BUFFER = CONSTANTS.QUAD_TREE_VISIBLE_BUFFER;

describe('calculateVisibleBounds', () => {
  const map = { width: 1000, height: 1000 };

  it('should cover the whole map plus the buffer when it fits on screen unzoomed', () => {
    const bounds = calculateVisibleBounds(
      map,
      { width: 1000, height: 1000 },
      {
        x: 0,
        y: 0,
        scale: 1,
      }
    );

    expect(bounds).toEqual({
      left: -BUFFER,
      top: -BUFFER,
      right: 100 + BUFFER,
      bottom: 100 + BUFFER,
    });
  });

  it('should narrow to the visible slice when the section is smaller than the map', () => {
    const bounds = calculateVisibleBounds(
      map,
      { width: 500, height: 250 },
      {
        x: 0,
        y: 0,
        scale: 1,
      }
    );

    expect(bounds.right).toBe(50 + BUFFER);
    expect(bounds.bottom).toBe(25 + BUFFER);
  });

  it('should shift the window when the map is panned', () => {
    const bounds = calculateVisibleBounds(
      map,
      { width: 500, height: 500 },
      {
        x: -200,
        y: -100,
        scale: 1,
      }
    );

    expect(bounds.left).toBe(20 - BUFFER);
    expect(bounds.top).toBe(10 - BUFFER);
    expect(bounds.right).toBe(70 + BUFFER);
    expect(bounds.bottom).toBe(60 + BUFFER);
  });

  it('should show a smaller slice of the map as it is zoomed in', () => {
    // A zoomed map element is measured at its scaled size, so both divide out by the scale.
    const zoomed = calculateVisibleBounds(
      { width: 2000, height: 2000 },
      {
        width: 1000,
        height: 1000,
      },
      { x: 0, y: 0, scale: 2 }
    );

    expect(zoomed.right).toBe(50 + BUFFER);
    expect(zoomed.bottom).toBe(50 + BUFFER);
  });

  it('should divide the pan offset by the scale, not multiply by it', () => {
    const bounds = calculateVisibleBounds(
      { width: 2000, height: 2000 },
      { width: 1000, height: 1000 },
      { x: -500, y: -250, scale: 2 }
    );

    expect(bounds.left).toBe(25 - BUFFER);
    expect(bounds.top).toBe(12.5 - BUFFER);
  });

  it('should not produce finite bounds for a map that has not been laid out yet', () => {
    const bounds = calculateVisibleBounds(
      { width: 0, height: 0 },
      { width: 500, height: 500 },
      {
        x: 0,
        y: 0,
        scale: 1,
      }
    );

    expect(Number.isFinite(bounds.right)).toBe(false);
  });
});

describe('calculateCollectibleScale', () => {
  it('should render markers at full size when the map is not zoomed', () => {
    expect(calculateCollectibleScale(1)).toBe(1);
  });

  it('should shrink markers as the map zooms in', () => {
    const atThree = calculateCollectibleScale(3);
    const atEight = calculateCollectibleScale(8);

    expect(atThree).toBeLessThan(1);
    expect(atEight).toBeLessThan(atThree);
  });

  it('should never shrink a marker past the floor', () => {
    expect(calculateCollectibleScale(13)).toBeGreaterThanOrEqual(0.1);
    expect(calculateCollectibleScale(100)).toBe(0.1);
  });
});

describe('calculateTooltipScale', () => {
  it('should counter the map zoom so the tooltip keeps its size', () => {
    expect(calculateTooltipScale(2, false)).toBe(0.5);
    expect(calculateTooltipScale(4, false)).toBe(0.25);
  });

  it('should shrink the tooltip further on mobile', () => {
    expect(calculateTooltipScale(1, true)).toBeCloseTo(1 / 1.5);
    expect(calculateTooltipScale(2, true)).toBeLessThan(calculateTooltipScale(2, false));
  });
});
