import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly showCollectedStickers = signal(true);
  private readonly showCollectedCollectibles = signal(false);

  constructor() {}

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
}
