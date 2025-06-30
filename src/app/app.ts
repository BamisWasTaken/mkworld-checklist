import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChecklistModel } from './core/models';
import { ChecklistDataService } from './core/services';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { MapSection } from './map-section/map-section';
import { ProgressBar } from './progress-bar/progress-bar';
import { StickerAlbum } from './sticker-album/sticker-album';
import { TodoSection } from './todo-section/todo-section';
import { TooltipService } from './core/services/tooltip.service';

@Component({
  selector: 'mkworld-root',
  imports: [TranslateModule, ProgressBar, StickerAlbum, Header, Footer, MapSection, TodoSection],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly translateService = inject(TranslateService);
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly tooltipService = inject(TooltipService);

  checklistModelsWithSticker = computed(() =>
    this.checklistDataService
      .getChecklistModels()()
      .filter((checklistModel: ChecklistModel) => checklistModel.hasSticker)
  );

  progress = computed(
    () => this.checklistModelsWithSticker().filter((item: ChecklistModel) => item.checked).length
  );
  readonly total = this.checklistModelsWithSticker().length;

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }

  onScrollToMap(checklistModel: ChecklistModel): void {
    const mapElement = document.getElementById('map-section');
    if (mapElement && !checklistModel.checked) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      this.tooltipService.setActiveTooltipDataWithScrollProtection(checklistModel);
    }
  }
}
