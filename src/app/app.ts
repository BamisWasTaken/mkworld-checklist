import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChecklistModel, TooltipData } from './core/models';
import { DataService } from './core/services';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { MapSection } from './map-section/map-section';
import { ProgressBar } from './progress-bar/progress-bar';
import { StickerAlbum } from './sticker-album/sticker-album';
import { TodoSection } from './todo-section/todo-section';

@Component({
  selector: 'mkworld-root',
  imports: [TranslateModule, ProgressBar, StickerAlbum, Header, Footer, MapSection, TodoSection],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly translateService = inject(TranslateService);
  private readonly dataService = inject(DataService);

  checklistModelsWithSticker = computed(() =>
    this.dataService
      .getChecklistModels()()
      .filter((checklistModel: ChecklistModel) => checklistModel.hasSticker)
  );
  tooltipData = signal<TooltipData | null>(null);

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
    const collectibleElement = document.getElementById(`collectible-div-${checklistModel.index}`);
    if (mapElement && collectibleElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
