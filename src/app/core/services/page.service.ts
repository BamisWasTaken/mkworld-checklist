import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { ChecklistDataService } from './checklist-data.service';
import { SettingsService } from './settings.service';
import { CONSTANTS } from '../../constants';
import { ChecklistModel } from '../models/checklist-model';
import { MobileService } from './mobile.service';
import { StickerSearchService } from './sticker-search.service';

@Injectable({
  providedIn: 'root',
})
export class PageService {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly settingsService = inject(SettingsService);
  private readonly mobileService = inject(MobileService);
  private readonly stickerSearchService = inject(StickerSearchService);

  private readonly visibleStickers = computed(() => {
    const allStickers = this.checklistDataService
      .getChecklistModels()()
      .filter(model => model.hasSticker);
    return this.settingsService.shouldShowCollectedStickers()()
      ? allStickers
      : allStickers.filter(model => !model.checked || model.disappearingFromStickerAlbum);
  });

  private readonly stickersExist = computed(() => this.visibleStickers().length > 0);

  private readonly stickersInStickerAlbum = computed(() => {
    const visibleStickers = this.visibleStickers();
    // Read the match set last so the search haystack is only built while a search is active.
    const matchingIndexes = this.stickerSearchService.getMatchingIndexes()();
    return matchingIndexes
      ? visibleStickers.filter((model: ChecklistModel) => matchingIndexes.has(model.index))
      : visibleStickers;
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
  /**
   * Tying the selected page to the term it was made under resets paging on every new search
   * without a second emission of {@link page}, which would retrigger the sticker album animation.
   */
  private readonly userPageSelection = signal({ searchTerm: '', pageNumber: 0 });
  private readonly userPageNumber = computed(() => {
    const userPageSelection = this.userPageSelection();
    return userPageSelection.searchTerm === this.stickerSearchService.getSearchTerm()()
      ? userPageSelection.pageNumber
      : 0;
  });
  private readonly finalPageNumber = computed(() => {
    const lastPageNumber = Math.max(0, this.pageCount() - 1);
    return Math.min(Math.max(0, this.userPageNumber()), lastPageNumber);
  });

  getPage(): Signal<ChecklistModel[]> {
    return this.page;
  }

  getPageNumber(): Signal<number> {
    return this.finalPageNumber;
  }

  setPageNumber(pageNumber: number): void {
    this.userPageSelection.set({
      searchTerm: this.stickerSearchService.getSearchTerm()(),
      pageNumber,
    });
  }

  hasStickers(): Signal<boolean> {
    return this.stickersExist;
  }

  getPageCount(): Signal<number> {
    return this.pageCount;
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
