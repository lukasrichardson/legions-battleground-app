# 01 — Establish the responsive and touch foundation

**Type:** AFK  
**Blocked by:** None — can start immediately

## What to build

Create one mobile-safe layout and interaction foundation that every route can consume. Fix the app-level conditions that currently produce clipped panels and nested scroll traps: global viewport locking, fixed desktop dimensions, unbounded flex children, and too-small touch controls.

This ticket is not a visual redesign of every route. It supplies the rules and primitives that later tickets apply.

## Technical direction

1. Make normal non-game pages vertically scrollable.
   - Replace global `100vw`/`100vh` plus `overflow: hidden` behavior with a dynamic-viewport-height page model.
   - Keep overflow containment only where a component genuinely owns a bounded viewport (for example, the landscape game board).
   - Add bottom safe-area padding to pages and sticky action areas.
2. Define shared layout tokens or utility conventions:
   - narrow-page gutter = 12 px; standard phone gutter = 16 px;
   - compact header = 56–64 px;
   - minimum touch target = 44 px;
   - page content must allow shrinking with `min-width: 0`;
   - long labels must wrap, clamp, or truncate inside a bounded parent.
3. Provide a reusable page-content wrapper and a reusable sticky-action wrapper.
   - Page wrapper owns vertical scrolling and horizontal padding.
   - Sticky action wrapper reserves safe-area bottom space and must never obscure the final content item.
4. Define a reusable touch feedback contract for buttons and selectable cards:
   - enabled: pressed visual state;
   - pending: disabled only for the relevant action and exposes an accessible busy label;
   - failure: visible inline error or toast;
   - success: visible completion or state update.
5. Audit base primitives (`Button`, `Input`, `Select`, card actions, icon buttons) so their hit area satisfies the target even when the visible icon/text is compact.

### Pseudocode behavior

```text
PageShell(content):
  render main(min-height: 100dvh, overflow-x: clip)
  render content column(min-width: 0, padding-inline: responsive gutter)
  allow document/page vertical scrolling

StickyAction(action):
  position: sticky at viewport bottom within owning page
  padding-bottom: safe-area-inset-bottom + base spacing
  reserve equivalent content padding so action never covers last item

InteractiveControl(state):
  hitbox >= 44px by 44px
  on press -> pressed visual
  on pending -> aria-busy and prevent duplicate submission
  on success/failure -> visible feedback
```

## Acceptance criteria

- [ ] Normal routes can scroll vertically on a phone; the document is not globally locked by desktop viewport CSS.
- [ ] At 320, 360, 390, and 414 px portrait widths, the document itself has no horizontal overflow.
- [ ] Shared page and sticky-action wrappers reserve top/bottom safe areas and do not conceal content.
- [ ] Shared button, input, select trigger, and icon-button hit areas are at least 44x44 px where they are primary touch targets.
- [ ] Every flex/grid primitive used by new mobile work can shrink without forcing its parent wider than the viewport.
- [ ] Existing keyboard focus indicators remain visible after the primitive changes.
- [ ] Add unit/component coverage for the responsive wrapper and touch-target class contract; if a behavior requires a rendered viewport, cover it in the end-to-end suite from ticket 10 instead.

## Explicit non-goals

- Do not redesign individual pages here.
- Do not change deck legality, game rules, APIs, authentication, or server state.
