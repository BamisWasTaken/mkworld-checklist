import { computed, effect, inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';
import checklistData from '../../../../public/data/checklist-data.json';
import { ChecklistModel, ChecklistModelState, CollectibleType } from '../models';
import { isPlatformBrowser } from '@angular/common';
import { CONSTANTS } from '../../constants';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class ChecklistDataService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settingsService = inject(SettingsService);

  private readonly checklistModels = signal<ChecklistModel[]>(checklistData);

  private readonly collectibleChecklistModelsOnMap = computed(() => {
    let checklistModels = this.checklistModels();

    checklistModels = checklistModels.filter(
      (checklistModel: ChecklistModel) =>
        checklistModel.collectibleModel &&
        (this.settingsService
          .getShownCollectibleTypes()()
          .includes(checklistModel.collectibleModel.collectibleType) ||
          checklistModel.disappearingFromMap)
    );

    if (this.settingsService.shouldShowCollectedCollectibles()()) {
      return checklistModels;
    }

    return checklistModels.filter(
      (checklistModel: ChecklistModel) =>
        !checklistModel.checked || checklistModel.disappearingFromMap
    );
  });

  private uncollectedPeachCoins = computed(() =>
    this.getUncollectedCollectibles(CollectibleType.PEACH_COIN)
  );
  private uncollectedQuestionMarkPanels = computed(() =>
    this.getUncollectedCollectibles(CollectibleType.QUESTIONMARK_PANEL)
  );
  private uncollectedPSwitches = computed(() =>
    this.getUncollectedCollectibles(CollectibleType.P_SWITCH)
  );

  private readonly checklistModelsWithSticker = computed(() =>
    this.checklistModels().filter((checklistModel: ChecklistModel) => checklistModel.hasSticker)
  );
  private readonly progress = computed(
    () => this.checklistModelsWithSticker().filter((item: ChecklistModel) => item.checked).length
  );
  private readonly total = computed(() => this.checklistModelsWithSticker().length);

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

  getCollectibleChecklistModelsOnMap(): Signal<ChecklistModel[]> {
    return this.collectibleChecklistModelsOnMap;
  }

  updateChecklistModelChecked(checklistModelToUpdate: ChecklistModel): void {
    checklistModelToUpdate.checked = !checklistModelToUpdate.checked;
    if (checklistModelToUpdate.checked && !checklistModelToUpdate.disappearingFromStickerAlbum) {
      checklistModelToUpdate.disappearingFromStickerAlbum = true;
      checklistModelToUpdate.disappearingFromMap =
        !this.settingsService.shouldShowCollectedCollectibles()();
      setTimeout(() => {
        this.checklistModels.update((checklistModels: ChecklistModel[]) =>
          checklistModels.map((checklistModel: ChecklistModel) =>
            checklistModel.index === checklistModelToUpdate.index
              ? {
                  ...checklistModel,
                  disappearingFromStickerAlbum: false,
                  disappearingFromMap: false,
                }
              : checklistModel
          )
        );
      }, 200);
    }

    this.checklistModels.update((checklistModels: ChecklistModel[]) =>
      checklistModels.map((checklistModel: ChecklistModel) =>
        checklistModel.index === checklistModelToUpdate.index
          ? checklistModelToUpdate
          : checklistModel
      )
    );
  }

  addDisappearingChecklistModels(
    checklistModelsToDisappear: ChecklistModel[],
    disappearingFromStickerAlbum: boolean,
    disappearingFromMap: boolean
  ): void {
    const checklistModelIndexesToDisappear = checklistModelsToDisappear.map(
      (checklistModel: ChecklistModel) => checklistModel.index
    );
    this.checklistModels.update((checklistModels: ChecklistModel[]) =>
      checklistModels.map((checklistModel: ChecklistModel) =>
        checklistModelIndexesToDisappear.includes(checklistModel.index)
          ? {
              ...checklistModel,
              disappearingFromStickerAlbum,
              disappearingFromMap,
            }
          : checklistModel
      )
    );
    setTimeout(() => {
      this.checklistModels.update((checklistModels: ChecklistModel[]) =>
        checklistModels.map((checklistModel: ChecklistModel) =>
          checklistModelIndexesToDisappear.includes(checklistModel.index)
            ? {
                ...checklistModel,
                disappearingFromStickerAlbum: false,
                disappearingFromMap: false,
              }
            : checklistModel
        )
      );
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

  getProgress(): Signal<number> {
    return this.progress;
  }

  getTotal(): Signal<number> {
    return this.total;
  }

  importChecklistModels(checklistModelStates: ChecklistModelState[]): void {
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
      this.importChecklistModels(checklistModelStates);
    }
  }
}
