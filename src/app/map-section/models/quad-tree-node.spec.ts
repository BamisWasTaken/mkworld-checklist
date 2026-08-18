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
