export interface PanzoomMock {
  on: (event: string, callback: (...args: unknown[]) => void) => PanzoomMock;
  zoomAbs: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  getTransform: ReturnType<typeof vi.fn>;
  setMinZoom: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  emit: (event: string) => void;
}

export function createPanzoomMock(
  transform: { x: number; y: number; scale: number } = { x: 0, y: 0, scale: 1 }
): PanzoomMock {
  const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  const currentTransform = { ...transform };

  const mock: PanzoomMock = {
    on(event, callback) {
      const existing = listeners.get(event) ?? [];
      existing.push(callback);
      listeners.set(event, existing);
      return mock;
    },
    zoomAbs: vi.fn((_x: number, _y: number, scale: number) => {
      currentTransform.scale = scale;
    }),
    moveTo: vi.fn((x: number, y: number) => {
      currentTransform.x = x;
      currentTransform.y = y;
    }),
    getTransform: vi.fn(() => ({ ...currentTransform })),
    setMinZoom: vi.fn(),
    dispose: vi.fn(),
    emit(event) {
      for (const callback of listeners.get(event) ?? []) {
        callback(mock);
      }
    },
  };

  return mock;
}
