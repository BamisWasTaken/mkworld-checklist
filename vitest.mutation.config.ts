import { defineConfig } from 'vitest/config';

/**
 * Stryker runs Vitest directly, without the Angular builder that normally compiles this project,
 * so only specs that need no Angular compilation can run here — the pure logic modules. Component
 * and service specs stay on `ng test`.
 *
 * Order is deliberately not shuffled: Stryker needs a mutant's result to be reproducible.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    restoreMocks: true,
    sequence: { shuffle: false },
    include: [
      'src/app/sticker-album/sticker-album-layout.spec.ts',
      'src/app/map-section/map-section-geometry.spec.ts',
      'src/app/todo-section/todo-section-items.spec.ts',
      'src/app/map-section/models/quad-tree-node.spec.ts',
    ],
  },
});
