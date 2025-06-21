import { Injectable, Signal, signal } from '@angular/core';
import { ChecklistModel } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TooltipService {
  private activeTooltipData = signal<ChecklistModel | null>(null);
  private isScrollingToTooltip = signal(false);

  setActiveTooltipData(checklistModel: ChecklistModel | null): void {
    if (this.activeTooltipData()?.index === checklistModel?.index) {
      this.activeTooltipData.set(null);
      return;
    }

    this.activeTooltipData.set(checklistModel);
  }

  setActiveTooltipDataWithScrollProtection(checklistModel: ChecklistModel | null): void {
    this.isScrollingToTooltip.set(true);
    this.setActiveTooltipData(checklistModel);

    // Clear the scroll protection after a short delay
    setTimeout(() => {
      this.isScrollingToTooltip.set(false);
    }, 200);
  }

  isScrollingToTooltipActive(): Signal<boolean> {
    return this.isScrollingToTooltip;
  }

  getActiveTooltipData(): Signal<ChecklistModel | null> {
    return this.activeTooltipData;
  }
}
