import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Achievement, ChecklistModel, Milestone } from '../core/models';
import { AchievementDataService, ChecklistDataService } from '../core/services';
import { TodoItem } from './models/todo-item';

@Component({
  selector: 'mkworld-todo-section',
  templateUrl: './todo-section.html',
  styleUrls: ['./todo-section.css'],
  imports: [TranslateModule, DecimalPipe, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoSection {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly achievementDataService = inject(AchievementDataService);
  private readonly translateService = inject(TranslateService);

  readonly uncollectedPeachCoins = this.checklistDataService.getUncollectedPeachCoins();
  readonly uncollectedQuestionMarkPanels =
    this.checklistDataService.getUncollectedQuestionMarkPanels();
  readonly uncollectedPSwitches = this.checklistDataService.getUncollectedPSwitches();
  readonly lastPeachCoinBeingRemoved = signal<boolean>(false);
  readonly lastQuestionMarkPanelBeingRemoved = signal<boolean>(false);
  readonly lastPSwitchBeingRemoved = signal<boolean>(false);

  readonly progress = this.checklistDataService.getProgress();
  readonly total = this.checklistDataService.getTotal();

  readonly achievements = this.achievementDataService.getAchievements();

  previousTodoItems: TodoItem[] = [];
  readonly todoItems = computed<TodoItem[]>(() => {
    const checklistModels = this.checklistDataService
      .getChecklistModels()()
      .filter(
        (checklistModel: ChecklistModel) =>
          (!checklistModel.checked || checklistModel.disappearingFromStickerAlbum) &&
          !checklistModel.collectibleModel
      );

    const todoItems: TodoItem[] = [];

    checklistModels.forEach((checklistModel: ChecklistModel) => {
      if (checklistModel.instructions !== 'SHARED.MILESTONE_REACHED_INSTRUCTIONS') {
        const foundTodoItem = todoItems.find(
          (todoItem: TodoItem) =>
            todoItem.checklistModel.instructions === checklistModel.instructions
        );
        if (foundTodoItem) {
          foundTodoItem.amountUnchecked++;
        } else {
          todoItems.push({ checklistModel, amountUnchecked: 1, appearing: false });
        }
      }
    });

    if (this.previousTodoItems.length !== todoItems.length) {
      todoItems.forEach((todoItem: TodoItem) => {
        if (
          !this.previousTodoItems.find(
            (previousTodoItem: TodoItem) =>
              previousTodoItem.checklistModel.instructions === todoItem.checklistModel.instructions
          )
        ) {
          todoItem.appearing = true;
        }
      });
    }

    todoItems.sort((a: TodoItem, b: TodoItem) => {
      const aTranslated = this.translateService.instant(
        'STICKERS.' + a.checklistModel.instructions
      );
      const bTranslated = this.translateService.instant(
        'STICKERS.' + b.checklistModel.instructions
      );
      return aTranslated.localeCompare(bTranslated);
    });
    this.previousTodoItems = todoItems;

    return todoItems;
  });

  titleColor = computed(() => {
    const progressPercentage = (this.progress() / this.total()) * 100;

    if (progressPercentage === 0) {
      return '#ffffff';
    } else if (progressPercentage >= 100) {
      return '#fbbf24';
    } else {
      const white = { r: 255, g: 255, b: 255 }; // #ffffff
      const brightGold = { r: 251, g: 191, b: 36 }; // #fbbf24

      const factor = progressPercentage / 100;
      const r = Math.round(white.r + (brightGold.r - white.r) * factor);
      const g = Math.round(white.g + (brightGold.g - white.g) * factor);
      const b = Math.round(white.b + (brightGold.b - white.b) * factor);

      return `rgb(${r}, ${g}, ${b})`;
    }
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
