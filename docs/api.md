# API Reference

The detailed REST and Socket.IO reference is preserved in [API reference details](./api-reference.md). Keep that document updated alongside route and event changes until its contents are fully incorporated here.

## Route ownership

- `src/server/network/routes.ts` contains health, room, card, import, and banlist endpoints.
- `src/server/controllers/decks.controller.ts` owns authenticated deck endpoints.
- `src/server/controllers/publishedDecks.controller.ts` owns public and authenticated published-deck endpoints.
- `src/server/network/socketHandler.ts` owns Socket.IO connection and event registration.

The API documentation must never infer an endpoint from UI behavior; verify it against these files.
