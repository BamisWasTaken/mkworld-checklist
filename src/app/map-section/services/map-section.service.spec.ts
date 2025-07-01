import { TestBed } from '@angular/core/testing';

import { MapSectionService } from './map-section.service';

describe('MapSectionService', () => {
  let service: MapSectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapSectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
