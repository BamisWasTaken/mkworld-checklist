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
  readonly isPanning = input(false);
  readonly isFocused = input(false);

  readonly showTooltip = output<TooltipData>();

  hovered = signal(false);
  readonly appearing = signal(false);

  constructor() {
    setTimeout(() => this.appearing.set(true), 0);
  }

  onClick(): void {
    if (this.isPanning()) {
      return;
    }

    const { collectibleModel } = this.checklistModel();
    if (collectibleModel) {
      this.showTooltip.emit({
        checklistModel: this.checklistModel(),
        x: collectibleModel.xPercentage,
        y: collectibleModel.yPercentage,
      });
    }
  }
}
