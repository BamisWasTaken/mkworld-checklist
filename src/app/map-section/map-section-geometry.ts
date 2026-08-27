import { CONSTANTS } from '../constants';
import { Bounds } from './models';

export interface PanTransform {
  x: number;
  y: number;
  scale: number;
}

/** Only the fields the geometry reads, so tests do not have to build whole DOMRects. */
export interface SizeLike {
  width: number;
  height: number;
}

/** Normalizes the 1-13 zoom range onto 0-1 before easing it. */
const COLLECTIBLE_SCALE_ZOOM_RANGE = 12;
const COLLECTIBLE_SCALE_MINIMUM = 0.1;
const COLLECTIBLE_SCALE_FALLOFF = 0.9;
const COLLECTIBLE_SCALE_EASING = 0.3;

const MOBILE_TOOLTIP_SHRINK = 1.5;

/**
 * The slice of the map currently on screen, in percentages of the unscaled map, padded by
 * {@link CONSTANTS.QUAD_TREE_VISIBLE_BUFFER} so markers exist before they scroll into view.
 */
export function calculateVisibleBounds(
  mapSize: SizeLike,
  sectionSize: SizeLike,
  transform: PanTransform
): Bounds {
  const unscaledMapWidth = mapSize.width / transform.scale;
  const unscaledMapHeight = mapSize.height / transform.scale;

  const visibleLeft = -transform.x / transform.scale;
  const visibleTop = -transform.y / transform.scale;
  const visibleRight = visibleLeft + sectionSize.width / transform.scale;
  const visibleBottom = visibleTop + sectionSize.height / transform.scale;

  return {
    left: (visibleLeft / unscaledMapWidth) * 100 - CONSTANTS.QUAD_TREE_VISIBLE_BUFFER,
    top: (visibleTop / unscaledMapHeight) * 100 - CONSTANTS.QUAD_TREE_VISIBLE_BUFFER,
    right: (visibleRight / unscaledMapWidth) * 100 + CONSTANTS.QUAD_TREE_VISIBLE_BUFFER,
    bottom: (visibleBottom / unscaledMapHeight) * 100 + CONSTANTS.QUAD_TREE_VISIBLE_BUFFER,
  };
}

/** Markers shrink as the map is zoomed in so they never swamp the terrain underneath. */
export function calculateCollectibleScale(panzoomScale: number): number {
  const normalizedScale = (panzoomScale - 1) / COLLECTIBLE_SCALE_ZOOM_RANGE;
  return Math.max(
    COLLECTIBLE_SCALE_MINIMUM,
    1 - COLLECTIBLE_SCALE_FALLOFF * Math.pow(normalizedScale, COLLECTIBLE_SCALE_EASING)
  );
}

/** Counter-scales the tooltip so it keeps a constant on-screen size at any zoom. */
export function calculateTooltipScale(panzoomScale: number, isMobile: boolean): number {
  return 1 / panzoomScale / (isMobile ? MOBILE_TOOLTIP_SHRINK : 1);
}
