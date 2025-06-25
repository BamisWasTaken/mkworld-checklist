import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ChecklistModel } from '../core/models';
import { DataService } from '../core/services';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-sticker',
  templateUrl: './sticker.html',
  styleUrls: ['./sticker.css'],
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sticker {
  private readonly dataService = inject(DataService);

  readonly checklistModel = input.required<ChecklistModel>();

  readonly onHover = output<boolean>();
  readonly onShowTooltip = output<{ instructions: string; event: MouseEvent }>();
  readonly onGoToMap = output<ChecklistModel>();
  readonly onChecked = output<void>();

  hovered = signal(false);

  constructor() {
    effect(() => {
      this.onHover.emit(this.hovered());
    });
  }

  toggleCheck() {
    this.dataService.updateChecklistModelChecked(this.checklistModel());
    this.onChecked.emit();
  }

  onMouseEnter() {
    this.hovered.set(true);
  }

  onMouseLeave() {
    this.hovered.set(false);
  }

  onStickerClick(event: MouseEvent) {
    if (this.checklistModel().collectibleModel) {
      this.onGoToMap.emit(this.checklistModel());
    } else {
      this.onShowTooltip.emit({
        instructions: this.checklistModel().instructions,
        event: event,
      });
    }
  }
}
