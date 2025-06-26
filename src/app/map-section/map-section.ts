import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import panzoom, { PanZoom } from 'panzoom';
import { ChecklistModel } from '../core/models';
import { ChecklistDataService } from '../core/services';
import { TooltipService } from '../core/services/tooltip.service';
import { Collectible } from './collectible/collectible';
import { Tooltip } from './collectible/tooltip/tooltip';

interface TooltipPosition {
  x: number;
  y: number;
  position: 'above' | 'below' | 'left' | 'right';
}

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule, Collectible, Tooltip],
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly tooltipService = inject(TooltipService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;
  private mouseDownPosition: { x: number; y: number } | null = null;
  private readonly DRAG_THRESHOLD = 5; // pixels

  readonly showCollected = signal(false);

  readonly activeTooltipData = this.tooltipService.getActiveTooltipData();
  readonly tooltipScale = signal(1);
  readonly tooltipTransform = computed(() => `scale(${1 / this.tooltipScale()})`);

  private readonly TOOLTIP_WIDTH = 300;
  private readonly TOOLTIP_HEIGHT = 350;
  private readonly TOOLTIP_MARGIN = 12;

  readonly tooltipPosition = computed(() => {
    if (!this.activeTooltipData() || !this.mapPanzoomRef()?.nativeElement) {
      return null;
    }

    const mapRect = this.mapPanzoomRef()!.nativeElement.getBoundingClientRect();
    const panTransform = this.pzInstance?.getTransform() ?? { scale: 1, x: 0, y: 0 };

    // Calculate collectible position
    const collectibleX =
      mapRect.left +
      panTransform.x +
      (this.activeTooltipData()!.collectibleModel!.xPercentage / 100) *
        mapRect.width *
        panTransform.scale;
    const collectibleY =
      mapRect.top +
      panTransform.y +
      (this.activeTooltipData()!.collectibleModel!.yPercentage / 100) *
        mapRect.height *
        panTransform.scale;

    return this.calculateOptimalPosition(collectibleX, collectibleY, mapRect);
  });

  readonly collectibleChecklistModels = computed(() => {
    const checklistModels = this.checklistDataService.getChecklistModels()();

    if (this.showCollected()) {
      return checklistModels.filter(
        (checklistModel: ChecklistModel) => checklistModel.collectibleModel
      );
    }

    return checklistModels.filter(
      (checklistModel: ChecklistModel) =>
        checklistModel.collectibleModel && (!checklistModel.checked || checklistModel.disappearing)
    );
  });

  readonly focusedCollectibleIndex = computed(() => {
    return this.activeTooltipData()?.index ?? null;
  });

  private calculateOptimalPosition(
    collectibleX: number,
    collectibleY: number,
    mapRect: DOMRect
  ): TooltipPosition {
    const scaledWidth = this.TOOLTIP_WIDTH;
    const scaledHeight = this.TOOLTIP_HEIGHT;
    const margin = this.TOOLTIP_MARGIN;

    // Calculate available space in each direction
    const spaceAbove = collectibleY - mapRect.top - margin;
    const spaceBelow = mapRect.bottom - collectibleY - margin;
    const spaceLeft = collectibleX - mapRect.left - margin;
    const spaceRight = mapRect.right - collectibleX - margin;

    // Check if tooltip fits completely in each position (both dimensions)
    const fitsAbove =
      spaceAbove >= scaledHeight && spaceLeft >= scaledWidth / 2 && spaceRight >= scaledWidth / 2;
    const fitsBelow =
      spaceBelow >= scaledHeight && spaceLeft >= scaledWidth / 2 && spaceRight >= scaledWidth / 2;
    const fitsLeft =
      spaceLeft >= scaledWidth && spaceAbove >= scaledHeight / 2 && spaceBelow >= scaledHeight / 2;
    const fitsRight =
      spaceRight >= scaledWidth && spaceAbove >= scaledHeight / 2 && spaceBelow >= scaledHeight / 2;

    // Try positions in order of preference: above, below, left, right
    if (fitsAbove) {
      return {
        x: collectibleX,
        y: collectibleY - margin,
        position: 'above',
      };
    }

    if (fitsBelow) {
      return {
        x: collectibleX,
        y: collectibleY + margin,
        position: 'below',
      };
    }

    if (fitsLeft) {
      return {
        x: collectibleX - margin,
        y: collectibleY,
        position: 'left',
      };
    }

    if (fitsRight) {
      return {
        x: collectibleX + margin,
        y: collectibleY,
        position: 'right',
      };
    }

    // Fallback logic: if no position fits completely, choose the best partial fit
    const hasVerticalSpace = spaceAbove >= scaledHeight || spaceBelow >= scaledHeight;
    const hasHorizontalSpace = spaceLeft >= scaledWidth || spaceRight >= scaledWidth;

    // If we have vertical space but not horizontal, prefer above/below
    if (hasVerticalSpace && !hasHorizontalSpace) {
      if (spaceAbove >= scaledHeight) {
        return {
          x: collectibleX,
          y: collectibleY - margin,
          position: 'above',
        };
      } else if (spaceBelow >= scaledHeight) {
        return {
          x: collectibleX,
          y: collectibleY + margin,
          position: 'below',
        };
      }
    }

    // If we have horizontal space but not vertical, prefer left/right
    if (hasHorizontalSpace && !hasVerticalSpace) {
      if (spaceLeft >= scaledWidth) {
        return {
          x: collectibleX - margin,
          y: collectibleY,
          position: 'left',
        };
      } else if (spaceRight >= scaledWidth) {
        return {
          x: collectibleX + margin,
          y: collectibleY,
          position: 'right',
        };
      }
    }

    // Final fallback: choose the position with the most available space
    const spaceScores = [
      { position: 'above' as const, score: Math.min(spaceAbove, spaceLeft, spaceRight) },
      { position: 'below' as const, score: Math.min(spaceBelow, spaceLeft, spaceRight) },
      { position: 'left' as const, score: Math.min(spaceLeft, spaceAbove, spaceBelow) },
      { position: 'right' as const, score: Math.min(spaceRight, spaceAbove, spaceBelow) },
    ];

    const bestPosition = spaceScores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // Position the tooltip as close as possible to the collectible
    switch (bestPosition.position) {
      case 'above':
        return {
          x: collectibleX,
          y: collectibleY - margin,
          position: 'above',
        };
      case 'below':
        return {
          x: collectibleX,
          y: collectibleY + margin,
          position: 'below',
        };
      case 'left':
        return {
          x: collectibleX - margin,
          y: collectibleY,
          position: 'left',
        };
      case 'right':
        return {
          x: collectibleX + margin,
          y: collectibleY,
          position: 'right',
        };
    }
  }

  toggleShowCollected(): void {
    const showCollected = !this.showCollected();
    if (!showCollected) {
      this.checklistDataService.addDisappearingChecklistModels(
        this.collectibleChecklistModels().filter(
          (checklistModel: ChecklistModel) =>
            checklistModel.checked && checklistModel.collectibleModel
        )
      );
    }
    this.showCollected.set(showCollected);
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.pzInstance = panzoom(this.mapPanzoomRef()!.nativeElement, {
        bounds: true,
        boundsPadding: 1,
        minZoom: 1,
        maxZoom: 10,
        zoomDoubleClickSpeed: 1,
      });

      this.pzInstance.on('panstart', () => (this.isPanning = true));
      this.pzInstance.on('panend', () => (this.isPanning = false));
      this.pzInstance.on('zoom', (pz: PanZoom) => {
        this.tooltipScale.set(pz.getTransform().scale);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.pzInstance) {
      this.pzInstance.dispose();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.activeTooltipData()) {
      return;
    }

    // Don't close tooltip if we're currently scrolling to it
    if (this.tooltipService.isScrollingToTooltipActive()()) {
      return;
    }

    // Don't close tooltip if we're currently panning
    if (this.isPanning) {
      return;
    }

    // Don't close tooltip if this was a drag (mouse moved significantly)
    if (this.mouseDownPosition) {
      const distance = Math.sqrt(
        Math.pow(event.clientX - this.mouseDownPosition.x, 2) +
          Math.pow(event.clientY - this.mouseDownPosition.y, 2)
      );
      if (distance > this.DRAG_THRESHOLD) {
        this.mouseDownPosition = null;
        return;
      }
    }

    const collectibleIndex = this.activeTooltipData()!.index;
    const clickedCollectible = (event.target as HTMLElement).closest(
      `[data-collectible-index='${collectibleIndex}']`
    );

    if (clickedCollectible) {
      return;
    }

    const clickedTooltip = (event.target as HTMLElement).closest('.map-tooltip-container');

    if (!clickedTooltip) {
      this.tooltipService.setActiveTooltipData(null);
    }

    // Clear mouse down position after processing
    this.mouseDownPosition = null;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    // Track mouse down position to detect drags
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp() {
    // Clear mouse down position after a short delay to allow click event to process
    setTimeout(() => {
      this.mouseDownPosition = null;
    }, 100);
  }
}
