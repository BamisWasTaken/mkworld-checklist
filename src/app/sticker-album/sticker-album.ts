import { Component, signal, computed, WritableSignal, output, effect } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { StickerModel } from '../core/models';
import { stickerData } from '../core/data/sticker-data';
import { Sticker } from '../sticker/sticker';

const STICKERS_PER_PAGE = 32;

@Component({
    selector: 'mkworld-sticker-album',
    imports: [Sticker, TranslateModule],
    templateUrl: './sticker-album.html',
    styleUrls: ['./sticker-album.css']
})
export class StickerAlbum {
    onStickersUpdated = output<StickerModel[]>();
    
    pages: WritableSignal<StickerModel[][]> = signal(this.createPages());
    hoveredDescription = signal<string | null>(null);
    private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

    page = signal(0);
    pageCount = computed(() => this.pages().length);

    prevPage() { if (this.page() > 0) this.page.update(p => p - 1); }
    nextPage() { if (this.page() < this.pageCount() - 1) this.page.update(p => p + 1); }

    constructor() {
        effect(() => {
            // Flatten all pages for the progress tracking
            const allStickers = this.pages().flat();
            this.onStickersUpdated.emit(allStickers);
        });
    }

    private createPages(): StickerModel[][] {
        const pages: StickerModel[][] = [];
        const totalPages = Math.ceil(stickerData.length / STICKERS_PER_PAGE);
        
        for (let i = 0; i < totalPages; i++) {
            const startIndex = i * STICKERS_PER_PAGE;
            const endIndex = startIndex + STICKERS_PER_PAGE;
            const pageStickers = stickerData.slice(startIndex, endIndex);
            pages.push(pageStickers);
        }
        
        return pages;
    }

    onCheck(sticker: StickerModel, checked: boolean): void {
        this.pages.update(pages => {
            const newPages = pages.map(page => 
                page.map(s => 
                    s.index === sticker.index ? { ...s, checked } : s
                )
            );
            return newPages;
        });
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
    };
} 