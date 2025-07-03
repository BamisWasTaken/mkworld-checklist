import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly translateService = inject(TranslateService);
  private readonly tooltipService = inject(TooltipService);
  private readonly mapSectionService = inject(MapSectionService);

  pzInstance: PanZoom | null = null;

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
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
