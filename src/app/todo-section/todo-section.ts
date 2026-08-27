import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Achievement, ChecklistModel, Milestone } from '../core/models';
import { AchievementDataService, ChecklistDataService } from '../core/services';
import { TodoItem } from './models/todo-item';
import { groupTodoItems, interpolateTitleColor, markAppearingItems } from './todo-section-items';
import { CONSTANTS } from '../constants';

@Component({
  selector: 'mkworld-todo-section',
  templateUrl: './todo-section.html',
  styleUrls: ['./todo-section.css'],
  imports: [TranslatePipe, DecimalPipe, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoSection {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly achievementDataService = inject(AchievementDataService);
  private readonly translateService = inject(TranslateService);

  readonly CONSTANTS = CONSTANTS;

  // Title
  readonly progress = this.checklistDataService.getProgress();
  readonly total = this.checklistDataService.getTotal();

  readonly titleColor = computed(() => {
    const progressPercentage = (this.progress() / this.total()) * 100;
    return interpolateTitleColor(progressPercentage);
  });

  // Collectibles section
  readonly collectedPeachCoins = this.checklistDataService.getCollectedPeachCoins();
  readonly collectedQuestionMarkPanels = this.checklistDataService.getCollectedQuestionMarkPanels();
  readonly collectedPSwitches = this.checklistDataService.getCollectedPSwitches();

  readonly lastPeachCoinBeingRemoved = signal<boolean>(false);
  readonly lastQuestionMarkPanelBeingRemoved = signal<boolean>(false);
  readonly lastPSwitchBeingRemoved = signal<boolean>(false);

  // Achievements section
  readonly achievements = this.achievementDataService.getAchievements();

  // Other section
  previousTodoItems: TodoItem[] = [];
  readonly todoItems = computed<TodoItem[]>(() => {
    const checklistModels = this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          (!checklistModel.checked || checklistModel.disappearingFromStickerAlbum) &&
          !checklistModel.collectibleModel
      );

    return this.generateTodoItems(checklistModels);
  });

  constructor() {
    toObservable(this.collectedPeachCoins)
      .pipe(takeUntilDestroyed())
      .subscribe((collectedPeachCoins: number) => {
        if (collectedPeachCoins === CONSTANTS.TOTAL_PEACH_COINS) {
          this.lastPeachCoinBeingRemoved.set(true);

          setTimeout(() => {
            this.lastPeachCoinBeingRemoved.set(false);
          }, 200);
        }
      });

    toObservable(this.collectedQuestionMarkPanels)
      .pipe(takeUntilDestroyed())
      .subscribe((collectedQuestionMarkPanels: number) => {
        if (collectedQuestionMarkPanels === CONSTANTS.TOTAL_QUESTION_MARK_PANELS) {
          this.lastQuestionMarkPanelBeingRemoved.set(true);

          setTimeout(() => {
            this.lastQuestionMarkPanelBeingRemoved.set(false);
          }, 200);
        }
      });

    toObservable(this.collectedPSwitches)
      .pipe(takeUntilDestroyed())
      .subscribe((collectedPSwitches: number) => {
        if (collectedPSwitches === CONSTANTS.TOTAL_P_SWITCHES) {
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

  private generateTodoItems(checklistModels: ChecklistModel[]): TodoItem[] {
    const todoItems = markAppearingItems(
      groupTodoItems(checklistModels, (instructions: string) =>
        this.translateService.instant('STICKERS.' + instructions)
      ),
      this.previousTodoItems
    );
    this.previousTodoItems = todoItems;

    return todoItems;
  }
}
