import { Injectable, signal, WritableSignal } from '@angular/core';
import { ChecklistModel } from '../models';
import data from '../../../../public/data/checklist-data.json';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private checklistModels = signal<ChecklistModel[]>([]);
  private disappearingChecklistModels = signal<Set<ChecklistModel>>(new Set());

  constructor() {
    this.checklistModels.set(data);
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
      this.addDisappearingChecklistModel(checklistModelToUpdate);
    }
  }

  addDisappearingChecklistModel(checklistModel: ChecklistModel): void {
    const newSet = new Set(this.disappearingChecklistModels());
    newSet.add(checklistModel);
    this.disappearingChecklistModels.set(newSet);
    setTimeout(() => {
      const afterSet = new Set(this.disappearingChecklistModels());
      afterSet.delete(checklistModel);
      this.disappearingChecklistModels.set(afterSet);
    }, 200);
  }

  addDisappearingChecklistModels(checklistModels: ChecklistModel[]): void {
    const newSet = new Set(this.disappearingChecklistModels());
    checklistModels.forEach((checklistModel: ChecklistModel) => {
      newSet.add(checklistModel);
    });
    this.disappearingChecklistModels.set(newSet);
    setTimeout(() => {
      const afterSet = new Set(this.disappearingChecklistModels());
      checklistModels.forEach((checklistModel: ChecklistModel) => {
        afterSet.delete(checklistModel);
      });
      this.disappearingChecklistModels.set(afterSet);
    }, 200);
  }
}
