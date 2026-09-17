# Game Engine

## Modes

The game supports two room-level modes:

- **Normal mode** applies phase and turn restrictions through the game and validation services.
- **Sandbox mode** relaxes interaction restrictions after setup so players can test card behavior and board states. It is selected when creating a room and is currently enabled by default in the initial state and room UI.

## Authoritative state

The server owns game progression. Shared interfaces in `src/shared/interfaces/` describe game state, cards, decks, and rooms. `src/shared/constants/initialGameState.ts` defines initial state. Client Redux slices hold the synchronized representation required for rendering and local UI state.

## Services

- `GameService` initializes, resets, and preserves game state.
- `RoomService` creates and manages rooms.
- `CardService` performs card-level changes.
- `EventHandler` coordinates game and room events.
- `ValidatorService` checks actions against the active state and mode.
- `GameHistoryService` supports undo and history state.

## Board and interaction model

The board includes hand, deck, discard, eradication, warriors, fortified, warlord, VeilRealm, synergy, guardian, tokens, and revealed zones. Cards can be dragged between supported zones and may expose contextual actions for flipping, targeting, modifiers, counters, cooldowns, and other card behavior.

Multi-zone movements include zone-index information so server-side updates preserve placement in nested card collections. The primary client integration points are `CardInner.tsx`, `GridItem.tsx`, and `Hand.tsx`; server behavior is coordinated through Socket.IO event handlers and game services.

## Sequences and phases

Normal games progress through setup and turn phases, including rock-paper-scissors and mulligan flows. Card effects that need player input are represented as sequences. Sandbox mode can auto-resolve sequence inputs where unrestricted testing is intended. See [Sandbox mode](./sandbox-mode.md) for verification scenarios.
