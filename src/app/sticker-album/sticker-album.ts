import {
  Component,
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
import { ChecklistModel, PageAnimationDirection } from '../core/models';
import { ChecklistDataService, PageService, SettingsService } from '../core/services';

@Component({
  selector: 'mkworld-sticker-album',
  imports: [TranslateModule],
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
  private previousStickerPositions = new Map<number, DOMRect>();
  private previousStickerOrder: number[] = [];

  page: ChecklistModel[] = [];
  readonly pageNumber = this.pageService.getPageNumber();
  readonly pageCount = this.pageService.getPageCount();

  hoveredChecklistModel = signal<ChecklistModel | null>(null);
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  isAnimating = signal(false);

  tooltipText = signal<string | null>(null);
  tooltipPosition = signal<{ x: number; y: number } | null>(null);

  constructor() {
    toObservable(this.pageService.getPage())
      .pipe(takeUntilDestroyed())
      .subscribe((page: ChecklistModel[]) => {
        this.page = page;
        if (this.stickerItems) {
          this.recordCurrentPositionsForFilter(this.showCollectedStickers());
          queueMicrotask(() => this.handleStickerChanges());
        }
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
    if (!this.isAnimating() && newPage !== this.pageNumber() && this.pageContainer?.nativeElement) {
      const currentPage = this.pageNumber();
      const direction =
        newPage > currentPage ? PageAnimationDirection.LEFT : PageAnimationDirection.RIGHT;

      this.isAnimating.set(true);

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
          this.isAnimating.set(false);
        }, 300);
      }, 300);
    }
  }

  toggleShowCollectedStickers() {
    if (!this.isAnimating()) {
      this.settingsService.toggleShowCollectedStickers();
    }
  }

  private recordCurrentPositionsForFilter(showCollected: boolean): void {
    this.previousStickerPositions.clear();
    this.previousStickerOrder = [];

    // Get the checklist models based on the current filter state
    const allChecklistModels = this.checklistDataService
      .getChecklistModels()()
      .filter(model => model.hasSticker);
    const filteredModels = showCollected
      ? allChecklistModels
      : allChecklistModels.filter(model => !model.checked);

    // Record the order of stickers that should be visible
    filteredModels.forEach(model => {
      this.previousStickerOrder.push(model.index);
    });

    // Record positions of currently visible stickers
    this.stickerItems.forEach(itemRef => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.getAttribute('data-sticker-index') || '0');
      this.previousStickerPositions.set(index, element.getBoundingClientRect());
    });
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

  private animateLayoutChanges(): void {
    const currentStickerOrder: number[] = [];

    // Get current sticker order
    this.stickerItems.forEach(itemRef => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.getAttribute('data-sticker-index') || '0');
      currentStickerOrder.push(index);
    });

    // Only animate if the order actually changed
    const orderChanged =
      this.previousStickerOrder.length !== currentStickerOrder.length ||
      this.previousStickerOrder.some((prevIndex, i) => prevIndex !== currentStickerOrder[i]);

    if (!orderChanged) {
      // No reordering happened, just animate new stickers appearing
      this.animateNewStickers();
      return;
    }

    // Animate existing stickers that moved
    this.stickerItems.forEach(itemRef => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.getAttribute('data-sticker-index') || '0');
      const currentRect = element.getBoundingClientRect();
      const previousRect = this.previousStickerPositions.get(index);

      if (previousRect) {
        // Calculate the transform to move from old position to new position
        const dx = previousRect.left - currentRect.left;
        const dy = previousRect.top - currentRect.top;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          // Apply initial transform to put element back in old position
          element.style.transform = `translate(${dx}px, ${dy}px)`;
          element.style.transition = 'none';

          // Force reflow
          element.getBoundingClientRect();

          // Play the animation
          element.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)';
          element.style.transform = 'translate(0, 0)';

          // Clean up after animation
          setTimeout(() => {
            element.style.transition = '';
            element.style.transform = '';
          }, 500);
        }
      } else {
        // This is a new sticker that appeared
        this.animateNewSticker(element);
      }
    });
  }

  private animateNewStickers(): void {
    // Find stickers that weren't in the previous order
    const previousIndexes = new Set(this.previousStickerOrder);

    this.stickerItems.forEach(itemRef => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.getAttribute('data-sticker-index') || '0');

      if (!previousIndexes.has(index)) {
        this.animateNewSticker(element);
      }
    });
  }

  private animateNewSticker(element: HTMLElement): void {
    // Handle newly entering elements (scale-in animation)
    element.style.opacity = '0';
    element.style.transform = 'scale(0)';
    element.style.transition = 'none';

    // Force reflow
    element.getBoundingClientRect();

    // Animate to final state
    element.style.transition =
      'opacity 0.4s cubic-bezier(0.4, 0.2, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0.2, 0.2, 1)';
    element.style.opacity = '1';
    element.style.transform = 'scale(1)';

    // Clean up after animation
    setTimeout(() => {
      element.style.transition = '';
      element.style.opacity = '';
      element.style.transform = '';
    }, 400);
  }

  private handleStickerChanges(): void {
    // Check if this is a filter change (toggle show collected stickers)
    // or if stickers were checked/unchecked
    const currentStickerOrder: number[] = [];

    this.stickerItems.forEach(itemRef => {
      const element = itemRef.nativeElement;
      const index = parseInt(element.getAttribute('data-sticker-index') || '0');
      currentStickerOrder.push(index);
    });

    // If we have previous positions recorded, this might be a filter change
    if (this.previousStickerOrder.length > 0) {
      this.animateLayoutChanges();
    } else {
      // First time or no previous positions, just animate new stickers
      this.animateNewStickers();
      // Record positions for next time
    }
  }

  onStickerChecked(checklistModel: ChecklistModel): void {
    this.checklistDataService.updateChecklistModelChecked(checklistModel);
  }

  onStickerClick(event: MouseEvent, checklistModel: ChecklistModel) {
    if (checklistModel.collectibleModel) {
      this.onGoToMap(checklistModel);
    } else {
      this.onStickerTooltip(checklistModel.instructions, event);
    }
  }
}
