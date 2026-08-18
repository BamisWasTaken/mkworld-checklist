import { TestBed } from '@angular/core/testing';

export function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function flushEffects(): void {
  TestBed.tick();
}
