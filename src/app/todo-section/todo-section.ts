import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChecklistModel, CollectibleType, Achievement } from '../core/models';
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

  // Track disappearing milestones
  readonly disappearingMilestones = signal<Set<string>>(new Set());

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

  readonly achievementsWithVisibleMilestones = computed(() => {
    return this.achievements().map(achievement => ({
      ...achievement,
      visibleMilestones: this.getVisibleMilestones(achievement),
    }));
  });

  private readonly seenInstructions = new Set<string>();

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

  isMilestoneChecked(achievement: Achievement, milestone: number): boolean {
    return achievement.milestoneReached !== null && achievement.milestoneReached >= milestone;
  }

  isCurrentMilestone(achievement: Achievement, milestone: number): boolean {
    return achievement.milestoneReached === milestone;
  }

  onMilestoneCheck(achievement: Achievement, milestone: number): void {
    const currentReached = achievement.milestoneReached;
    if (this.isMilestoneChecked(achievement, milestone)) {
      // Unchecking - set to previous milestone or null
      const newReached =
        currentReached === milestone ? (milestone > 1 ? milestone - 1 : null) : milestone;

      this.achievementDataService.updateAchievementMilestoneReached(achievement, newReached);
    } else {
      // Checking - set to this milestone

      // Add all previous milestones to disappearing set for animation
      const milestonesToRemove = achievement.milestones
        .map((_, index) => index + 1)
        .filter(m => m < milestone);

      this.disappearingMilestones.update(set => {
        const newSet = new Set(set);
        milestonesToRemove.forEach(m => {
          newSet.add(`${achievement.index}-${m}`);
        });
        return newSet;
      });

      // Remove from disappearing set after animation
      setTimeout(() => {
        this.disappearingMilestones.update(set => {
          const newSet = new Set(set);
          milestonesToRemove.forEach(m => {
            newSet.delete(`${achievement.index}-${m}`);
          });
          this.achievementDataService.updateAchievementMilestoneReached(achievement, milestone);
          return newSet;
        });
      }, 200);
    }
  }

  getMilestoneText(achievement: Achievement, milestone: number): string {
    const milestoneValue = achievement.milestones[milestone - 1];
    return `${milestoneValue}`;
  }

  private getVisibleMilestones(achievement: Achievement): number[] {
    const milestones = achievement.milestones;
    const currentReached = achievement.milestoneReached;

    if (currentReached === null) {
      // Show all milestones if none reached
      return milestones.map((_, index) => index + 1);
    }

    // Show current milestone and future milestones
    return milestones.map((_, index) => index + 1).filter(milestone => milestone >= currentReached);
  }
}
