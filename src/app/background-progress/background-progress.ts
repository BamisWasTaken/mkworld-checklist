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

  gradientPosition = computed(() => {
    const percentage = this.progressPercentage();
    return `${Math.max(0, 100 - percentage)}% 0`;
  });

  progressGradient = computed(() => {
    const percentage = this.progressPercentage();

    if (percentage >= 100) {
      return `linear-gradient(135deg, 
        #23272e 0%, 
        #23272e 5%, 
        rgb(199, 170, 9) 15%, 
        rgb(255, 193, 78) 30%, 
        #fff8dc 45%, 
        rgb(204, 174, 4) 60%, 
        #23272e 75%, 
        #23272e 100%
      )`;
    }

    return `linear-gradient(135deg, 
      #23272e 0%, 
      #23272e 5%, 
      #1ccad8 20%, 
      #3ecf4c 35%, 
      #ffdb4d 50%, 
      #ff9900 65%, 
      #23272e 80%, 
      #23272e 100%
    )`;
  });
}
