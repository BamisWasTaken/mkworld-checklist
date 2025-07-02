import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { ChecklistDataService } from './checklist-data.service';
import { SettingsService } from './settings.service';
import { CONSTANTS } from '../../constants';
import { ChecklistModel } from '../models/checklist-model';

@Injectable({
  providedIn: 'root',
})
export class PageService {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly settingsService = inject(SettingsService);

  private readonly stickersInStickerAlbum = computed(() => {
    const allStickers = this.checklistDataService
      .getChecklistModels()()
      .filter(model => model.hasSticker);
    return this.settingsService.shouldShowCollectedStickers()()
      ? allStickers
      : allStickers.filter(model => !model.checked || model.disappearingFromStickerAlbum);
  });

  private readonly page = computed(() => {
    return this.stickersInStickerAlbum().slice(
      this.finalPageNumber() * CONSTANTS.STICKERS_PER_PAGE,
      (this.finalPageNumber() + 1) * CONSTANTS.STICKERS_PER_PAGE
    );
  });
  private readonly pageCount = computed(() =>
    Math.ceil(this.stickersInStickerAlbum().length / CONSTANTS.STICKERS_PER_PAGE)
  );
  private readonly userPageNumber = signal(0);
  private readonly finalPageNumber = computed(() => {
    const userPageNumber = this.userPageNumber();
    const pageCount = this.pageCount();
    return userPageNumber >= pageCount ? pageCount - 1 : userPageNumber;
  });

  getPage(): Signal<ChecklistModel[]> {
    return this.page;
  }

  getPageNumber(): Signal<number> {
    return this.finalPageNumber;
  }

  getPageCount(): Signal<number> {
    return this.pageCount;
  }

  setPageNumber(pageNumber: number): void {
    this.userPageNumber.set(pageNumber);
  }
}
