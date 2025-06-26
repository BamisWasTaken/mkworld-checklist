import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType } from '../../core/models';
import { ChecklistDataService, TooltipService } from '../../core/services';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  imports: [TranslateModule],
})
export class Tooltip {
  private readonly checklistDataService = inject(ChecklistDataService);
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
    this.checklistDataService.updateChecklistModelChecked(this.checklistModel());
  }

  onClose() {
    this.tooltipService.setActiveTooltipData(null);
  }
}
