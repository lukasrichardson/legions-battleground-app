# 05 — Make published-deck browsing and reading work on phones

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets

## What to build

Make published deck discovery and deck-detail reading fully usable with normal vertical page flow. Remove tiny nested viewing panes and horizontal card/detail collisions.

## Technical direction

### Browse route

- At narrow widths, render deck summaries as one-column cards. A second column is allowed only when all required labels remain legible.
- Each card contains: deck name, legion, featured hero, author, main/side counts, publish date, and a full-card tap target to open detail.
- Keep the current legion filter but make its trigger/contents mobile-safe via the shared filter/select pattern.

### Detail route

- Make the full route vertically scrollable; do not constrain the whole deck to a tiny fixed-height pane.
- Header presents deck identity, ownership/author, card counts, and full-width Copy action when applicable.
- Use a simple view selector: `Cards`, `Grouped`, `Stats`.
  - `Cards`: card thumbnails arranged responsively; tapping opens card inspector.
  - `Grouped`: card name + count rows; tapping opens card inspector.
  - `Stats`: existing available summary information only. Do not invent analytics.
- Special cards, Main Deck, and Side Deck are collapsible sections with visible counts.
- `Copy this deck` clearly handles signed-out state by initiating sign-in, and signed-in success navigates to the copied deck exactly as current behavior does.

## Acceptance criteria

- [ ] Browse cards and deck-detail header are in bounds at 320 px with long title/author/hero values.
- [ ] Deck details use normal vertical scroll; users can reach every deck section without first locating a small nested scroll region.
- [ ] Every visible card representation has an explicit tap path to inspection.
- [ ] View switching preserves the deck being viewed and does not lose the current page/route.
- [ ] Copy action is reachable, describes sign-in requirement when relevant, and retains existing server behavior.
- [ ] Loading, missing-deck/error, no-side-deck, and long deck-list states are tested.

## Explicit non-goals

- Do not add editing controls to another user's published deck.
- Do not change publish/copy authorization rules.
