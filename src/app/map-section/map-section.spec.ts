import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistModel } from '../core/models';
import { MapSectionService, TooltipService } from '../core/services';
import { TooltipPosition } from './models';
import { MapSection } from './map-section';
import { createCollectibleChecklist } from '../../testing/fixtures';
import { createPanzoomMock } from '../../testing/panzoom-mock';
import { dispatchMouse, dispatchTouch } from '../../testing/dispatch-events';

describe('MapSection', () => {
  let fixture: ComponentFixture<MapSection>;
  let component: MapSection;
  let tooltipService: TooltipService;
  const panzoomMock = createPanzoomMock();
  const collectible = createCollectibleChecklist({ index: 42 });
  const visibleModels = signal<ChecklistModel[]>([collectible]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSection],
      providers: [
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

  it('should update fullscreen state when fullscreenchange fires', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fixture.nativeElement,
    });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(component.isFullscreen).toBe(true);
  });
});
