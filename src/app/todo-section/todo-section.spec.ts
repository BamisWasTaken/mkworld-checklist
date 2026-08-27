import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '../constants';
import { CollectibleType } from '../core/models';
import { AchievementDataService, ChecklistDataService } from '../core/services';
import { waitMs } from '../../testing/async';
import { TodoSection } from './todo-section';

describe('TodoSection', () => {
  let fixture: ComponentFixture<TodoSection>;
  let achievementDataService: AchievementDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoSection],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoSection);
    achievementDataService = TestBed.inject(AchievementDataService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expand an achievement when its row is clicked', () => {
    const row = fixture.nativeElement.querySelector('.todo-item.cursor-pointer') as HTMLElement;
    row.click();
    fixture.detectChanges();

    expect(achievementDataService.getAchievements()()[0].expanded).toBe(true);
  });

  it('should check a milestone without collapsing the achievement', () => {
    const achievement = achievementDataService.getAchievements()()[0];
    if (!achievement.expanded) {
      const row = fixture.nativeElement.querySelector('.todo-item.cursor-pointer') as HTMLElement;
      row.click();
      fixture.detectChanges();
    }

    expect(achievementDataService.getAchievements()()[0].expanded).toBe(true);

    const checkbox = fixture.nativeElement.querySelector(
      '.milestones-container.expanded input[type="checkbox"]'
    ) as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    expect(achievementDataService.getAchievements()()[0].expanded).toBe(true);
    expect(achievementDataService.getAchievements()()[0].milestoneReached).toBeGreaterThan(0);
  });

  describe('other todo items', () => {
    function instructionsOf(): string[] {
      return fixture.componentInstance.todoItems().map(item => item.checklistModel.instructions);
    }

    it('should collapse repeated instructions into a single counted row', () => {
      const items = fixture.componentInstance.todoItems();
      const repeated = items.find(item => item.amountUnchecked > 1);

      // The seed data has many stickers sharing a task, so at least one row must be counted.
      expect(repeated).toBeTruthy();
    });

    it('should never list a collectible-backed sticker', () => {
      const collectibleIndexes = new Set(
        TestBed.inject(ChecklistDataService)
          .getChecklistModels()()
          .filter(model => model.collectibleModel)
          .map(model => model.index)
      );

      const listed = fixture.componentInstance
        .todoItems()
        .map(item => item.checklistModel.index)
        .filter(index => collectibleIndexes.has(index));

      expect(listed).toEqual([]);
    });

    it('should list rows in translated alphabetical order', () => {
      const instructions = instructionsOf();
      const sorted = [...instructions].sort((a, b) => a.localeCompare(b));

      expect(instructions).toEqual(sorted);
    });

    it('should look instructions up under the STICKERS namespace', () => {
      const checklistDataService = TestBed.inject(ChecklistDataService);
      const translateService = TestBed.inject(TranslateService);
      const [first] = fixture.componentInstance.todoItems();
      const rawKey = checklistDataService
        .getChecklistModels()()
        .find(model => model.index === first.checklistModel.index)!.instructions;

      translateService.setTranslation('en', { STICKERS: { [rawKey]: 'Seeded task text' } });

      // `todoItems` depends on the checklist, not on the translation store, so a language change
      // alone does not re-translate the list — collecting something is what forces the recompute.
      const collectible = checklistDataService
        .getChecklistModels()()
        .find(model => model.collectibleModel)!;
      checklistDataService.updateChecklistModelChecked(collectible);
      fixture.detectChanges();

      expect(
        fixture.componentInstance
          .todoItems()
          .some(item => item.checklistModel.instructions === 'Seeded task text')
      ).toBe(true);
    });

    it('should drop a row once its last sticker is collected', async () => {
      const checklistDataService = TestBed.inject(ChecklistDataService);
      const single = fixture.componentInstance
        .todoItems()
        .find(item => item.amountUnchecked === 1)!;
      expect(single).toBeTruthy();

      const model = checklistDataService
        .getChecklistModels()()
        .find(item => item.index === single.checklistModel.index)!;
      checklistDataService.updateChecklistModelChecked(model);
      fixture.detectChanges();

      // The row is held on screen while `disappearingFromStickerAlbum` runs the exit animation.
      expect(
        fixture.componentInstance
          .todoItems()
          .some(item => item.checklistModel.index === single.checklistModel.index)
      ).toBe(true);

      await waitMs(250);
      fixture.detectChanges();

      expect(
        fixture.componentInstance
          .todoItems()
          .some(item => item.checklistModel.index === single.checklistModel.index)
      ).toBe(false);
    });
  });

  describe('title colour', () => {
    it('should be white before anything is collected', () => {
      expect(fixture.componentInstance.titleColor()).toBe('#ffffff');
    });

    it('should move off white once stickers are collected', () => {
      const checklistDataService = TestBed.inject(ChecklistDataService);
      const models = checklistDataService.getChecklistModels()();
      for (const model of models.slice(0, 20)) {
        checklistDataService.updateChecklistModelChecked(model);
      }
      fixture.detectChanges();

      expect(fixture.componentInstance.titleColor()).toMatch(/^rgb\(/);
    });
  });

  describe('collectible completion', () => {
    it('should flag the peach coin row as leaving, then clear it', async () => {
      const component = fixture.componentInstance;
      expect(component.lastPeachCoinBeingRemoved()).toBe(false);

      TestBed.inject(ChecklistDataService).performQuickAction(
        'CHECK_ALL_PEACH_MEDALLIONS' as never
      );
      fixture.detectChanges();

      expect(component.collectedPeachCoins()).toBe(CONSTANTS.TOTAL_PEACH_COINS);
      expect(component.lastPeachCoinBeingRemoved()).toBe(true);

      // The flag only holds the row on screen long enough to animate out.
      await waitMs(300);

      expect(component.lastPeachCoinBeingRemoved()).toBe(false);
    });

    it('should leave the other collectible rows alone', () => {
      TestBed.inject(ChecklistDataService).performQuickAction(
        'CHECK_ALL_PEACH_MEDALLIONS' as never
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.lastPSwitchBeingRemoved()).toBe(false);
      expect(fixture.componentInstance.lastQuestionMarkPanelBeingRemoved()).toBe(false);
    });

    it('should count collected collectibles per type', () => {
      const checklistDataService = TestBed.inject(ChecklistDataService);
      checklistDataService.performQuickAction('CHECK_ALL_P_SWITCHES' as never);
      fixture.detectChanges();

      expect(fixture.componentInstance.collectedPSwitches()).toBe(CONSTANTS.TOTAL_P_SWITCHES);
      expect(fixture.componentInstance.collectedPeachCoins()).toBe(0);
      expect(CollectibleType.P_SWITCH).toBe('p-switch');
    });
  });
});
