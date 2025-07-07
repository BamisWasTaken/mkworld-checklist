import { effect, inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';
import achievementsData from '../../../../public/data/achievements-data.json';
import { Achievement, AchievementState, Milestone } from '../models';
import { isPlatformBrowser } from '@angular/common';
import { CONSTANTS } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class AchievementDataService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly achievements = signal<Achievement[]>(achievementsData as Achievement[]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAchievementsFromStorage();

      effect(() => {
        localStorage.setItem(
          CONSTANTS.STORAGE_KEY_ACHIEVEMENTS,
          JSON.stringify(
            this.achievements().map(
              (achievement: Achievement) =>
                ({
                  index: achievement.index,
                  milestoneReached: achievement.milestoneReached,
                  expanded: achievement.expanded,
                }) as AchievementState
            )
          )
        );
      });
    }
  }

  getAchievements(): Signal<Achievement[]> {
    return this.achievements.asReadonly();
  }

  updateAchievementMilestoneReached(
    achievementToUpdate: Achievement,
    milestoneClicked: Milestone
  ): void {
    if (achievementToUpdate.milestoneReached === milestoneClicked.milestoneNumber) {
      achievementToUpdate.milestoneReached = milestoneClicked.milestoneNumber - 1;
    } else {
      this.setDisappearingMilestones(achievementToUpdate, milestoneClicked);
      achievementToUpdate.milestoneReached = milestoneClicked.milestoneNumber;
    }

    this.achievements.update((achievements: Achievement[]) =>
      achievements.map((achievement: Achievement) =>
        achievement.index === achievementToUpdate.index ? achievementToUpdate : achievement
      )
    );
  }

  toggleAchievementExpanded(achievementToToggle: Achievement): void {
    this.achievements.update((achievements: Achievement[]) =>
      achievements.map((achievement: Achievement) =>
        achievement.index === achievementToToggle.index
          ? { ...achievement, expanded: !achievement.expanded }
          : { ...achievement, expanded: false }
      )
    );
  }

  importAchievements(achievementStates: AchievementState[]): void {
    this.achievements.update((achievements: Achievement[]) =>
      achievements.map((achievement: Achievement) => {
        const achievementState = achievementStates.find(
          (achievementState: AchievementState) => achievementState.index === achievement.index
        );
        return {
          ...achievement,
          milestoneReached: achievementState?.milestoneReached ?? 0,
          expanded: achievementState?.expanded ?? false,
        };
      })
    );
  }

  private setDisappearingMilestones(
    achievementToUpdate: Achievement,
    milestoneChecked: Milestone
  ): void {
    if (achievementToUpdate.milestoneReached > 0 || milestoneChecked.milestoneNumber > 1) {
      achievementToUpdate.milestones.forEach((milestone: Milestone) => {
        if (
          milestone.milestoneNumber >= achievementToUpdate.milestoneReached &&
          milestone.milestoneNumber < milestoneChecked.milestoneNumber
        ) {
          milestone.disappearing = true;
        }
      });

      setTimeout(() => {
        achievementToUpdate.milestones.forEach(
          (milestone: Milestone) => (milestone.disappearing = false)
        );
        this.achievements.update((achievements: Achievement[]) =>
          achievements.map((achievement: Achievement) =>
            achievement.index === achievementToUpdate.index ? achievementToUpdate : achievement
          )
        );
      }, 200);
    }
  }

  private loadAchievementsFromStorage(): void {
    const storedAchievements = localStorage.getItem(CONSTANTS.STORAGE_KEY_ACHIEVEMENTS);
    if (storedAchievements) {
      const achievementStates: AchievementState[] = JSON.parse(storedAchievements);
      this.importAchievements(achievementStates);
    }
  }
}
