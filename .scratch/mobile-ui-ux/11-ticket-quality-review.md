# Ticket quality review — Mobile UI/UX

## Review result

**Approved for implementation as local tickets.** The tickets are self-contained and do not depend on a future product/architecture document.

## Checks performed

| Check | Result | Resolution / evidence |
| --- | --- | --- |
| Every user-facing route is owned | Pass | README coverage map assigns home, auth, decks, deck builder, cards, browse, deck detail, and play. |
| Every current modal family is owned | Pass | Ticket 02 owns the common responsive-dialog behavior and explicitly names create, join, import/preview, help, card pile, tools, plunder, inspector, concede/leave, errors, and match-complete. Feature tickets own their content behavior. |
| Mobile gameplay requirement is unambiguous | Pass | Tickets 08–09 state: join/create allowed; board landscape-only; portrait is rotate gate only; no forced orientation lock or companion view. |
| Deck editing touch behavior is unambiguous | Pass | Ticket 07 specifies card-body tap = inspect; explicit buttons = mutate; same validation path; immediate state/undo; drag not required. |
| Responsive requirements are measurable | Pass | README defines target viewports, in-bounds condition, touch target, feedback, and overflow rule. Ticket 10 automates the bounds/overflow contract. |
| Dependencies are safe | Pass | Foundation and dialog work precede consuming route work; deck builder waits for personal collection; gameplay waits for mobile match entry. No circular dependency. |
| Existing rules/APIs are protected | Pass | Tickets repeatedly preserve deck legality, existing patch queue, authorization/admission, Socket.IO command validation, and desktop drag/drop. |
| Scope is bounded | Pass | Explicit non-goals prevent a portrait gameplay redesign, server-rule changes, new data models, forced orientation lock, and unnecessary framework migration. |

## Ambiguities resolved before implementation

1. **“Mobile-friendly” is not subjective.** Use the README viewport, bounds, target-size, and overflow definitions.
2. **“Tap card” has one meaning.** It opens inspection. It cannot add/remove a deck card.
3. **Add/remove behavior has one meaning.** Explicit Add, Plus, Minus, and Remove-all controls are the sole mutation paths; they all use the existing legality/persistence path.
4. **Undo is limited.** It restores only the immediately preceding successful deck mutation. It is not a general history system.
5. **Landscape is not optional for the board.** The app does not attempt to reflow the board into portrait.
6. **Horizontal scrolling is narrowly exempted.** Only card strips/hand tray named by tickets are allowed; no page-level, form, list, or primary-action overflow is acceptable.
7. **No duplicate persistence architecture.** Deck changes continue through the existing patch queue; game changes continue through existing validated game-event emission.

## Implementation handoff rules

- Complete tickets in dependency order.
- A ticket cannot close solely on visual inspection: it must satisfy its stated behavior, bounds, and state criteria.
- If a legitimate existing domain rule blocks an acceptance criterion, record the exact rule and revise the ticket before shipping a silent exception.
- Add every newly discovered modal or mobile-only control to ticket 02 and ticket 10 before merging it.
