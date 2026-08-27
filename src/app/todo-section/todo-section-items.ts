import { ChecklistModel } from '../core/models';
import { TodoItem } from './models/todo-item';

/** Milestone rows live in the achievements section, so they never become "other" todo items. */
const MILESTONE_INSTRUCTIONS = 'SHARED.MILESTONE_REACHED_INSTRUCTIONS';

const TITLE_COLOR_EMPTY = '#ffffff';
const TITLE_COLOR_COMPLETE = '#fbbf24';

const WHITE = { r: 255, g: 255, b: 255 };
const BRIGHT_GOLD = { r: 251, g: 191, b: 36 };

/** Fades the todo title from white toward gold as the collection fills up. */
export function interpolateTitleColor(progressPercentage: number): string {
  if (progressPercentage === 0) {
    return TITLE_COLOR_EMPTY;
  }
  if (progressPercentage >= 100) {
    return TITLE_COLOR_COMPLETE;
  }

  const factor = progressPercentage / 100;
  const channel = (from: number, to: number) => Math.round(from + (to - from) * factor);

  return `rgb(${channel(WHITE.r, BRIGHT_GOLD.r)}, ${channel(WHITE.g, BRIGHT_GOLD.g)}, ${channel(
    WHITE.b,
    BRIGHT_GOLD.b
  )})`;
}

/**
 * Collapses models that share an instruction into one row carrying a count, so "collect 40 coins
 * in X" appears once rather than forty times. Instructions are translated first because the raw
 * i18n keys of two identical tasks differ per sticker.
 */
export function groupTodoItems(
  checklistModels: ChecklistModel[],
  translate: (instructions: string) => string
): TodoItem[] {
  const todoItems: TodoItem[] = [];

  for (const checklistModel of checklistModels) {
    if (checklistModel.instructions === MILESTONE_INSTRUCTIONS) {
      continue;
    }

    const translatedChecklistModel = {
      ...checklistModel,
      instructions: translate(checklistModel.instructions),
    };
    const foundTodoItem = todoItems.find(
      (todoItem: TodoItem) =>
        todoItem.checklistModel.instructions === translatedChecklistModel.instructions
    );

    if (foundTodoItem) {
      foundTodoItem.amountUnchecked++;
    } else {
      todoItems.push({
        checklistModel: translatedChecklistModel,
        amountUnchecked: 1,
        appearing: false,
      });
    }
  }

  return todoItems.sort((a: TodoItem, b: TodoItem) =>
    a.checklistModel.instructions.localeCompare(b.checklistModel.instructions)
  );
}

/**
 * Flags rows that were not in the previous render so they can animate in. Only runs when the row
 * count changed, so a row that merely shifted position does not re-animate.
 */
export function markAppearingItems(
  todoItems: TodoItem[],
  previousTodoItems: TodoItem[]
): TodoItem[] {
  if (previousTodoItems.length === todoItems.length) {
    return todoItems;
  }

  for (const todoItem of todoItems) {
    todoItem.appearing = !previousTodoItems.some(
      (previousTodoItem: TodoItem) =>
        previousTodoItem.checklistModel.instructions === todoItem.checklistModel.instructions
    );
  }

  return todoItems;
}
