import { NgStyle } from '@angular/common';
import { Component, input, signal, effect, model, output, ElementRef, inject } from '@angular/core';
import { StickerModel } from '../../core/models/sticker-model';
import { TooltipData } from '../../core/models/tooltip-data';

@Component({
  selector: 'mkworld-collectible',
  templateUrl: './collectible.html',
  imports: [NgStyle],
  styleUrl: './collectible.css',
})
export class Collectible {
  private readonly elementRef = inject(ElementRef);

  readonly sticker = input.required<StickerModel>();
  readonly checked = model(false);

  readonly showTooltip = output<TooltipData>();

  hovered = signal(false);
  disappearing = signal(false);
  appearing = signal(false);

  constructor() {
    setTimeout(() => this.appearing.set(true), 0);

    effect(() => {
      if (this.checked()) {
        this.disappearing.set(true);
      }
    });
  }

  onCheckedChange(checked: boolean) {
    this.checked.set(checked);
  }

  onClick(event: MouseEvent) {
    this.showTooltip.emit({
      stickerIndex: this.sticker().index,
      x: event.pageX,
      y: event.pageY - 10,
    });
  }
}
