import { TestBed } from '@angular/core/testing';
import { ChecklistDataService } from './checklist-data.service';
import { TooltipService } from './tooltip.service';
import { waitMs } from '../../../testing/async';

describe('TooltipService', () => {
  let service: TooltipService;
  let checklistDataService: ChecklistDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TooltipService);
    checklistDataService = TestBed.inject(ChecklistDataService);
  });

  it('should set and clear the active tooltip', () => {
    const model = checklistDataService.getChecklistModels()()[0];

    service.setActiveTooltipData(model);
    expect(service.getActiveTooltipData()()?.index).toBe(model.index);

    service.setActiveTooltipData(model);
    expect(service.getActiveTooltipData()()).toBeUndefined();
  });

  it('should delay opening when scroll protection is used', async () => {
    const model = checklistDataService.getChecklistModels()()[0];

    service.setActiveTooltipDataWithScrollProtection(model);
    expect(service.getActiveTooltipData()()).toBeUndefined();

    await waitMs(200);

    expect(service.getActiveTooltipData()()?.index).toBe(model.index);
  });
});
