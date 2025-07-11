import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { PanZoom } from 'panzoom';
import { CONSTANTS } from '../constants';
import { ChecklistModel } from '../core/models';
import {
  ChecklistDataService,
  MapSectionService,
  PageService,
  SettingsService,
  TooltipService,
} from '../core/services';
import { PageAnimationDirection, StickerPosition } from './models';

@Component({
  selector: 'mkworld-sticker-album',
  imports: [TranslateModule, NgOptimizedImage],
  templateUrl: './sticker-album.html',
  styleUrls: ['./sticker-album.css'],
})
export class StickerAlbum {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly settingsService = inject(SettingsService);
  private readonly pageService = inject(PageService);
  private readonly tooltipService = inject(TooltipService);
  private readonly mapSectionService = inject(MapSectionService);

  readonly stickersPerRow = this.pageService.getStickersPerRow();
  readonly stickersPerColumn = this.pageService.getStickersPerColumn();
  readonly stickersPerPage = this.pageService.getStickersPerPage();

  @ViewChildren('stickerItem') stickerItems!: QueryList<ElementRef>;
  @ViewChild('pageContainer', { static: false }) pageContainer!: ElementRef;

  readonly showCollectedStickers = this.settingsService.shouldShowCollectedStickers();
  private previousStickerPositions: StickerPosition[] = [];

  page: ChecklistModel[] = [];
  readonly pageNumber = this.pageService.getPageNumber();
  readonly pageCount = this.pageService.getPageCount();

  hoveredChecklistModel = signal<ChecklistModel | null>(null);
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  isAnimating = signal(false);
  isSwitchingPage = signal(false);
  areControlsDisabled = computed(() => this.isAnimating() || this.isSwitchingPage());

  tooltipText = signal<string | null>(null);
  tooltipSticker = signal<ChecklistModel | null>(null);
  tooltipPosition = signal<{ x: number; y: number } | null>(null);
  tooltipPositionAbove = signal<boolean>(false);

  // Drag functionality properties
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;

  pzInstance: PanZoom | null = null;

  constructor() {
    toObservable(this.pageService.getPage())
      .pipe(takeUntilDestroyed())
      .subscribe((page: ChecklistModel[]) => {
        if (this.stickerItems) {
          this.recordCurrentPositionsForFilter();
          queueMicrotask(() => this.animateLayoutChanges());
        }
        this.page = page;
      });
  }

  prevPage() {
    if (this.pageNumber() > 0) {
      this.goToPage(this.pageNumber() - 1);
    } else {
      this.goToPage(this.pageCount() - 1, false);
    }
  }

  nextPage() {
    if (this.pageNumber() < this.pageCount() - 1) {
      this.goToPage(this.pageNumber() + 1);
    } else {
      this.goToPage(0, false);
    }
  }

  goToPage(newPage: number, animate: boolean = true) {
    if (
      !this.areControlsDisabled() &&
      newPage !== this.pageNumber() &&
      this.pageContainer?.nativeElement
    ) {
      const currentPage = this.pageNumber();
      const direction =
        newPage > currentPage ? PageAnimationDirection.LEFT : PageAnimationDirection.RIGHT;

      this.isSwitchingPage.set(true);

      const pageElement = this.pageContainer.nativeElement as HTMLElement;
      const slideDistance = animate ? 20 : 0;
      const translateXOut =
        direction === PageAnimationDirection.RIGHT ? slideDistance : -slideDistance;

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

  onGoToMap(checklistModel: ChecklistModel): void {
    const mapElement = document.getElementById('map-section');
    if (mapElement) {
      if (!this.pzInstance) {
        this.pzInstance = this.mapSectionService.getPanzoomInstance();
      }
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const x = (1024 / 100) * ((checklistModel.collectibleModel!.xPercentage - 25) * 2);
      const y = (1281 / 100) * ((checklistModel.collectibleModel!.yPercentage - 25) * 2);
      this.pzInstance.zoomAbs(0, 0, 2);
      this.pzInstance.moveTo(-x, -y);

      this.tooltipService.setActiveTooltipDataWithScrollProtection(checklistModel);
    }
  }

  onChecklistItemHover(isHovered: boolean, checklistModel: ChecklistModel): void {
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

  onStickerChecked(checklistModel: ChecklistModel): void {
    this.checklistDataService.updateChecklistModelChecked(checklistModel);
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

  private onStickerTooltip(
    instructions: string,
    event: MouseEvent,
    checklistModel: ChecklistModel
  ): void {
    const index = this.page.indexOf(checklistModel);
    if (Math.floor(index / this.stickersPerRow()) === 0) {
      this.tooltipPositionAbove.set(false);
    } else {
      this.tooltipPositionAbove.set(true);
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipText.set(instructions);
    this.tooltipSticker.set(checklistModel);
    this.tooltipPosition.set({
      x: rect.left + rect.width / 2,
      y: this.tooltipPositionAbove() ? rect.top : rect.bottom,
    });
  }

  private recordCurrentPositionsForFilter(): void {
    this.previousStickerPositions = [];

    this.stickerItems.forEach((itemRef: ElementRef) => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.id.split('-')[1]);
      this.previousStickerPositions.push({ index, position: element.getBoundingClientRect() });
    });
  }

  private animateLayoutChanges(): void {
    let firstNewStickerAtPageEnd = true;
    let amountOfNewStickersAtEndOfPage = 0;
    const pageWidth = this.pageContainer.nativeElement.getBoundingClientRect().width - 48;
    this.stickerItems.forEach((itemRef: ElementRef, positionOnPage: number) => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.id.split('-')[1]);
      const currentRect = element.getBoundingClientRect();
      const previousRect = this.previousStickerPositions.find(
        (prevStickerPosition: StickerPosition) => prevStickerPosition.index === index
      )?.position;

      let dx = 0;
      let dy = 0;

      if (previousRect) {
        dx = previousRect.left - currentRect.left;
        dy = previousRect.top - currentRect.top;
      } else if (index > this.previousStickerPositions.at(-1)!.index && !this.isSwitchingPage()) {
        if (firstNewStickerAtPageEnd) {
          firstNewStickerAtPageEnd = false;
          amountOfNewStickersAtEndOfPage = this.stickersPerPage() - positionOnPage;
        }

        // Calculate the row the current sticker is in
        const currentStickerRow = Math.ceil((positionOnPage + 1) / this.stickersPerRow());
        // Calculate the amount of new stickers in the row
        const newStickersInRow =
          amountOfNewStickersAtEndOfPage -
          this.stickersPerRow() * (this.stickersPerColumn() - currentStickerRow);
        dx = pageWidth;
        if (newStickersInRow < 8) {
          // If there are less than 8 new stickers in the row, the stickers in the row should be offset just enough to start off screen
          dx = (pageWidth / 8) * newStickersInRow;
        }
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

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
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
    if (!this.isDragging) {
      return;
    }

    const deltaX = this.dragCurrentX - this.dragStartX;
    const deltaY = this.dragCurrentY - this.dragStartY;
    const dragDistance = Math.abs(deltaX);

    if (
      dragDistance >= CONSTANTS.STICKER_ALBUM_DRAG_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX > 0) {
        this.prevPage();
      } else {
        this.nextPage();
      }
    }

    this.isDragging = false;
  }
}
