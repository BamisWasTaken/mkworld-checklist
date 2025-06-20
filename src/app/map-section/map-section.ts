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
import { StickerModel } from '../core/models/sticker-model';
import { Collectible } from './collectible/collectible';
import { TooltipData } from '../core/models';

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule, Collectible],
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly stickers = input.required<StickerModel[]>();
  readonly disappearingStickers = input.required<Set<StickerModel>>();

  readonly onStickerChecked = output<StickerModel>();
  readonly showTooltip = output<TooltipData>();

  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');

  private pzInstance: PanZoom | null = null;
  protected isPanning = false;

  readonly collectibles = computed(() =>
    this.stickers().filter(
      sticker =>
        sticker.mapPosition && (!sticker.checked || this.disappearingStickers().has(sticker))
    )
  );

  onShowTooltip(tooltipData: TooltipData) {
    this.showTooltip.emit(tooltipData);
  }

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
}
