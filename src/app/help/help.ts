import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-help',
  templateUrl: './help.html',
  styleUrls: ['./help.css'],
  imports: [TranslateModule],
})
export class Help {
  readonly isOpen = input.required<boolean>();
  readonly closeHelp = output<void>();
}
