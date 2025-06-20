import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrls: ['./progress-bar.css'],
  imports: [TranslateModule],
})
export class ProgressBar {
  readonly progress = input.required<number>();
  readonly total = input.required<number>();

  progressPercent = computed(() => (this.total() > 0 ? (this.progress() / this.total()) * 100 : 0));
}
