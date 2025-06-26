import { AchievementType } from './achievement-type';

export interface Achievement {
  index: number;
  type: AchievementType;
  title: string;
  milestoneText: string;
  milestones: number[];
  milestoneReached: number | null;
}
