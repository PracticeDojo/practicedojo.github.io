# Test Protocol — v2.12.2 (Locations landscape, at-location cards, location preview)

File under test: `practice_dojo/practice_dojo.html`. Run `TEST-PROTOCOL-v2.12.1.md` first — this
builds on it and section C there (row fitting) still applies.

Setup: play a Location to the field, then drag characters onto it.

---

## A. Locations render landscape

- [ ] **A1** Play a Location → it appears **rotated 90°** (landscape), filling its slot.
- [ ] **A2** Toggle its exert state from the context menu → it **stays landscape** and does **not**
      dim or change size. (Locations don't exert; the rotation no longer depends on that flag.)
- [ ] **A3** Its drop shadow falls **downward**, same as every other card on the board.
- [ ] **A4** Hover it → no jump, no resize.
- [ ] **A5** A Location **in hand** is still portrait, and the hand layout is unchanged.
- [ ] **A6** A Location in the **discard pile**, in **Inspect Deck** and in **Inspect Discard** is
      still portrait.
- [ ] **A7** Load an old bookmark / imported replay that has a Location on the field → it renders
      landscape correctly.

## B. Characters standing at a Location

- [ ] **B1** Drag a character onto a Location → it sits above it, slightly **smaller** than the
      cards on the open field (that's intentional).
- [ ] **B2** Its drop shadow falls **downward** and sits directly under the card — **not offset to
      one side**, which was the reported bug.
- [ ] **B3** Exert a character that's at a Location → rotates, stays centred, shadow still falls
      downward, still slightly smaller than field cards.
- [ ] **B4** A damaged character at a Location → its damage counter is scaled to match the smaller
      card and stays pinned to the corner.
- [ ] **B5** A newly played character at a Location → the `NEW` pill is scaled to fit.
- [ ] **B6** Hover a character at a Location → no growth jump; drag it back off the Location works.

## C. Row fitting with Locations

No horizontal overflow and no scrollbar in any of these:

- [ ] **C1** 1 Location + 8 characters on the field.
- [ ] **C2** 2 Locations + 10 exerted characters.
- [ ] **C3** 1 Location with **3 characters standing at it**, plus 5 on the open field.
      *(Two or more characters at a location are wider than the location card — this was
      unaccounted for before.)*
- [ ] **C4** 2 Locations with 2 characters each, plus 6 on the open field.
- [ ] **C5** Add characters to a Location one at a time on a busy field → the row re-fits each time.
- [ ] **C6** Same checks at Tweaks → Card size `0.7×` and `1.4×`.
- [ ] **C7** Mobile 360px with a Location and a couple of characters at it.

## D. Location preview pane

- [ ] **D1** Hover a Location (on the field, in hand, in the discard) → the preview pane shows the
      **text card**, never a cropped landscape image, in **both** Art and Text tweak modes.
- [ ] **D2** That text card shows: cost badge, name + version, `LOCATION`, its abilities, and a
      footer with willpower, lore and `MOVE n ⬡`.
- [ ] **D3** The floating gold/hexagon cost badge in the pane's bottom-right is **hidden** for a
      Location (the text card has its own) — no double badge.
- [ ] **D4** Hover a Location, then a Character, in Art mode → the character shows **artwork** and
      the pane returns to its fixed height.
- [ ] **D5** The CTL/BCR/RDS/LVI metrics bar still updates when hovering a Location.

## E. Regression

- [ ] **E1** Dragging a character onto a Location, and off it again, still works.
- [ ] **E2** Challenging a character that is standing at a Location still works.
- [ ] **E3** Right-click / click on a Location still opens its context menu (it moved — the hit area
      should have moved with it).
- [ ] **E4** Non-location cards look and behave exactly as in v2.12.1.
- [ ] **E5** Version reads **v2.12.2** on loading screen, setup screen and sidebar.
- [ ] **E6** No console errors.

---

Notes / failures:
