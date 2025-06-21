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
import { ChecklistModel, TooltipData } from '../core/models';
import { DataService } from '../core/services';
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
  private readonly dataService = inject(DataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;

  readonly activeTooltipData = signal<TooltipData | null>(null);
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
      (this.activeTooltipData()!.x / 100) * mapRect.width * panTransform.scale;
    const collectibleY =
      mapRect.top +
      panTransform.y +
      (this.activeTooltipData()!.y / 100) * mapRect.height * panTransform.scale;

    return this.calculateOptimalPosition(collectibleX, collectibleY, mapRect, panTransform.scale);
  });

  readonly collectibleChecklistModels = computed(() => {
    const checklistModels = this.dataService.getChecklistModels()();
    const disappearingChecklistModels = this.dataService.getDisappearingChecklistModels()();

    return checklistModels.filter(
      (checklistModel: ChecklistModel) =>
        checklistModel.collectibleModel &&
        (!checklistModel.checked || disappearingChecklistModels.has(checklistModel))
    );
  });

  readonly focusedCollectibleIndex = computed(() => {
    return this.activeTooltipData()?.checklistModel.index ?? null;
  });

  private calculateOptimalPosition(
    collectibleX: number,
    collectibleY: number,
    mapRect: DOMRect,
    scale: number
  ): TooltipPosition {
    const scaledWidth = this.TOOLTIP_WIDTH / scale;
    const scaledHeight = this.TOOLTIP_HEIGHT / scale;
    const margin = this.TOOLTIP_MARGIN / scale;

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

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.pzInstance = panzoom(this.mapPanzoomRef()!.nativeElement, {
        bounds: true,
        boundsPadding: 1,
        minZoom: 1,
        maxZoom: 10,
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

  onShowTooltip(tooltipData: TooltipData) {
    if (this.activeTooltipData()?.checklistModel.index === tooltipData.checklistModel.index) {
      this.closeTooltip();
      return;
    }
    this.activeTooltipData.set(tooltipData);
  }

  closeTooltip(): void {
    this.activeTooltipData.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.activeTooltipData()) {
      return;
    }

    const collectibleIndex = this.activeTooltipData()!.checklistModel.index;
    const clickedCollectible = (event.target as HTMLElement).closest(
      `[data-collectible-index='${collectibleIndex}']`
    );

    if (clickedCollectible) {
      return;
    }

    const clickedTooltip = (event.target as HTMLElement).closest('.map-tooltip-container');

    if (!clickedTooltip) {
      this.closeTooltip();
    }
  }
}
