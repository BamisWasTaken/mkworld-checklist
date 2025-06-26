import { TestBed } from '@angular/core/testing';

import { AchievementDataService } from './achievement-data.service';

describe('AchievementDataService', () => {
  let service: AchievementDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AchievementDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
