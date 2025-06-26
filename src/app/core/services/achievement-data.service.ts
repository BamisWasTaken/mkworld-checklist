import { Injectable, signal, WritableSignal } from '@angular/core';
import achievementsData from '../../../../public/data/achievements-data.json';
import { Achievement, Milestone } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AchievementDataService {
  private achievements = signal<Achievement[]>([]);

  constructor() {
    this.achievements.set(achievementsData as Achievement[]);
  }

  getAchievements(): WritableSignal<Achievement[]> {
    return this.achievements;
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

  private setDisappearingMilestones(
    achievementToUpdate: Achievement,
    milestoneChecked: Milestone
  ): void {
    if (achievementToUpdate.milestoneReached > 0) {
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
      }, 200);
    }
  }
}
