# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

mktools.io — Angular 22 SPA (SSR via Cloudflare Workers/Wrangler) helping players 100%-complete Mario Kart World: sticker album, interactive collectible map, auto-generated to-do list, achievements.

## Commands

```
npm run start:angular   # dev server (ng serve, no HMR) — used by Playwright webServer, http://localhost:4200
npm run start:wrangler  # build + wrangler dev — runs the actual Worker/SSR path
npm run build           # ng build (production config, dist/browser + dist/server)
npm test                # ng test — unit tests via Angular's vitest builder
npm run test:ci         # ng test --no-watch --coverage
npm run e2e             # playwright test (e2e/*.spec.ts)
npm run test:mutation   # stryker run — mutation testing over the pure logic modules
npm run lint             # eslint --fix
npm run lint:ci          # eslint, no fix
npm run format            # prettier --write src/**/*.{ts,js,json,css,scss,html}
npm run deploy            # build + wrangler deploy
```

Single test file: `ng test -- src/app/core/services/checklist-data.service.spec.ts` (vitest under the hood — a `.spec.ts` path/pattern arg filters like normal vitest). Note `--filter` matches **test names**, not paths. Single e2e file: `npx playwright test e2e/map.spec.ts`.

There is no `app.routes.ts` — this is a single-page, routerless app; `App` composes all sections directly in `app.html`.

## Architecture

**State model**: no NgRx/store lib. Each domain has an `Injectable({providedIn: 'root'})` service holding a private `signal<T[]>`, exposing it read-only via a method returning `Signal<T>` (e.g. `getChecklistModels()`), and mutating only through `.update()`/`.set()`. Derived data is `computed()` inside the service, not in components. Two source-of-truth services:

- `ChecklistDataService` — the 1056 collectible/sticker entries (`ChecklistModel[]`), seeded from `public/data/checklist-data.json`.
- `AchievementDataService` — milestone tracking (`Achievement[]`), seeded from `public/data/achievements-data.json`.

**Persistence pattern** (repeated in both data services): on construction, if `isPlatformBrowser(PLATFORM_ID)`, load saved state from `localStorage` (keys in `src/app/constants.ts` `CONSTANTS.STORAGE_KEY_*`) via `import*States()`, else seed from the JSON via `structuredClone`. An `effect()` re-serializes the relevant signal to `localStorage` on every change. Only _state_ (checked/milestoneReached/expanded + index) round-trips through storage — the full `ChecklistModel`/`Achievement` shape always comes fresh from the JSON data files, so JSON edits (new/changed collectibles) don't require a storage migration. `ImportExportService` builds/consumes a `SaveFile` (`{achievementStates, checklistModelStates, settings}`) for user-facing export/import.

**Disappear animation convention**: toggling an item sets a transient `disappearingFromStickerAlbum`/`disappearingFromMap` flag, updates the signal so CSS can animate, then a `setTimeout(..., 200)` clears the flag and updates the signal again. This pattern is duplicated per-service rather than shared — match it when adding similar toggles.

**Map rendering** (`map-section/`): pans/zooms with `panzoom` over collectible markers positioned by `xPercentage`/`yPercentage` (not pixels — resolution independent). `models/quad-tree-node.ts` spatially indexes markers so only markers in the visible viewport are rendered/hit-tested; rebuilt/queried against `CONSTANTS.QUAD_TREE_*` thresholds (debounce, buffer, max objects per node — see `constants.ts`).

**Pure logic extraction**: geometry and layout maths live in Angular-free modules next to their component — `sticker-album/sticker-album-layout.ts` (drag intent, page wrap, FLIP offsets, map-jump focus), `map-section/map-section-geometry.ts` (visible bounds, marker/tooltip scaling), `todo-section/todo-section-items.ts` (row grouping, title colour). Components delegate to them rather than inlining the maths. This is what makes those branches testable without `TestBed` and mutation-testable at all — put new maths there, not in the component.

**Responsive strategy**: `MobileService.getIsMobileView()` is a signal driven off viewport width, read at the top (`App`) to conditionally reorder/hide sections (e.g. header placement in `app.html`), not via CSS breakpoints alone. `CONSTANTS.STICKERS_PER_ROW/COLUMN_DESKTOP` vs `_MOBILE` similarly branch the sticker-album grid math.

**SSR/Workers split**: `src/server.ts` is the Worker/Wrangler entry (`platform: neutral`, used by `start:wrangler`/`deploy`); `src/server.angular.ts` is a separate Node SSR entry only wired up under the `angular` build configuration. `wrangler.jsonc` serves `dist/browser` as static assets and routes SSR through `dist/server/server.mjs`.

**i18n**: all user-facing strings go through `@ngx-translate` (`translate` pipe/directive) — never hardcode template strings. Translation files live in `public/i18n/`, loaded via `provideTranslateHttpLoader({ prefix: './i18n/' })`. `fallbackLang: 'en'` is the only registered language currently.

**Assets**: `public/` is the only assets root (images, fonts, i18n, `data/*.json`) — the CLI's old `src/assets` convention is not used here.

## Conventions (Angular)

- Standalone components only; DI via `inject()`, not constructor params.
- Signals for state; `input()`/`output()` over decorators.
- New control-flow syntax (`@if`/`@for`/`@defer`) — not `*ngIf`/`*ngFor`.
- Components/services are typically `ChangeDetectionStrategy.Eager` or explicitly zoneless-friendly (see `App`) — follow the existing strategy on a file rather than defaulting to `Default`.

## Testing

- Unit tests (`*.spec.ts`) sit next to their source file, run through Angular's vitest builder (config in `angular.json` → `architect.test`, base options in `vitest-base.config.ts`: `isolate: true`, shuffled test order — write tests independent of run order and of each other's state).
- `src/testing/setup.ts` stubs `IntersectionObserver`, resets `window.innerWidth` to 1024, and calls `clearAppStorage()` before/after every test — don't hand-roll localStorage cleanup in individual specs.
- `src/testing/fixtures/` has `create*` builders for the core models (`create-checklist-model`, `create-achievement`, `create-collectible-model`, `create-milestone`, `create-collectible-checklist`) — prefer these over inlining literals when constructing test data.
- `src/testing/test-providers.ts` is the default DI provider set for specs (test translate, `PLATFORM_ID: 'browser'`, image-warning suppression); pull it in rather than re-providing ad hoc.
- `panzoom-mock.ts` mocks the `panzoom` lib for map-section specs.
- E2e specs are split by feature area (`map.spec.ts`, `sticker-album.spec.ts`, `settings.spec.ts`, `save-file.spec.ts`, `quick-actions.spec.ts`, `todo-section.spec.ts`, `collecting.spec.ts`) with shared setup in `e2e/helpers.ts` (not a `.spec` file, so Playwright does not collect it). `mobile.spec.ts` is routed only to the `mobile` project (iPhone 12) and excluded from `chromium` via `testIgnore`/`testMatch` — keep new mobile-only e2e tests there to stay on that split.
- Two e2e traps worth knowing: the album **shows** collected stickers by default (`settings.service.ts`), so use `hideCollectedStickers()` before asserting a sticker disappeared; and the 744 map markers overlap, so address one with `locator.dispatchEvent('click')` (`clickMarker` in helpers) — a positional `.click()` hits whichever marker is topmost.
- **Mutation testing** (`npm run test:mutation`) runs Stryker over the pure logic modules listed in `stryker.config.json`. Stryker drives Vitest directly via `vitest.mutation.config.ts`, without the Angular builder, so only specs needing no Angular compilation can run there — component and service specs stay on `ng test`. Equivalent mutants are excluded with `// Stryker disable` comments that state why; add tests before reaching for a disable. Break threshold is 95%.
