import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BackgroundProgress } from './background-progress/background-progress';
import { MobileService } from './core/services/mobile.service';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { MapSection } from './map-section/map-section';
import { StickerAlbum } from './sticker-album/sticker-album';
import { TodoSection } from './todo-section/todo-section';

@Component({
  selector: 'mkworld-root',
  imports: [
    TranslateModule,
    StickerAlbum,
    Header,
    Footer,
    MapSection,
    TodoSection,
    BackgroundProgress,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly translateService = inject(TranslateService);
  private readonly mobileService = inject(MobileService);

  isMobileView = this.mobileService.getIsMobileView();

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }
}
