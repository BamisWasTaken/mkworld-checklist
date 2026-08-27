import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import checklistData from '../../../../public/data/checklist-data.json';
import { CONSTANTS } from '../../constants';
import { ChecklistModel, CollectibleType, QuickAction } from '../models';
import { AchievementDataService } from './achievement-data.service';
import { ChecklistDataService } from './checklist-data.service';
import { SettingsService } from './settings.service';
import { flushEffects, waitMs } from '../../../testing/async';
import { getChecklistStorage, setChecklistStorage } from '../../../testing/local-storage';

describe('ChecklistDataService', () => {
  let service: ChecklistDataService;
  let settingsService: SettingsService;
  let achievementDataService: AchievementDataService;

  function createService(): void {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChecklistDataService);
    settingsService = TestBed.inject(SettingsService);
    achievementDataService = TestBed.inject(AchievementDataService);
  }

  function findByType(type: CollectibleType): ChecklistModel {
    const model = service
      .getChecklistModels()()
      .find((item: ChecklistModel) => item.collectibleModel?.collectibleType === type);
    expect(model).toBeTruthy();
    return model!;
  }

  function findStickerWithoutCollectible(): ChecklistModel {
    const model = service
      .getChecklistModels()()
      .find((item: ChecklistModel) => item.hasSticker && !item.collectibleModel);
    expect(model).toBeTruthy();
    return model!;
  }

  function findByIndex(index: number): ChecklistModel {
    const model = service
      .getChecklistModels()()
      .find((item: ChecklistModel) => item.index === index);
    expect(model).toBeTruthy();
    return model!;
  }

  describe('when running in the browser with empty storage', () => {
    beforeEach(() => {
      createService();
    });

    it('should load the seed checklist', () => {
      expect(service.getChecklistModels()().length).toBe(checklistData.length);
      expect(
        service
          .getChecklistModels()()
          .every((item: ChecklistModel) => !item.checked)
      ).toBe(true);
    });

    it('should persist checked flags after a toggle', () => {
      const sticker = findStickerWithoutCollectible();

      service.updateChecklistModelChecked(sticker);
      flushEffects();

      const stored = getChecklistStorage() as { index: number; checked: boolean }[];
      expect(stored.find(state => state.index === sticker.index)?.checked).toBe(true);
    });
  });

  describe('when storage has saved progress', () => {
    beforeEach(() => {
      setChecklistStorage([
        { index: 0, checked: true },
        { index: 99999, checked: true },
      ]);
      createService();
    });

    it('should merge saved checked flags onto the seed by index', () => {
      expect(findByIndex(0).checked).toBe(true);
      expect(findByIndex(1).checked).toBe(false);
    });

    it('should ignore saved indexes that are not in the seed', () => {
      expect(
        service
          .getChecklistModels()()
          .some((item: ChecklistModel) => item.index === 99999)
      ).toBe(false);
      expect(service.getChecklistModels()().length).toBe(checklistData.length);
    });
  });

  describe('when running on the server', () => {
    beforeEach(() => {
      setChecklistStorage([{ index: 0, checked: true }]);
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(ChecklistDataService);
    });

    it('should not read or write localStorage', () => {
      expect(service.getChecklistModels()()).toEqual([]);
      expect(localStorage.getItem(CONSTANTS.STORAGE_KEY_CHECKLIST_MODELS)).toBe(
        JSON.stringify([{ index: 0, checked: true }])
      );
    });
  });

  describe('updateChecklistModelChecked', () => {
    beforeEach(() => {
      createService();
    });

    it('should toggle checked and keep the item visible on the map while it is disappearing', async () => {
      const peachCoin = findByType(CollectibleType.PEACH_COIN);
      const peachIndex = peachCoin.index;

      service.updateChecklistModelChecked(peachCoin);

      const whileDisappearing = service
        .getCollectibleChecklistModelsOnMap()()
        .find((item: ChecklistModel) => item.index === peachIndex);
      expect(whileDisappearing?.checked).toBe(true);
      expect(whileDisappearing?.disappearingFromMap).toBe(true);

      await waitMs(200);

      expect(
        service
          .getCollectibleChecklistModelsOnMap()()
          .some((item: ChecklistModel) => item.index === peachIndex)
      ).toBe(false);
      expect(findByIndex(peachIndex).disappearingFromMap).toBe(false);
    });

    it('should not mark map items as disappearing when collected collectibles stay visible', () => {
      settingsService.toggleShowCollectedCollectibles();
      const peachCoin = findByType(CollectibleType.PEACH_COIN);

      service.updateChecklistModelChecked(peachCoin);

      expect(findByIndex(peachCoin.index).disappearingFromMap).toBe(false);
      expect(
        service
          .getCollectibleChecklistModelsOnMap()()
          .some((item: ChecklistModel) => item.index === peachCoin.index)
      ).toBe(true);
    });
  });

  describe('map filtering', () => {
    beforeEach(() => {
      createService();
    });

    it('should hide collectible types that are toggled off', () => {
      const before = service.getCollectibleChecklistModelsOnMap()();
      expect(
        before.some(item => item.collectibleModel?.collectibleType === CollectibleType.PEACH_COIN)
      ).toBe(true);

      settingsService.toggleShowCollectibleType(CollectibleType.PEACH_COIN);

      expect(
        service
          .getCollectibleChecklistModelsOnMap()()
          .some(item => item.collectibleModel?.collectibleType === CollectibleType.PEACH_COIN)
      ).toBe(false);
    });

    it('should keep a hidden type visible while disappearingFromMap is set', async () => {
      const peachCoin = findByType(CollectibleType.PEACH_COIN);
      service.addDisappearingChecklistModels([peachCoin], false, true);
      settingsService.toggleShowCollectibleType(CollectibleType.PEACH_COIN);

      expect(
        service
          .getCollectibleChecklistModelsOnMap()()
          .some((item: ChecklistModel) => item.index === peachCoin.index)
      ).toBe(true);

      await waitMs(200);

      expect(
        service
          .getCollectibleChecklistModelsOnMap()()
          .some((item: ChecklistModel) => item.index === peachCoin.index)
      ).toBe(false);
    });
  });

  describe('progress', () => {
    beforeEach(() => {
      createService();
    });

    it('should count only sticker items toward progress and total', () => {
      const stickerCount = service
        .getChecklistModels()()
        .filter(item => item.hasSticker).length;
      expect(service.getTotal()()).toBe(stickerCount);
      expect(service.getProgress()()).toBe(0);

      const sticker = findStickerWithoutCollectible();
      service.updateChecklistModelChecked(sticker);
      expect(service.getProgress()()).toBe(1);

      const peachCoin = findByType(CollectibleType.PEACH_COIN);
      expect(peachCoin.hasSticker).toBe(false);
      service.updateChecklistModelChecked(peachCoin);
      expect(service.getProgress()()).toBe(1);
    });
  });

  describe('importChecklistModels', () => {
    beforeEach(() => {
      createService();
    });

    it('should merge imported checked flags by index and default missing ones', () => {
      service.importChecklistModels([
        { index: 0, checked: true },
        { index: 1, checked: false },
      ]);

      expect(findByIndex(0).checked).toBe(true);
      expect(findByIndex(1).checked).toBe(false);
      expect(findByIndex(2).checked).toBe(false);
    });
  });

  describe('performQuickAction', () => {
    beforeEach(() => {
      createService();
    });

    it('should check and uncheck all collectibles of a type', () => {
      service.performQuickAction(QuickAction.CHECK_ALL_PEACH_MEDALLIONS);

      const peachCoins = service
        .getChecklistModels()()
        .filter(item => item.collectibleModel?.collectibleType === CollectibleType.PEACH_COIN);
      expect(peachCoins.length).toBeGreaterThan(0);
      expect(peachCoins.every(item => item.checked)).toBe(true);

      service.performQuickAction(QuickAction.UNCHECK_ALL_PEACH_MEDALLIONS);
      expect(
        service
          .getChecklistModels()()
          .filter(item => item.collectibleModel?.collectibleType === CollectibleType.PEACH_COIN)
          .every(item => !item.checked)
      ).toBe(true);
    });

    it('should reset checklist progress and achievements', () => {
      service.updateChecklistModelChecked(findByIndex(0));
      const achievement = achievementDataService.getAchievements()()[0];
      achievementDataService.updateAchievementMilestoneReached(
        achievement,
        achievement.milestones[0]
      );

      service.performQuickAction(QuickAction.RESET);

      expect(
        service
          .getChecklistModels()()
          .every((item: ChecklistModel) => !item.checked)
      ).toBe(true);
      expect(achievementDataService.getAchievements()()[0].milestoneReached).toBe(0);
    });
  });
});
