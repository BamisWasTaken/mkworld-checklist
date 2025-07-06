import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PanZoom } from 'panzoom';
import { BackgroundProgress } from './background-progress/background-progress';
import { ChecklistModel } from './core/models';
import { MapSectionService } from './core/services';
import { TooltipService } from './core/services/tooltip.service';
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
  private readonly tooltipService = inject(TooltipService);
  private readonly mapSectionService = inject(MapSectionService);
  private readonly platformId = inject(PLATFORM_ID);

  pzInstance: PanZoom | null = null;
  isMobileView = signal(false);

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');

    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth < 1024);

      window.addEventListener('resize', () => {
        this.isMobileView.set(window.innerWidth < 1024);
      });
    }
  }

  onScrollToMap(checklistModel: ChecklistModel): void {
    const mapElement = document.getElementById('map-section');
    if (mapElement) {
      if (!this.pzInstance) {
        this.pzInstance = this.mapSectionService.getPanzoomInstance();
      }
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const x = (1024 / 100) * ((checklistModel.collectibleModel!.xPercentage - 25) * 2);
      const y = (1281 / 100) * ((checklistModel.collectibleModel!.yPercentage - 25) * 2);
      this.pzInstance.zoomAbs(0, 0, 2);
      this.pzInstance.moveTo(-x, -y);

      this.tooltipService.setActiveTooltipDataWithScrollProtection(checklistModel);
    }
  }
}
