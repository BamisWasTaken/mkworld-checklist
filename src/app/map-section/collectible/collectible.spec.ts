import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Collectible } from './collectible';

describe('Collectible', () => {
  let component: Collectible;
  let fixture: ComponentFixture<Collectible>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collectible],
    }).compileComponents();

    fixture = TestBed.createComponent(Collectible);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
