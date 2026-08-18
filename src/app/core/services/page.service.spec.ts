import { TestBed } from '@angular/core/testing';
import { CONSTANTS } from '../../constants';
import { ChecklistDataService } from './checklist-data.service';
import { PageService } from './page.service';
import { SettingsService } from './settings.service';
import { waitMs } from '../../../testing/async';

describe('PageService', () => {
  let service: PageService;
  let checklistDataService: ChecklistDataService;
  let settingsService: SettingsService;

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

      const sticker = checklistDataService.getChecklistModels()().find(item => item.hasSticker)!;
      expect(service.getPage()().some(item => item.index === sticker.index)).toBe(true);

      checklistDataService.updateChecklistModelChecked(sticker);
      expect(service.getPage()().some(item => item.index === sticker.index)).toBe(true);

      await waitMs(250);

      expect(service.getPage()().some(item => item.index === sticker.index)).toBe(false);
    });

    it('should clamp the page number to the last available page', () => {
      service.setPageNumber(999);
      expect(service.getPageNumber()()).toBe(service.getPageCount()() - 1);
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
