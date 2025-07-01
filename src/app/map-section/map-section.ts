import { isPlatformBrowser, NgOptimizedImage, NgStyle } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
import { ChecklistModel, CollectibleType } from '../core/models';
import { ChecklistDataService, SettingsService, TooltipService } from '../core/services';
import { MapSectionService } from './services/map-section.service';
import { Tooltip } from './tooltip/tooltip';

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule, Tooltip, NgStyle, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly tooltipService = inject(TooltipService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settingsService = inject(SettingsService);
  private readonly mapSectionService = inject(MapSectionService);

  readonly CollectibleType = CollectibleType;

  private readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');
  private readonly mapSectionRef = viewChild<ElementRef>('mapSection');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;
  private mouseDownPosition: { x: number; y: number } | null = null;
  private readonly DRAG_THRESHOLD = 5; // pixels

  readonly showCollectedCollectibles = this.settingsService.shouldShowCollectedCollectibles();

  readonly hovered = signal<ChecklistModel | null>(null);

  readonly activeTooltipData = this.tooltipService.getActiveTooltipData();
  readonly panzoomScale = signal(1);
  readonly tooltipTransform = computed(() => `scale(${1 / this.panzoomScale()})`);
  readonly collectibleScale = computed(() => 1 - this.panzoomScale() / 15);

  readonly visibleCollectibleChecklistModels =
    this.mapSectionService.getVisibleCollectibleChecklistModels();

  readonly tooltipPosition = computed(() =>
    this.mapSectionService.calculateTooltipPosition(
      this.mapPanzoomRef()!,
      this.mapSectionRef()!,
      this.pzInstance!,
      this.activeTooltipData()?.collectibleModel
    )
  );

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.mapSectionService.updateVisibleCollectibleIndexes(
        this.mapPanzoomRef()!,
        this.mapSectionRef()!,
        this.pzInstance!
      );
      this.initializePanZoom();
    }
  }

  ngOnDestroy(): void {
    this.mapSectionService.cleanup(this.pzInstance);
  }

  onClick(checklistModel: ChecklistModel): void {
    if (this.isPanning) {
      return;
    }

    this.tooltipService.setActiveTooltipData(checklistModel);
  }

  toggleShowCollected(): void {
    if (this.showCollectedCollectibles()) {
      this.checklistDataService.addDisappearingChecklistModels(
        this.visibleCollectibleChecklistModels().filter(
          (checklistModel: ChecklistModel) => checklistModel.checked
        )
      );
    }
    this.settingsService.toggleShowCollectedCollectibles();
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

  private initializePanZoom(): void {
    this.pzInstance = panzoom(this.mapPanzoomRef()!.nativeElement, {
      bounds: true,
      boundsPadding: 1,
      minZoom: 1,
      maxZoom: 10,
      zoomDoubleClickSpeed: 1,
      smoothScroll: false,
    });

    this.pzInstance.on('panstart', () => (this.isPanning = true));
    this.pzInstance.on('panend', () => (this.isPanning = false));
    this.pzInstance.on('pan', () =>
      this.mapSectionService.debouncedUpdateVisibleCollectibles(
        this.mapPanzoomRef()!,
        this.mapSectionRef()!,
        this.pzInstance!
      )
    );
    this.pzInstance.on('zoom', (pz: PanZoom) => {
      this.panzoomScale.set(pz.getTransform().scale);
      this.mapSectionService.debouncedUpdateVisibleCollectibles(
        this.mapPanzoomRef()!,
        this.mapSectionRef()!,
        this.pzInstance!
      );
    });
  }
}
