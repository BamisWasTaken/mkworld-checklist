import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgressBar } from './progress-bar/progress-bar';
import { StickerAlbum } from './sticker-album/sticker-album';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { MapSection } from './map-section/map-section';
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
  
  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }
}
