import { Component, computed, input, output, Signal } from '@angular/core';
import { ChecklistModel } from '../../../core/models/checklist-model';
import { TooltipData } from '../../../core/models/tooltip-data';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
})
export class Tooltip {
  readonly tooltipData = input.required<TooltipData>();
  readonly checklistItems = input.required<ChecklistModel[]>();

  readonly checked = output<ChecklistModel>();
  readonly close = output<void>();

  readonly checklistItem: Signal<ChecklistModel> = computed(
    () =>
      this.checklistItems().find(
        (checklistItem: ChecklistModel) => checklistItem.index === this.tooltipData().checklistIndex
      )!
  );

  onChecked() {
    this.checked.emit({ ...this.checklistItem(), checked: !this.checklistItem().checked });
  }

  onClose() {
    this.close.emit();
  }
}
