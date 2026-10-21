# 03 — Make sign-in, home, and room joining phone-first

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets

## What to build

Deliver a complete mobile lobby flow: sign in, inspect rooms, create a room, join a room, and browse recent decks without clipped desktop rows or a mobile exclusion state.

## Technical direction

### Sign-in

- Provider buttons span their available container width and remain fully visible at 320 px.
- Provider text must not expand the page. Wrap only if needed; otherwise truncate only decorative/secondary text, never the provider identity.

### Lobby

- Keep one primary action: signed-out `Enter the Battleground`; signed-in `Play`.
- Convert each active room from a fixed multi-column row into a stacked room card:
  - first line: room name and lock/mode badges;
  - second line: host and player count;
  - final line: full-width Join action.
- Mobile Join behavior:
  - signed out: invoke existing sign-in flow;
  - signed in: open the existing Join Room form sheet;
  - never display `N/A on mobile`.
- Recent published decks use vertically scrollable preview cards at narrow widths. Do not use a clipped wide carousel as the only discovery path.
- Preserve the desktop presentation where it remains appropriate; mobile is a responsive variant, not a separate route.

### State table

| State | Visible result |
| --- | --- |
| No rooms | explanatory empty state and primary Play action |
| Rooms loading | non-interactive skeleton/status with no layout shift beyond its container |
| Locked room | lock badge; Join still opens password-capable form |
| Signed out Join | sign-in begins; no fake disabled Join action |
| Join pending | only that submit control is pending; user cannot double-submit |
| Join failure | inline form error; entered password/selected deck retained when safe |

## Acceptance criteria

- [ ] Sign-in choices, primary lobby action, active rooms, and recent-deck link are all in bounds at 320 px.
- [ ] Every active room has a touch-friendly Join action on mobile; no room renders `N/A on mobile`.
- [ ] A signed-in user can reach Create Room and Join Room, choose a deck, and submit from a phone-width viewport.
- [ ] Room names, aliases, and deck titles with long strings cannot force overflow or overlap their actions.
- [ ] Recent published decks are usable without horizontal page scrolling and lead to their detail route.
- [ ] Empty, loading, signed-out, locked-room, and join-error states are covered by automated or manual viewport tests.

## Explicit non-goals

- This ticket does not implement the in-match landscape board; it only gets the player to match entry.
