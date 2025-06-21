import { NgStyle } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { ChecklistModel, TooltipData } from '../../core/models';

@Component({
  selector: 'mkworld-collectible',
  templateUrl: './collectible.html',
  imports: [NgStyle],
  styleUrl: './collectible.css',
})
export class Collectible {
  readonly checklistModel = input.required<ChecklistModel>();

  readonly showTooltip = output<TooltipData>();

  hovered = signal(false);
  appearing = signal(false);

  constructor() {
    setTimeout(() => this.appearing.set(true), 0);
  }

  onClick(event: MouseEvent) {
    this.showTooltip.emit({
      checklistModel: this.checklistModel(),
      x: event.pageX,
      y: event.pageY - 10,
    });
  }
}
