import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isMobileView = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth < 1024);

      window.addEventListener('resize', () => {
        this.isMobileView.set(window.innerWidth < 1024);
      });
    }
  }

  getIsMobileView(): Signal<boolean> {
    return this.isMobileView.asReadonly();
  }
}
