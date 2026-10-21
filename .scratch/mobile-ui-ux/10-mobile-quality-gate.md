# 10 — Add responsive and touch regression coverage

**Type:** AFK  
**Blocked by:** 01-mobile-foundation; add coverage incrementally as tickets complete

## What to build

Make the mobile contract testable so later changes cannot reintroduce clipped controls or ambiguous critical actions. Use the existing end-to-end setup and test conventions; do not introduce a new testing framework.

## Technical direction

### Viewport matrix

Run applicable route tests at:

- 320x568
- 390x844
- 414x896
- 568x320
- 667x375

### Bounds helper

Create a test helper that inspects visible interactive elements (`button`, links, inputs, selects, textarea, and role-based controls). For every non-exempt visible element:

```text
rect.left >= 0
rect.top >= 0
rect.right <= viewport.width
rect.bottom <= viewport.height
```

Allow only explicit, named exemptions for intentional horizontal card strips/hand tray. The test must fail if an exemption is used for a form, page-level navigation, room list, or primary action.

### Behavior coverage

- Assert mobile navigation opens/closes and routes correctly.
- Assert dialogs keep close/primary actions visible.
- Assert lobby Join works on mobile.
- Assert card-gallery tap opens inspector.
- Assert deck-builder Add/Remove controls—not card body taps—change quantities; assert Undo where implemented.
- Assert portrait play shows rotate gate; landscape touch selection emits/attempts the expected existing command path.
- Capture screenshots for failures or baseline review where the existing E2E infrastructure supports it.

## Acceptance criteria

- [ ] Responsive tests cover every user-facing route and all shared overlay types introduced by tickets 01–09.
- [ ] Bounds helper fails on an off-screen visible interactive control and passes intentional documented card-strip exceptions.
- [ ] Tests verify there is no document-level horizontal overflow on portrait routes.
- [ ] Tests cover signed-out, signed-in where fixtures permit, loading/empty/error, and long-content variants for affected routes.
- [ ] Touch-flow assertions cover deck add/remove, room join, card inspection, and mobile gameplay selection.
- [ ] Existing test suite remains green; test changes do not depend on timing-only waits when an observable state is available.

## Review checklist before closing this ticket

- [ ] Every exemption has a user-visible scroll affordance.
- [ ] No test merely checks that an element exists when its required interaction should be executable.
- [ ] No acceptance check assumes a new API, data model, or orientation lock not specified in tickets 01–09.
