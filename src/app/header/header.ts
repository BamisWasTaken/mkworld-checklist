import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ImportExportService } from '../core/services/import-export.service';
import { MobileService } from '../core/services/mobile.service';
import { Help } from '../help/help';

@Component({
  selector: 'mkworld-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [TranslateModule, NgOptimizedImage, Help],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly importExportService = inject(ImportExportService);
  private readonly translateService = inject(TranslateService);
  private readonly mobileService = inject(MobileService);

  readonly isMobile = this.mobileService.getIsMobileView();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  isHelpOpen = signal(false);

  downloadSaveFile(): void {
    this.importExportService.exportSaveFile();
  }

  uploadSaveFile(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const saveFile = JSON.parse(e.target?.result as string);
          this.importExportService.importSaveFile(saveFile);
        } catch (error: unknown) {
          console.error(error);
          alert(this.translateService.instant('HEADER.ERROR_PARSING_SAVE_FILE'));
        }
      };
      reader.readAsText(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  openHelp(): void {
    this.isHelpOpen.set(true);
  }

  closeHelp(): void {
    this.isHelpOpen.set(false);
  }
}
