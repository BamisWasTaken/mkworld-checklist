import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChecklistModel, TooltipData } from './core/models';
import { DataService } from './core/services';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { Tooltip } from './map-section/collectible/tooltip/tooltip';
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
    TodoSection,
    Tooltip,
  ],
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

  onShowTooltip(tooltipData: TooltipData): void {
    this.tooltipData.set(tooltipData);
  }

  onTooltipClose(): void {
    this.tooltipData.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.tooltipData()) {
      const tooltipElement = document.querySelector('.tooltip') as HTMLElement;
      if (tooltipElement && !tooltipElement.contains(event.target as Node)) {
        this.onTooltipClose();
      }
    }
  }
}
