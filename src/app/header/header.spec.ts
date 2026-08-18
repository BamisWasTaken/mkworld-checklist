import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistDataService, ImportExportService } from '../core/services';
import { QuickAction } from '../core/models';
import { Header } from './header';
import { dispatchMouse } from '../../testing/dispatch-events';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let importExportService: ImportExportService;
  let checklistDataService: ChecklistDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    importExportService = TestBed.inject(ImportExportService);
    checklistDataService = TestBed.inject(ChecklistDataService);
    fixture.detectChanges();
  });

  function header(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the settings dropdown on a document click outside the container', () => {
    header().querySelector('.settings-dropdown-container button')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    fixture.detectChanges();
    expect(component.isSettingsDropdownOpen()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isSettingsDropdownOpen()).toBe(false);
  });

  it('should keep the settings dropdown open when clicking inside it', () => {
    header().querySelector('.settings-dropdown-container button')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    fixture.detectChanges();

    header().querySelector('.settings-dropdown')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isSettingsDropdownOpen()).toBe(true);
  });

  it('should run a quick action only after confirmation', () => {
    const perform = vi.spyOn(checklistDataService, 'performQuickAction');

    header().querySelector('.settings-dropdown-container button')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    fixture.detectChanges();
    header().querySelector('.settings-dropdown div.px-4')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    fixture.detectChanges();

    expect(component.isConfirmationOpen()).toBe(true);
    expect(perform).not.toHaveBeenCalled();

    const buttons = fixture.nativeElement.querySelectorAll('mkworld-confirmation-popup button');
    dispatchMouse(buttons[0], 'click');
    fixture.detectChanges();
    expect(perform).not.toHaveBeenCalled();

    header().querySelector('.settings-dropdown-container button')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    fixture.detectChanges();
    header().querySelector('.settings-dropdown div.px-4')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    fixture.detectChanges();
    const confirmButtons = fixture.nativeElement.querySelectorAll('mkworld-confirmation-popup button');
    dispatchMouse(confirmButtons[1], 'click');
    fixture.detectChanges();

    expect(perform).toHaveBeenCalledWith(QuickAction.CHECK_ALL_QUESTIONMARK_PANELS);
  });

  it('should not import invalid JSON save files', async () => {
    const importSpy = vi.spyOn(importExportService, 'importSaveFile');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    const file = new File(['not-json'], 'save.json', { type: 'application/json' });
    const input = header().querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(window.alert).toHaveBeenCalled();
    });
    expect(consoleError).toHaveBeenCalledWith(expect.any(SyntaxError));
    expect(importSpy).not.toHaveBeenCalled();
  });
});
