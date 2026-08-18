import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-help',
  templateUrl: './help.html',
  styleUrls: ['./help.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe],
})
export class Help {
  readonly isOpen = input.required<boolean>();
  readonly closeHelp = output<void>();
}
