import {
  Component,
  computed,
  HostListener,
  inject,
  output,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel } from '../core/models';
import { DataService } from '../core/services';
import { Sticker } from '../sticker/sticker';

const STICKERS_PER_PAGE = 32;

@Component({
  selector: 'mkworld-sticker-album',
  imports: [Sticker, TranslateModule],
  templateUrl: './sticker-album.html',
  styleUrls: ['./sticker-album.css'],
})
export class StickerAlbum implements AfterViewInit {
  private readonly dataService = inject(DataService);

  @ViewChildren('stickerItem') stickerItems!: QueryList<ElementRef>;

  scrollToMap = output<ChecklistModel>();

  readonly showCollectedStickers = signal(true);
  private previousStickerPositions = new Map<number, DOMRect>();
  private previousStickerOrder: number[] = [];

  pages = computed(() => {
    const allChecklistModels = this.dataService
      .getChecklistModels()()
      .filter(model => model.hasSticker);
    const filteredModels = this.showCollectedStickers()
      ? allChecklistModels
      : allChecklistModels.filter(model => !model.checked);
    return this.createPages(filteredModels);
  });

  hoveredDescription = signal<string | null>(null);
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  page = signal(0);
  pageCount = computed(() => this.pages().length);

  tooltipText = signal<string | null>(null);
  tooltipPosition = signal<{ x: number; y: number } | null>(null);

  ngAfterViewInit() {
    // Subscribe to changes in the sticker items to animate layout changes
    this.stickerItems.changes.subscribe(() => {
      // Small delay to ensure DOM has updated
      setTimeout(() => this.handleStickerChanges(), 0);
    });
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
    } else {
      this.page.set(this.pageCount() - 1);
    }
  }

  nextPage() {
    if (this.page() < this.pageCount() - 1) {
      this.page.update(p => p + 1);
    } else {
      this.page.set(0);
    }
  }

  goToPage(page: number) {
    this.page.set(page);
  }

  toggleShowCollectedStickers() {
    // Record current positions BEFORE the filter change
    // We need to record based on the current filter state, not the DOM state
    this.recordCurrentPositionsForFilter(this.showCollectedStickers());
    const currentPage = this.page();
    this.showCollectedStickers.update(current => !current);

    // Keep the same page if possible, otherwise go to the last available page
    setTimeout(() => {
      const newPageCount = this.pageCount();
      if (currentPage >= newPageCount) {
        // Current page no longer exists, go to the last available page
        this.page.set(Math.max(0, newPageCount - 1));
      }
      // If current page still exists, stay on it (no change needed)
    }, 0);

    // Animate after change detection runs
    setTimeout(() => this.animateLayoutChanges(), 0);
  }

  private recordCurrentPositionsForFilter(showCollected: boolean): void {
    this.previousStickerPositions.clear();
    this.previousStickerOrder = [];

    // Get the checklist models based on the current filter state
    const allChecklistModels = this.dataService
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

  onChecklistItemHover(isHovered: boolean, description: string): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (isHovered) {
      this.hoveredDescription.set(description);
    } else {
      this.hoverTimeout = setTimeout(() => {
        this.hoveredDescription.set(null);
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

    // Update the previous positions for next time
    this.recordCurrentPositionsForFilter(this.showCollectedStickers());
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

  private createPages(checklistModels: ChecklistModel[]): ChecklistModel[][] {
    const pages: ChecklistModel[][] = [];
    for (let i = 0; i < checklistModels.length; i += STICKERS_PER_PAGE) {
      pages.push(checklistModels.slice(i, i + STICKERS_PER_PAGE));
    }
    return pages;
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
      this.recordCurrentPositionsForFilter(this.showCollectedStickers());
    }
  }

  onStickerChecked(): void {
    // When a sticker is checked/unchecked, we need to animate the layout changes
    // but only if we're not showing collected stickers
    if (!this.showCollectedStickers()) {
      this.recordCurrentPositionsForFilter(this.showCollectedStickers());
      // The animation will be triggered by the stickerItems.changes subscription
    }
  }
}
