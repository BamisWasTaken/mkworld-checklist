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
import { ChecklistModel, CollectibleModel, CollectibleType } from '../core/models';
import { ChecklistDataService, SettingsService, TooltipService } from '../core/services';
import { Tooltip } from './tooltip/tooltip';
import { CONSTANTS } from '../constants';
import { Bounds, QuadTreeNode, TooltipPosition } from './models';

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

  readonly CollectibleType = CollectibleType;

  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');
  readonly mapSectionRef = viewChild<ElementRef>('mapSection');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;
  private mouseDownPosition: { x: number; y: number } | null = null;
  private readonly DRAG_THRESHOLD = 5; // pixels

  // Quadtree optimization
  private quadtree: QuadTreeNode | null = null;
  private updateVisibleCollectiblesTimeout: number | null = null;

  readonly showCollectedCollectibles = this.settingsService.shouldShowCollectedCollectibles();

  readonly hovered = signal<ChecklistModel | null>(null);

  readonly activeTooltipData = this.tooltipService.getActiveTooltipData();
  readonly panzoomScale = signal(1);
  readonly tooltipTransform = computed(() => `scale(${1 / this.panzoomScale()})`);
  readonly collectibleScale = computed(() => 1 - this.panzoomScale() / 15);

  // Visible collectibles using quadtree optimization
  readonly visibleCollectibleIndexes = signal<number[]>([]);
  readonly visibleCollectibleChecklistModels = computed(() => {
    if (this.collectibleChecklistModels().length > CONSTANTS.QUADTREE_THRESHOLD) {
      return this.collectibleChecklistModels().filter((checklistModel: ChecklistModel) =>
        this.visibleCollectibleIndexes().includes(checklistModel.index)
      );
    }
    return this.collectibleChecklistModels();
  });

  readonly tooltipPosition = computed(() =>
    this.calculateOptimalPosition(this.activeTooltipData()?.collectibleModel)
  );

  readonly collectibleChecklistModels = computed(() => {
    const checklistModels = this.checklistDataService.getChecklistModels()();

    if (this.showCollectedCollectibles()) {
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

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeQuadTree(this.checklistDataService.getChecklistModels()());
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
      this.pzInstance.on('pan', () => this.debouncedUpdateVisibleCollectibles());
      this.pzInstance.on('zoom', (pz: PanZoom) => {
        this.panzoomScale.set(pz.getTransform().scale);
        this.debouncedUpdateVisibleCollectibles();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.updateVisibleCollectiblesTimeout) {
      clearTimeout(this.updateVisibleCollectiblesTimeout);
    }
    if (this.pzInstance) {
      this.pzInstance.dispose();
    }
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

  private calculateOptimalPosition(collectibleModel?: CollectibleModel): TooltipPosition {
    if (!collectibleModel) {
      return TooltipPosition.ABOVE;
    }

    const visibleBounds = this.calculateVisibleBounds();

    // Calculate available space in each direction
    const spaceAbove = collectibleModel.yPercentage - visibleBounds.y;
    const spaceBelow = visibleBounds.y + visibleBounds.height - collectibleModel.yPercentage;
    const spaceLeft = collectibleModel.xPercentage - visibleBounds.x;
    const spaceRight = visibleBounds.x + visibleBounds.width - collectibleModel.xPercentage;

    // Final fallback: choose the position with the most available space
    const spaceScores = [
      { position: TooltipPosition.ABOVE, score: Math.min(spaceAbove, spaceLeft, spaceRight) },
      { position: TooltipPosition.BELOW, score: Math.min(spaceBelow, spaceLeft, spaceRight) },
      { position: TooltipPosition.LEFT, score: Math.min(spaceLeft, spaceAbove, spaceBelow) },
      { position: TooltipPosition.RIGHT, score: Math.min(spaceRight, spaceAbove, spaceBelow) },
    ];

    const bestPosition = spaceScores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return bestPosition.position;
  }

  private initializeQuadTree(checklistModels: ChecklistModel[]): void {
    const collectibles = checklistModels.filter(
      (checklistModel: ChecklistModel) => checklistModel.collectibleModel
    );

    // Initialize quadtree with full map bounds (0-100%)
    this.quadtree = new QuadTreeNode({ x: 0, y: 0, width: 100, height: 100 });

    // Insert all collectibles into the quadtree
    for (const collectible of collectibles) {
      this.quadtree.insert(collectible);
    }

    // Set initial visible collectibles
    this.updateVisibleCollectibles();
  }

  private updateVisibleCollectibles(): void {
    if (!this.quadtree || !this.mapPanzoomRef()?.nativeElement) {
      return;
    }

    const visibleBounds = this.calculateVisibleBounds();
    const visibleCollectibleIndexes = this.quadtree
      .retrieve(visibleBounds)
      .map((checklistModel: ChecklistModel) => checklistModel.index);

    this.visibleCollectibleIndexes.set(visibleCollectibleIndexes);
  }

  private calculateVisibleBounds(): Bounds {
    const mapSectionRect = this.mapSectionRef()!.nativeElement.getBoundingClientRect();
    const mapRect = this.mapPanzoomRef()!.nativeElement.getBoundingClientRect();
    const panTransform = this.pzInstance?.getTransform() ?? { scale: 1, x: 0, y: 0 };

    const mapSectionWidth = mapSectionRect.width;
    const mapSectionHeight = mapSectionRect.height;
    const mapWidth = mapRect.width / panTransform.scale;
    const mapHeight = mapRect.height / panTransform.scale;

    const visibleLeft = -panTransform.x / panTransform.scale - CONSTANTS.QUADTREE_VISIBLE_BUFFER;
    const visibleTop = -panTransform.y / panTransform.scale - CONSTANTS.QUADTREE_VISIBLE_BUFFER;
    const visibleRight =
      visibleLeft + mapSectionWidth / panTransform.scale + CONSTANTS.QUADTREE_VISIBLE_BUFFER;
    const visibleBottom =
      visibleTop + mapSectionHeight / panTransform.scale + CONSTANTS.QUADTREE_VISIBLE_BUFFER;

    const x = Math.max(0, (visibleLeft / mapWidth) * 100);
    const y = Math.max(0, (visibleTop / mapHeight) * 100);
    const width = Math.min(100 - x, ((visibleRight - visibleLeft) / mapWidth) * 100);
    const height = Math.min(100 - y, ((visibleBottom - visibleTop) / mapHeight) * 100);

    return { x, y, width, height };
  }

  private debouncedUpdateVisibleCollectibles(): void {
    if (this.collectibleChecklistModels().length > CONSTANTS.QUADTREE_THRESHOLD) {
      if (this.updateVisibleCollectiblesTimeout) {
        clearTimeout(this.updateVisibleCollectiblesTimeout);
      }

      this.updateVisibleCollectiblesTimeout = window.setTimeout(() => {
        this.updateVisibleCollectibles();
        this.updateVisibleCollectiblesTimeout = null;
      }, CONSTANTS.QUADTREE_DEBOUNCE_TIME);
    }
  }
}
