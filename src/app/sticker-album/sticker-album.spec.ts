import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CONSTANTS } from '../constants';
import { PageService } from '../core/services';
import { StickerAlbum } from './sticker-album';
import { dispatchMouse, dispatchTouch } from '../../testing/dispatch-events';
import { waitMs } from '../../testing/async';

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
});
