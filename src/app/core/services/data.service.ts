import { Injectable, signal, WritableSignal } from '@angular/core';
import { ChecklistModel } from '../models';
import { checklistData } from '../data/checklist-data';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private checklistModels = signal<ChecklistModel[]>([]);
  private disappearingChecklistModels = signal<Set<ChecklistModel>>(new Set());

  constructor() {
    this.checklistModels.set(checklistData);
  }

  getChecklistModels(): WritableSignal<ChecklistModel[]> {
    return this.checklistModels;
  }

  getDisappearingChecklistModels(): WritableSignal<Set<ChecklistModel>> {
    return this.disappearingChecklistModels;
  }

  updateChecklistModelChecked(checklistModelToUpdate: ChecklistModel): void {
    checklistModelToUpdate.checked = !checklistModelToUpdate.checked;

    this.checklistModels.update((checklistModels: ChecklistModel[]) =>
      checklistModels.map((checklistModel: ChecklistModel) =>
        checklistModel.index === checklistModelToUpdate.index
          ? checklistModelToUpdate
          : checklistModel
      )
    );

    if (
      checklistModelToUpdate.checked &&
      !this.disappearingChecklistModels().has(checklistModelToUpdate)
    ) {
      const newSet = new Set(this.disappearingChecklistModels());
      newSet.add(checklistModelToUpdate);
      this.disappearingChecklistModels.set(newSet);
      setTimeout(() => {
        const afterSet = new Set(this.disappearingChecklistModels());
        afterSet.delete(checklistModelToUpdate);
        this.disappearingChecklistModels.set(afterSet);
      }, 200);
    }
  }
}
