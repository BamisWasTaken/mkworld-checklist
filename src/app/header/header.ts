import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Help } from './help/help';
import { ConfirmationPopup } from './confirmation-popup/confirmation-popup';
import { ChecklistDataService, ImportExportService, MobileService } from '../core/services';
import { QuickAction } from '../core/models';

@Component({
  selector: 'mkworld-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [TranslateModule, NgOptimizedImage, Help, ConfirmationPopup],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly importExportService = inject(ImportExportService);
  private readonly translateService = inject(TranslateService);
  private readonly mobileService = inject(MobileService);
  private readonly checklistDataService = inject(ChecklistDataService);

  readonly isMobile = this.mobileService.getIsMobileView();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  isHelpOpen = signal(false);

  isSettingsDropdownOpen = signal(false);
  selectedQuickAction = signal<QuickAction | null>(null);
  isConfirmationOpen = signal(false);

  readonly quickActions = Object.values(QuickAction);

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

  toggleSettingsDropdown(): void {
    this.isSettingsDropdownOpen.update(open => !open);
  }

  closeSettingsDropdown(): void {
    this.isSettingsDropdownOpen.set(false);
  }

  onQuickActionSelected(quickAction: QuickAction): void {
    this.selectedQuickAction.set(quickAction);
    this.isConfirmationOpen.set(true);
    this.closeSettingsDropdown();
  }

  onConfirmationResult(confirmed: boolean): void {
    this.isConfirmationOpen.set(false);

    if (confirmed) {
      this.checklistDataService.performQuickAction(this.selectedQuickAction()!);
    }

    setTimeout(() => {
      this.selectedQuickAction.set(null);
    }, 300);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isSettingsDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.settings-dropdown-container')) {
        this.closeSettingsDropdown();
      }
    }
  }
}
