import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType } from '../core/models';
import { DataService } from '../core/services';

@Component({
  selector: 'mkworld-todo-section',
  templateUrl: './todo-section.html',
  styleUrls: ['./todo-section.css'],
  imports: [TranslateModule],
})
export class TodoSection {
  private readonly dataService = inject(DataService);

  readonly disappearingChecklistModels = this.dataService.getDisappearingChecklistModels();

  todoItems = computed<ChecklistModel[]>(() => {
    const checklistModels = this.dataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          (!checklistModel.checked || this.disappearingChecklistModels().has(checklistModel)) &&
          !checklistModel.collectibleModel
      );
    const seenInstructions = new Set<string>();
    return checklistModels.filter((checklistModel: ChecklistModel) => {
      if (seenInstructions.has(checklistModel.instructions)) {
        return false;
      }
      seenInstructions.add(checklistModel.instructions);
      return true;
    });
  });

  uncollectedPeachCoins = computed<number>(() =>
    this.getUncollectedCount(this.dataService.getChecklistModels()(), CollectibleType.PEACH_COIN)
  );
  lastPeachCoinBeingRemoved = computed<boolean>(() =>
    this.isRemovingLastCollectibleType(this.uncollectedPeachCoins(), CollectibleType.PEACH_COIN)
  );

  uncollectedQuestionMarkPanels = computed<number>(() =>
    this.getUncollectedCount(
      this.dataService.getChecklistModels()(),
      CollectibleType.QUESTIONMARK_PANEL
    )
  );
  lastQuestionMarkPanelBeingRemoved = computed<boolean>(() =>
    this.isRemovingLastCollectibleType(
      this.uncollectedQuestionMarkPanels(),
      CollectibleType.QUESTIONMARK_PANEL
    )
  );

  uncollectedPSwitches = computed<number>(() =>
    this.getUncollectedCount(this.dataService.getChecklistModels()(), CollectibleType.P_SWITCH)
  );
  lastPSwitchBeingRemoved = computed<boolean>(() =>
    this.isRemovingLastCollectibleType(this.uncollectedPSwitches(), CollectibleType.P_SWITCH)
  );

  private getUncollectedCount(checklistModels: ChecklistModel[], type: CollectibleType): number {
    return checklistModels.filter(
      (checklistModel: ChecklistModel) =>
        !checklistModel.checked && checklistModel.collectibleModel?.collectibleType === type
    ).length;
  }

  private isRemovingLastCollectibleType(uncollectedCount: number, type: CollectibleType): boolean {
    let isRemoving = false;
    if (uncollectedCount === 0) {
      this.disappearingChecklistModels().forEach((checklistModel: ChecklistModel) => {
        if (checklistModel.collectibleModel?.collectibleType === type) {
          isRemoving = true;
        }
      });
    }
    return isRemoving;
  }
}
