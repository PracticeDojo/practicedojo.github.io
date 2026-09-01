# Test Protocol — v2.14.2 (Feature 32: Text-Only Card Mode)

File under test: `practice_dojo/practice_dojo.html`
A/B baseline: `git show HEAD:practice_dojo/practice_dojo.html`.

**What changed:** new **Tweaks → Card display: Art / Text**. In Text mode no card artwork is
requested or shown anywhere; every card renders as its text face (ink strip, cost, name, version,
strength/willpower) and the sidebar preview always shows the full text card. Art mode is the default
and should look exactly as before, apart from a new ink-colour strip on the *offline* fallback face.

---

## 0. Smoke

- [ ] Loading screen, setup modal and sidebar all read **v2.14.2**. **If they don't, you're on a
      cached copy** — hard-refresh (Ctrl+F5) before testing anything below.
- [ ] Start a game with two decks (ideally one dual-ink deck). No console errors.

## 1. Art mode unchanged (default)

- [ ] Fresh profile / first load defaults to **Art**. Board, hand, inkwell, discard all show artwork
      exactly like the baseline file.
- [ ] Hover a card → sidebar preview shows the artwork (Locations still show the text card).
- [ ] Open Tweaks: there is exactly **one** Art/Text row, **Card display**, hinted "Board, hand,
      ink, discard, every card grid and the preview pane." The old preview-only row is gone.

## 2. Switching to Text

Open Tweaks → **Card display** → **Text**.

- [ ] The board redraws immediately — no reload needed.
- [ ] Every face-up card in **hand, field, inkwell and discard** shows a text face: cost top-left,
      name centred, version under it, strength (left) / willpower (right) along the bottom.
- [ ] A coloured **ink strip** runs down the left edge of each card; a **dual-ink** card shows two
      colours split top/bottom.
- [ ] **Inkable** cards show the cost in a **gold disc** with a thin white ring; **uninkable** cards
      show it in a **dark hexagon**. Put an inkable and an uninkable card side by side — the
      difference must be obvious without hovering.
- [ ] An uninkable card's face is also slightly flatter (less ink tint, thinner edge strip), so the
      two are still distinguishable at the smallest card size where the badge shape is hard to read.
- [ ] Hovering the cost badge shows "Cost N (inkable)" / "Cost N (not inkable)".
- [ ] Cards with no strength/willpower (Actions, Songs, Items) show no stat row — nothing broken.
- [ ] Face-down cards (opponent hand, un-flipped inkwell) show a **striped panel**, not the usual
      card-back image — and reveal nothing about the card.
- [ ] Exerted cards, locations (landscape), stacked cards and characters at a location all still
      rotate/size correctly with text faces.
- [ ] Damage counters, the "NEW" drying pill, stack-count badges and hover action chips still paint
      **on top** of the text face.

## 3. No images are requested in Text mode

- [ ] Open DevTools → Network, filter **Img**, clear it, then switch to Text and play a few actions
      (draw, play, ink, end turn).
- [ ] No requests to `api.lorcana.ravensburger.com` (card art) and none for the Wikipedia card back.
      *(The card database from jsdelivr may still be fetched — that's data, not images.)*

## 4. Every surface, not just the board

With Text mode on:

- [ ] **Inspect Deck** (right-click deck / mobile corner button): all 60 tiles are text faces.
- [ ] **Inspect Discard**: text faces.
- [ ] **Mulligan** modal (start a new game in Text mode): 7 text faces; marking cards still works.
- [ ] **Craft Hand** pool: text faces, with the selected/available badges still legible on top.
- [ ] **Card search** (right-click a deck card → Replace): result tiles are text faces.
- [ ] **Multiverse tree** node "Cards Played / Inked / Drawn / …" thumbnails: tiny text faces with
      the ink strip; hovering shows the full name via tooltip.
- [ ] Sidebar **auto-save** rows: same.

## 5. Card details / preview pane (the Feature 30 reuse)

- [ ] Hover any card in Text mode → the sidebar preview shows the **full text card**: cost badge,
      name + version, type line, **every ability in full** with reminder text, and the
      strength / willpower / lore footer.
- [ ] That happens for **all** card types, not just Locations (the old behaviour).
- [ ] A wordy card (e.g. Fairy Godmother – Magical Benefactor) makes the pane grow and scroll.
- [ ] Ink symbols, exert, strength, willpower and lore render as **symbols, not empty boxes**.
- [ ] Switching **Card display** flips the board **and** the preview pane together — there is no way
      to have one in Art and the other in Text any more.
- [ ] In **Art** mode the preview still falls back to text on its own when the artwork can't be
      fetched (offline), and Locations still always show the text card.

## 6. Persistence

- [ ] Set Text mode, reload the page, resume the session → still Text mode, with the Tweaks button
      showing Text as active, **and the board is text from the very first paint** (no flash of art).
- [ ] Set Art mode, reload → Art.

## 7. Switching back and forth mid-game

- [ ] With a busy board (8+ cards on the field, cards in inkwell/discard), toggle Art ⇄ Text five
      times. Cards never disappear, duplicate, or lose their exerted/damage state.
- [ ] After switching back to Art, artwork loads normally (it re-fetches / re-warms).

## 8. Offline behaviour (Art mode) — regression check

- [ ] In **Art** mode, go offline (DevTools → Network → Offline) and force a render (play a card).
- [ ] Cards that can't load show the text face **with the new ink strip** — this is the intended
      change; everything else about the offline fallback behaves as before.
- [ ] Reconnect → artwork comes back on the next render.

## 9. Mobile (360px)

- [ ] In Text mode at 360px, card names are legible on board cards at the default card size.
- [ ] Names still readable at the smallest Tweaks card size (0.7×) — truncation is acceptable, an
      unreadable smear is not.
- [ ] The Card display toggle is reachable in the Tweaks panel on a phone.

---

### Known / accepted behaviour

- Board cards show name / version / cost / strength / willpower — **not** full ability text. The
  ability text lives in the sidebar preview, which is one hover (or right-click → Preview Card) away.
- The ink strip and the inkable-cost colouring also appear on the *offline* fallback in Art mode, by
  design — it's the same element.
