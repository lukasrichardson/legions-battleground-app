# 09 — Make landscape gameplay usable without drag-and-drop

**Type:** AFK  
**Blocked by:** 01-mobile-foundation, 02-mobile-shell-and-sheets, 08-mobile-match-entry

## What to build

Provide a compact landscape interaction model for game play. Preserve existing desktop behavior, but make touch selection and targeting complete enough that a phone player never needs a drag gesture for a required action.

## Technical direction

- Treat 568x320 and 667x375 as the minimum supported landscape board sizes.
- Keep the existing board semantics and game-event pipeline. Only change presentation and client interaction routing.
- Add a selected-card state for touch:

```text
tap playable card:
  set selectedCard
  show selected visual and valid target affordances

tap valid target/zone:
  emit the same event that desktop drag/drop would emit
  clear selection after accepted command or terminal validation failure

tap selected card again OR tap Cancel:
  clear selection without changing game state

tap invalid target:
  retain selection; show concise reason/feedback; emit no game mutation
```

- Keep hand cards in an intentionally horizontally scrollable bottom tray with visible edge affordance.
- Make phase/advance control large, labeled, and reachable in the bottom/thumb zone. Disable it with a reason when unavailable.
- Consolidate inspector, activity/log, navigation, tools, and match actions behind compact rail controls that open a bounded overlay/sheet. Their controls must remain touch friendly.
- Card inspection is separate from play/target selection. If one card supports both, provide an explicit inspect affordance rather than relying on gesture ambiguity.
- Maintain regular-match and sandbox differences; never expose unavailable regular-match controls as active.

## Acceptance criteria

- [ ] At 568x320 and 667x375, a user can select a card, cancel selection, choose a valid target, and advance a permitted phase without drag-and-drop.
- [ ] Touch-triggered commands use existing game event validation; client presentation does not bypass server/game rules.
- [ ] Invalid targets do not mutate state and give immediate visible feedback.
- [ ] The hand tray is the only intentional horizontal-scroll interaction on the board and has a visible scroll affordance.
- [ ] Phase, menu, activity, inspector, and leave/concede actions are reachable and have at least 44 px touch targets.
- [ ] Existing desktop drag/drop behavior remains functional.
- [ ] Regular-match and sandbox interaction tests cover enabled/disabled action states.

## Explicit non-goals

- Do not create a portrait board.
- Do not redesign game rules, targeting rules, or Socket.IO event contracts.
