import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { QuickAction } from '../../core/models/quick-action';

@Component({
  selector: 'mkworld-confirmation-popup',
  templateUrl: './confirmation-popup.html',
  styleUrls: ['./confirmation-popup.css'],
  imports: [TranslatePipe],
})
export class ConfirmationPopup {
  readonly isOpen = input.required<boolean>();
  readonly quickAction = input<QuickAction | null>(null);
  readonly confirmed = output<boolean>();
}
