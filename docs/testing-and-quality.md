# Testing and Quality

## Automated checks

```bash
npm run check
```

`check` runs lint with zero warnings allowed, both TypeScript checks, and all Vitest tests. GitHub Actions runs the same command for pull requests targeting `master` and pushes to `master`, independently of the browser suite. It needs no database or OAuth credentials.

Use the patched Node 24 release in `.nvmrc`. CI also runs `npm run audit:dependencies` against the complete dependency graph. ESLint uses `eslint.config.mjs`; generated build/test output is excluded there.

Individual checks and additional validation:

```bash
npm run lint
npm run typecheck
npm run typecheck:server
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

`test` runs Vitest tests in `tests/`. `test:coverage` writes text, HTML, and LCOV coverage reports to `coverage/`; the directory is generated output and must not be committed.

## End-to-end smoke tests

`npm run test:e2e` starts an isolated MongoDB container, seeds deterministic cards, decks, and two test players, starts the application, and runs the Chromium Playwright suite. It ignores normal `MONGO_URL` and `MONGO_DB_NAME` values, so it cannot target development, staging, or production data. Docker Desktop must be running locally.

To use a different local test database, set `E2E_MONGO_URL` and `E2E_MONGO_DB_NAME`. The URL must use `mongodb://` with `localhost`, `127.0.0.1`, or `::1`; the database name must end in `_e2e`. Unsafe targets are rejected before the database is cleared.

The suite signs in using a NextAuth credentials provider which is only present when `E2E_TEST_MODE=true` and `NODE_ENV` is not `production`. It exercises authenticated deck management, public-deck copying, browser-driven regular-room creation and joining, match-state synchronization and reconnecting, and sandbox entry.

Page navigation has a separate 30-second timeout in `playwright.config.ts` because the development server compiles routes on first visit. This does not change the shorter control-action timeouts used by interaction tests.

### Mobile regression helpers

Use `e2e/mobile.ts` in Playwright coverage for phone-sized routes and overlays. It provides the supported viewport matrix plus assertions for document-level horizontal overflow and visible interactive controls that extend outside the current viewport. Run the layout assertion only after the route has reached an observable ready state (for example, a heading, list, or dialog title), rather than using a timing delay.

Intentional horizontally scrollable card strips and the in-match hand tray may opt out of the instantaneous control-bounds assertion only by declaring both `data-mobile-overflow-exempt="card-strip"` or `"hand-tray"` and `data-mobile-horizontal-scroll-affordance` on their scroll container. The exemption is rejected for forms, navigation, primary actions, and room lists.

Use `expectControlsReachable` for vertically scrolling routes: it scrolls real controls into view, checks their 44px hit areas and horizontal bounds, and hit-tests them against clipping or overlapping ancestors. It restores scroll positions afterward. Disabled controls must still meet the size and bounds contract but need not receive pointer events. Run it inside open dialogs as well as on settled routes. Document width alone cannot detect clipped content.

The reachability assertion retries with a fresh control snapshot for up to five seconds when asynchronous rendering replaces a node during measurement. It still rejects persistent clipping. Sign-in helpers verify the final URL pathname and poll the HTTP session endpoint so callback query strings and document replacement cannot create false readiness signals.

Compact gameplay (up to 1100px wide) renders without a board-wide transform. At 568×320 and 667×375, the battlefield scrolls vertically while the local hand and phase action remain pinned. Only the local hand scrolls horizontally. Counter adjustments are available in the existing card menu with 44px buttons; desktop inline adjustments and draggable dialogs remain available to precision pointers.

The regression specs cover pending-save Undo invalidation, failed-save recovery, hydrated-card inspection, status warning parity, portrait route reachability at 320/360/390/414px, filter keyboard behavior, native touch targeting, desktop pile-dialog/card dragging, and two-player synchronization/reconnection on desktop and landscape touch contexts. Board screenshots are written into the corresponding Playwright test output directory.

GitHub Actions runs this suite for pull requests targeting `master` and pushes to `master`. Failed runs retain the Playwright HTML report, traces, screenshots, and retry-only videos as artifacts.

## Current coverage scope

`tests/deck-api.test.ts` starts an ephemeral Express listener and exercises the real deck controllers, services, validation, and error middleware with database calls mocked. It covers creation, duplication, copying, publication, ownership filters, legacy IDs, invalid input, missing decks, edit races, and safe infrastructure-error responses. Client API-message handling is covered in `tests/api-error.test.ts`. These tests do not verify MongoDB query execution or replace the browser suite.

The automated suite covers deterministic utility behavior, card selection, ordinal formatting, HTML entity decoding, socket payload validation, R2 image-key migration, R2 service-worker routing, Toolbox deck-response parsing, and the critical Chromium user journeys above. It does not claim exhaustive card-rule, full game-engine, or cross-browser coverage.

## Manual verification

For gameplay changes, verify normal and sandbox modes, reconnect behavior, and state synchronization between two players. See [Sandbox mode](./sandbox-mode.md) for manual scenarios.

For card imports, use `npm run importToolboxCardsDev` or `npm run importToolboxCardsProd`; both preload `.env` with `dotenv/config` and use `tsconfig.server.json`.

For Toolbox deck imports, confirm that the preview GET goes directly from the browser to `api.legionstoolbox.com`, while the subsequent authenticated save goes only to `POST /api/importDecks` on this app. For R2 migration testing, run `npm run syncCardImages` first and inspect its report before using `--apply`.
