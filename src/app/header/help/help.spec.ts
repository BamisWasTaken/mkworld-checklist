import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Help } from './help';

describe('Help', () => {
  let fixture: ComponentFixture<Help>;
  let closed: number;

  beforeEach(async () => {
    closed = 0;
    await TestBed.configureTestingModule({
      imports: [Help],
    }).compileComponents();

    fixture = TestBed.createComponent(Help);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentInstance.closeHelp.subscribe(() => closed++);
    fixture.detectChanges();
  });

  it('should emit close when the backdrop is clicked', () => {
    (fixture.nativeElement.querySelector('.help-modal') as HTMLElement).click();
    expect(closed).toBe(1);
  });

  it('should not close when the inner panel is clicked', () => {
    (fixture.nativeElement.querySelector('.help-modal > div') as HTMLElement).click();
    expect(closed).toBe(0);
  });

  it('should emit close when the close button is clicked', () => {
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(closed).toBe(1);
  });
});
