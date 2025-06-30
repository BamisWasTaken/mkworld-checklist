import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
