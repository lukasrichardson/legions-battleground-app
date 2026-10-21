# 04 — Make the card gallery tap-first and responsive

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets

## What to build

Make card discovery, filtering, pagination, and inspection usable on narrow phones. A card tap must have one consistent meaning: inspect the card. Gallery cards must not hide essential information behind hover.

## Technical direction

- Keep search visible at the top of the gallery while the result area scrolls.
- Open filters in the shared Filter Sheet. It must expose all existing filters, an active-filter count, Apply, and Reset.
- Use a two-column grid at narrow phone widths; increase columns only when card images and spacing remain legible.
- Maintain the existing data/query semantics. Changing filters updates results and resets pagination according to current product behavior.
- Tapping a gallery card opens a mobile card-inspector sheet containing image, title, readable rules/details, and close target.
- Do not attach add/remove deck mutations to gallery card taps.
- Keep Prev/Next controls reachable; use a compact accessible pagination footer. Do not allow the count/control row to wrap over itself.

### Pseudocode behavior

```text
tap GalleryCard(card):
  selectedCard = card
  open CardInspectorSheet(selectedCard)

tap Filters:
  draftFilters = appliedFilters
  open FilterSheet(draftFilters)

tap Apply:
  appliedFilters = draftFilters
  page = 1
  close sheet

tap Reset:
  draftFilters = defaults
```

## Acceptance criteria

- [ ] Search, Filters, result count, pagination controls, and first two rows of cards fit within a 320 px viewport without horizontal overflow.
- [ ] Gallery card tap opens an inspector sheet every time; it does not perform a hidden add/remove action.
- [ ] Filter Sheet Apply/Reset behavior is deterministic and preserves filter state on cancel.
- [ ] Inspector text/image/body scroll without hiding its close target.
- [ ] Loading, empty-result, failed-request, and long-card-name states are readable and reachable.
- [ ] Existing card search/filter tests still pass; add mobile interaction coverage for inspect and filters.

## Explicit non-goals

- Do not add deck-editing controls to the gallery.
- Do not change card data or filter semantics.
