# Testing and Quality

## Automated checks

```bash
npm run lint
npm run typecheck
npm run typecheck:server
npm run build
```

- `lint` runs ESLint over maintained source files.
- `typecheck` checks the Next.js/client TypeScript project without emitting output.
- `typecheck:server` checks server and shared TypeScript without emitting output.
- `build` produces the Next.js production build and compiled server output.

## Current coverage boundary

The repository does not currently include an automated unit, integration, or end-to-end test suite. Do not represent it as having automated test coverage. Manual sandbox-mode scenarios are maintained in [Sandbox mode](./sandbox-mode.md).

## Recommended change verification

For a UI change, run lint, client typecheck, and a local browser smoke test. For a server or shared-contract change, also run server typecheck and production build. For gameplay behavior, verify normal and sandbox modes, reconnect behavior, and state synchronization between players.
