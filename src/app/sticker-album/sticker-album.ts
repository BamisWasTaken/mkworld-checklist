import { Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { StickerModel } from '../core/models';
import { Sticker } from '../sticker/sticker';

const STICKERS_PER_PAGE = 32;

@Component({
  selector: 'mkworld-sticker-album',
  imports: [Sticker, TranslateModule],
  templateUrl: './sticker-album.html',
  styleUrls: ['./sticker-album.css'],
})
export class StickerAlbum {
  stickers = input.required<StickerModel[]>();

  onStickerChecked = output<StickerModel>();

  pages = computed(() => this.createPages(this.stickers()));
  hoveredDescription = signal<string | null>(null);
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  page = signal(0);
  pageCount = computed(() => this.pages().length);

  prevPage() {
    if (this.page() > 0) this.page.update(p => p - 1);
  }
  nextPage() {
    if (this.page() < this.pageCount() - 1) this.page.update(p => p + 1);
  }

  private createPages(stickers: StickerModel[]): StickerModel[][] {
    const pages: StickerModel[][] = [];
    const totalPages = Math.ceil(stickers.length / STICKERS_PER_PAGE);

    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * STICKERS_PER_PAGE;
      const endIndex = startIndex + STICKERS_PER_PAGE;
      const pageStickers = stickers.slice(startIndex, endIndex);
      pages.push(pageStickers);
    }

    return pages;
  }

  onCheck(sticker: StickerModel, checked: boolean): void {
    this.onStickerChecked.emit({ ...sticker, checked });
  }

  onStickerHover(hovered: boolean, description: string): void {
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
}
