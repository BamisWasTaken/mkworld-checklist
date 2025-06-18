import { Component, input, model, signal } from '@angular/core';

@Component({
    selector: 'mkworld-sticker',
    templateUrl: './sticker.html',
    styleUrls: ['./sticker.css']
})
export class Sticker {
    readonly index = input.required<number>();
    readonly checked = model(false);
    hovered = signal(false);

    toggleCheck() {
        this.checked.update(v => !v);
    }
} 