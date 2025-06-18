import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSection } from './map-section';

describe('MapSection', () => {
  let component: MapSection;
  let fixture: ComponentFixture<MapSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
