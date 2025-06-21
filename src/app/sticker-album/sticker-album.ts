import { Component, computed, HostListener, inject, output, signal } from '@angular/core';
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
export class StickerAlbum {
  private readonly dataService = inject(DataService);

  scrollToMap = output<ChecklistModel>();

  pages = computed(() => this.createPages(this.dataService.getChecklistModels()()));
  hoveredDescription = signal<string | null>(null);
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  page = signal(0);
  pageCount = computed(() => this.pages().length);

  tooltipText = signal<string | null>(null);
  tooltipPosition = signal<{ x: number; y: number } | null>(null);

  prevPage() {
    if (this.page() > 0) this.page.update(p => p - 1);
  }
  nextPage() {
    if (this.page() < this.pageCount() - 1) this.page.update(p => p + 1);
  }

  private createPages(checklistModels: ChecklistModel[]): ChecklistModel[][] {
    const pages: ChecklistModel[][] = [];
    const totalPages = Math.ceil(checklistModels.length / STICKERS_PER_PAGE);

    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * STICKERS_PER_PAGE;
      const endIndex = startIndex + STICKERS_PER_PAGE;
      const pageChecklistModels = checklistModels.slice(startIndex, endIndex);
      pages.push(pageChecklistModels);
    }

    return pages;
  }

  onGoToMap(checklistModel: ChecklistModel): void {
    this.scrollToMap.emit(checklistModel);
  }

  onChecklistItemHover(hovered: boolean, description: string): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (hovered) {
      this.hoveredDescription.set(description);
    } else {
      this.hoverTimeout = setTimeout(() => {
        this.hoveredDescription.set(null);
        this.hoverTimeout = null;
      }, 300);
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
}
