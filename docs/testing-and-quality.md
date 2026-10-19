# Testing and Quality

## Automated checks

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

GitHub Actions runs this suite for pull requests targeting `master` and pushes to `master`. Failed runs retain the Playwright HTML report, traces, screenshots, and retry-only videos as artifacts.

## Current coverage scope

The automated suite covers deterministic utility behavior, card selection, ordinal formatting, HTML entity decoding, socket payload validation, R2 image-key migration, R2 service-worker routing, Toolbox deck-response parsing, and the critical Chromium user journeys above. It does not claim exhaustive card-rule, full game-engine, or cross-browser coverage.

## Manual verification

For gameplay changes, verify normal and sandbox modes, reconnect behavior, and state synchronization between two players. See [Sandbox mode](./sandbox-mode.md) for manual scenarios.

For card imports, use `npm run importToolboxCardsDev` or `npm run importToolboxCardsProd`; both preload `.env` with `dotenv/config` and use `tsconfig.server.json`.

For Toolbox deck imports, confirm that the preview GET goes directly from the browser to `api.legionstoolbox.com`, while the subsequent authenticated save goes only to `POST /api/importDecks` on this app. For R2 migration testing, run `npm run syncCardImages` first and inspect its report before using `--apply`.
