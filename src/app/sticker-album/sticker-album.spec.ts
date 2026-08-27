import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CONSTANTS } from '../constants';
import { ChecklistDataService, MapSectionService, PageService } from '../core/services';
import { createCollectibleChecklist } from '../../testing/fixtures';
import { createPanzoomMock } from '../../testing/panzoom-mock';
import { calculateMapFocus } from './sticker-album-layout';
import { StickerAlbum } from './sticker-album';
import { dispatchMouse, dispatchTouch } from '../../testing/dispatch-events';
import { waitMs } from '../../testing/async';

const UNIQUE_TOKEN = 'zzuniquetoken';

describe('StickerAlbum', () => {
  let fixture: ComponentFixture<StickerAlbum>;
  let component: StickerAlbum;
  let pageService: PageService;

  beforeEach(async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    });

    await TestBed.configureTestingModule({
      imports: [StickerAlbum],
    }).compileComponents();

    fixture = TestBed.createComponent(StickerAlbum);
    component = fixture.componentInstance;
    pageService = TestBed.inject(PageService);
    fixture.detectChanges();
    await waitMs(600);
    fixture.detectChanges();
  });

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function waitForPageChange(): Promise<void> {
    await waitMs(250);
    fixture.detectChanges();
  }

  function swipeMouse(fromX: number, fromY: number, toX: number, toY: number): void {
    component.onMouseDown(
      new MouseEvent('mousedown', { bubbles: true, clientX: fromX, clientY: fromY })
    );
    component.onMouseMove(
      new MouseEvent('mousemove', { bubbles: true, clientX: toX, clientY: toY })
    );
    component.onMouseUp();
  }

  function swipeTouch(fromX: number, fromY: number, toX: number, toY: number): void {
    const target = host();
    component.onTouchStart(dispatchTouch(target, 'touchstart', fromX, fromY) as TouchEvent);
    component.onTouchMove(dispatchTouch(target, 'touchmove', toX, toY) as TouchEvent);
    component.onTouchEnd();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(host().querySelectorAll('.sticker').length).toBeGreaterThan(0);
  });

  it('should go to the next page on a horizontal mouse swipe past the threshold', async () => {
    expect(component.areControlsDisabled()).toBe(false);
    expect(pageService.getPageNumber()()).toBe(0);

    swipeMouse(200, 40, 200 - CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD, 45);
    await waitForPageChange();

    expect(pageService.getPageNumber()()).toBe(1);
  });

  it('should go to the next page on a horizontal touch swipe past the threshold', async () => {
    expect(component.areControlsDisabled()).toBe(false);

    swipeTouch(200, 40, 200 - CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD, 40);
    await waitForPageChange();

    expect(pageService.getPageNumber()()).toBe(1);
  });

  it('should ignore vertical-dominant drags', async () => {
    swipeMouse(40, 40, 50, 40 + CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD + 20);
    await waitForPageChange();

    expect(pageService.getPageNumber()()).toBe(0);
  });

  it('should ignore drags below the distance threshold', async () => {
    swipeMouse(40, 40, 40 + CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD - 10, 40);
    await waitForPageChange();

    expect(pageService.getPageNumber()()).toBe(0);
  });

  it('should wrap from the first page to the last page on a right swipe', async () => {
    swipeMouse(40, 40, 40 + CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD, 40);
    await waitForPageChange();

    expect(pageService.getPageNumber()()).toBe(pageService.getPageCount()() - 1);
  });

  it('should open a tooltip when a sticker is clicked and close it on document click', () => {
    const sticker = host().querySelector('.sticker') as HTMLElement;
    dispatchMouse(sticker, 'click', 10, 10);
    fixture.detectChanges();

    expect(host().querySelector('.sticker-tooltip')).toBeTruthy();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host().querySelector('.sticker-tooltip')).toBeNull();
  });

  it('should close the tooltip on window scroll', () => {
    const sticker = host().querySelector('.sticker') as HTMLElement;
    dispatchMouse(sticker, 'click', 10, 10);
    fixture.detectChanges();
    expect(host().querySelector('.sticker-tooltip')).toBeTruthy();

    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(host().querySelector('.sticker-tooltip')).toBeNull();
  });

  it('should toggle a sticker from its checkbox without opening the tooltip', () => {
    const sticker = host().querySelector('.sticker') as HTMLElement;
    const checkbox = sticker.querySelector('.sticker-checkbox') as HTMLInputElement;

    checkbox.click();
    fixture.detectChanges();

    expect(checkbox.checked).toBe(true);
    expect(host().querySelector('.sticker-tooltip')).toBeNull();
  });

  describe('sticker clicks', () => {
    function clickEvent(): MouseEvent {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'currentTarget', {
        value: host().querySelector('.sticker') as HTMLElement,
      });
      return event;
    }

    it('should show the instructions for a sticker with no collectible', () => {
      const model = component.page.find(item => !item.collectibleModel)!;
      expect(model).toBeTruthy();

      component.onStickerClick(clickEvent(), model);
      fixture.detectChanges();

      expect(component.tooltipText()).toBe(model.instructions);
      expect(component.tooltipSticker()).toBe(model);
    });

    it('should offer to jump to the map for a collectible still on it', () => {
      const model = createCollectibleChecklist({ index: 4242 });
      vi.spyOn(
        TestBed.inject(ChecklistDataService),
        'getCollectibleChecklistModelsOnMap'
      ).mockReturnValue(signal([model]));

      component.onStickerClick(clickEvent(), model);
      fixture.detectChanges();

      expect(component.tooltipText()).toBe('SHARED.DOUBLE_CLICK_TO_JUMP');
    });

    it('should say so when a collectible is no longer on the map', () => {
      const model = createCollectibleChecklist({ index: 4243 });
      vi.spyOn(
        TestBed.inject(ChecklistDataService),
        'getCollectibleChecklistModelsOnMap'
      ).mockReturnValue(signal([]));

      component.onStickerClick(clickEvent(), model);
      fixture.detectChanges();

      expect(component.tooltipText()).toBe('SHARED.STICKER_NOT_ON_MAP');
    });

    it('should jump the map to the collectible on a second click', () => {
      const model = createCollectibleChecklist(
        { index: 4244 },
        { xPercentage: 60, yPercentage: 30 }
      );
      vi.spyOn(
        TestBed.inject(ChecklistDataService),
        'getCollectibleChecklistModelsOnMap'
      ).mockReturnValue(signal([model]));

      const panzoomMock = createPanzoomMock();
      vi.spyOn(TestBed.inject(MapSectionService), 'getPanzoomInstance').mockReturnValue(
        panzoomMock as never
      );
      const mapSection = document.createElement('div');
      mapSection.id = 'map-section';
      mapSection.scrollIntoView = vi.fn();
      document.body.appendChild(mapSection);

      // First click arms the tooltip, second click is the one that jumps.
      component.onStickerClick(clickEvent(), model);
      component.onStickerClick(clickEvent(), model);

      const focus = calculateMapFocus(60, 30);
      expect(panzoomMock.zoomAbs).toHaveBeenCalledWith(0, 0, 2);
      expect(panzoomMock.moveTo).toHaveBeenCalledWith(-focus.x, -focus.y);

      mapSection.remove();
    });

    it('should clear every tooltip signal when closed', () => {
      component.onStickerClick(clickEvent(), component.page[0]);
      fixture.detectChanges();
      expect(component.tooltipText()).not.toBeNull();

      component.closeTooltip();

      expect(component.tooltipText()).toBeNull();
      expect(component.tooltipSticker()).toBeNull();
      expect(component.tooltipPosition()).toBeNull();
    });
  });

  describe('hovering', () => {
    it('should track the hovered sticker immediately', () => {
      component.onStickerHover(true, component.page[0]);

      expect(component.hoveredChecklistModel()).toBe(component.page[0]);
    });

    it('should clear the hovered sticker only after the grace period', async () => {
      component.onStickerHover(true, component.page[0]);
      component.onStickerHover(false, component.page[0]);

      expect(component.hoveredChecklistModel()).toBe(component.page[0]);

      await waitMs(200);

      expect(component.hoveredChecklistModel()).toBeNull();
    });

    it('should cancel a pending clear when the pointer comes back', async () => {
      // Moving between two stickers must not blank the description in between.
      component.onStickerHover(true, component.page[0]);
      component.onStickerHover(false, component.page[0]);
      component.onStickerHover(true, component.page[1]);

      await waitMs(200);

      expect(component.hoveredChecklistModel()).toBe(component.page[1]);
    });
  });

  describe('paging and controls', () => {
    it('should lock the controls while a page transition runs', async () => {
      expect(component.areControlsDisabled()).toBe(false);

      component.nextPage();

      expect(component.areControlsDisabled()).toBe(true);

      await waitMs(500);
      fixture.detectChanges();

      expect(component.areControlsDisabled()).toBe(false);
    });

    it('should ignore a page change while the controls are locked', async () => {
      component.nextPage();
      expect(pageService.getPageNumber()()).toBe(0);

      component.goToPage(5);
      await waitMs(500);
      fixture.detectChanges();

      expect(pageService.getPageNumber()()).toBe(1);
    });

    it('should ignore a jump to the page already shown', () => {
      component.goToPage(0);

      expect(component.areControlsDisabled()).toBe(false);
    });

    it('should refuse to toggle collected stickers while the controls are locked', () => {
      const before = component.showCollectedStickers();

      component.nextPage();
      component.toggleShowCollectedStickers();

      expect(component.showCollectedStickers()).toBe(before);
    });

    it('should toggle collected stickers when the controls are free', () => {
      const before = component.showCollectedStickers();

      component.toggleShowCollectedStickers();
      fixture.detectChanges();

      expect(component.showCollectedStickers()).toBe(!before);
    });
  });

  describe('search', () => {
    function searchInput(): HTMLInputElement {
      return host().querySelector('.sticker-search-input') as HTMLInputElement;
    }

    async function typeSearch(searchTerm: string): Promise<void> {
      const input = searchInput();
      input.value = searchTerm;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitMs(CONSTANTS.STICKER_SEARCH_DEBOUNCE_TIME + 100);
      fixture.detectChanges();
    }

    it('should render the search input', () => {
      expect(searchInput()).toBeTruthy();
    });

    it('should keep the album usable when the search matches nothing', async () => {
      await typeSearch(UNIQUE_TOKEN);

      expect(searchInput()).toBeTruthy();
      expect(host().querySelectorAll('.sticker').length).toBe(0);
      expect(host().querySelector('.sticker-album-no-results')).toBeTruthy();
    });

    it('should restore the album when the search is cleared', async () => {
      await typeSearch(UNIQUE_TOKEN);
      expect(host().querySelectorAll('.sticker').length).toBe(0);

      (host().querySelector('.sticker-search-clear') as HTMLElement).click();
      fixture.detectChanges();

      expect(host().querySelectorAll('.sticker').length).toBeGreaterThan(0);
      expect(searchInput().value).toBe('');
    });

    it('should not switch pages when dragging inside the search input', async () => {
      const input = searchInput();

      dispatchMouse(input, 'mousedown', 200, 40);
      dispatchMouse(input, 'mousemove', 200 - CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD, 40);
      dispatchMouse(input, 'mouseup', 200 - CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD, 40);
      await waitForPageChange();

      expect(pageService.getPageNumber()()).toBe(0);
    });

    it('should not lock the controls while filtering', async () => {
      await typeSearch(UNIQUE_TOKEN);

      expect(component.areControlsDisabled()).toBe(false);
    });
  });
});
