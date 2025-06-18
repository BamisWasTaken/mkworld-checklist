import { Component, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'mkworld-progress-bar',
    templateUrl: './progress-bar.html',
    styleUrls: ['./progress-bar.css'],
    imports: [TranslateModule]
})
export class ProgressBar {
    progress = signal(0);
    total = signal(1056);

    progressPercent = computed(() => this.total() > 0 ? (this.progress() / this.total()) * 100 : 0);
} 