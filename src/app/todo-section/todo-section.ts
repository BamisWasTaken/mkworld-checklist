import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType, Achievement, Milestone } from '../core/models';
import { AchievementDataService, ChecklistDataService } from '../core/services';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'mkworld-todo-section',
  templateUrl: './todo-section.html',
  styleUrls: ['./todo-section.css'],
  imports: [TranslateModule, DecimalPipe],
})
export class TodoSection {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly achievementDataService = inject(AchievementDataService);

  readonly disappearingChecklistModels = this.checklistDataService.getDisappearingChecklistModels();
  readonly achievements = this.achievementDataService.getAchievements();

  // Track expanded achievements
  readonly expandedAchievements = signal<Set<number>>(new Set());

  readonly uncollectedPeachCoins = computed(() => {
    return this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          checklistModel.collectibleModel?.collectibleType === CollectibleType.PEACH_COIN
      )
      .filter((checklistModel: ChecklistModel) => !checklistModel.checked).length;
  });

  readonly uncollectedQuestionMarkPanels = computed(() => {
    return this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          checklistModel.collectibleModel?.collectibleType === CollectibleType.QUESTIONMARK_PANEL
      )
      .filter((checklistModel: ChecklistModel) => !checklistModel.checked).length;
  });

  readonly uncollectedPSwitches = computed(() => {
    return this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          checklistModel.collectibleModel?.collectibleType === CollectibleType.P_SWITCH
      )
      .filter((checklistModel: ChecklistModel) => !checklistModel.checked).length;
  });

  readonly lastPeachCoinBeingRemoved = computed(() => {
    return this.uncollectedPeachCoins() === 0 && this.disappearingChecklistModels().size > 0;
  });

  readonly lastQuestionMarkPanelBeingRemoved = computed(() => {
    return (
      this.uncollectedQuestionMarkPanels() === 0 && this.disappearingChecklistModels().size > 0
    );
  });

  readonly lastPSwitchBeingRemoved = computed(() => {
    return this.uncollectedPSwitches() === 0 && this.disappearingChecklistModels().size > 0;
  });

  readonly todoItems = computed(() => {
    const checklistModels = this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          (!checklistModel.checked || this.disappearingChecklistModels().has(checklistModel)) &&
          !checklistModel.collectibleModel
      );
    const seenInstructions = new Set<string>();
    return checklistModels.filter((checklistModel: ChecklistModel) => {
      if (
        seenInstructions.has(checklistModel.instructions) ||
        checklistModel.instructions === 'SHARED.MILESTONE_REACHED_INSTRUCTIONS'
      ) {
        return false;
      }
      seenInstructions.add(checklistModel.instructions);
      return true;
    });
  });

  toggleAchievementExpanded(achievementIndex: number): void {
    const current = this.expandedAchievements();
    const newSet = new Set(current);

    if (newSet.has(achievementIndex)) {
      newSet.delete(achievementIndex);
    } else {
      newSet.add(achievementIndex);
    }

    this.expandedAchievements.set(newSet);
  }

  onMilestoneCheck(achievement: Achievement, milestone: Milestone): void {
    this.achievementDataService.updateAchievementMilestoneReached(achievement, milestone);
  }
}
