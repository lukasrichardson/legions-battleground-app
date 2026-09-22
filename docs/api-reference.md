# API and Socket.IO Reference

This reference is derived from `src/server/network/routes.ts`, the two controllers, and `src/server/network/socketHandler.ts`. It does not claim rate limits, custom status formats, or payload fields not implemented in source.

## Route ownership

- `src/server/network/routes.ts` owns health, room, card, import, and banlist routes.
- `src/server/controllers/decks.controller.ts` owns authenticated deck routes.
- `src/server/controllers/publishedDecks.controller.ts` owns published-deck routes.
- `src/server/network/socketHandler.ts` registers Socket.IO connection handlers.

## HTTP routes

| Route | Access | Purpose |
|---|---|---|
| `GET /healthz` | Public | Returns plain-text `ok`. |
| `POST /createRoom` | Public | Creates an in-memory room from `roomName`, `playerName`, `deckId`, optional `p2DeckId`, `sandboxMode`, and optional `roomPassword`. |
| `POST /joinRoom` | Public | Validates a room, player name, deck, and optional room password. |
| `GET /api/cards` | Public | Lists cards; supports `query`, `legion`, `type`, `rarity`, `set`, `srlStatus`, `page`, and `pageSize`. `srlStatus` accepts active banlist values plus `unrestricted`, which returns cards with no banlist record. |
| `GET /api/cards/filterOptions` | Public | Returns card filter values. |
| `GET, POST /api/banlist` | GET public; POST authenticated | Reads or updates active banlist entries. POST accepts `suspended`, `restricted`, `limited`, or `unrestricted`; posting `unrestricted` removes the card's entry because it is the implicit default. |
| `/api/decks` and `/api/published_decks` | Controller-defined | Deck-library and published-deck operations. |

## Toolbox deck import

Deck preview requests are deliberately made by the browser directly to Toolbox's public deck endpoint, rather than proxied through this server. This keeps the request associated with the user's IP address and avoids concentrating Toolbox rate limits or bot challenges on the application server.

The browser then sends the selected deck to authenticated `POST /api/importDecks`. The server resolves each card by its Toolbox `code` first (with a title fallback for legacy payloads), replaces it with the canonical Mongo card document, and persists the deck. No Toolbox credentials or user cookies are sent with the browser-side request.

## Socket.IO

On connection, the server emits `rooms`. Clients may emit `joinGame`, `gameEvent`, and `roomEvent`; malformed payloads receive an `error` event. Successful joins broadcast `rooms`, `roomEvent`, and `gameEvent`; game actions may also broadcast `phaseEvent` and `gameHistoryEvent`.

The authoritative payload shapes are `JoinGamePayload`, `GameEventPayload`, and `RoomEventPayload` in `src/server/interfaces/SocketTypes.ts`; event names are in `src/shared/enums/`.
