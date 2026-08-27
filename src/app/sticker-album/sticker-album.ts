import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { PanZoom } from 'panzoom';
import { ChecklistModel } from '../core/models';
import {
  ChecklistDataService,
  MapSectionService,
  PageService,
  SettingsService,
  StickerSearchService,
  TooltipService,
} from '../core/services';
import { StickerPosition } from './models';
import {
  calculateEntryOffset,
  calculateFlipDelta,
  calculateMapFocus,
  calculateTooltipAnchor,
  resolveDragIntent,
  resolveNextPage,
  resolvePageTransition,
  resolvePreviousPage,
  shouldPositionTooltipAbove,
} from './sticker-album-layout';

/**
 * The entry offset is spaced against the desktop row width on every viewport; see
 * {@link calculateEntryOffset}.
 */
const ENTRY_OFFSET_COLUMNS = 8;

/** Zoom the map jumps to when a sticker's tooltip is clicked a second time. */
const MAP_JUMP_ZOOM = 2;

@Component({
  selector: 'mkworld-sticker-album',
  imports: [TranslatePipe, NgOptimizedImage],
  templateUrl: './sticker-album.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./sticker-album.css'],
})
export class StickerAlbum {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly settingsService = inject(SettingsService);
  private readonly pageService = inject(PageService);
  private readonly tooltipService = inject(TooltipService);
  private readonly mapSectionService = inject(MapSectionService);
  private readonly stickerSearchService = inject(StickerSearchService);

  readonly stickerItems = viewChildren<ElementRef>('stickerItem');
  readonly pageContainer = viewChild<ElementRef>('pageContainer');

  readonly stickersPerRow = this.pageService.getStickersPerRow();
  readonly stickersPerColumn = this.pageService.getStickersPerColumn();
  readonly stickersPerPage = this.pageService.getStickersPerPage();

  readonly showCollectedStickers = this.settingsService.shouldShowCollectedStickers();

  page: ChecklistModel[] = [];
  readonly pageNumber = this.pageService.getPageNumber();
  readonly pageCount = this.pageService.getPageCount();
  readonly hasStickers = this.pageService.hasStickers();
  readonly hasSearchResults = computed(() => this.pageCount() > 0);

  readonly rawSearchTerm = this.stickerSearchService.getRawSearchTerm();
  private lastAnimatedSearchTerm = '';

  hoveredChecklistModel = signal<ChecklistModel | null>(null);
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly isAnimating = signal(false);
  private readonly isSwitchingPage = signal(false);
  readonly areControlsDisabled = computed(() => this.isAnimating() || this.isSwitchingPage());

  tooltipText = signal<string | null>(null);
  tooltipSticker = signal<ChecklistModel | null>(null);
  tooltipPosition = signal<{ x: number; y: number } | null>(null);
  tooltipPositionAbove = signal<boolean>(false);

  private previousStickerPositions: StickerPosition[] = [];

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;

  private pzInstance: PanZoom | null = null;

  constructor() {
    toObservable(this.pageService.getPage())
      .pipe(takeUntilDestroyed())
      .subscribe((page: ChecklistModel[]) => {
        // A search swaps the whole page at once, so the filter animation has nothing to move.
        const searchTerm = this.stickerSearchService.getSearchTerm()();
        const isSearchChange = searchTerm !== this.lastAnimatedSearchTerm;
        this.lastAnimatedSearchTerm = searchTerm;

        if (this.stickerItems() && !isSearchChange) {
          this.recordCurrentPositionsForFilter();
          queueMicrotask(() => this.animateLayoutChanges());
        }
        this.page = page;
      });
  }

  onSearchInput(event: Event): void {
    this.stickerSearchService.setSearchTerm((event.target as HTMLInputElement).value);
  }

  clearSearch(searchInput: HTMLInputElement): void {
    searchInput.value = '';
    searchInput.focus();
    this.stickerSearchService.clearSearchTerm();
  }

  prevPage() {
    const target = resolvePreviousPage(this.pageNumber(), this.pageCount());
    if (target) {
      this.goToPage(target.page, target.animate);
    }
  }

  nextPage() {
    const target = resolveNextPage(this.pageNumber(), this.pageCount());
    if (target) {
      this.goToPage(target.page, target.animate);
    }
  }

  goToPage(newPage: number, animate: boolean = true) {
    if (
      !this.areControlsDisabled() &&
      newPage !== this.pageNumber() &&
      this.pageContainer()?.nativeElement
    ) {
      const { translateXOut } = resolvePageTransition(this.pageNumber(), newPage, animate);

      this.isSwitchingPage.set(true);

      const pageElement = this.pageContainer()!.nativeElement as HTMLElement;

      pageElement.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
      pageElement.style.transform = `translateX(${translateXOut}px)`;
      pageElement.style.opacity = '0';

      setTimeout(() => {
        this.pageService.setPageNumber(newPage);

        const translateXIn = -translateXOut;

        pageElement.style.transition = 'none';
        pageElement.style.transform = `translateX(${translateXIn}px)`;

        pageElement.getBoundingClientRect();

        pageElement.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        pageElement.style.transform = 'translateX(0)';
        pageElement.style.opacity = '1';

        setTimeout(() => {
          this.isSwitchingPage.set(false);
        }, 200);
      }, 200);
    }
  }

  toggleShowCollectedStickers() {
    if (!this.areControlsDisabled()) {
      this.isAnimating.set(true);
      this.settingsService.toggleShowCollectedStickers();
    }
  }

  onStickerHover(isHovered: boolean, checklistModel: ChecklistModel): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (isHovered) {
      this.hoveredChecklistModel.set(checklistModel);
    } else {
      this.hoverTimeout = setTimeout(() => {
        this.hoveredChecklistModel.set(null);
      }, 150);
    }
  }

  onStickerChecked(checklistModel: ChecklistModel): void {
    this.checklistDataService.updateChecklistModelChecked(checklistModel);
  }

  onStickerClick(event: MouseEvent, checklistModel: ChecklistModel): void {
    if (checklistModel.collectibleModel) {
      if (
        this.checklistDataService.getCollectibleChecklistModelsOnMap()().includes(checklistModel)
      ) {
        if (checklistModel === this.tooltipSticker()) {
          this.onGoToMap(checklistModel);
        } else {
          this.onStickerTooltip('SHARED.DOUBLE_CLICK_TO_JUMP', event, checklistModel);
        }
      } else {
        this.onStickerTooltip('SHARED.STICKER_NOT_ON_MAP', event, checklistModel);
      }
    } else {
      this.onStickerTooltip(checklistModel.instructions, event, checklistModel);
    }
  }

  closeTooltip(): void {
    this.tooltipText.set(null);
    this.tooltipSticker.set(null);
    this.tooltipPosition.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.tooltipText()) {
      const tooltipElement = document.querySelector('.sticker-tooltip') as HTMLElement;
      if (tooltipElement && !tooltipElement.contains(event.target as Node)) {
        this.closeTooltip();
      }
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.tooltipText()) {
      this.closeTooltip();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (isSearchControl(event.target)) {
      return;
    }
    this.startDrag(event.clientX, event.clientY);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.updateDrag(event.clientX, event.clientY);
    }
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    if (this.isDragging) {
      this.endDrag();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (isSearchControl(event.target)) {
      return;
    }
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (this.isDragging) {
      const touch = event.touches[0];
      this.updateDrag(touch.clientX, touch.clientY);
    }
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    if (this.isDragging) {
      this.endDrag();
    }
  }

  private onStickerTooltip(
    instructions: string,
    event: MouseEvent,
    checklistModel: ChecklistModel
  ): void {
    const above = shouldPositionTooltipAbove(
      this.page.indexOf(checklistModel),
      this.stickersPerRow()
    );
    this.tooltipPositionAbove.set(above);

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipText.set(instructions);
    this.tooltipSticker.set(checklistModel);
    this.tooltipPosition.set(calculateTooltipAnchor(rect, above));
  }

  private recordCurrentPositionsForFilter(): void {
    this.previousStickerPositions = [];

    this.stickerItems().forEach((itemRef: ElementRef) => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.id.split('-')[1]);
      this.previousStickerPositions.push({ index, position: element.getBoundingClientRect() });
    });
  }

  private animateLayoutChanges(): void {
    const pageContainer = this.pageContainer()?.nativeElement;
    if (!pageContainer) {
      return;
    }

    let firstNewStickerAtPageEnd = true;
    let amountOfNewStickersAtEndOfPage = 0;
    const pageWidth = pageContainer.getBoundingClientRect().width - 48;
    this.stickerItems().forEach((itemRef: ElementRef, positionOnPage: number) => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.id.split('-')[1]);
      const currentRect = element.getBoundingClientRect();
      const previousRect = this.previousStickerPositions.find(
        (prevStickerPosition: StickerPosition) => prevStickerPosition.index === index
      )?.position;

      let dx = 0;
      let dy = 0;

      if (previousRect) {
        ({ x: dx, y: dy } = calculateFlipDelta(previousRect, currentRect));
      } else if (
        this.previousStickerPositions.at(-1) &&
        index > this.previousStickerPositions.at(-1)!.index &&
        !this.isSwitchingPage()
      ) {
        if (firstNewStickerAtPageEnd) {
          firstNewStickerAtPageEnd = false;
          amountOfNewStickersAtEndOfPage = this.stickersPerPage() - positionOnPage;
        }

        dx = calculateEntryOffset({
          positionOnPage,
          stickersPerRow: this.stickersPerRow(),
          stickersPerColumn: this.stickersPerColumn(),
          newStickersAtPageEnd: amountOfNewStickersAtEndOfPage,
          pageWidth,
          offsetColumns: ENTRY_OFFSET_COLUMNS,
        });
      } else if (!this.isSwitchingPage()) {
        this.isAnimating.set(true);
        this.animateNewSticker(element);
      }

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        this.isAnimating.set(true);
        element.style.transform = `translate(${dx}px, ${dy}px)`;
        element.style.transition = 'none';

        element.getBoundingClientRect();

        element.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)';
        element.style.transform = 'translate(0, 0)';

        setTimeout(() => {
          element.style.transition = '';
          element.style.transform = '';
        }, 500);
      }
    });

    setTimeout(() => {
      this.isAnimating.set(false);
    }, 500);
  }

  private animateNewSticker(element: HTMLElement): void {
    element.style.opacity = '0';
    element.style.transform = 'scale(0)';
    element.style.transition = 'none';

    element.getBoundingClientRect();

    element.style.transition =
      'opacity 0.4s cubic-bezier(0.4, 0.2, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0.2, 0.2, 1)';
    element.style.opacity = '1';
    element.style.transform = 'scale(1)';

    setTimeout(() => {
      element.style.transition = '';
      element.style.opacity = '';
      element.style.transform = '';
    }, 400);
  }

  private startDrag(startX: number, startY: number): void {
    this.isDragging = true;
    this.dragStartX = startX;
    this.dragStartY = startY;
    this.dragCurrentX = startX;
    this.dragCurrentY = startY;
  }

  private updateDrag(currentX: number, currentY: number): void {
    this.dragCurrentX = currentX;
    this.dragCurrentY = currentY;
  }

  private endDrag(): void {
    const intent = resolveDragIntent(
      this.dragCurrentX - this.dragStartX,
      this.dragCurrentY - this.dragStartY
    );

    if (intent === 'prev') {
      this.prevPage();
    } else if (intent === 'next') {
      this.nextPage();
    }

    this.isDragging = false;
  }

  private onGoToMap(checklistModel: ChecklistModel): void {
    const mapElement = document.getElementById('map-section');
    if (mapElement) {
      if (!this.pzInstance) {
        this.pzInstance = this.mapSectionService.getPanzoomInstance();
      }
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const focus = calculateMapFocus(
        checklistModel.collectibleModel!.xPercentage,
        checklistModel.collectibleModel!.yPercentage
      );
      this.pzInstance.zoomAbs(0, 0, MAP_JUMP_ZOOM);
      this.pzInstance.moveTo(-focus.x, -focus.y);

      this.tooltipService.setActiveTooltipDataWithScrollProtection(checklistModel);
    }
  }
}

/**
 * The drag handlers sit on the host, so text selection inside the search box would flip pages.
 */
function isSearchControl(target: EventTarget | null): boolean {
  return !!(target as HTMLElement | null)?.closest?.('.sticker-search');
}
