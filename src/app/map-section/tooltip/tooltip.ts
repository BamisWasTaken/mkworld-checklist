import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType } from '../../core/models';
import { ChecklistDataService, TooltipService } from '../../core/services';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'mkworld-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  imports: [TranslateModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tooltip {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly tooltipService = inject(TooltipService);
  private readonly domSanitizer = inject(DomSanitizer);

  readonly checklistModel = input.required<ChecklistModel>();
  readonly position = input<'above' | 'below' | 'left' | 'right'>('above');

  readonly CollectibleType = CollectibleType;

  readonly youtubeLink = computed(() =>
    this.domSanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${this.checklistModel().collectibleModel!.youtubeId}`
    )
  );

  onChecked() {
    this.checklistDataService.updateChecklistModelChecked(this.checklistModel());
  }

  onClose() {
    this.tooltipService.setActiveTooltipData(null);
  }
}
