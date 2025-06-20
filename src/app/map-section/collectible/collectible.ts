import { NgStyle } from '@angular/common';
import { Component, effect, input, model, output, signal } from '@angular/core';
import { ChecklistModel, TooltipData } from '../../core/models';

@Component({
  selector: 'mkworld-collectible',
  templateUrl: './collectible.html',
  imports: [NgStyle],
  styleUrl: './collectible.css',
})
export class Collectible {
  readonly checklistItem = input.required<ChecklistModel>();
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
      checklistIndex: this.checklistItem().index,
      x: event.pageX,
      y: event.pageY - 10,
    });
  }
}
