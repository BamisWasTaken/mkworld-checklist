import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';
import { CONSTANTS } from '../../constants';
import { CollectibleType, Map, Settings } from '../models';

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

  private readonly map = signal<Map | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSettingsFromStorage();

      effect(() => {
        const settings: Settings = {
          showCollectedStickers: this.showCollectedStickers(),
          showCollectedCollectibles: this.showCollectedCollectibles(),
          shownCollectibleTypes: this.shownCollectibleTypes(),
          map: this.map() ?? Map.UPSCALED_MAP,
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

  toggleShowCollectibleType(collectibleType: CollectibleType) {
    this.shownCollectibleTypes.update((shownCollectibleTypes: CollectibleType[]) => {
      if (shownCollectibleTypes.includes(collectibleType)) {
        return shownCollectibleTypes.filter((type: CollectibleType) => type !== collectibleType);
      }
      return [...shownCollectibleTypes, collectibleType];
    });
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

  getMap(): Signal<Map | null> {
    return this.map.asReadonly();
  }

  setMap(map: Map) {
    this.map.set(map);
  }

  importSettings(settings: Settings): void {
    if (settings.showCollectedStickers !== undefined) {
      this.showCollectedStickers.set(settings.showCollectedStickers);
    }
    if (settings.showCollectedCollectibles !== undefined) {
      this.showCollectedCollectibles.set(settings.showCollectedCollectibles);
    }
    if (settings.shownCollectibleTypes !== undefined) {
      this.shownCollectibleTypes.set(settings.shownCollectibleTypes);
    }
    if (settings.map !== undefined) {
      this.map.set(settings.map);
    }
  }

  private loadSettingsFromStorage(): void {
    const storedSettings = localStorage.getItem(CONSTANTS.STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      const settings: Settings = JSON.parse(storedSettings);
      this.importSettings(settings);
    } else {
      this.map.set(Map.UPSCALED_MAP);
    }
  }
}
