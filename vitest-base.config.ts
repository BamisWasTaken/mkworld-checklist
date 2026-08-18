import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    isolate: true,
    restoreMocks: true,
    sequence: {
      shuffle: true,
    },
  },
});
