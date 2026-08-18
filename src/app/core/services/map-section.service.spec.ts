import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PanZoom } from 'panzoom';
import { CONSTANTS } from '../../constants';
import { TooltipPosition } from '../../map-section/models';
import { MapSectionService } from './map-section.service';
import { createPanzoomMock } from '../../../testing/panzoom-mock';

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
});
