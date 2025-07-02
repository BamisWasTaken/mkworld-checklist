import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { ChecklistModel } from '../models';
import { ChecklistDataService } from './checklist-data.service';

@Injectable({
  providedIn: 'root',
})
export class TooltipService {
  private readonly checklistDataService = inject(ChecklistDataService);

  private readonly activeTooltipIndex = signal<number | null>(null);
  private readonly activeTooltipData = computed(() =>
    this.checklistDataService
      .getChecklistModels()()
      .find((checklistModel: ChecklistModel) => checklistModel.index === this.activeTooltipIndex())
  );

  setActiveTooltipData(checklistModel: ChecklistModel | null): void {
    if (this.activeTooltipIndex() === checklistModel?.index) {
      this.activeTooltipIndex.set(null);
      return;
    }

    this.activeTooltipIndex.set(checklistModel?.index ?? null);
  }

  setActiveTooltipDataWithScrollProtection(checklistModel: ChecklistModel | null): void {
    setTimeout(() => {
      this.setActiveTooltipData(checklistModel);
    }, 200);
  }

  getActiveTooltipData(): Signal<ChecklistModel | undefined> {
    return this.activeTooltipData;
  }
}
