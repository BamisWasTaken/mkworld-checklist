import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistDataService } from '../core/services';
import { BackgroundProgress } from './background-progress';

describe('BackgroundProgress', () => {
  let fixture: ComponentFixture<BackgroundProgress>;
  let component: BackgroundProgress;
  const progress = signal(0);
  const total = signal(0);

  beforeEach(async () => {
    progress.set(0);
    total.set(0);

    await TestBed.configureTestingModule({
      imports: [BackgroundProgress],
      providers: [
        {
          provide: ChecklistDataService,
          useValue: {
            getProgress: () => progress.asReadonly(),
            getTotal: () => total.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BackgroundProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should report no progress before the checklist has loaded', () => {
    // Guards against dividing by a total of zero during SSR and first paint.
    expect(component.progressPercentage()).toBe(0);
  });

  it('should turn collected stickers into a percentage', () => {
    total.set(200);
    progress.set(50);

    expect(component.progressPercentage()).toBe(25);
  });

  it('should reach 100 when everything is collected', () => {
    total.set(1056);
    progress.set(1056);

    expect(component.progressPercentage()).toBe(100);
  });

  it('should sweep the gradient position from right to left as progress grows', () => {
    total.set(100);
    progress.set(0);
    expect(component.gradientPosition()).toBe('100% 0');

    progress.set(40);
    expect(component.gradientPosition()).toBe('60% 0');

    progress.set(100);
    expect(component.gradientPosition()).toBe('0% 0');
  });

  it('should never push the gradient position past zero', () => {
    total.set(100);
    progress.set(150);

    expect(component.gradientPosition()).toBe('0% 0');
  });

  it('should switch to the gold gradient only at full completion', () => {
    total.set(100);

    progress.set(99);
    const inProgress = component.progressGradient();
    expect(inProgress).toContain('#1ccad8');

    progress.set(100);
    const complete = component.progressGradient();
    expect(complete).not.toBe(inProgress);
    expect(complete).toContain('rgb(199, 170, 9)');
  });
});
