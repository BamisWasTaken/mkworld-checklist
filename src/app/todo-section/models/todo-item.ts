import { ChecklistModel } from '../../core/models';

export interface TodoItem {
  checklistModel: ChecklistModel;
  amountUnchecked: number;
  appearing: boolean;
}
