import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  output,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { CONSTANTS } from '../constants';
import { ChecklistModel, PageAnimationDirection, StickerPosition } from '../core/models';
import { ChecklistDataService, PageService, SettingsService } from '../core/services';

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

  @ViewChildren('stickerItem') stickerItems!: QueryList<ElementRef>;
  @ViewChild('pageContainer', { static: false }) pageContainer!: ElementRef;

  scrollToMap = output<ChecklistModel>();

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
  tooltipPosition = signal<{ x: number; y: number } | null>(null);

  // Drag functionality properties
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;

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
      this.goToPage(this.pageCount() - 1);
    }
  }

  nextPage() {
    if (this.pageNumber() < this.pageCount() - 1) {
      this.goToPage(this.pageNumber() + 1);
    } else {
      this.goToPage(0);
    }
  }

  goToPage(newPage: number) {
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
      const slideDistance = 50;
      const translateXOut =
        direction === PageAnimationDirection.RIGHT ? slideDistance : -slideDistance;

      pageElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      pageElement.style.transform = `translateX(${translateXOut}px)`;
      pageElement.style.opacity = '0';

      setTimeout(() => {
        this.pageService.setPageNumber(newPage);

        const translateXIn = -translateXOut;

        pageElement.style.transition = 'none';
        pageElement.style.transform = `translateX(${translateXIn}px)`;

        pageElement.getBoundingClientRect();

        pageElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        pageElement.style.transform = 'translateX(0)';
        pageElement.style.opacity = '1';

        setTimeout(() => {
          this.isSwitchingPage.set(false);
        }, 300);
      }, 300);
    }
  }

  toggleShowCollectedStickers() {
    if (!this.areControlsDisabled()) {
      this.isAnimating.set(true);
      this.settingsService.toggleShowCollectedStickers();
    }
  }

  onGoToMap(checklistModel: ChecklistModel): void {
    this.scrollToMap.emit(checklistModel);
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

  onStickerTooltip(instructions: string, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipText.set(instructions);
    this.tooltipPosition.set({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  closeTooltip(): void {
    this.tooltipText.set(null);
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

  onStickerChecked(checklistModel: ChecklistModel): void {
    this.checklistDataService.updateChecklistModelChecked(checklistModel);
  }

  onStickerClick(event: MouseEvent, checklistModel: ChecklistModel) {
    if (checklistModel.collectibleModel) {
      if (
        this.checklistDataService.getCollectibleChecklistModelsOnMap()().includes(checklistModel)
      ) {
        this.onGoToMap(checklistModel);
      } else {
        this.onStickerTooltip('SHARED.STICKER_NOT_ON_MAP', event);
      }
    } else {
      this.onStickerTooltip(checklistModel.instructions, event);
    }
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
    this.isAnimating.set(true);

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
          amountOfNewStickersAtEndOfPage = CONSTANTS.STICKERS_PER_PAGE - positionOnPage;
        }

        // Calculate the row the current sticker is in
        const currentStickerRow = Math.ceil((positionOnPage + 1) / CONSTANTS.STICKERS_PER_ROW);
        // Calculate the amount of new stickers in the row
        const newStickersInRow =
          amountOfNewStickersAtEndOfPage -
          CONSTANTS.STICKERS_PER_ROW * (CONSTANTS.STICKERS_PER_COLUMN - currentStickerRow);
        dx = pageWidth;
        if (newStickersInRow < 8) {
          // If there are less than 8 new stickers in the row, the stickers in the row should be offset just enough to start off screen
          dx = (pageWidth / 8) * newStickersInRow;
        }
      } else {
        this.animateNewSticker(element);
      }

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
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
