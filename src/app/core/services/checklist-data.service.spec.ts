import { TestBed } from '@angular/core/testing';

import { ChecklistDataService } from './checklist-data.service';

describe('ChecklistDataService', () => {
  let service: ChecklistDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChecklistDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
