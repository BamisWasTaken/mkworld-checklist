import { Component, inject, signal } from '@angular/core';
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

  progress = signal(0);
  readonly total = stickerData.length;

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }

  onStickersUpdated(stickers: StickerModel[]): void {
    this.progress.update(() => stickers.filter((sticker: StickerModel) => sticker.checked).length);
  }
}
