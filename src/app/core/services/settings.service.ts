import { Injectable, Signal, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { CONSTANTS } from '../../constants';
import { Settings } from '../models';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly showCollectedStickers = signal(true);
  private readonly showCollectedCollectibles = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSettingsFromStorage();

      effect(() => {
        const settings: Settings = {
          showCollectedStickers: this.showCollectedStickers(),
          showCollectedCollectibles: this.showCollectedCollectibles(),
        };
        localStorage.setItem(CONSTANTS.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      });
    }
  }

  shouldShowCollectedStickers(): Signal<boolean> {
    return this.showCollectedStickers.asReadonly();
  }

  shouldShowCollectedCollectibles(): Signal<boolean> {
    return this.showCollectedCollectibles.asReadonly();
  }

  toggleShowCollectedStickers() {
    this.showCollectedStickers.update((value: boolean) => !value);
  }

  toggleShowCollectedCollectibles() {
    this.showCollectedCollectibles.update((value: boolean) => !value);
  }

  private loadSettingsFromStorage(): void {
    const storedSettings = localStorage.getItem(CONSTANTS.STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      const settings: Settings = JSON.parse(storedSettings);
      this.showCollectedStickers.set(settings.showCollectedStickers);
      this.showCollectedCollectibles.set(settings.showCollectedCollectibles);
    }
  }
}
