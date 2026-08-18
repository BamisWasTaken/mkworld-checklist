import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MobileService } from './mobile.service';

describe('MobileService', () => {
  function createService(innerWidth: number): MobileService {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: innerWidth,
    });
    TestBed.configureTestingModule({});
    return TestBed.inject(MobileService);
  }

  it('should treat widths under 1024 as mobile', () => {
    const service = createService(800);
    expect(service.getIsMobileView()()).toBe(true);
  });

  it('should treat widths of 1024 and above as desktop', () => {
    const service = createService(1280);
    expect(service.getIsMobileView()()).toBe(false);
  });

  it('should update when the window is resized', () => {
    const service = createService(800);
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1280 });
    window.dispatchEvent(new Event('resize'));
    expect(service.getIsMobileView()()).toBe(false);
  });

  it('should stay unset on the server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(MobileService);
    expect(service.getIsMobileView()()).toBeNull();
  });
});
