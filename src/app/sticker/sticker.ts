import { Component, effect, input, model, output, signal } from '@angular/core';

@Component({
  selector: 'mkworld-sticker',
  templateUrl: './sticker.html',
  styleUrls: ['./sticker.css'],
})
export class Sticker {
  readonly index = input.required<number>();
  readonly description = input.required<string>();
  readonly checked = model(false);

  readonly onHover = output<boolean>();

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
}
