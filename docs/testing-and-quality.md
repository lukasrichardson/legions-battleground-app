# Testing and Quality

## Automated checks

```bash
npm run lint
npm run typecheck
npm run typecheck:server
npm test
npm run test:coverage
npm run build
```

`test` runs Vitest tests in `tests/`. `test:coverage` writes text, HTML, and LCOV coverage reports to `coverage/`; the directory is generated output and must not be committed.

## Current coverage scope

The automated suite covers deterministic utility behavior, card selection, ordinal formatting, HTML entity decoding, socket payload validation, R2 image-key migration, R2 service-worker routing, and Toolbox deck-response parsing. It does not claim full game-engine, database, HTTP, Socket.IO, or browser coverage. Those systems still need integration and end-to-end tests with isolated MongoDB and authenticated browser fixtures.

## Manual verification

For gameplay changes, verify normal and sandbox modes, reconnect behavior, and state synchronization between two players. See [Sandbox mode](./sandbox-mode.md) for manual scenarios.

For card imports, use `npm run importToolboxCardsDev` or `npm run importToolboxCardsProd`; both preload `.env` with `dotenv/config` and use `tsconfig.server.json`.

For Toolbox deck imports, confirm that the preview GET goes directly from the browser to `api.legionstoolbox.com`, while the subsequent authenticated save goes only to `POST /api/importDecks` on this app. For R2 migration testing, run `npm run syncCardImages` first and inspect its report before using `--apply`.
