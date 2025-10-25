import { Component, inject, input, signal, computed } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ChecklistDataService, SettingsService } from '../../core/services';
import { ChecklistModel, CollectibleType, Map } from '../../core/models';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'mkworld-settings',
  imports: [TranslatePipe, NgOptimizedImage],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly settingsService = inject(SettingsService);
  private readonly checklistDataService = inject(ChecklistDataService);

  readonly visibleCollectibleChecklistModels = input.required<ChecklistModel[]>();

  readonly CollectibleType = CollectibleType;

  readonly showCollectedCollectibles = this.settingsService.shouldShowCollectedCollectibles();
  readonly shownCollectibleTypes = this.settingsService.getShownCollectibleTypes();
  readonly showPeachCoins = this.settingsService.shouldShowPeachCoins();
  readonly showQuestionMarkPanels = this.settingsService.shouldShowQuestionMarkPanels();
  readonly showPSwitches = this.settingsService.shouldShowPSwitches();
  readonly map = this.settingsService.getMap();
  readonly useUpscaledMap = computed(() => this.map() === Map.UPSCALED_MAP);

  readonly isSettingsOpen = signal(false);

  toggleSettings(): void {
    this.isSettingsOpen.update((open: boolean) => !open);
  }

  toggleShowCollected(): void {
    if (this.showCollectedCollectibles()) {
      this.checklistDataService.addDisappearingChecklistModels(
        this.visibleCollectibleChecklistModels().filter(
          (checklistModel: ChecklistModel) => checklistModel.checked
        ),
        false,
        true
      );
    }
    this.settingsService.toggleShowCollectedCollectibles();
  }

  toggleShowCollectibleType(collectibleType: CollectibleType): void {
    if (this.shownCollectibleTypes().includes(collectibleType)) {
      this.checklistDataService.addDisappearingChecklistModels(
        this.visibleCollectibleChecklistModels().filter(
          (checklistModel: ChecklistModel) =>
            checklistModel.collectibleModel?.collectibleType === collectibleType
        ),
        false,
        true
      );
    }
    this.settingsService.toggleShowCollectibleType(collectibleType);
  }

  toggleUpscaledMap(): void {
    this.settingsService.setMap(
      this.map() === Map.UPSCALED_MAP ? Map.INGAME_MAP : Map.UPSCALED_MAP
    );
  }
}
