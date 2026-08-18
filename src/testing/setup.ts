import { clearAppStorage } from './local-storage';

class IntersectionObserverStub {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: readonly number[] = [];

  constructor() {}

  disconnect(): void {}
  observe(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(): void {}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  configurable: true,
  writable: true,
  value: IntersectionObserverStub,
});

const DEFAULT_INNER_WIDTH = 1024;

function resetSharedTestState(): void {
  clearAppStorage();
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: DEFAULT_INNER_WIDTH,
  });
}

resetSharedTestState();

beforeEach(() => {
  resetSharedTestState();
});

afterEach(() => {
  resetSharedTestState();
});
