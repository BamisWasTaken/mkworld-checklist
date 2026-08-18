import { Milestone } from '../../app/core/models';

export function createMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    milestoneNumber: 1,
    amount: 50,
    disappearing: false,
    ...overrides,
  };
}
