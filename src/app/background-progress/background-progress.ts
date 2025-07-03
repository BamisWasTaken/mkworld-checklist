import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChecklistDataService } from '../core/services';

@Component({
  selector: 'mkworld-background-progress',
  templateUrl: './background-progress.html',
  styleUrls: ['./background-progress.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundProgress {
  private readonly checklistDataService = inject(ChecklistDataService);

  readonly progress = this.checklistDataService.getProgress();
  readonly total = this.checklistDataService.getTotal();

  progressPercentage = computed(() => {
    if (this.total() === 0) return 0;
    return (this.progress() / this.total()) * 100;
  });

  progressGradient = computed(() => {
    const percentage = this.progressPercentage();

    if (percentage >= 100) {
      return `linear-gradient(135deg, 
        #23272e 0%, 
        #ffd700 ${Math.max(0, percentage - 30)}%, 
rgb(255, 193, 78) ${Math.max(0, percentage - 15)}%, 
        #fff8dc ${Math.max(0, percentage - 5)}%, 
        #ffd700 ${percentage}%, 
        #23272e ${Math.min(100, percentage + 5)}%
      )`;
    }

    return `linear-gradient(135deg, 
      #23272e 0%, 
      #1ccad8 ${Math.max(0, percentage - 20)}%, 
      #3ecf4c ${Math.max(0, percentage - 10)}%, 
      #ffdb4d ${Math.max(0, percentage - 5)}%, 
      #ff9900 ${percentage}%, 
      #23272e ${Math.min(100, percentage + 5)}%
    )`;
  });
}
