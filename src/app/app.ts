import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { checklistData } from './core/data/checklist-data';
import { ChecklistModel, TooltipData } from './core/models';
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

  checklistItems = signal<ChecklistModel[]>(checklistData);
  checklistItemsWithSticker = computed(() => this.checklistItems().filter(item => item.hasSticker));
  tooltipData = signal<TooltipData | null>(null);

  readonly disappearingChecklistItems = signal<Set<ChecklistModel>>(new Set());

  progress = computed(
    () => this.checklistItemsWithSticker().filter((item: ChecklistModel) => item.checked).length
  );
  readonly total = this.checklistItemsWithSticker().length;

  constructor() {
    this.translateService.addLangs(['en']);
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }

  onScrollToMap(checklistItem: ChecklistModel): void {
    const mapElement = document.getElementById('map-section');
    const collectibleElement = document.getElementById(`collectible-div-${checklistItem.index}`);
    if (mapElement && collectibleElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onChecklistItemChecked(checklistItem: ChecklistModel): void {
    this.checklistItems.update(items =>
      items.map(i => (i.index === checklistItem.index ? checklistItem : i))
    );

    if (checklistItem.checked && !this.disappearingChecklistItems().has(checklistItem)) {
      const newSet = new Set(this.disappearingChecklistItems());
      newSet.add(checklistItem);
      this.disappearingChecklistItems.set(newSet);
      setTimeout(() => {
        const afterSet = new Set(this.disappearingChecklistItems());
        afterSet.delete(checklistItem);
        this.disappearingChecklistItems.set(afterSet);
      }, 200);
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
