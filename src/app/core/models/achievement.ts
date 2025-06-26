import { AchievementType } from './achievement-type';
import { Milestone } from './milestone';

export interface Achievement {
  index: number;
  type: AchievementType;
  title: string;
  milestoneText: string;
  milestones: Milestone[];
  milestoneReached: number;
  expanded: boolean;
}
