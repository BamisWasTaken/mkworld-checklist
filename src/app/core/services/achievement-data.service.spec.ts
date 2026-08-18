import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { waitMs } from '../../../testing/async';
import { setAchievementStorage } from '../../../testing/local-storage';
import { CONSTANTS } from '../../constants';
import { Achievement, Milestone } from '../models';
import { AchievementDataService } from './achievement-data.service';

describe('AchievementDataService', () => {
  let service: AchievementDataService;

  function createService(): void {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AchievementDataService);
  }

  function firstAchievement(): Achievement {
    const achievement = service.getAchievements()()[0];
    expect(achievement).toBeTruthy();
    return achievement;
  }

  function milestone(achievement: Achievement, number: number): Milestone {
    const found = achievement.milestones.find(item => item.milestoneNumber === number);
    expect(found).toBeTruthy();
    return found!;
  }

  describe('when running in the browser with empty storage', () => {
    beforeEach(() => {
      createService();
    });

    it('should load seed achievements at milestone 0', () => {
      expect(service.getAchievements()().length).toBeGreaterThan(0);
      expect(
        service
          .getAchievements()()
          .every(item => item.milestoneReached === 0)
      ).toBe(true);
    });
  });

  describe('when storage has saved progress', () => {
    beforeEach(() => {
      setAchievementStorage([{ index: 0, milestoneReached: 2, expanded: true }]);
      createService();
    });

    it('should merge saved milestone and expanded state by index', () => {
      const achievement = firstAchievement();
      expect(achievement.milestoneReached).toBe(2);
      expect(achievement.expanded).toBe(true);
    });
  });

  describe('when running on the server', () => {
    beforeEach(() => {
      setAchievementStorage([{ index: 0, milestoneReached: 2, expanded: true }]);
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(AchievementDataService);
    });

    it('should not read localStorage', () => {
      expect(service.getAchievements()()).toEqual([]);
      expect(localStorage.getItem(CONSTANTS.STORAGE_KEY_ACHIEVEMENTS)).toContain(
        '"milestoneReached":2'
      );
    });
  });

  describe('updateAchievementMilestoneReached', () => {
    beforeEach(() => {
      createService();
    });

    it('should set the clicked milestone', () => {
      const achievement = firstAchievement();
      service.updateAchievementMilestoneReached(achievement, milestone(achievement, 2));
      expect(firstAchievement().milestoneReached).toBe(2);
    });

    it('should decrement when the same milestone is clicked again', () => {
      const achievement = firstAchievement();
      service.updateAchievementMilestoneReached(achievement, milestone(achievement, 2));
      service.updateAchievementMilestoneReached(
        firstAchievement(),
        milestone(firstAchievement(), 2)
      );
      expect(firstAchievement().milestoneReached).toBe(1);
    });

    it('should mark skipped milestones as disappearing until the timeout', async () => {
      const achievement = firstAchievement();
      service.updateAchievementMilestoneReached(achievement, milestone(achievement, 3));

      expect(
        firstAchievement().milestones.find(item => item.milestoneNumber === 1)?.disappearing
      ).toBe(true);
      expect(
        firstAchievement().milestones.find(item => item.milestoneNumber === 2)?.disappearing
      ).toBe(true);

      await waitMs(200);

      expect(firstAchievement().milestones.every(item => !item.disappearing)).toBe(true);
    });
  });

  describe('toggleAchievementExpanded', () => {
    beforeEach(() => {
      createService();
    });

    it('should expand one achievement and collapse the others', () => {
      const [first, second] = service.getAchievements()();
      service.toggleAchievementExpanded(first);
      service.toggleAchievementExpanded(second);

      const achievements = service.getAchievements()();
      expect(achievements.find(item => item.index === first.index)?.expanded).toBe(false);
      expect(achievements.find(item => item.index === second.index)?.expanded).toBe(true);
    });
  });

  describe('importAchievements', () => {
    beforeEach(() => {
      createService();
    });

    it('should clamp milestoneReached to the last milestone', () => {
      const achievement = firstAchievement();
      const maxMilestone =
        achievement.milestones[achievement.milestones.length - 1].milestoneNumber;

      service.importAchievements([
        { index: achievement.index, milestoneReached: maxMilestone + 50, expanded: true },
      ]);

      expect(firstAchievement().milestoneReached).toBe(maxMilestone);
      expect(firstAchievement().expanded).toBe(true);
    });
  });
});
