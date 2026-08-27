import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistModel } from '../core/models';
import { MapSectionService, MobileService, TooltipService } from '../core/services';
import { TooltipPosition } from './models';
import { MapSection } from './map-section';
import { createCollectibleChecklist } from '../../testing/fixtures';
import { createPanzoomMock } from '../../testing/panzoom-mock';
import { dispatchMouse, dispatchTouch } from '../../testing/dispatch-events';
import { waitMs } from '../../testing/async';

describe('MapSection', () => {
  let fixture: ComponentFixture<MapSection>;
  let component: MapSection;
  let tooltipService: TooltipService;
  // Rebuilt per test: a leaked timer from one test must not be able to touch another's mock.
  let panzoomMock = createPanzoomMock();
  const collectible = createCollectibleChecklist({ index: 42 });
  const visibleModels = signal<ChecklistModel[]>([collectible]);
  const isMobileView = signal<boolean | null>(false);

  /** jsdom implements neither side of the fullscreen API, so both are stubbed per test. */
  function setFullscreenElement(element: HTMLElement | null): void {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => element,
    });
  }

  beforeEach(async () => {
    isMobileView.set(false);
    setFullscreenElement(null);
    panzoomMock = createPanzoomMock();

    await TestBed.configureTestingModule({
      imports: [MapSection],
      providers: [
        {
          provide: MobileService,
          useValue: { getIsMobileView: () => isMobileView.asReadonly() },
        },
        {
          provide: MapSectionService,
          useValue: {
            getVisibleCollectibleChecklistModels: () => visibleModels.asReadonly(),
            initializePanzoom: () => panzoomMock,
            updateVisibleCollectibleIndexes: vi.fn(),
            debouncedUpdateVisibleCollectibles: vi.fn(),
            calculateTooltipPosition: () => TooltipPosition.ABOVE,
            cleanup: vi.fn(),
            getPanzoomInstance: () => panzoomMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapSection);
    component = fixture.componentInstance;
    tooltipService = TestBed.inject(TooltipService);
    fixture.detectChanges();
  });

  afterEach(() => {
    setFullscreenElement(null);
  });

  function marker(): HTMLElement {
    return fixture.nativeElement.querySelector('[data-collectible-index="42"]') as HTMLElement;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open a tooltip when a collectible is clicked', () => {
    dispatchMouse(marker(), 'click');
    fixture.detectChanges();

    expect(tooltipService.getActiveTooltipData()()?.index).toBe(42);
  });

  it('should ignore collectible clicks while panzoom is panning', () => {
    panzoomMock.emit('panstart');
    dispatchMouse(marker(), 'click');
    fixture.detectChanges();

    expect(tooltipService.getActiveTooltipData()()).toBeUndefined();
  });

  it('should close the tooltip on a document click outside the tooltip and collectible', () => {
    dispatchMouse(marker(), 'click');
    fixture.detectChanges();
    expect(tooltipService.getActiveTooltipData()()?.index).toBe(42);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(tooltipService.getActiveTooltipData()()).toBeUndefined();
  });

  it('should close the tooltip on document touchend outside the tooltip', () => {
    dispatchMouse(marker(), 'click');
    fixture.detectChanges();

    dispatchTouch(document.body, 'touchend', 0, 0);
    fixture.detectChanges();

    expect(tooltipService.getActiveTooltipData()()).toBeUndefined();
  });

  it('should not close the tooltip when the same collectible is clicked outside of its own handler', () => {
    tooltipService.setActiveTooltipData(collectible);
    fixture.detectChanges();

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: marker() });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(tooltipService.getActiveTooltipData()()?.index).toBe(42);
  });

  describe('fullscreen', () => {
    function stubRequestFullscreen(): ReturnType<typeof vi.fn> {
      const section = fixture.nativeElement.querySelector('section') as HTMLElement;
      const requestFullscreen = vi.fn(() => Promise.resolve());
      section.requestFullscreen = requestFullscreen;
      return requestFullscreen;
    }

    it('should request fullscreen on the map section', async () => {
      const requestFullscreen = stubRequestFullscreen();

      component.toggleFullscreen();

      expect(requestFullscreen).toHaveBeenCalled();

      // Drain the pending zoom reset so its timer cannot fire during another test.
      await waitMs(150);
    });

    it('should reset the zoom once the fullscreen sizing has applied on desktop', async () => {
      stubRequestFullscreen();

      component.toggleFullscreen();
      expect(panzoomMock.zoomAbs).not.toHaveBeenCalled();

      await waitMs(150);

      expect(panzoomMock.zoomAbs).toHaveBeenCalledWith(0, 0, 1);
    });

    it('should leave the zoom alone when entering fullscreen on mobile', async () => {
      isMobileView.set(true);
      stubRequestFullscreen();

      component.toggleFullscreen();
      await waitMs(150);

      expect(panzoomMock.zoomAbs).not.toHaveBeenCalled();
    });

    it('should exit fullscreen and reset the zoom', async () => {
      setFullscreenElement(fixture.nativeElement);
      document.exitFullscreen = vi.fn(() => Promise.resolve());

      component.toggleFullscreen();
      await waitMs(150);

      expect(document.exitFullscreen).toHaveBeenCalled();
      expect(panzoomMock.zoomAbs).toHaveBeenCalledWith(0, 0, 1);
    });

    it('should never raise the minimum zoom', async () => {
      // A minZoom other than 1 puts panzoom on the branch that drops wheel zooms whenever the
      // scene sits outside its bounds, which froze the zoom on wide screens.
      stubRequestFullscreen();

      component.toggleFullscreen();
      await waitMs(150);
      setFullscreenElement(fixture.nativeElement);
      document.exitFullscreen = vi.fn(() => Promise.resolve());
      component.toggleFullscreen();
      await waitMs(150);

      expect(panzoomMock.setMinZoom).not.toHaveBeenCalled();
    });
  });

  describe('zoom-driven scaling', () => {
    it('should shrink collectibles as the map is zoomed in', () => {
      const atRest = component.collectibleScale();

      panzoomMock.zoomAbs(0, 0, 6);
      panzoomMock.emit('zoom');
      fixture.detectChanges();

      expect(component.panzoomScale()).toBe(6);
      expect(component.collectibleScale()).toBeLessThan(atRest);
    });

    it('should counter-scale the tooltip against the map zoom', () => {
      panzoomMock.zoomAbs(0, 0, 4);
      panzoomMock.emit('zoom');
      fixture.detectChanges();

      expect(component.tooltipScale()).toBe(0.25);
    });
  });

  it('should dispose panzoom when destroyed', () => {
    const mapSectionService = TestBed.inject(MapSectionService);

    fixture.destroy();

    expect(mapSectionService.cleanup).toHaveBeenCalledWith(panzoomMock);
  });

  it('should update fullscreen state when fullscreenchange fires', () => {
    setFullscreenElement(fixture.nativeElement);

    document.dispatchEvent(new Event('fullscreenchange'));

    expect(component.isFullscreen).toBe(true);
  });
});
