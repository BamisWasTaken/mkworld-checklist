import { NgStyle } from '@angular/common';
import { Component, input, signal, effect } from '@angular/core';
import { StickerModel } from '../../core/models/sticker-model';

@Component({
  selector: 'mkworld-collectible',
  templateUrl: './collectible.html',
  imports: [NgStyle],
  styleUrl: './collectible.css'
})
export class Collectible {
  readonly sticker = input.required<StickerModel>();

  hovered = signal(false);
  disappearing = signal(false);
  appearing = signal(false);

  constructor() {
    setTimeout(() => this.appearing.set(true), 0);

    effect(() => {
      if (this.sticker().checked) {
        this.disappearing.set(true);
      }
    });
  }
}
