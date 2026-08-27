import { CONSTANTS } from '../../constants';
import { Bounds } from './bounds';
import { QuadTreeNode } from './quad-tree-node';

describe('QuadTreeNode', () => {
  it('should return inserted collectibles that sit inside the query bounds', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });
    tree.insert({ index: 1, xPercentage: 10, yPercentage: 10 });
    tree.insert({ index: 2, xPercentage: 90, yPercentage: 90 });

    expect(tree.retrieve({ left: 0, top: 0, right: 50, bottom: 50 })).toEqual([1]);
    expect(tree.retrieve({ left: 50, top: 50, right: 100, bottom: 100 })).toEqual([2]);
  });

  it('should split after exceeding the max object count and still retrieve every item', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });
    const count = CONSTANTS.QUAD_TREE_MAX_OBJECTS + 5;

    for (let index = 0; index < count; index++) {
      tree.insert({
        index,
        xPercentage: 10 + (index % 5),
        yPercentage: 10 + Math.floor(index / 5),
      });
    }

    expect(tree.children.length).toBe(4);
    expect(tree.collectibles.length).toBe(0);

    const found = tree.retrieve({ left: 0, top: 0, right: 100, bottom: 100 });
    expect(found.sort((a, b) => a - b)).toEqual([...Array(count).keys()]);
  });

  it('should return nothing when the query does not intersect the node', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 50, bottom: 50 });
    tree.insert({ index: 1, xPercentage: 10, yPercentage: 10 });

    const outside: Bounds = { left: 80, top: 80, right: 100, bottom: 100 };
    expect(tree.retrieve(outside)).toEqual([]);
  });
});

describe('QuadTreeNode.getIndex', () => {
  const tree = () => new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });

  it('should map each corner to its own quadrant', () => {
    const node = tree();

    expect(node.getIndex({ index: 0, xPercentage: 10, yPercentage: 10 })).toBe(0);
    expect(node.getIndex({ index: 1, xPercentage: 90, yPercentage: 10 })).toBe(1);
    expect(node.getIndex({ index: 2, xPercentage: 10, yPercentage: 90 })).toBe(2);
    expect(node.getIndex({ index: 3, xPercentage: 90, yPercentage: 90 })).toBe(3);
  });

  it('should send a collectible exactly on both midpoints to the top-left quadrant', () => {
    // Boundaries are inclusive on the low side so nothing falls between quadrants.
    expect(tree().getIndex({ index: 0, xPercentage: 50, yPercentage: 50 })).toBe(0);
  });

  it('should resolve each midpoint independently', () => {
    const node = tree();

    expect(node.getIndex({ index: 0, xPercentage: 50, yPercentage: 90 })).toBe(2);
    expect(node.getIndex({ index: 1, xPercentage: 90, yPercentage: 50 })).toBe(1);
  });

  it('should follow its own bounds rather than assuming the full map', () => {
    const offset = new QuadTreeNode({ left: 50, top: 50, right: 100, bottom: 100 });

    expect(offset.getIndex({ index: 0, xPercentage: 60, yPercentage: 60 })).toBe(0);
    expect(offset.getIndex({ index: 1, xPercentage: 90, yPercentage: 90 })).toBe(3);
  });
});

describe('QuadTreeNode.retrieve', () => {
  function fullTree(): QuadTreeNode {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });
    tree.insert({ index: 1, xPercentage: 25, yPercentage: 25 });
    tree.insert({ index: 2, xPercentage: 75, yPercentage: 25 });
    tree.insert({ index: 3, xPercentage: 25, yPercentage: 75 });
    tree.insert({ index: 4, xPercentage: 75, yPercentage: 75 });
    return tree;
  }

  it('should collect from every quadrant a query straddles', () => {
    const found = fullTree().retrieve({ left: 20, top: 20, right: 80, bottom: 80 });

    expect(found.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });

  it('should return only the quadrant a narrow query covers', () => {
    expect(fullTree().retrieve({ left: 60, top: 60, right: 90, bottom: 90 })).toEqual([4]);
  });

  it('should exclude a collectible sitting exactly on the query edge', () => {
    // `retrieve` compares strictly, so the buffer in calculateVisibleBounds is what keeps
    // markers on the viewport edge rendered.
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });
    tree.insert({ index: 1, xPercentage: 50, yPercentage: 50 });

    expect(tree.retrieve({ left: 50, top: 50, right: 100, bottom: 100 })).toEqual([]);
    expect(tree.retrieve({ left: 49, top: 49, right: 100, bottom: 100 })).toEqual([1]);
  });

  it('should still find everything after splitting more than once', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });
    const perQuadrant = CONSTANTS.QUAD_TREE_MAX_OBJECTS + 2;
    let index = 0;

    // Enough collectibles in one quadrant to force that child to split in turn.
    for (let i = 0; i < perQuadrant; i++) {
      tree.insert({ index: index++, xPercentage: 1 + i * 0.5, yPercentage: 1 + i * 0.5 });
    }
    for (let i = 0; i < perQuadrant; i++) {
      tree.insert({ index: index++, xPercentage: 60 + i * 0.5, yPercentage: 60 + i * 0.5 });
    }

    expect(tree.children.length).toBe(4);
    expect(tree.children[0].children.length).toBe(4);

    const found = tree.retrieve({ left: 0, top: 0, right: 100, bottom: 100 });
    expect(found.sort((a, b) => a - b)).toEqual([...Array(index).keys()]);
  });

  it('should return nothing from an empty tree', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });

    expect(tree.retrieve({ left: 0, top: 0, right: 100, bottom: 100 })).toEqual([]);
  });

  it('should accept a query that only touches the node bounds', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 50, bottom: 50 });
    tree.insert({ index: 1, xPercentage: 25, yPercentage: 25 });

    // `intersects` is inclusive, so an adjacent viewport still descends into the node.
    expect(tree.retrieve({ left: 50, top: 50, right: 100, bottom: 100 })).toEqual([]);
    expect(tree.retrieve({ left: 51, top: 51, right: 100, bottom: 100 })).toEqual([]);
  });
});

describe('QuadTreeNode.split', () => {
  it('should carve the node into four equal quadrants of its own bounds', () => {
    const tree = new QuadTreeNode({ left: 20, top: 10, right: 60, bottom: 50 });

    tree.split();

    expect(tree.children.map(child => child.bounds)).toEqual([
      { left: 20, top: 10, right: 40, bottom: 30 },
      { left: 40, top: 10, right: 60, bottom: 30 },
      { left: 20, top: 30, right: 40, bottom: 50 },
      { left: 40, top: 30, right: 60, bottom: 50 },
    ]);
  });

  it('should halve each side independently for a non-square node', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 40 });

    tree.split();

    expect(tree.children[0].bounds).toEqual({ left: 0, top: 0, right: 50, bottom: 20 });
    expect(tree.children[3].bounds).toEqual({ left: 50, top: 20, right: 100, bottom: 40 });
  });
});

describe('QuadTreeNode.insert', () => {
  it('should hold collectibles until the max object count is exceeded', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });

    for (let index = 0; index < CONSTANTS.QUAD_TREE_MAX_OBJECTS; index++) {
      tree.insert({ index, xPercentage: 10 + index, yPercentage: 10 + index });
    }

    expect(tree.children).toHaveLength(0);
    expect(tree.collectibles).toHaveLength(CONSTANTS.QUAD_TREE_MAX_OBJECTS);

    tree.insert({ index: 99, xPercentage: 80, yPercentage: 80 });

    expect(tree.children).toHaveLength(4);
    expect(tree.collectibles).toHaveLength(0);
  });
});

describe('QuadTreeNode query edges', () => {
  it('should include only collectibles strictly inside the query bounds', () => {
    const tree = new QuadTreeNode({ left: 0, top: 0, right: 100, bottom: 100 });
    tree.insert({ index: 0, xPercentage: 15, yPercentage: 15 });
    tree.insert({ index: 1, xPercentage: 10, yPercentage: 15 });
    tree.insert({ index: 2, xPercentage: 20, yPercentage: 15 });
    tree.insert({ index: 3, xPercentage: 15, yPercentage: 10 });
    tree.insert({ index: 4, xPercentage: 15, yPercentage: 20 });
    tree.insert({ index: 5, xPercentage: 25, yPercentage: 15 });
    tree.insert({ index: 6, xPercentage: 15, yPercentage: 25 });

    // Every edge is exclusive, which is why calculateVisibleBounds pads the viewport.
    expect(tree.retrieve({ left: 10, top: 10, right: 20, bottom: 20 })).toEqual([0]);
  });
});
