import { NgStyle } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { ChecklistModel } from '../../core/models';
import { TooltipService } from '../../core/services/tooltip.service';

@Component({
  selector: 'mkworld-collectible',
  templateUrl: './collectible.html',
  imports: [NgStyle],
  styleUrl: './collectible.css',
})
export class Collectible {
  private readonly tooltipService = inject(TooltipService);

  readonly checklistModel = input.required<ChecklistModel>();
  readonly isPanning = input(false);
  readonly isFocused = input(false);

  hovered = signal(false);
  readonly appearing = signal(false);

  constructor() {
    setTimeout(() => this.appearing.set(true), 0);
  }

  onClick(): void {
    if (this.isPanning()) {
      return;
    }

    this.tooltipService.setActiveTooltipData(this.checklistModel());
  }
}
