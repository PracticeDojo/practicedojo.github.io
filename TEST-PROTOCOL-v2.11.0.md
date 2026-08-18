# Test Protocol — v2.11.0 (Feature 29: Offline hardening)

File under test: `practice_dojo/practice_dojo.html`. Baseline for A/B: `git stash` / previous commit.

DevTools offline: **Network tab → throttling dropdown → Offline**. Use that rather than turning off
Wi-Fi, so the `online`/`offline` events fire.

---

## A. Strength / willpower on the card fallback

- [ ] **A1** Start a match. DevTools → Network → check **Block request URL** on
      `api.lorcana.ravensburger.com` (or go Offline), then reload and start a match.
      → Every face-up card shows: cost top-left, name + version centred, **strength bottom-left with a
      small `S`**, **willpower bottom-right with a small `W`**.
- [ ] **A2** An **Action / Song / Item** card in hand → name + cost, **no** stats row.
- [ ] **A3** A **Location** on the field → willpower on the **right**, nothing on the left.
- [ ] **A4** Text stays inside the tile and legible at: board card, Inspect Deck (60 tiles),
      mulligan card (140px), Craft Hand pool. Cards Played thumbnails (35px / 18px) show name only —
      expected, no stats there.
- [ ] **A5** Card-size slider `0.7×` → `1.4×`: stats scale with the tile, never overlap the name.
- [ ] **A6** Mobile 360px width: stats readable on board cards.
- [ ] **A7** Hover a card while offline → sidebar preview falls back to name + version + stats.

## B. Images stay loaded

- [ ] **B1** Online, start a match. Network tab → confirm card images keep downloading in the
      background **after** the board is drawn (both decks warm, ~6 at a time), not just the visible ones.
- [ ] **B2** Once the requests settle, switch to **Offline**. Play several turns — draw, play, ink,
      end turn, undo. → **Artwork keeps showing.** Nothing goes blank or reverts to text.
- [ ] **B3** Still offline: open **Inspect Deck** (60 cards) and **Inspect Discard**.
      → Artwork shown, not name placeholders.
- [ ] **B4** Still offline: open the multiverse tree, jump to another bookmark.
      → Board renders with artwork.
- [ ] **B5** Go Offline *before* the warm finishes → some cards show names. Go back **Online**.
      → Within a few seconds the board re-renders and the missing artwork fills in by itself
      (no manual refresh).
- [ ] **B6** No broken-image glyphs (grey torn-page icon) anywhere at any point.

## C. Card DB cache (IndexedDB)

- [ ] **C1** Load the app once online. DevTools → Application → IndexedDB →
      `lorcana_dojo_cache` → `kv` → key `allCardsText` exists.
- [ ] **C2** Reload with DevTools **Offline**. → App boots to the setup screen (**not**
      "Error loading database. Please refresh."). Card search / deck parsing still work.
- [ ] **C3** Warm reload online → loading screen is quick (no ~9 MB `allCards.json` download in the
      Network tab; a background refresh request is fine).
- [ ] **C4** Delete the `lorcana_dojo_cache` DB and reload online → app still loads normally
      (cold path) and re-creates the entry.
- [ ] **C5** Private / incognito window → app still loads (IndexedDB may be unavailable; it must
      degrade, not break).

## D. Regression — nothing else moved

- [ ] **D1** Online, a normal match looks **identical** to the baseline: no visible text under
      artwork, no layout shift, same card sizes.
- [ ] **D2** Drag & drop, challenge arrows, context menus, stacking/shift, inkwell flip: unchanged.
- [ ] **D3** Import a Duels.ink `.md` and a `.replay.gz` → unchanged.
- [ ] **D4** Version reads **v2.11.0** on the loading screen, setup screen and sidebar.
- [ ] **D5** Console clean — no repeating errors while offline (a handful of failed image requests
      is expected; an endless retry storm is not).

---

Notes / failures:
