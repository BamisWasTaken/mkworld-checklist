import { Component, signal, computed, WritableSignal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Sticker } from '../sticker/sticker';

const TOTAL_STICKERS = 1056;
const STICKERS_PER_PAGE = 32;

type StickerType = { index: number; checked: boolean };

@Component({
    selector: 'mkworld-sticker-album',
    imports: [Sticker, TranslateModule],
    templateUrl: './sticker-album.html',
    styleUrls: ['./sticker-album.css']
})
export class StickerAlbum {
    page = signal(0);
    stickers: WritableSignal<StickerType[]> = signal(Array.from({ length: TOTAL_STICKERS }, (_, i) => ({ index: i, checked: false })));

    pageCount = computed(() => Math.ceil(TOTAL_STICKERS / STICKERS_PER_PAGE));
    pageStickers = computed(() => this.stickers().slice(this.page() * STICKERS_PER_PAGE, (this.page() + 1) * STICKERS_PER_PAGE));

    prevPage() { if (this.page() > 0) this.page.update(p => p - 1); }
    nextPage() { if (this.page() < this.pageCount() - 1) this.page.update(p => p + 1); }

    onCheck(sticker: StickerType, checked: boolean) {
        this.stickers.update(s => {
            const arr = [...s];
            arr[sticker.index] = { ...arr[sticker.index], checked };
            return arr;
        });
    }
} 