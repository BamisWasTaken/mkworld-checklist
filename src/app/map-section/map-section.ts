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
import { PanZoom } from 'panzoom';
import { CONSTANTS } from '../constants';
import { ChecklistModel, CollectibleType } from '../core/models';
import {
  ChecklistDataService,
  MapSectionService,
  SettingsService,
  TooltipService,
} from '../core/services';
import { MouseDownPosition } from './models';
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

  readonly showCollectedCollectibles = this.settingsService.shouldShowCollectedCollectibles();
  readonly shownCollectibleTypes = this.settingsService.getShownCollectibleTypes();
  readonly showPeachCoins = this.settingsService.shouldShowPeachCoins();
  readonly showQuestionMarkPanels = this.settingsService.shouldShowQuestionMarkPanels();
  readonly showPSwitches = this.settingsService.shouldShowPSwitches();

  readonly visibleCollectibleChecklistModels =
    this.mapSectionService.getVisibleCollectibleChecklistModels();

  readonly panzoomScale = signal(1);
  readonly tooltipTransform = computed(() => `scale(${1 / this.panzoomScale()})`);
  readonly collectibleScale = computed(() => 1 - this.panzoomScale() / 15);

  readonly activeTooltipData = this.tooltipService.getActiveTooltipData();
  readonly tooltipPosition = computed(() =>
    this.mapSectionService.calculateTooltipPosition(
      this.mapPanzoomRef()!,
      this.mapSectionRef()!,
      this.pzInstance!,
      this.activeTooltipData()?.collectibleModel
    )
  );

  readonly hovered = signal<ChecklistModel | null>(null);

  private pzInstance: PanZoom | null = null;
  isPanning = false;

  private mouseDownPosition: MouseDownPosition | null = null;

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

  onTouchStart(event: TouchEvent, checklistModel: ChecklistModel): void {
    event.preventDefault();
    this.hovered.set(checklistModel);
  }

  onTouchEnd(event: TouchEvent, checklistModel: ChecklistModel): void {
    event.preventDefault();
    this.hovered.set(null);
    if (this.isPanning) {
      return;
    }

    this.tooltipService.setActiveTooltipData(checklistModel);
  }

  onMapTouchStart(event: TouchEvent): void {
    event.preventDefault();
  }

  onMapTouchMove(event: TouchEvent): void {
    event.preventDefault();
  }

  onMapTouchEnd(event: TouchEvent): void {
    event.preventDefault();
  }

  toggleShowCollected(): void {
    if (this.showCollectedCollectibles()) {
      this.checklistDataService.addDisappearingChecklistModels(
        this.visibleCollectibleChecklistModels().filter(
          (checklistModel: ChecklistModel) => checklistModel.checked
        ),
        false,
        true
      );
    }
    this.settingsService.toggleShowCollectedCollectibles();
  }

  toggleShowCollectibleType(collectibleType: CollectibleType): void {
    if (this.shownCollectibleTypes().includes(collectibleType)) {
      this.checklistDataService.addDisappearingChecklistModels(
        this.visibleCollectibleChecklistModels().filter(
          (checklistModel: ChecklistModel) =>
            checklistModel.collectibleModel?.collectibleType === collectibleType
        ),
        false,
        true
      );
    }
    this.settingsService.toggleShowCollectibleType(collectibleType);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.handleDocumentInteraction(event);
  }

  @HostListener('document:touchend', ['$event'])
  onDocumentTouchEnd(event: TouchEvent) {
    this.handleDocumentInteraction(event);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    this.mouseDownPosition = { x: event.clientX, y: event.clientY } as MouseDownPosition;
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouchStart(event: TouchEvent) {
    if (event.touches.length > 0) {
      this.mouseDownPosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      } as MouseDownPosition;
    }
  }

  private handleDocumentInteraction(event: MouseEvent | TouchEvent): void {
    if (this.activeTooltipData()) {
      if (this.mouseDownPosition) {
        const clientX = 'touches' in event ? event.changedTouches[0]?.clientX : event.clientX;
        const clientY = 'touches' in event ? event.changedTouches[0]?.clientY : event.clientY;

        if (clientX !== undefined && clientY !== undefined) {
          const distance = Math.sqrt(
            Math.pow(clientX - this.mouseDownPosition.x, 2) +
              Math.pow(clientY - this.mouseDownPosition.y, 2)
          );
          if (distance > CONSTANTS.MAP_DRAG_THRESHOLD) {
            this.mouseDownPosition = null;
            return;
          }
        }
      }

      const collectibleIndex = this.activeTooltipData()!.index;
      const target = event.target as HTMLElement;
      const clickedCollectible = target.closest(`[data-collectible-index='${collectibleIndex}']`);

      if (clickedCollectible) {
        return;
      }

      const clickedTooltip = target.closest('.map-tooltip-container');

      if (!clickedTooltip) {
        this.tooltipService.setActiveTooltipData(null);
      }
    }
    this.mouseDownPosition = null;
  }

  private initializePanZoom(): void {
    this.pzInstance = this.mapSectionService.initializePanzoom(this.mapPanzoomRef()!);

    this.pzInstance.on('panstart', () => (this.isPanning = true));
    this.pzInstance.on('panend', () => setTimeout(() => (this.isPanning = false), 20));
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
