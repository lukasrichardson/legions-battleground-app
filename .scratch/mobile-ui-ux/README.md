# Mobile UI/UX implementation tickets

## Objective

Make Legions Battleground reliably usable on phones without creating a separate mobile product. The app must have no clipped interactive controls, accidental horizontal scrolling, or drag/hover-only core actions.

## Delivery order

| Order | Ticket | Can start after |
| --- | --- | --- |
| 1 | 01-mobile-foundation | Immediately |
| 2 | 02-mobile-shell-and-sheets | 01 |
| 3 | 03-auth-and-lobby | 01, 02 |
| 4 | 04-card-gallery | 01, 02 |
| 5 | 05-published-decks | 01, 02 |
| 6 | 06-deck-collection | 01, 02 |
| 7 | 07-deck-builder-touch-controls | 01, 02, 06 |
| 8 | 08-mobile-match-entry | 01, 02, 03 |
| 9 | 09-landscape-gameplay-touch | 01, 02, 08 |
| 10 | 10-mobile-quality-gate | 01; extend after every ticket |

## Product decisions already made

- Phone gameplay is **landscape-only**. Portrait may show only a rotate prompt after a player has entered a match; do not build a portrait companion view.
- Mobile players **can create and join games**. `N/A on mobile` is not an acceptable state.
- Drag-and-drop is optional desktop enhancement only. No mobile-critical task may require it.
- Card taps inspect a card. Explicit controls mutate state.
- The target is touch-first, not a visually shrunken desktop layout.

## Shared acceptance definitions

- **Supported narrow portrait:** 320x568, 360x800, 390x844, 414x896 CSS pixels.
- **Supported compact landscape:** 568x320 and 667x375 CSS pixels.
- **In bounds:** a visible interactive element's client rect is fully inside the viewport, except an intentionally horizontally scrollable card strip whose affordance is visible.
- **Touch target:** its hit area is at least 44x44 CSS pixels. Visual icon size may be smaller.
- **Immediate feedback:** within the current render cycle the user sees one of selected, pending, succeeded, failed, or undoable state. Network-backed actions may show a pending state first.
- **No accidental horizontal scroll:** `document.documentElement.scrollWidth <= window.innerWidth`; scoped horizontal scrolling is permitted only where the ticket explicitly says so.

## Coverage map

| Existing surface | Ticket(s) that own the mobile outcome |
| --- | --- |
| Global styles, page sizing, shared inputs/buttons | 01 |
| Arena navigation, account menu, every modal/dialog/form | 02 |
| Home, sign-in, active rooms, create/join room | 03 |
| Card gallery and card inspection | 04 |
| Published deck browse and deck detail/copy | 05 |
| Personal deck list, create/import/preview | 06 |
| Deck builder, search pane, deck sections, card add/remove/save | 07 |
| Match admission and portrait rotate gate | 08 |
| Landscape board, toolbar, hand, targeting, game overlays | 09 |
| Route/overlay regression protection | 10 |

## Ticket-quality review

These tickets deliberately define the interaction outcome, test dimensions, and state ownership before implementation. They do not mandate file-level refactors, CSS framework changes, or a new state-management library. If an implementation discovers a conflict with an existing rule/engine constraint, preserve the game/deck legality rule and update the affected ticket with the exact constraint before changing interaction behavior.
