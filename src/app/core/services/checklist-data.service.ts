import { computed, effect, inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';
import checklistData from '../../../../public/data/checklist-data.json';
import { ChecklistModel, ChecklistModelState, CollectibleType } from '../models';
import { isPlatformBrowser } from '@angular/common';
import { CONSTANTS } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class ChecklistDataService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly checklistModels = signal<ChecklistModel[]>(checklistData);

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
    if (isPlatformBrowser(this.platformId)) {
      this.loadChecklistModelsFromStorage();

      effect(() => {
        localStorage.setItem(
          CONSTANTS.STORAGE_KEY_CHECKLIST_MODELS,
          JSON.stringify(
            this.checklistModels().map(
              (checklistModel: ChecklistModel) =>
                ({
                  index: checklistModel.index,
                  checked: checklistModel.checked,
                }) as ChecklistModelState
            )
          )
        );
      });
    }
  }

  getChecklistModels(): Signal<ChecklistModel[]> {
    return this.checklistModels.asReadonly();
  }

  updateChecklistModelChecked(checklistModelToUpdate: ChecklistModel): void {
    checklistModelToUpdate.checked = !checklistModelToUpdate.checked;
    if (checklistModelToUpdate.checked && !checklistModelToUpdate.disappearing) {
      this.addDisappearingChecklistModel(checklistModelToUpdate);
    }

    this.checklistModels.update((checklistModels: ChecklistModel[]) =>
      checklistModels.map((checklistModel: ChecklistModel) =>
        checklistModel.index === checklistModelToUpdate.index
          ? checklistModelToUpdate
          : checklistModel
      )
    );
  }

  addDisappearingChecklistModel(disappearingChecklistModel: ChecklistModel): void {
    disappearingChecklistModel.disappearing = true;
    setTimeout(() => {
      this.checklistModels.update((checklistModels: ChecklistModel[]) =>
        checklistModels.map((checklistModel: ChecklistModel) =>
          checklistModel.index === disappearingChecklistModel.index
            ? { ...checklistModel, disappearing: false }
            : checklistModel
        )
      );
    }, 200);
  }

  addDisappearingChecklistModels(checklistModels: ChecklistModel[]): void {
    checklistModels.forEach((checklistModel: ChecklistModel) => {
      this.addDisappearingChecklistModel(checklistModel);
    });
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

  private loadChecklistModelsFromStorage(): void {
    const storedChecklistModels = localStorage.getItem(CONSTANTS.STORAGE_KEY_CHECKLIST_MODELS);
    if (storedChecklistModels) {
      const checklistModelStates: ChecklistModelState[] = JSON.parse(storedChecklistModels);
      this.checklistModels.update((checklistModels: ChecklistModel[]) =>
        checklistModels.map((checklistModel: ChecklistModel) => {
          const checklistModelState = checklistModelStates.find(
            (checklistModelState: ChecklistModelState) =>
              checklistModelState.index === checklistModel.index
          );
          return {
            ...checklistModel,
            checked: checklistModelState?.checked ?? checklistModel.checked,
          };
        })
      );
    }
  }
}
