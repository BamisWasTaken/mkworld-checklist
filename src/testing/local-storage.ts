import { CONSTANTS } from '../app/constants';

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();

function installLocalStorage(): Storage {
  const descriptor = {
    configurable: true,
    writable: true,
    value: memoryStorage,
  };
  Object.defineProperty(globalThis, 'localStorage', descriptor);
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', descriptor);
  }
  return memoryStorage;
}

installLocalStorage();

export function clearAppStorage(): void {
  localStorage.clear();
}

export function setChecklistStorage(states: unknown[]): void {
  localStorage.setItem(CONSTANTS.STORAGE_KEY_CHECKLIST_MODELS, JSON.stringify(states));
}

export function setAchievementStorage(states: unknown[]): void {
  localStorage.setItem(CONSTANTS.STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(states));
}

export function setSettingsStorage(settings: unknown): void {
  localStorage.setItem(CONSTANTS.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

export function getChecklistStorage(): unknown[] | null {
  const raw = localStorage.getItem(CONSTANTS.STORAGE_KEY_CHECKLIST_MODELS);
  return raw ? (JSON.parse(raw) as unknown[]) : null;
}

export function getSettingsStorage(): unknown | null {
  const raw = localStorage.getItem(CONSTANTS.STORAGE_KEY_SETTINGS);
  return raw ? JSON.parse(raw) : null;
}

export function getAchievementStorage(): unknown[] | null {
  const raw = localStorage.getItem(CONSTANTS.STORAGE_KEY_ACHIEVEMENTS);
  return raw ? (JSON.parse(raw) as unknown[]) : null;
}
