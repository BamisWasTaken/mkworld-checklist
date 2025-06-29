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
      : allStickers.filter(model => !model.checked || model.disappearing);
  });

  private readonly page = computed(() => {
    return this.stickersInStickerAlbum().slice(
      this.pageNumber() * CONSTANTS.STICKERS_PER_PAGE,
      (this.pageNumber() + 1) * CONSTANTS.STICKERS_PER_PAGE
    );
  });
  private readonly pageNumber = signal(0);
  private readonly pageCount = computed(() =>
    Math.ceil(this.stickersInStickerAlbum().length / CONSTANTS.STICKERS_PER_PAGE)
  );

  getPage(): Signal<ChecklistModel[]> {
    return this.page;
  }

  getPageNumber(): Signal<number> {
    return this.pageNumber.asReadonly();
  }

  getPageCount(): Signal<number> {
    return this.pageCount;
  }

  setPageNumber(pageNumber: number): void {
    this.pageNumber.set(pageNumber);
  }
}
