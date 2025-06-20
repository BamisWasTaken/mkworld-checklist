import { Component, computed, input, output } from '@angular/core';
import { TooltipData } from '../../../core/models/tooltip-data';
import { StickerModel } from '../../../core/models/sticker-model';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
})
export class Tooltip {
  readonly tooltipData = input.required<TooltipData>();
  readonly stickers = input.required<StickerModel[]>();

  readonly checked = output<StickerModel>();
  readonly close = output<void>();

  readonly sticker = computed(() => this.stickers()[this.tooltipData().stickerIndex]);

  onChecked() {
    this.checked.emit({
      ...this.sticker(),
      checked: !this.sticker().checked,
    });
  }

  onClose() {
    this.close.emit();
  }
}
