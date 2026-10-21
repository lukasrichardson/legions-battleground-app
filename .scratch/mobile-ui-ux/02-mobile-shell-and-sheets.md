# 02 — Standardize mobile navigation, dialogs, forms, and feedback

**Type:** AFK  
**Blocked by:** 01-mobile-foundation

## What to build

Make one consistent mobile shell for navigation and one consistent mobile sheet/dialog behavior for every current overlay. Replace draggable, desktop-positioned dialogs as the phone default. Ensure all forms and destructive actions remain visible and usable when content is long or the software keyboard is present.

## Technical direction

### Navigation

- Keep the compact top bar: home/logo, contextual page title or Back, and a menu target.
- Mobile menu is a full-height right sheet with:
  - close target pinned at top;
  - navigation links;
  - account action area;
  - Support link pinned at bottom.
- Every row/link has a 44 px hit area. Closing and navigation must restore focus to the invoker when applicable.

### Responsive dialog contract

Use one `ResponsiveDialog` API or equivalent behavior:

```text
ResponsiveDialog({open, title, body, primaryAction?, closeAction}):
  if viewport < 768px:
    render bottom sheet, max-height <= dynamic viewport minus safe areas
    pin header (title + close)
    scroll body only when body exceeds available height
    if primaryAction exists: pin action footer
  else:
    render constrained centered dialog

  on open: move focus inside
  Tab: keep focus inside
  Escape/backdrop: close only when caller permits close
  on close: restore opener focus
```

- Do not support dragging on mobile.
- Do not close an in-progress destructive confirmation merely by tapping an accidental backdrop.
- Apply this contract to Create Deck, Create Room, Join Room, Import/Preview Deck, Help, Card Pile, Tools/Settings, Plunder, card inspector, concede/leave, join errors, and match-complete dialogs.

### Forms and feedback

- Forms are one column below 768 px.
- Input labels remain visible; placeholders are supplemental only.
- Validation appears immediately after the related field; submit scrolls/focuses the first invalid field.
- Prevent duplicate submits while a request is pending.
- Provide a small app-level toast/undo mechanism for reversible local mutations. This ticket provides the mechanism; the deck-builder ticket consumes it.

## Acceptance criteria

- [ ] The mobile navigation sheet has visible, reachable Home, Decks, Browse, Cards, account, Support, and Close controls at 320 px.
- [ ] Every listed existing modal uses the responsive dialog contract or documents a justified exception.
- [ ] A dialog's title/close row and primary action never scroll out of reach on a supported phone viewport.
- [ ] Create/Join/Import forms remain one column and usable with long values and keyboard-visible viewport reduction.
- [ ] Dialog focus trapping, Escape behavior, and focus restoration work with keyboard navigation.
- [ ] The shared toast API can show an action label, optional Undo action, and expiry without covering a sticky primary action.
- [ ] No modal/container creates unexpected page-wide horizontal scrolling.

## Explicit non-goals

- Do not redesign card/deck content in this ticket.
- Do not alter what existing forms submit or their server APIs.
