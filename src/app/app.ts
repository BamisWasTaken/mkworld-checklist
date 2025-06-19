import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { stickerData } from './core/data/sticker-data';
import { StickerModel } from './core/models';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { MapSection } from './map-section/map-section';
import { ProgressBar } from './progress-bar/progress-bar';
import { StickerAlbum } from './sticker-album/sticker-album';
import { TodoSection } from './todo-section/todo-section';

@Component({
  selector: 'mkworld-root',
  imports: [
    TranslateModule,
    ProgressBar,
    StickerAlbum,
    Header,
    Footer,
    MapSection,
    TodoSection
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly translateService = inject(TranslateService);

  stickers = signal<StickerModel[]>(stickerData);
  readonly disappearingStickers = signal<Set<StickerModel>>(new Set());

  progress = computed(() => this.stickers().filter((sticker: StickerModel) => sticker.checked).length);
  readonly total = stickerData.length;

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }

  onStickerChecked(sticker: StickerModel): void {
    this.stickers.update(stickers => stickers.map(s => s.index === sticker.index ? sticker : s));
    if (sticker.checked && !this.disappearingStickers().has(sticker)) {
      const newSet = new Set(this.disappearingStickers());
      newSet.add(sticker);
      this.disappearingStickers.set(newSet);
      setTimeout(() => {
        const afterSet = new Set(this.disappearingStickers());
        afterSet.delete(sticker);
        this.disappearingStickers.set(afterSet);
      }, 200);
    }
  }
}
