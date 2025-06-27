import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { Achievement, ChecklistModel, Milestone } from '../core/models';
import { AchievementDataService, ChecklistDataService } from '../core/services';

@Component({
  selector: 'mkworld-todo-section',
  templateUrl: './todo-section.html',
  styleUrls: ['./todo-section.css'],
  imports: [TranslateModule, DecimalPipe],
})
export class TodoSection {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly achievementDataService = inject(AchievementDataService);

  readonly uncollectedPeachCoins = this.checklistDataService.getUncollectedPeachCoins();
  readonly uncollectedQuestionMarkPanels =
    this.checklistDataService.getUncollectedQuestionMarkPanels();
  readonly uncollectedPSwitches = this.checklistDataService.getUncollectedPSwitches();
  readonly lastPeachCoinBeingRemoved = signal<boolean>(false);
  readonly lastQuestionMarkPanelBeingRemoved = signal<boolean>(false);
  readonly lastPSwitchBeingRemoved = signal<boolean>(false);

  readonly achievements = this.achievementDataService.getAchievements();

  readonly todoItems = computed(() => {
    const checklistModels = this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          (!checklistModel.checked || checklistModel.disappearing) &&
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

  constructor() {
    toObservable(this.uncollectedPeachCoins)
      .pipe(takeUntilDestroyed())
      .subscribe((uncollectedPeachCoins: number) => {
        if (uncollectedPeachCoins === 0) {
          this.lastPeachCoinBeingRemoved.set(true);

          setTimeout(() => {
            this.lastPeachCoinBeingRemoved.set(false);
          }, 200);
        }
      });

    toObservable(this.uncollectedQuestionMarkPanels)
      .pipe(takeUntilDestroyed())
      .subscribe((uncollectedQuestionMarkPanels: number) => {
        if (uncollectedQuestionMarkPanels === 0) {
          this.lastQuestionMarkPanelBeingRemoved.set(true);

          setTimeout(() => {
            this.lastQuestionMarkPanelBeingRemoved.set(false);
          }, 200);
        }
      });

    toObservable(this.uncollectedPSwitches)
      .pipe(takeUntilDestroyed())
      .subscribe((uncollectedPSwitches: number) => {
        if (uncollectedPSwitches === 0) {
          this.lastPSwitchBeingRemoved.set(true);

          setTimeout(() => {
            this.lastPSwitchBeingRemoved.set(false);
          }, 200);
        }
      });
  }

  toggleAchievementExpanded(achievement: Achievement): void {
    this.achievementDataService.toggleAchievementExpanded(achievement);
  }

  onMilestoneCheck(achievement: Achievement, milestone: Milestone): void {
    this.achievementDataService.updateAchievementMilestoneReached(achievement, milestone);
  }
}
