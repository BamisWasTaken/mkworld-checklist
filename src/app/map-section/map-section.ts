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
import { ChecklistModel, CollectibleType } from '../core/models';
import { MapSectionService, MobileService, TooltipService } from '../core/services';
import { Settings } from './settings/settings';
import { Tooltip } from './tooltip/tooltip';

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule, Tooltip, NgStyle, NgOptimizedImage, Settings],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly tooltipService = inject(TooltipService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mapSectionService = inject(MapSectionService);
  private readonly mobileService = inject(MobileService);

  readonly CollectibleType = CollectibleType;

  private readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');
  private readonly mapSectionRef = viewChild<ElementRef>('mapSection');

  readonly panzoomScale = signal(1);
  readonly tooltipTransform = computed(
    () => `scale(${1 / this.panzoomScale() / (this.mobileService.getIsMobileView()() ? 1.5 : 1)})`
  );
  readonly collectibleScale = computed(() => {
    const scale = this.panzoomScale();
    const normalizedScale = (scale - 1) / 12; // Normalize 1-13 to 0-1
    const result = Math.max(0.1, 1 - 0.9 * Math.pow(normalizedScale, 0.3));
    return result;
  });

  readonly visibleCollectibleChecklistModels =
    this.mapSectionService.getVisibleCollectibleChecklistModels();

  readonly activeTooltipData = this.tooltipService.getActiveTooltipData();
  readonly tooltipPosition = computed(() =>
    this.mapSectionService.calculateTooltipPosition(
      this.mapPanzoomRef()!,
      this.mapSectionRef()!,
      this.pzInstance!,
      this.activeTooltipData()?.collectibleModel
    )
  );

  private pzInstance: PanZoom | null = null;
  isPanning = false;
  isFullscreen = false;

  readonly hovered = signal<ChecklistModel | null>(null);

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

  toggleFullscreen(): void {
    if (this.mapSectionRef()) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setTimeout(() => {
          this.pzInstance?.zoomAbs(0, 0, 1);
          this.mapSectionService.updateVisibleCollectibleIndexes(
            this.mapPanzoomRef()!,
            this.mapSectionRef()!,
            this.pzInstance!
          );
        }, 100);
      } else {
        this.mapSectionRef()!.nativeElement.requestFullscreen();
        this.mapSectionService.updateVisibleCollectibleIndexes(
          this.mapPanzoomRef()!,
          this.mapSectionRef()!,
          this.pzInstance!
        );
      }
    }
  }

  @HostListener('document:fullscreenchange', [])
  onFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.handleDocumentInteraction(event);
  }

  @HostListener('document:touchend', ['$event'])
  onDocumentTouchEnd(event: TouchEvent) {
    this.handleDocumentInteraction(event);
  }

  private handleDocumentInteraction(event: MouseEvent | TouchEvent): void {
    if (this.activeTooltipData() && !this.isPanning) {
      const collectibleIndex = this.activeTooltipData()!.index;
      const target = event.target as HTMLElement;
      const clickedCollectible = target.closest(`[data-collectible-index='${collectibleIndex}']`);

      // If the click is on a collectible, do nothing. Collectibles handle clicks themselves.
      if (clickedCollectible) {
        return;
      }

      const clickedTooltip = target.closest('.map-tooltip-container');

      // If the click is not inside the tooltip, close it.
      if (!clickedTooltip) {
        this.tooltipService.setActiveTooltipData(null);
      }
    }
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
