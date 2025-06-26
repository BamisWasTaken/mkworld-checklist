import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { ChecklistModel, CollectibleType } from '../models';
import checklistData from '../../../../public/data/checklist-data.json';

@Injectable({
  providedIn: 'root',
})
export class ChecklistDataService {
  private checklistModels = signal<ChecklistModel[]>([]);
  private disappearingChecklistModels = signal<Set<ChecklistModel>>(new Set());

  private uncollectedPeachCoins = computed(() =>
    this.getUncollectedCollectibles(CollectibleType.PEACH_COIN)
  );
  private uncollectedQuestionMarkPanels = computed(() =>
    this.getUncollectedCollectibles(CollectibleType.QUESTIONMARK_PANEL)
  );
  private uncollectedPSwitches = computed(() =>
    this.getUncollectedCollectibles(CollectibleType.P_SWITCH)
  );

  constructor() {
    this.checklistModels.set(checklistData);
  }

  getChecklistModels(): WritableSignal<ChecklistModel[]> {
    return this.checklistModels;
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

  getDisappearingChecklistModels(): WritableSignal<Set<ChecklistModel>> {
    return this.disappearingChecklistModels;
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

  getUncollectedPeachCoins(): Signal<number> {
    return this.uncollectedPeachCoins;
  }

  getUncollectedQuestionMarkPanels(): Signal<number> {
    return this.uncollectedQuestionMarkPanels;
  }

  getUncollectedPSwitches(): Signal<number> {
    return this.uncollectedPSwitches;
  }

  private getUncollectedCollectibles(collectibleType: CollectibleType): number {
    return this.checklistModels().filter(
      (checklistModel: ChecklistModel) =>
        !checklistModel.checked &&
        checklistModel.collectibleModel?.collectibleType === collectibleType
    ).length;
  }
}
