import { Component, computed, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType } from '../../../core/models';
import { DataService } from '../../../core/services';
import { TooltipService } from '../../../core/services/tooltip.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  imports: [TranslateModule],
})
export class Tooltip {
  private readonly dataService = inject(DataService);
  private readonly tooltipService = inject(TooltipService);
  private readonly domSanitizer = inject(DomSanitizer);

  readonly checklistModel = input.required<ChecklistModel>();
  readonly position = input<'above' | 'below' | 'left' | 'right'>('above');

  readonly CollectibleType = CollectibleType;

  readonly youtubeLink = computed(() => {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${this.checklistModel().collectibleModel!.youtubeLink}`
    );
  });

  onChecked() {
    this.dataService.updateChecklistModelChecked(this.checklistModel());
  }

  onClose() {
    this.tooltipService.setActiveTooltipData(null);
  }
}
