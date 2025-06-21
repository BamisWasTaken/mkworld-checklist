import { Component, inject, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipData } from '../../../core/models';
import { DataService } from '../../../core/services';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  imports: [TranslateModule],
})
export class Tooltip {
  private readonly dataService = inject(DataService);

  readonly tooltipData = input.required<TooltipData>();
  readonly position = input<'above' | 'below' | 'left' | 'right'>('above');

  readonly close = output<void>();

  onChecked() {
    this.dataService.updateChecklistModelChecked(this.tooltipData().checklistModel);
  }

  onClose() {
    this.close.emit();
  }
}
