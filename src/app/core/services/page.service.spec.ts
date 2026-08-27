import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '../../constants';
import { ChecklistDataService } from './checklist-data.service';
import { PageService } from './page.service';
import { SettingsService } from './settings.service';
import { StickerSearchService } from './sticker-search.service';
import { waitMs } from '../../../testing/async';
import { ChecklistModel } from '../models';

const UNIQUE_TOKEN = 'zzuniquetoken';
const DEBOUNCE_WAIT = CONSTANTS.STICKER_SEARCH_DEBOUNCE_TIME + 50;

describe('PageService', () => {
  let service: PageService;
  let checklistDataService: ChecklistDataService;
  let settingsService: SettingsService;
  let stickerSearchService: StickerSearchService;
  let translateService: TranslateService;

  function createService(innerWidth: number): void {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: innerWidth,
    });
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageService);
    checklistDataService = TestBed.inject(ChecklistDataService);
    settingsService = TestBed.inject(SettingsService);
    stickerSearchService = TestBed.inject(StickerSearchService);
    translateService = TestBed.inject(TranslateService);
  }

  function getStickers(): ChecklistModel[] {
    return checklistDataService
      .getChecklistModels()()
      .filter(model => model.hasSticker);
  }

  async function search(searchTerm: string): Promise<void> {
    stickerSearchService.setSearchTerm(searchTerm);
    await waitMs(DEBOUNCE_WAIT);
  }

  describe('desktop layout', () => {
    beforeEach(() => {
      createService(1280);
    });

    it('should use the desktop grid size', () => {
      expect(service.getStickersPerRow()()).toBe(CONSTANTS.STICKERS_PER_ROW_DESKTOP);
      expect(service.getStickersPerColumn()()).toBe(CONSTANTS.STICKERS_PER_COLUMN_DESKTOP);
      expect(service.getStickersPerPage()()).toBe(
        CONSTANTS.STICKERS_PER_ROW_DESKTOP * CONSTANTS.STICKERS_PER_COLUMN_DESKTOP
      );
    });

    it('should hide collected stickers after they finish disappearing', async () => {
      if (settingsService.shouldShowCollectedStickers()()) {
        settingsService.toggleShowCollectedStickers();
      }
      expect(settingsService.shouldShowCollectedStickers()()).toBe(false);

      const sticker = checklistDataService
        .getChecklistModels()()
        .find(item => item.hasSticker)!;
      expect(
        service
          .getPage()()
          .some(item => item.index === sticker.index)
      ).toBe(true);

      checklistDataService.updateChecklistModelChecked(sticker);
      expect(
        service
          .getPage()()
          .some(item => item.index === sticker.index)
      ).toBe(true);

      await waitMs(250);

      expect(
        service
          .getPage()()
          .some(item => item.index === sticker.index)
      ).toBe(false);
    });

    it('should clamp the page number to the last available page', () => {
      service.setPageNumber(999);
      expect(service.getPageNumber()()).toBe(service.getPageCount()() - 1);
    });

    it('should clamp a negative page number to the first page', () => {
      service.setPageNumber(-1);
      expect(service.getPageNumber()()).toBe(0);
    });

    it('should not filter the album while no search is active', async () => {
      const pageBeforeSearch = service.getPage()();

      await search('ab');

      expect(service.getPage()()).toEqual(pageBeforeSearch);
    });

    it('should repaginate the matching stickers into full pages', async () => {
      const stickers = getStickers();
      const sharedInstructions = stickers[0].instructions;
      const expectedMatches = stickers.filter(
        (model: ChecklistModel) => model.instructions === sharedInstructions
      ).length;
      expect(expectedMatches).toBeGreaterThan(service.getStickersPerPage()());
      translateService.setTranslation('en', { STICKERS: { [sharedInstructions]: UNIQUE_TOKEN } });

      await search(UNIQUE_TOKEN);

      expect(service.getPageCount()()).toBe(
        Math.ceil(expectedMatches / service.getStickersPerPage()())
      );
      expect(service.getPage()().length).toBe(service.getStickersPerPage()());
    });

    it('should reset to the first page when the search term changes', async () => {
      service.setPageNumber(3);
      expect(service.getPageNumber()()).toBe(3);

      await search(UNIQUE_TOKEN);

      expect(service.getPageNumber()()).toBe(0);
    });

    it('should show an empty page when the search matches nothing', async () => {
      const lastStickers = getStickers().slice(-service.getStickersPerPage()());

      await search(UNIQUE_TOKEN);

      expect(service.getPageCount()()).toBe(0);
      expect(service.getPageNumber()()).toBe(0);
      expect(service.getPage()()).toEqual([]);
      expect(service.getPage()()).not.toEqual(lastStickers);
    });

    it('should restore the full album when the search is cleared', async () => {
      const pageCountBeforeSearch = service.getPageCount()();
      await search(UNIQUE_TOKEN);
      expect(service.getPageCount()()).toBe(0);

      stickerSearchService.clearSearchTerm();

      expect(service.getPageCount()()).toBe(pageCountBeforeSearch);
    });

    it('should report whether the album has any stickers', () => {
      expect(service.hasStickers()()).toBe(true);
    });
  });

  describe('mobile layout', () => {
    beforeEach(() => {
      createService(800);
    });

    it('should use the mobile grid size', () => {
      expect(service.getStickersPerRow()()).toBe(CONSTANTS.STICKERS_PER_ROW_MOBILE);
      expect(service.getStickersPerColumn()()).toBe(CONSTANTS.STICKERS_PER_COLUMN_MOBILE);
    });
  });
});
