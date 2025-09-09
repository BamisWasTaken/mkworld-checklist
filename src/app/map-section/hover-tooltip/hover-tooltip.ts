import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipPosition } from '../models';
import { ChecklistModel, CollectibleType } from '../../core/models';

@Component({
  selector: 'mkworld-hover-tooltip',
  templateUrl: './hover-tooltip.html',
  styleUrl: './hover-tooltip.css',
  imports: [TranslateModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoverTooltip {
  readonly checklistModel = input.required<ChecklistModel>();
  readonly position = input<TooltipPosition>(TooltipPosition.ABOVE);

  readonly CollectibleType = CollectibleType;
}
