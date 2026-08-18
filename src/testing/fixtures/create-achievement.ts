import { Achievement, AchievementType } from '../../app/core/models';
import { createMilestone } from './create-milestone';

export function createAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    index: 0,
    type: AchievementType.COINS,
    title: 'TITLE_COINS',
    icon: 'C',
    milestoneText: 'MILESTONE_TEXT_COINS',
    milestoneReached: 0,
    expanded: false,
    milestones: [
      createMilestone({ milestoneNumber: 1, amount: 50 }),
      createMilestone({ milestoneNumber: 2, amount: 100 }),
      createMilestone({ milestoneNumber: 3, amount: 200 }),
    ],
    ...overrides,
  };
}
