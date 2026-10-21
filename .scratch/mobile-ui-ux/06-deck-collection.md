# 06 — Make personal deck collection management phone-friendly

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets

## What to build

Make the authenticated Decks route usable on phones for finding, opening, creating, importing, and previewing decks. Replace desktop table/list assumptions with touch-friendly deck cards and page-level actions.

## Technical direction

- Represent each saved deck as a touch-friendly card with name, legion/hero, main/side counts, and relevant update/status information already available in the model.
- Tapping the card body opens the builder. Secondary actions belong in a clearly labeled overflow/menu control; they must not collide with the card-body tap.
- Keep `Create deck` and `Import deck` visible at page level. At narrow widths, use a sticky primary action or an accessible action menu—not a cramped header row.
- Apply ticket 02's responsive dialog to create/import/preview flows.
- Import preview card images may use an intentional horizontal strip only if it has clear scroll affordance. The import action remains pinned/reachable and does not move off-screen.
- Preserve existing routes, API calls, and auth behavior.

## Acceptance criteria

- [ ] The Decks page exposes Create and Import at 320 px without clipping, overlap, or hidden hover actions.
- [ ] Long deck names and heroes do not push counts/actions out of the viewport.
- [ ] Tapping a deck card reliably opens its builder; tapping a secondary action does not accidentally open the builder.
- [ ] Create, import preview, import error, import success, empty collection, and loading states fit supported phone viewports.
- [ ] Import preview's primary action remains reachable after the preview content is long.

## Explicit non-goals

- This ticket does not change in-builder card editing; that is ticket 07.
