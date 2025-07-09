import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { ChecklistDataService } from './checklist-data.service';
import { SettingsService } from './settings.service';
import { CONSTANTS } from '../../constants';
import { ChecklistModel } from '../models/checklist-model';
import { MobileService } from './mobile.service';

@Injectable({
  providedIn: 'root',
})
export class PageService {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly settingsService = inject(SettingsService);
  private readonly mobileService = inject(MobileService);

  private readonly stickersInStickerAlbum = computed(() => {
    const allStickers = this.checklistDataService
      .getChecklistModels()()
      .filter(model => model.hasSticker);
    return this.settingsService.shouldShowCollectedStickers()()
      ? allStickers
      : allStickers.filter(model => !model.checked || model.disappearingFromStickerAlbum);
  });

  private readonly isMobile = this.mobileService.getIsMobileView();

  private readonly stickersPerRow = computed(() =>
    this.isMobile() ? CONSTANTS.STICKERS_PER_ROW_MOBILE : CONSTANTS.STICKERS_PER_ROW_DESKTOP
  );
  private readonly stickersPerColumn = computed(() =>
    this.isMobile() ? CONSTANTS.STICKERS_PER_COLUMN_MOBILE : CONSTANTS.STICKERS_PER_COLUMN_DESKTOP
  );
  private readonly stickersPerPage = computed(
    () => this.stickersPerRow() * this.stickersPerColumn()
  );

  private readonly page = computed(() => {
    return this.stickersInStickerAlbum().slice(
      this.finalPageNumber() * this.stickersPerPage(),
      (this.finalPageNumber() + 1) * this.stickersPerPage()
    );
  });
  private readonly pageCount = computed(() =>
    Math.ceil(this.stickersInStickerAlbum().length / this.stickersPerPage())
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

  getStickersPerRow(): Signal<number> {
    return this.stickersPerRow;
  }

  getStickersPerColumn(): Signal<number> {
    return this.stickersPerColumn;
  }

  getStickersPerPage(): Signal<number> {
    return this.stickersPerPage;
  }
}
