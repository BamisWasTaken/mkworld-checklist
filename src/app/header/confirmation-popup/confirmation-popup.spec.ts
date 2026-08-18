import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickAction } from '../../core/models/quick-action';
import { ConfirmationPopup } from './confirmation-popup';

describe('ConfirmationPopup', () => {
  let fixture: ComponentFixture<ConfirmationPopup>;
  let confirmed: boolean[];

  beforeEach(async () => {
    confirmed = [];
    await TestBed.configureTestingModule({
      imports: [ConfirmationPopup],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationPopup);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('quickAction', QuickAction.RESET);
    fixture.componentInstance.confirmed.subscribe((value: boolean) => confirmed.push(value));
    fixture.detectChanges();
  });

  it('should emit false when the backdrop is clicked', () => {
    (fixture.nativeElement.querySelector('.confirmation-popup') as HTMLElement).click();
    expect(confirmed).toEqual([false]);
  });

  it('should not close when the inner panel is clicked', () => {
    (fixture.nativeElement.querySelector('.confirmation-popup > div') as HTMLElement).click();
    expect(confirmed).toEqual([]);
  });

  it('should emit true when confirm is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    expect(confirmed).toEqual([true]);
  });
});
