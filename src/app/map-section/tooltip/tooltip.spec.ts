import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistDataService, TooltipService } from '../../core/services';
import { Tooltip } from './tooltip';
import { createCollectibleChecklist } from '../../../testing/fixtures';
import { CollectibleType } from '../../core/models';

describe('Tooltip', () => {
  let fixture: ComponentFixture<Tooltip>;
  let checklistDataService: ChecklistDataService;
  let tooltipService: TooltipService;
  const model = createCollectibleChecklist(
    { index: 32, checked: false },
    { collectibleType: CollectibleType.P_SWITCH, youtubeId: 'abc', missionName: '32_MISSION_NAME' }
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tooltip],
    }).compileComponents();

    fixture = TestBed.createComponent(Tooltip);
    checklistDataService = TestBed.inject(ChecklistDataService);
    tooltipService = TestBed.inject(TooltipService);
    fixture.componentRef.setInput('checklistModel', model);
    tooltipService.setActiveTooltipData(model);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark the collectible collected when the collect button is clicked', () => {
    const update = vi.spyOn(checklistDataService, 'updateChecklistModelChecked');
    const button = fixture.nativeElement.querySelector('.collect-button') as HTMLButtonElement;
    button.click();
    expect(update).toHaveBeenCalledWith(model);
  });

  it('should close when the close button is clicked', () => {
    const button = fixture.nativeElement.querySelector('.close-button') as HTMLButtonElement;
    button.click();
    expect(tooltipService.getActiveTooltipData()()).toBeUndefined();
  });
});
