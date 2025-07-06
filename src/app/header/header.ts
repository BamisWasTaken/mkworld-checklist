import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'mkworld-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [TranslateModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly isMobile = input.required<boolean>();
}
