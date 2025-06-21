import { Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel } from '../../../core/models';
import { DataService } from '../../../core/services';
import { TooltipService } from '../../../core/services/tooltip.service';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  imports: [TranslateModule],
})
export class Tooltip {
  private readonly dataService = inject(DataService);
  private readonly tooltipService = inject(TooltipService);

  readonly checklistModel = input.required<ChecklistModel>();
  readonly position = input<'above' | 'below' | 'left' | 'right'>('above');

  onChecked() {
    this.dataService.updateChecklistModelChecked(this.checklistModel());
  }

  onClose() {
    this.tooltipService.setActiveTooltipData(null);
  }
}
