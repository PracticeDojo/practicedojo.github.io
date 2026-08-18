# Test Protocol — v2.12.1 (Feature 28 exerted-card / scaling fixes)

File under test: `practice_dojo/practice_dojo.html`.

Setup: get a lot of cards onto one field. Fastest route is a Duels.ink replay imported to a late
turn, or drag cards from hand to field repeatedly. Exert with the card's context menu.

---

## A. Exerted card geometry

- [ ] **A1** Exert one character on an otherwise empty field → it sits **centred in its own slot**,
      not hanging low or drifting left.
- [ ] **A2** Its drop shadow falls **downward**, same direction as the upright cards next to it —
      not off to one side.
- [ ] **A3** Hover an exerted card → it does **not** grow or jump. Neighbours don't shift.
- [ ] **A4** Hover an upright card → the usual lift still works.
- [ ] **A5** Exert a card in the **inkwell** → same, centred and stable.
- [ ] **A6** A location (enters play exerted) sits centred, with its stacked characters above it.

## B. Shadows and badges scale with the card

Use Tweaks → Card size at `0.7×` and `1.4×`, and fill the field to force auto-scaling down.

- [ ] **B1** As cards shrink, the drop shadow shrinks with them — no oversized blurry smear under a
      small card.
- [ ] **B2** Damage counters shrink with the card and stay pinned to the top-right corner. At the
      smallest scale the number is still readable (they stop shrinking at 60%).
- [ ] **B3** The purple stack-count badge stays pinned to the bottom-right corner at every scale.
- [ ] **B4** The `NEW` (drying) pill scales and stays inside the card.
- [ ] **B5** Face-down cards (opponent hand, un-flipped inkwell) scale their shadow and inner border
      too.
- [ ] **B6** Hand, inkwell and discard cards look **unchanged** from before — they aren't auto-scaled,
      so their shadows should be exactly as they were.

## C. Row fitting — the main fix

For each, the field must stay on **one row** with **no horizontal scrollbar** and nothing spilling
past the board edge:

- [ ] **C1** 8 characters, all exerted.
- [ ] **C2** 12 characters, none exerted.
- [ ] **C3** 12 characters, alternating exerted / upright.
- [ ] **C4** 1 location + 8 characters.
- [ ] **C5** 2 locations + 10 exerted characters. *(This was the worst case — ~162px of overflow
      before the fix.)*
- [ ] **C6** 20+ exerted characters → wraps to 2 rows, still no horizontal overflow.
- [ ] **C7** Exert and un-exert cards one at a time on a full field → the row re-fits smoothly each
      time, never overflowing mid-way.
- [ ] **C8** Resize the browser window narrow → wide with a full field → the row keeps fitting.
- [ ] **C9** Toggle the sidebar (panel layout: Docked → Hide) with a full field → re-fits.
- [ ] **C10** Mobile 360px with 6+ cards including exerted ones → fits, no sideways scroll.

## D. Regression

- [ ] **D1** Drag & drop onto the field, onto a location, and card-onto-card stacking all still work
      with exerted cards involved.
- [ ] **D2** Challenge (drag onto an opponent card) still works and the arrow lands correctly on an
      exerted target.
- [ ] **D3** Hover action chips (PLAY / INK / QUEST) still appear on upright cards; still hidden on
      exerted ones.
- [ ] **D4** Clicking an exerted card still opens its context menu (the card moved, its hit area
      should have moved with it).
- [ ] **D5** Version reads **v2.12.1** on loading screen, setup screen and sidebar.
- [ ] **D6** No console errors.

---

Notes / failures:
