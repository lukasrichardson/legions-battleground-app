# 07 — Rebuild deck editing around explicit touch controls

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets, 06-deck-collection

## What to build

Make deck building reliable without drag-and-drop. A player must be able to search, inspect, add, remove, and save every eligible card using predictable tap controls. This is the primary fix for inconsistent card taps on mobile.

## Technical direction

### Mobile workspace

- Below 768 px, use three tabs: `Deck`, `Find cards`, `Details`.
- Sticky builder header contains deck name/context, explicit save state, and Save action.
- Tab switch does not discard unsaved local edits or active search/filter state during the current visit.

### Required interaction contract

```text
tap search-result card -> open CardInspectorSheet(card)
tap "Add to deck" -> request add one copy
  if allowed: update quantity + totals; show "Added <name>" with Undo
  if blocked: retain sheet; show exact legality reason

tap deck-row minus -> request remove one copy
  if quantity > 1: decrement; show Undo
  if quantity == 1: remove row; show Undo

tap deck-row plus -> same legality check and result as Add to deck
tap deck-row body -> open CardInspectorSheet(card)
tap "Remove all" overflow action -> remove all copies; show Undo
```

- Card row quantity controls are separate 44 px targets. A card-row body cannot add/remove a card.
- Use the same row/control contract for special, main, and side deck sections.
- `Add to deck` and `+` share the same validation path. `Remove` and `−` share the same mutation path.
- Do not require long press, swipe, or drag. Those may be future enhancements, never prerequisites.
- Reuse existing deck patch/queue behavior; do not create a second persistence channel.

### State and error handling

- Header state is one of `Saved`, `Unsaved changes`, `Saving…`, `Save failed`.
- Disable duplicate save while a save is pending; leave edits intact after failure and provide Retry.
- A blocked add displays the actual existing reason (deck limit, incompatible legion, ineligible side deck, etc.), not generic failure text.
- Undo restores exactly the quantity and section before the immediately preceding completed mutation. If persistence fails, undo is not offered as a false success; show failure and refresh/reconcile using existing client behavior.

## Acceptance criteria

- [ ] On a 320 px viewport, a user can search, inspect, add, remove one, remove all, and save a deck without drag-and-drop.
- [ ] Card body taps always inspect; only explicit Add/+/−/Remove all controls mutate deck composition.
- [ ] Quantity controls are 44 px targets and cannot overlap neighbouring card-row actions.
- [ ] All three deck sections follow one interaction model.
- [ ] Add/remove updates totals and section count immediately, then resolves persistence status correctly.
- [ ] Undo restores the immediately prior successful add/remove operation and expires predictably.
- [ ] Illegal adds are prevented before mutation and show a specific reason.
- [ ] Unsaved, saving, failed-save, long card title, zero quantity, and section-empty states are covered by tests.
- [ ] Existing deck-composition and patch-queue tests continue to pass.

## Explicit non-goals

- Do not redesign game/deck legality rules.
- Do not remove desktop drag-and-drop if it currently works; simply ensure no mobile workflow depends on it.
