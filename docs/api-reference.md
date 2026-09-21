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
| `GET /api/toolboxDecks/:deckId` | Public | Fetches a deck from the Legions Toolbox API. |
| `GET /api/cards` | Public | Lists cards; supports `query`, `legion`, `type`, `rarity`, `set`, `page`, and `pageSize`. |
| `GET /api/cards/filterOptions` | Public | Returns card filter values. |
| `GET, POST /api/banlist` | GET public; POST authenticated | Reads or updates banlist entries. |
| `/api/decks` and `/api/published_decks` | Controller-defined | Deck-library and published-deck operations. |

## Socket.IO

On connection, the server emits `rooms`. Clients may emit `joinGame`, `gameEvent`, and `roomEvent`; malformed payloads receive an `error` event. Successful joins broadcast `rooms`, `roomEvent`, and `gameEvent`; game actions may also broadcast `phaseEvent` and `gameHistoryEvent`.

The authoritative payload shapes are `JoinGamePayload`, `GameEventPayload`, and `RoomEventPayload` in `src/server/interfaces/SocketTypes.ts`; event names are in `src/shared/enums/`.
