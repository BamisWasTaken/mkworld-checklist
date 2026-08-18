import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AchievementDataService } from '../core/services';
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
});
