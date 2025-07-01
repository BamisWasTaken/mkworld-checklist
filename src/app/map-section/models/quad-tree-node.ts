import { CONSTANTS } from '../../constants';
import { Bounds } from './bounds';
import { QuadTreeCollectible } from './quad-tree-collectible';

export class QuadTreeNode {
  bounds: Bounds;
  collectibles: QuadTreeCollectible[] = [];
  children: QuadTreeNode[] = [];

  constructor(bounds: Bounds) {
    this.bounds = bounds;
  }

  split(): void {
    const subWidth = (this.bounds.right - this.bounds.left) / 2;
    const subHeight = (this.bounds.bottom - this.bounds.top) / 2;

    this.children = [
      new QuadTreeNode({
        left: this.bounds.left,
        top: this.bounds.top,
        right: this.bounds.left + subWidth,
        bottom: this.bounds.top + subHeight,
      }),
      new QuadTreeNode({
        left: this.bounds.left + subWidth,
        top: this.bounds.top,
        right: this.bounds.right,
        bottom: this.bounds.top + subHeight,
      }),
      new QuadTreeNode({
        left: this.bounds.left,
        top: this.bounds.top + subHeight,
        right: this.bounds.left + subWidth,
        bottom: this.bounds.bottom,
      }),
      new QuadTreeNode({
        left: this.bounds.left + subWidth,
        top: this.bounds.top + subHeight,
        right: this.bounds.right,
        bottom: this.bounds.bottom,
      }),
    ];
  }

  getIndex(collectible: QuadTreeCollectible): number {
    const x = collectible.xPercentage;
    const y = collectible.yPercentage;
    const verticalMidpoint = this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
    const horizontalMidpoint = this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;

    // Determine which quadrant the collectible belongs to
    // Use inclusive boundaries to ensure every collectible fits somewhere
    const isTop = y <= horizontalMidpoint;
    const isLeft = x <= verticalMidpoint;

    if (isLeft) {
      return isTop ? 0 : 2; // top-left or bottom-left
    } else {
      return isTop ? 1 : 3; // top-right or bottom-right
    }
  }

  insert(collectible: QuadTreeCollectible): void {
    if (this.children.length > 0) {
      const index = this.getIndex(collectible);
      this.children[index].insert(collectible);
      return;
    }

    this.collectibles.push(collectible);

    if (this.collectibles.length > CONSTANTS.QUAD_TREE_MAX_OBJECTS && this.children.length === 0) {
      this.split();

      for (const item of this.collectibles) {
        const index = this.getIndex(item);
        this.children[index].insert(item);
      }
      this.collectibles = [];
    }
  }

  retrieve(bounds: Bounds): number[] {
    const returnObjects: number[] = [];

    if (!this.intersects(bounds)) {
      return returnObjects;
    }

    for (const collectible of this.collectibles) {
      const x = collectible.xPercentage;
      const y = collectible.yPercentage;

      if (x > bounds.left && x < bounds.right && y > bounds.top && y < bounds.bottom) {
        returnObjects.push(collectible.index);
      }
    }

    for (const child of this.children) {
      returnObjects.push(...child.retrieve(bounds));
    }

    return returnObjects;
  }

  private intersects(bounds: Bounds): boolean {
    return !(
      bounds.left > this.bounds.right ||
      bounds.right < this.bounds.left ||
      bounds.top > this.bounds.bottom ||
      bounds.bottom < this.bounds.top
    );
  }
}
