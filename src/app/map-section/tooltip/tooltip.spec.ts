import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistDataService, SettingsService, TooltipService } from '../../core/services';
import { Tooltip } from './tooltip';
import { createCollectibleChecklist } from '../../../testing/fixtures';
import { ChecklistModel, CollectibleType } from '../../core/models';

describe('Tooltip', () => {
  let fixture: ComponentFixture<Tooltip>;
  let checklistDataService: ChecklistDataService;
  let tooltipService: TooltipService;
  let settingsService: SettingsService;
  let model: ChecklistModel;

  function createModel(overrides: Partial<ChecklistModel> = {}): ChecklistModel {
    return createCollectibleChecklist(
      { index: 32, checked: false, ...overrides },
      {
        collectibleType: CollectibleType.P_SWITCH,
        youtubeId: 'abc',
        missionName: '32_MISSION_NAME',
      }
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tooltip],
    }).compileComponents();

    // `updateChecklistModelChecked` mutates the model in place, so each test gets its own.
    model = createModel();

    fixture = TestBed.createComponent(Tooltip);
    checklistDataService = TestBed.inject(ChecklistDataService);
    tooltipService = TestBed.inject(TooltipService);
    settingsService = TestBed.inject(SettingsService);
    fixture.componentRef.setInput('checklistModel', model);
    tooltipService.setActiveTooltipData(model);
    fixture.detectChanges();
  });

  function collectButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.collect-button') as HTMLButtonElement;
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark the collectible collected when the collect button is clicked', () => {
    const update = vi.spyOn(checklistDataService, 'updateChecklistModelChecked');

    collectButton().click();

    expect(update).toHaveBeenCalledWith(model);
  });

  it('should close when the close button is clicked', () => {
    const button = fixture.nativeElement.querySelector('.close-button') as HTMLButtonElement;

    button.click();

    expect(tooltipService.getActiveTooltipData()()).toBeUndefined();
  });

  it('should close when collecting while collected collectibles are hidden', () => {
    expect(settingsService.shouldShowCollectedCollectibles()()).toBe(false);
    expect(tooltipService.getActiveTooltipData()()).toBeDefined();

    collectButton().click();

    // The marker disappears from the map, so the tooltip would otherwise hang over empty map.
    expect(tooltipService.getActiveTooltipData()()).toBeUndefined();
  });

  it('should stay open when collecting while collected collectibles are shown', () => {
    settingsService.toggleShowCollectedCollectibles();
    expect(settingsService.shouldShowCollectedCollectibles()()).toBe(true);

    collectButton().click();

    // The marker stays on the map, so the checked collect button remains visible as feedback.
    expect(tooltipService.getActiveTooltipData()()).toBeDefined();
  });

  it('should stay open when uncollecting an already collected collectible', () => {
    fixture.componentRef.setInput('checklistModel', createModel({ checked: true }));
    fixture.detectChanges();

    collectButton().click();

    expect(tooltipService.getActiveTooltipData()()).toBeDefined();
  });
});
