# 08 — Allow phone users to enter matches and handle orientation cleanly

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets, 03-auth-and-lobby

## What to build

Allow mobile players to create and join rooms, then enforce landscape only at the point where the active board is shown. Do not build a portrait companion game view.

## Technical direction

- Remove device-type logic that replaces the lobby Join action with `N/A on mobile`.
- Keep Create Room and Join Room form behavior/validation identical across phone and desktop.
- After successful room admission and route transition:
  - landscape: show the playable game layout;
  - portrait: show a full-screen orientation gate with `Rotate your device to play`, match-safe background, and no board controls.
- The orientation gate must react to rotation without requiring a reload and reveal the existing game UI once landscape is reached.
- Do not disconnect, reset game state, or repeat admission when the device rotates.
- The gate must cover the board in portrait so partially interactive board controls cannot be tapped underneath.

### Pseudocode behavior

```text
on room admission success:
  navigate to play route using existing admission token/session flow

PlayRoute:
  if viewport orientation is portrait AND viewport width <= mobile threshold:
    render OrientationGate above board
    board remains mounted but inert/covered
  else:
    render board

on orientationchange/resize:
  recompute orientation
  do not rejoin room or mutate game state
```

## Acceptance criteria

- [ ] A signed-in phone user can create and join a room using the same authorization/admission behavior as desktop.
- [ ] No lobby state displays `N/A on mobile` instead of a functional Create/Join flow.
- [ ] Portrait active-match view exposes only the rotate gate; board controls cannot receive touch input behind it.
- [ ] Rotating to supported landscape reveals the board without page reload, reauthentication, room rejoin, or state reset.
- [ ] Rotating back to portrait re-applies the gate without disconnecting the player.
- [ ] Existing regular-match authentication and room-security tests remain valid.

## Explicit non-goals

- No portrait match controls, chat, or companion mode.
- No forced browser/device orientation lock.
