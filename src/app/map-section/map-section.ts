import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  output,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import panzoom, { PanZoom } from 'panzoom';
import { ChecklistModel, TooltipData } from '../core/models';
import { Collectible } from './collectible/collectible';
import { DataService } from '../core/services';

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule, Collectible],
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly showTooltip = output<TooltipData>();

  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;

  readonly collectibleChecklistModels = computed(() => {
    const checklistModels = this.dataService.getChecklistModels()();
    const disappearingChecklistModels = this.dataService.getDisappearingChecklistModels()();

    return checklistModels.filter(
      (checklistModel: ChecklistModel) =>
        checklistModel.collectibleModel &&
        (!checklistModel.checked || disappearingChecklistModels.has(checklistModel))
    );
  });

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.pzInstance = panzoom(this.mapPanzoomRef()!.nativeElement, {
        bounds: true,
        boundsPadding: 1,
        minZoom: 1,
        maxZoom: 10,
      });

      this.pzInstance.on('panstart', () => (this.isPanning = true));
      this.pzInstance.on('panend', () => (this.isPanning = false));
    }
  }

  ngOnDestroy(): void {
    if (this.pzInstance) {
      this.pzInstance.dispose();
    }
  }

  onShowTooltip(tooltipData: TooltipData) {
    this.showTooltip.emit(tooltipData);
  }
}
