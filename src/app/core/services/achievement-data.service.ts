import { Injectable, signal, WritableSignal } from '@angular/core';
import achievementsData from '../../../../public/data/achievements-data.json';
import { Achievement } from '../models';

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
    milestoneReached: number | null
  ): void {
    achievementToUpdate.milestoneReached = milestoneReached;

    this.achievements.update((achievements: Achievement[]) =>
      achievements.map((achievement: Achievement) =>
        achievement.index === achievementToUpdate.index ? achievementToUpdate : achievement
      )
    );
  }
}
