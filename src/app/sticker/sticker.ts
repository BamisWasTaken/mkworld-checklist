import { Component, effect, input, model, output, signal } from '@angular/core';
import { ChecklistModel } from '../core/models';

@Component({
  selector: 'mkworld-sticker',
  templateUrl: './sticker.html',
  styleUrls: ['./sticker.css'],
})
export class Sticker {
  readonly checklistItem = input.required<ChecklistModel>();
  readonly checked = model(false);

  readonly onHover = output<boolean>();
  readonly onShowTooltip = output<{ instructions: string; event: MouseEvent }>();
  readonly onGoToMap = output<ChecklistModel>();

  hovered = signal(false);

  constructor() {
    effect(() => {
      this.onHover.emit(this.hovered());
    });
  }

  toggleCheck() {
    this.checked.update((checked: boolean) => !checked);
  }

  onMouseEnter() {
    this.hovered.set(true);
  }

  onMouseLeave() {
    this.hovered.set(false);
  }

  onStickerClick(event: MouseEvent) {
    if (this.checklistItem().collectibleModel) {
      this.onGoToMap.emit(this.checklistItem());
    } else {
      this.onShowTooltip.emit({
        instructions: this.checklistItem().instructions,
        event: event,
      });
    }
  }
}
