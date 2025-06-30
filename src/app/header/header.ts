import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
