import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType } from '../core/models';

@Component({
  selector: 'mkworld-todo-section',
  templateUrl: './todo-section.html',
  styleUrls: ['./todo-section.css'],
  imports: [TranslateModule],
})
export class TodoSection {
  readonly checklistItems = input.required<ChecklistModel[]>();
  readonly disappearingChecklistItems = input.required<Set<ChecklistModel>>();

  todoItems = computed<ChecklistModel[]>(() => {
    const items = this.checklistItems().filter(
      (item: ChecklistModel) =>
        (!item.checked || this.disappearingChecklistItems().has(item)) && !item.collectibleModel
    );
    const seenInstructions = new Set<string>();
    return items.filter((item: ChecklistModel) => {
      if (seenInstructions.has(item.instructions)) {
        return false;
      }
      seenInstructions.add(item.instructions);
      return true;
    });
  });

  uncollectedPeachCoins = computed<number>(() =>
    this.getUncollectedCount(this.checklistItems(), CollectibleType.PEACH_COIN)
  );
  lastPeachCoinBeingRemoved = computed<boolean>(() =>
    this.isRemovingLastCollectibleType(this.uncollectedPeachCoins(), CollectibleType.PEACH_COIN)
  );

  uncollectedQuestionMarkPanels = computed<number>(() =>
    this.getUncollectedCount(this.checklistItems(), CollectibleType.QUESTIONMARK_PANEL)
  );
  lastQuestionMarkPanelBeingRemoved = computed<boolean>(() =>
    this.isRemovingLastCollectibleType(
      this.uncollectedQuestionMarkPanels(),
      CollectibleType.QUESTIONMARK_PANEL
    )
  );

  uncollectedPSwitches = computed<number>(() =>
    this.getUncollectedCount(this.checklistItems(), CollectibleType.P_SWITCH)
  );
  lastPSwitchBeingRemoved = computed<boolean>(() =>
    this.isRemovingLastCollectibleType(this.uncollectedPSwitches(), CollectibleType.P_SWITCH)
  );

  private getUncollectedCount(checklistItems: ChecklistModel[], type: CollectibleType): number {
    return checklistItems.filter(
      (item: ChecklistModel) => !item.checked && item.collectibleModel?.collectibleType === type
    ).length;
  }

  private isRemovingLastCollectibleType(uncollectedCount: number, type: CollectibleType): boolean {
    let isRemoving = false;
    if (uncollectedCount === 0) {
      this.disappearingChecklistItems().forEach(item => {
        if (item.collectibleModel?.collectibleType === type) {
          isRemoving = true;
        }
      });
    }
    return isRemoving;
  }
}
