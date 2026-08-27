import { createChecklistModel } from '../../testing/fixtures';
import { TodoItem } from './models/todo-item';
import { groupTodoItems, interpolateTitleColor, markAppearingItems } from './todo-section-items';

/** The component prefixes keys with `STICKERS.`; the helper only needs a deterministic mapping. */
const identity = (instructions: string) => instructions;

function todoItem(instructions: string, amountUnchecked = 1): TodoItem {
  return {
    checklistModel: createChecklistModel({ instructions }),
    amountUnchecked,
    appearing: false,
  };
}

describe('interpolateTitleColor', () => {
  it('should be white at no progress', () => {
    expect(interpolateTitleColor(0)).toBe('#ffffff');
  });

  it('should be gold at full progress', () => {
    expect(interpolateTitleColor(100)).toBe('#fbbf24');
    expect(interpolateTitleColor(120)).toBe('#fbbf24');
  });

  it('should interpolate halfway between white and gold', () => {
    // r: 255 + (251 - 255) * 0.5 = 253, g: 255 + (191 - 255) * 0.5 = 223, b: 255 + (36 - 255) * 0.5
    expect(interpolateTitleColor(50)).toBe('rgb(253, 223, 146)');
  });

  it('should stay closer to white early on', () => {
    expect(interpolateTitleColor(1)).toBe('rgb(255, 254, 253)');
  });
});

describe('groupTodoItems', () => {
  it('should collapse models that share an instruction into one counted row', () => {
    const items = groupTodoItems(
      [
        createChecklistModel({ index: 1, instructions: 'COLLECT_COINS' }),
        createChecklistModel({ index: 2, instructions: 'COLLECT_COINS' }),
        createChecklistModel({ index: 3, instructions: 'COLLECT_COINS' }),
      ],
      identity
    );

    expect(items).toHaveLength(1);
    expect(items[0].amountUnchecked).toBe(3);
  });

  it('should keep distinct instructions apart', () => {
    const items = groupTodoItems(
      [
        createChecklistModel({ index: 1, instructions: 'B_TASK' }),
        createChecklistModel({ index: 2, instructions: 'A_TASK' }),
      ],
      identity
    );

    expect(items).toHaveLength(2);
    expect(items.every((item: TodoItem) => item.amountUnchecked === 1)).toBe(true);
  });

  it('should group on the translated text, not the raw key', () => {
    const items = groupTodoItems(
      [
        createChecklistModel({ index: 1, instructions: 'KEY_A' }),
        createChecklistModel({ index: 2, instructions: 'KEY_B' }),
      ],
      () => 'Collect 40 coins'
    );

    expect(items).toHaveLength(1);
    expect(items[0].amountUnchecked).toBe(2);
  });

  it('should drop milestone rows, which belong to the achievements section', () => {
    const items = groupTodoItems(
      [
        createChecklistModel({ index: 1, instructions: 'SHARED.MILESTONE_REACHED_INSTRUCTIONS' }),
        createChecklistModel({ index: 2, instructions: 'REAL_TASK' }),
      ],
      identity
    );

    expect(items).toHaveLength(1);
    expect(items[0].checklistModel.instructions).toBe('REAL_TASK');
  });

  it('should sort rows by their translated text', () => {
    const items = groupTodoItems(
      [
        createChecklistModel({ index: 1, instructions: 'Charlie' }),
        createChecklistModel({ index: 2, instructions: 'alpha' }),
        createChecklistModel({ index: 3, instructions: 'Bravo' }),
      ],
      identity
    );

    expect(items.map((item: TodoItem) => item.checklistModel.instructions)).toEqual([
      'alpha',
      'Bravo',
      'Charlie',
    ]);
  });

  it('should store the translated text on the row it returns', () => {
    const items = groupTodoItems(
      [createChecklistModel({ instructions: 'RAW_KEY' })],
      () => 'Translated'
    );

    expect(items[0].checklistModel.instructions).toBe('Translated');
    // Rows start settled; only markAppearingItems may flag one as new.
    expect(items[0].appearing).toBe(false);
  });

  it('should return nothing for an empty list', () => {
    expect(groupTodoItems([], identity)).toEqual([]);
  });
});

describe('markAppearingItems', () => {
  it('should flag rows that were not there before', () => {
    const items = markAppearingItems([todoItem('A'), todoItem('B')], [todoItem('A')]);

    expect(items.find(item => item.checklistModel.instructions === 'B')!.appearing).toBe(true);
    expect(items.find(item => item.checklistModel.instructions === 'A')!.appearing).toBe(false);
  });

  it('should leave every row alone when the count did not change', () => {
    // A row that only moved must not re-animate, so an equal-length render is skipped entirely.
    const items = markAppearingItems(
      [todoItem('B'), todoItem('C')],
      [todoItem('A'), todoItem('B')]
    );

    expect(items.some((item: TodoItem) => item.appearing)).toBe(false);
  });

  it('should flag everything on the first render', () => {
    const items = markAppearingItems([todoItem('A'), todoItem('B')], []);

    expect(items.every((item: TodoItem) => item.appearing)).toBe(true);
  });

  it('should flag nothing when rows were only removed', () => {
    const items = markAppearingItems([todoItem('A')], [todoItem('A'), todoItem('B')]);

    expect(items[0].appearing).toBe(false);
  });
});
