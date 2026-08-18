import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType } from '../../core/models';
import { TooltipPosition } from '../models';

@Component({
  selector: 'mkworld-hover-tooltip',
  templateUrl: './hover-tooltip.html',
  styleUrl: './hover-tooltip.css',
  imports: [TranslatePipe, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoverTooltip {
  readonly checklistModel = input.required<ChecklistModel>();
  readonly position = input<TooltipPosition>(TooltipPosition.ABOVE);

  readonly CollectibleType = CollectibleType;
}
