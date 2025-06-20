import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import panzoom, { PanZoom } from 'panzoom';
import { ChecklistModel, TooltipData } from '../core/models';
import { Collectible } from './collectible/collectible';

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule, Collectible],
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly checklistItems = input.required<ChecklistModel[]>();
  readonly disappearingChecklistItems = input.required<Set<ChecklistModel>>();

  readonly onChecklistItemChecked = output<ChecklistModel>();
  readonly showTooltip = output<TooltipData>();

  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;

  readonly collectibleChecklistItems = computed(() =>
    this.checklistItems().filter(
      checklistItem =>
        checklistItem.collectibleModel &&
        (!checklistItem.checked || this.disappearingChecklistItems().has(checklistItem))
    )
  );

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
