# Architecture

## System shape

Legions Battleground is a single full-stack repository and deployable Node.js process, not a multi-package monorepo. Next.js renders the application UI while an Express server hosts HTTP routes and Socket.IO handles live game events. MongoDB persists cards, decks, rooms, and game state.

```text
Browser
  ├── Next.js routes, React components, Redux state, and Socket.IO client
  └── NextAuth session cookies
          │
          ▼
Express + Socket.IO server
  ├── HTTP route controllers and API services
  ├── Game, room, card, event, and validation services
  └── MongoDB data access
```

## Code boundaries

| Area | Location | Responsibility |
|---|---|---|
| Application routes and UI | `src/app/` | Next.js pages, UI components, authentication routes, play and deck experiences. |
| Client state and utilities | `src/client/` | Redux slices, socket hook, UI utilities, image preloading, and shared client primitives. |
| HTTP and Socket.IO server | `src/server/` | Express startup, routes, socket handlers, middleware, and server-only utilities. |
| Game services | `src/server/services/game/` | Room lifecycle, game state, card actions, event handling, history, and validation. |
| API services | `src/server/services/api/` | Deck and published-deck operations. |
| Shared domain model | `src/shared/` | Shared interfaces, enums, and initial game state used by both sides of the application. |

## State and event flow

1. A user action is dispatched from a React component or Redux-connected hook.
2. The Socket.IO client emits a game, room, or phase event.
3. Server handlers validate the request and delegate to the relevant game service.
4. The server updates authoritative state and broadcasts the resulting state to connected players.
5. Client event handlers update Redux slices and re-render the UI.

HTTP routes are used for resource-oriented operations such as deck, card, room, and published-deck data. Socket events carry the interactive game loop.

## Authentication and authorization

NextAuth provides GitHub, Google, and Discord OAuth sign-in. Express middleware exposes authenticated user context to protected API routes. Deck operations use that context to scope access to the owner; published decks have separate public and authenticated operations.

## Deployment model

`src/server/server.ts` starts the hybrid Next.js and Express application. `npm run build` builds Next.js, compiles the server TypeScript, and resolves runtime aliases; `npm start` runs the compiled server. The Dockerfile packages the same model for container deployment.
