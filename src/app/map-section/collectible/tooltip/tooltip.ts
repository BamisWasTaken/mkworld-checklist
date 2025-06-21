import { Component, inject, input, output } from '@angular/core';
import { TooltipData } from '../../../core/models/tooltip-data';
import { DataService } from '../../../core/services';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
})
export class Tooltip {
  private readonly dataService = inject(DataService);

  readonly tooltipData = input.required<TooltipData>();

  readonly close = output<void>();

  onChecked() {
    this.dataService.updateChecklistModelChecked(this.tooltipData().checklistModel);
  }

  onClose() {
    this.close.emit();
  }
}
