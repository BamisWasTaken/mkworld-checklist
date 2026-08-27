import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PanZoom } from 'panzoom';
import { CONSTANTS } from '../../constants';
import { TooltipPosition } from '../../map-section/models';
import { MapSectionService } from './map-section.service';
import { createPanzoomMock } from '../../../testing/panzoom-mock';
import { waitMs } from '../../../testing/async';

describe('MapSectionService', () => {
  let service: MapSectionService;

  function createElementRef(rect: Partial<DOMRect>): ElementRef {
    return {
      nativeElement: {
        getBoundingClientRect: () => ({
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          bottom: 1000,
          right: 1000,
          width: 1000,
          height: 1000,
          toJSON: () => ({}),
          ...rect,
        }),
      },
    } as ElementRef;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapSectionService);
  });

  it('should throw when the panzoom instance has not been initialized', () => {
    expect(() => service.getPanzoomInstance()).toThrow('Panzoom instance not initialized');
  });

  it('should prefer ABOVE for hover tooltips when there is space around the collectible', () => {
    const panzoom = createPanzoomMock({ x: 0, y: 0, scale: 1 });
    const position = service.calculateTooltipPosition(
      createElementRef({ width: 1000, height: 1000 }),
      createElementRef({ width: 1000, height: 1000 }),
      panzoom as unknown as PanZoom,
      true,
      { collectibleType: 'p-switch' as never, xPercentage: 50, yPercentage: 20 }
    );

    expect(position).toBe(TooltipPosition.ABOVE);
  });

  it('should pick the side with the most remaining space when the collectible is near an edge', () => {
    const panzoom = createPanzoomMock({ x: 0, y: 0, scale: 1 });
    const position = service.calculateTooltipPosition(
      createElementRef({ width: 1000, height: 1000 }),
      createElementRef({ width: 1000, height: 1000 }),
      panzoom as unknown as PanZoom,
      false,
      { collectibleType: 'p-switch' as never, xPercentage: 50, yPercentage: 2 }
    );

    expect(position).toBe(TooltipPosition.BELOW);
  });

  it('should dispose panzoom and clear the debounce timer on cleanup', async () => {
    const panzoom = createPanzoomMock();
    const mapPanzoomRef = createElementRef({ width: 1000, height: 1000 });
    const mapSectionRef = createElementRef({ width: 1000, height: 1000 });

    if (service.getVisibleCollectibleChecklistModels()().length > CONSTANTS.QUAD_TREE_THRESHOLD) {
      service.debouncedUpdateVisibleCollectibles(
        mapPanzoomRef,
        mapSectionRef,
        panzoom as unknown as PanZoom
      );
    }

    service.cleanup(panzoom as unknown as PanZoom);
    expect(panzoom.dispose).toHaveBeenCalled();
  });

  describe('visible collectible tracking', () => {
    const wholeMap = createElementRef({ width: 1000, height: 1000 });

    it('should return every collectible while the whole map is on screen', () => {
      service.updateVisibleCollectibleIndexes(
        wholeMap,
        createElementRef({ width: 1000, height: 1000 }),
        createPanzoomMock() as unknown as PanZoom
      );

      const visible = service.getVisibleCollectibleChecklistModels()();
      expect(visible.length).toBeGreaterThan(CONSTANTS.QUAD_TREE_THRESHOLD);
    });

    it('should narrow the set once the map is zoomed in', () => {
      service.updateVisibleCollectibleIndexes(
        wholeMap,
        createElementRef({ width: 1000, height: 1000 }),
        createPanzoomMock() as unknown as PanZoom
      );
      const all = service.getVisibleCollectibleChecklistModels()().length;

      service.updateVisibleCollectibleIndexes(
        createElementRef({ width: 2000, height: 2000 }),
        createElementRef({ width: 1000, height: 1000 }),
        createPanzoomMock({ x: 0, y: 0, scale: 2 }) as unknown as PanZoom
      );

      const zoomed = service.getVisibleCollectibleChecklistModels()().length;
      expect(zoomed).toBeGreaterThan(0);
      expect(zoomed).toBeLessThan(all);
    });

    it('should follow the pan to a different part of the map', () => {
      const zoomed = createElementRef({ width: 2000, height: 2000 });
      const section = createElementRef({ width: 1000, height: 1000 });

      service.updateVisibleCollectibleIndexes(
        zoomed,
        section,
        createPanzoomMock({ x: 0, y: 0, scale: 2 }) as unknown as PanZoom
      );
      const topLeft = service
        .getVisibleCollectibleChecklistModels()()
        .map(model => model.index);

      service.updateVisibleCollectibleIndexes(
        zoomed,
        section,
        createPanzoomMock({ x: -1000, y: -1000, scale: 2 }) as unknown as PanZoom
      );
      const bottomRight = service
        .getVisibleCollectibleChecklistModels()()
        .map(model => model.index);

      expect(topLeft.length).toBeGreaterThan(0);
      expect(bottomRight.length).toBeGreaterThan(0);
      // The windows only share the strip the visible buffer overlaps.
      expect(bottomRight.filter(index => !topLeft.includes(index)).length).toBeGreaterThan(0);
      expect(topLeft.filter(index => !bottomRight.includes(index)).length).toBeGreaterThan(0);
    });
  });

  describe('debouncedUpdateVisibleCollectibles', () => {
    it('should apply only the last of a burst of updates', async () => {
      const zoomed = createElementRef({ width: 2000, height: 2000 });
      const section = createElementRef({ width: 1000, height: 1000 });
      const farCorner = createPanzoomMock({ x: -1000, y: -1000, scale: 2 }) as unknown as PanZoom;

      service.updateVisibleCollectibleIndexes(
        zoomed,
        section,
        createPanzoomMock({ x: 0, y: 0, scale: 2 }) as unknown as PanZoom
      );
      const beforeDebounce = service
        .getVisibleCollectibleChecklistModels()()
        .map(m => m.index);

      service.debouncedUpdateVisibleCollectibles(zoomed, section, farCorner);
      service.debouncedUpdateVisibleCollectibles(zoomed, section, farCorner);
      service.debouncedUpdateVisibleCollectibles(zoomed, section, farCorner);

      // Still the old set: the pending update has not fired yet.
      expect(
        service
          .getVisibleCollectibleChecklistModels()()
          .map(m => m.index)
      ).toEqual(beforeDebounce);

      await waitMs(CONSTANTS.QUAD_TREE_DEBOUNCE_TIME + 100);

      expect(
        service
          .getVisibleCollectibleChecklistModels()()
          .map(m => m.index)
      ).not.toEqual(beforeDebounce);
    });
  });

  describe('initializePanzoom', () => {
    it('should keep the options panzoom needs to apply a wheel zoom unclamped', () => {
      const element = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(element);

      const instance = service.initializePanzoom({ nativeElement: element } as ElementRef);

      // panzoom only skips its bounds clamp on a zoom while boundsPadding is 1 and minZoom is 1.
      expect(instance.getMinZoom()).toBe(1);
      expect(instance.getMaxZoom()).toBe(13);

      service.cleanup(instance);
    });

    it('should hand back the same instance it created', () => {
      const element = document.createElement('div');
      document.createElement('div').appendChild(element);

      const instance = service.initializePanzoom({ nativeElement: element } as ElementRef);

      expect(service.getPanzoomInstance()).toBe(instance);

      service.cleanup(instance);
    });
  });
});
