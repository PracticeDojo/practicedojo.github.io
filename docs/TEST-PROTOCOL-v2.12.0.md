# Test Protocol — v2.12.0 (Feature 30: Offline text card)

File under test: `practice_dojo/practice_dojo.html`. Run the v2.11.0 protocol first if it hasn't been.

Fastest path: **Tweaks (gear) → Card preview → Text**. That shows the text card online, so most of
section A needs no offline simulation. Section C is the only part that needs the network cut
(DevTools → Network → Offline, or Block request URL on `api.lorcana.ravensburger.com`).

---

## A. The text card itself (Tweaks → Card preview → **Text**)

Hover each card type in hand / on the field and check the preview pane:

- [ ] **A1 Character** (e.g. *Cinderella – Gentle and Kind*) → cost badge, `Cinderella` big with
      `Gentle and Kind` under it, type line `CHARACTER · STORYBORN • HERO • PRINCESS`,
      `Singer 5` in accent color with the reminder text dimmed + italic after it, the named ability
      in accent color followed by its effect, footer `2 ⚔ / 5 🛡 / 2 ◊`.
- [ ] **A2 Space after ability names** — reads `STUNNING TRANSFORMATION Whenever you…`, never
      `TRANSFORMATIONWhenever`.
- [ ] **A3 Activated ability** shows its cost then an em-dash before the effect
      (`STRAIGHTEN HAIR ⟳ — Remove up to 1 damage…`).
- [ ] **A4 Song / Action** (e.g. *Be Our Guest*) → the singing reminder line **and** the body effect,
      no strength/willpower footer.
- [ ] **A5 Location** → willpower + lore in the footer, and `MOVE 1 ⬡` on the right. No strength.
- [ ] **A6 Item** → ability shown, no stat footer beyond what the card has.
- [ ] **A7 Uninkable card** → cost badge is a **dark hexagon**; inkable → **gold circle**.
- [ ] **A8 Ink strip** on the left of the header matches the card's ink; a **dual-ink** card shows a
      two-color gradient.
- [ ] **A9 Symbols** — ink / exert / strength / willpower / lore all render as **icons**. If you see
      an empty rectangle (tofu) or a `¤` / `⬡` / `⟳` character anywhere, that's a fail.
- [ ] **A10 No junk** — no set name, card number, rarity, artist or flavour text anywhere.
- [ ] **A11 Longest card** — *Fairy Godmother – Magical Benefactor* (the wordiest in the game):
      full text readable, pane grows, nothing clipped mid-word.
- [ ] **A12 Unknown card** (`cardId: -999`, from a Duels.ink import) → reads `Unknown card`,
      no crash.

## B. Pane behaviour

- [ ] **B1** In **Art** mode the pane is the same fixed height as before — no growth, no scrollbar.
- [ ] **B2** In **Text** mode the pane grows for long cards and shrinks for short ones. It stops at
      about a third of the screen height and scrolls beyond that.
- [ ] **B3** The floating gold/hex cost badge in the pane's bottom-right is **hidden** in text mode
      (the card has its own) and back in art mode.
- [ ] **B4** The CTL/BCR/RDS/LVI metric bar under the pane still updates on hover in both modes.
- [ ] **B5** Toggling Art ↔ Text while a card is previewed redraws it **immediately** — no need to
      re-hover.
- [ ] **B6** Reload → the mode is remembered.
- [ ] **B7** The log pane below still works when the preview grows (it gets shorter, that's expected).
- [ ] **B8** Mobile 360px, sidebar drawer open → text card readable, no horizontal overflow.

## C. Offline fallback chain (Tweaks back to **Art**)

- [ ] **C1** Online, hover a card → **artwork**, as always.
- [ ] **C2** Go Offline *after* the deck has warmed, hover a card not yet previewed → the full-res
      art fails, so it falls back to the **warmed thumbnail** (lower-res art, still a picture).
- [ ] **C3** Block `api.lorcana.ravensburger.com` **and reload** (nothing warmed), then hover →
      the **text card** appears.
- [ ] **C4** Hover several cards quickly while offline → each shows its **own** text card; no stale
      card left behind from a previous hover.
- [ ] **C5** Back online, hover a fresh card → artwork returns; the pane goes back to fixed height.

## D. Regression

- [ ] **D1** Board cards, Inspect Deck / Discard, mulligan, Craft Hand: unchanged from v2.11.0
      (the S/W stats on the small card fallbacks still appear when art is blocked).
- [ ] **D2** No console errors while hovering, in either mode.
- [ ] **D3** Version reads **v2.12.0** on loading screen, setup screen and sidebar.
- [ ] **D4** Other Tweaks (accent, card size, panel layout, player palette) still work and persist.

---

Notes / failures:
