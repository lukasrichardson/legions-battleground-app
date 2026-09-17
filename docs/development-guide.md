# Development Guide

## Before changing behavior

1. Identify whether the change is client-only, API-oriented, or part of the live game loop.
2. Update shared types in `src/shared/` when both client and server exchange the new data.
3. Keep normal and sandbox mode behavior explicit when changing game actions.
4. Run the checks listed in [Testing and quality](./testing-and-quality.md).

## Adding an HTTP API capability

1. Add or extend a controller in `src/server/controllers/`.
2. Put reusable data and business logic in `src/server/services/api/`.
3. Register the controller or route in `src/server/network/routes.ts`.
4. Apply `requireAuth` or `optionalAuth` from `src/server/middleware/auth.ts` where the route needs session context.
5. Update [the API reference](./api.md).

## Adding a game action or Socket.IO event

1. Define or update shared event and payload types in `src/shared/`.
2. Add client emission and state handling in `src/client/`.
3. Wire the server handler in `src/server/network/socketHandler.ts` or the relevant event module.
4. Delegate state changes to `src/server/services/game/` rather than embedding game logic in UI components.
5. Validate the action and exercise both game modes.

## Database changes

MongoDB access is centralized around `src/server/utils/database.util.ts` and API/game services. Update the relevant shared interfaces with any persisted-shape change, retain ownership checks for user resources, and test with existing deck and room records where practical.

## TypeScript conventions

- Prefer domain interfaces and type guards over `any`.
- Keep shared client/server contracts in `src/shared/`.
- Treat server state as authoritative; do not rely on client-only validation for game rules or authorization.
- Keep file paths and documentation references current when moving a service or interface.
