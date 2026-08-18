import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectibleType } from '../../core/models';
import { ChecklistDataService, SettingsService } from '../../core/services';
import { Settings } from './settings';

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;
  let component: Settings;
  let settingsService: SettingsService;
  let checklistDataService: ChecklistDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Settings],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService);
    checklistDataService = TestBed.inject(ChecklistDataService);
    fixture.componentRef.setInput('visibleCollectibleChecklistModels', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close the settings panel from the toggle button', () => {
    const toggle = fixture.nativeElement.querySelector('.settings-toggle') as HTMLButtonElement;
    expect(component.isSettingsOpen()).toBe(false);

    toggle.click();
    fixture.detectChanges();
    expect(component.isSettingsOpen()).toBe(true);

    toggle.click();
    fixture.detectChanges();
    expect(component.isSettingsOpen()).toBe(false);
  });

  it('should toggle collectible type filters from the checkbox change', () => {
    const addDisappearing = vi.spyOn(checklistDataService, 'addDisappearingChecklistModels');
    if (!settingsService.getShownCollectibleTypes()().includes(CollectibleType.PEACH_COIN)) {
      settingsService.toggleShowCollectibleType(CollectibleType.PEACH_COIN);
    }
    expect(settingsService.getShownCollectibleTypes()()).toContain(CollectibleType.PEACH_COIN);

    const peachCheckbox = fixture.nativeElement.querySelector(
      '#show-peach-coins-map'
    ) as HTMLInputElement;

    peachCheckbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(settingsService.getShownCollectibleTypes()()).not.toContain(CollectibleType.PEACH_COIN);
    expect(addDisappearing).toHaveBeenCalled();
  });
});
