# Test Protocol — v2.15.2 (Feature 33: Mono palette + mulligan card order)

File under test: `practice_dojo/practice_dojo.html`
A/B baseline: `git show HEAD:practice_dojo/practice_dojo.html`.

**What changed:** **Tweaks → Player palette** gains a third option, **Mono** — the whole interface
desaturated, with the two players separated by lightness instead of hue. Modern and Classic are
untouched.

---

## 0. Smoke

- [ ] Loading screen, setup modal and sidebar all read **v2.15.2**. If not, hard-refresh (Ctrl+F5).
- [ ] Start a game. Palette starts on whatever you had before (Modern by default).

## 1. Modern / Classic unchanged — **the v2.15.0 bug**

v2.15.0 applied Mono permanently: the new rule landed inside an existing `html, body { … }` selector
list, so it read `html, body.palette-mono` and `html` matched unconditionally. Check this first.


- [ ] **Modern**: P1 amber, P2 blue, amber accent — identical to the baseline file.
- [ ] **Classic**: P1 orange `#a86b32`, P2 purple `#3f2e70` — identical to the baseline.
- [ ] Switching Modern ⇄ Classic still applies instantly.

## 2. Mono — nothing is coloured

Tweaks → Player palette → **Mono**.

- [ ] Applies instantly, no reload.
- [ ] **Nowhere** in the interface is there a colour: top bar, sidebar, board halves, buttons,
      badges, lore counters, metric bars, toasts, context menus, modals.
- [ ] **Card artwork is grayscale too** (Art mode).
- [ ] In **Text** mode (Tweaks → Card display → Text) the ink identity strips down the left edge of
      cards are grey, and the gold "inkable" cost disc is grey — but the disc-vs-hexagon shape still
      tells inkable from uninkable.
- [ ] Deck ink pips on the setup/continue cards are grey.
- [ ] Multiverse tree: node edge colours, connector lines and a victory node's gradient are all grey.
- [ ] Older modals (win dialog, deck-fill, cloud save) show no stray coloured text — check any
      green/red/yellow status text you can trigger.

## 3. Mono — the two players are still obvious

This is the point of the feature; be picky here.

- [ ] The top (opponent) and bottom (your) board halves are clearly **different shades** — one reads
      bright, the other heavy. You can tell whose half is whose at a glance without reading names.
- [ ] Player badges / name rows for P1 and P2 are clearly different.
- [ ] Multiverse tree nodes for P1 turns vs P2 turns are clearly different shades from each other.
- [ ] The divider between the halves and the active-timeline tint still read correctly.
- [ ] Metric bars (BCR / LVI / RDS / CTL) are still distinguishable from one another by lightness.

## 4. Nothing moved

A CSS filter can shift `position: fixed` elements. Check each while Mono is on:

- [ ] Right-click a card → the **context menu** appears at the cursor, not offset.
- [ ] Open the **Timelines drawer**, the **Tweaks panel**, the **Multiverse tree**, **Inspect Deck**,
      **Inspect Discard**, the **mulligan** modal and the **import log** modal — each sits where it
      does in Modern.
- [ ] A **toast** (save a bookmark) appears in its normal spot.
- [ ] On mobile, the **sidebar drawer** and hamburger still slide in correctly.

## 5. Persistence & interaction with other tweaks

- [ ] Set Mono, reload → still Mono, with the Mono button active.
- [ ] Switch Mono → Modern → Classic → Mono: colours come back and go away cleanly each time, with
      no leftover grey or leftover colour.
- [ ] Accent, card size, panel layout, card display and the multiverse node view all still work while
      Mono is on.

## 6. Mobile (360px)

- [ ] At 360px in Mono, the board halves are still tellable apart and text contrast is comfortable.
- [ ] No visible performance drop when playing cards / opening the tree (the page-wide filter is the
      thing to watch here — report any sluggishness).

## 7. Mulligan hand is ordered by ink cost (v2.15.2)

- [ ] Start a new game and open the **mulligan** screen. The 7 cards are laid out **cheapest on the
      left, most expensive on the right**.
- [ ] Cards that cost the same sit next to each other, in alphabetical order (stable — reopening the
      modal gives the same layout).
- [ ] Marking / unmarking cards for mulligan still works, and the marked card stays in place (the X
      overlay lands on the card you clicked).
- [ ] The mulligan **odds panel** still updates as you mark cards.
- [ ] Confirm the mulligan → the replacement cards are drawn correctly and the hand on the board is
      normal.
- [ ] Sandbox check: before opening the mulligan, click your deck a few times so the hand is 9 cards,
      then open it. The **first 7** are sorted by cost; the extra cards sit after them in draw order.
- [ ] The board hand itself is **not** reordered by this — only the mulligan screen.

---

### Known / accepted behaviour

- The **accent swatches in Tweaks are grey while Mono is on** — they're inside the filtered area and
  CSS can't un-filter a descendant. Their tooltips and the accent name label still identify them.
- Mono deliberately greys the card artwork; that follows "the whole interface desaturated". Say so if
  you'd rather the art kept its colour — it's one selector to exempt.
