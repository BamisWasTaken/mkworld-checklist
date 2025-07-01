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
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.children = [
      new QuadTreeNode({ x, y, width: subWidth, height: subHeight }),
      new QuadTreeNode({ x: x + subWidth, y, width: subWidth, height: subHeight }),
      new QuadTreeNode({ x, y: y + subHeight, width: subWidth, height: subHeight }),
      new QuadTreeNode({ x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight }),
    ];
  }

  getIndex(collectible: QuadTreeCollectible): number {
    const x = collectible.xPercentage;
    const y = collectible.yPercentage;
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

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

  retrieve(bounds: Bounds): QuadTreeCollectible[] {
    const returnObjects: QuadTreeCollectible[] = [];

    if (!this.intersects(bounds)) {
      return returnObjects;
    }

    for (const collectible of this.collectibles) {
      const x = collectible.xPercentage;
      const y = collectible.yPercentage;

      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        returnObjects.push(collectible);
      }
    }

    if (this.children.length > 0) {
      for (const child of this.children) {
        returnObjects.push(...child.retrieve(bounds));
      }
    }

    return returnObjects;
  }

  private intersects(bounds: Bounds): boolean {
    return !(
      bounds.x > this.bounds.x + this.bounds.width ||
      bounds.x + bounds.width < this.bounds.x ||
      bounds.y > this.bounds.y + this.bounds.height ||
      bounds.y + bounds.height < this.bounds.y
    );
  }
}
