import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';
import { CONSTANTS } from '../../constants';
import { CollectibleType, Settings } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly showCollectedStickers = signal(true);
  private readonly showCollectedCollectibles = signal(false);

  private readonly shownCollectibleTypes = signal<CollectibleType[]>([
    CollectibleType.PEACH_COIN,
    CollectibleType.P_SWITCH,
    CollectibleType.QUESTIONMARK_PANEL,
  ]);
  private readonly showPeachCoins = computed(() =>
    this.shownCollectibleTypes().includes(CollectibleType.PEACH_COIN)
  );
  private readonly showQuestionMarkPanels = computed(() =>
    this.shownCollectibleTypes().includes(CollectibleType.QUESTIONMARK_PANEL)
  );
  private readonly showPSwitches = computed(() =>
    this.shownCollectibleTypes().includes(CollectibleType.P_SWITCH)
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSettingsFromStorage();

      effect(() => {
        const settings: Settings = {
          showCollectedStickers: this.showCollectedStickers(),
          showCollectedCollectibles: this.showCollectedCollectibles(),
          shownCollectibleTypes: this.shownCollectibleTypes(),
        };
        localStorage.setItem(CONSTANTS.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      });
    }
  }

  shouldShowCollectedStickers(): Signal<boolean> {
    return this.showCollectedStickers.asReadonly();
  }

  toggleShowCollectedStickers() {
    this.showCollectedStickers.update((value: boolean) => !value);
  }

  shouldShowCollectedCollectibles(): Signal<boolean> {
    return this.showCollectedCollectibles.asReadonly();
  }

  toggleShowCollectedCollectibles() {
    this.showCollectedCollectibles.update((value: boolean) => !value);
  }

  getShownCollectibleTypes(): Signal<CollectibleType[]> {
    return this.shownCollectibleTypes.asReadonly();
  }

  shouldShowPeachCoins(): Signal<boolean> {
    return this.showPeachCoins;
  }
  shouldShowQuestionMarkPanels(): Signal<boolean> {
    return this.showQuestionMarkPanels;
  }
  shouldShowPSwitches(): Signal<boolean> {
    return this.showPSwitches;
  }

  toggleShowCollectibleType(collectibleType: CollectibleType) {
    this.shownCollectibleTypes.update((shownCollectibleTypes: CollectibleType[]) => {
      if (shownCollectibleTypes.includes(collectibleType)) {
        return shownCollectibleTypes.filter((type: CollectibleType) => type !== collectibleType);
      }
      return [...shownCollectibleTypes, collectibleType];
    });
  }

  private loadSettingsFromStorage(): void {
    const storedSettings = localStorage.getItem(CONSTANTS.STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      const settings: Settings = JSON.parse(storedSettings);
      if (settings.showCollectedStickers !== undefined) {
        this.showCollectedStickers.set(settings.showCollectedStickers);
      }
      if (settings.showCollectedCollectibles !== undefined) {
        this.showCollectedCollectibles.set(settings.showCollectedCollectibles);
      }
      if (settings.shownCollectibleTypes !== undefined) {
        this.shownCollectibleTypes.set(settings.shownCollectibleTypes);
      }
    }
  }
}
