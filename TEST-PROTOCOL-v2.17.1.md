# Test protocol — v2.17.1 · Feature 36: "Competition" player palette

File under test: `practice_dojo/practice_dojo.html`
Baseline for A/B: `git stash` / `git show HEAD~1:practice_dojo/practice_dojo.html` (v2.16.2).

**What changed in one line:** the interface now takes its colours from the two decks
actually in play, and each player's two inks are *woven* with a different pattern
(P1 split, P2 barber pole) so a mirror match still reads.

Before starting: open Tweaks (the sliders icon, bottom right) → **Player palette**.
You should see four options on a 2×2 grid: **Competition · Modern · Classic · Mono**.

---

## 1 · Default and persistence

- [ ] Open the app in a **fresh profile / cleared localStorage**. Tweaks → Player palette
      has **Competition** active.
- [ ] Open it in the browser you already use (existing localStorage, which held
      `palette: "modern"`). Competition is active — the one-time migration moved it.
      Picking Modern afterwards sticks across reloads.
- [ ] Switch to Modern, reload. Modern is still active (an existing choice is never
      overridden).
- [ ] Switch back to Competition, reload. Competition is still active.

## 2 · Palette derives from the decks

Start a game with **two visibly different ink pairs** (e.g. P1 Amber/Steel, P2 Ruby/Sapphire).

- [ ] Bottom half of the board is washed in P1's first ink at the bottom edge, shading
      toward P1's second ink at the centre line. Top half likewise for P2.
- [ ] Sidebar player rows, the lore badges, the turn pill, the metric bars and the log
      entry edges all use the deck inks — not amber/blue.
- [ ] Card art is still full colour and unaffected.
- [ ] Tweaks → Player palette shows two chips reading `P1` and `P2`. Hovering each names
      the pair it detected (e.g. "Player 1: Amber / Steel").
- [ ] The P1 chip is a **hard two-colour split**; the P2 chip is **diagonal stripes**.
- [ ] **Both chips show two different colours** — this is the check that the deck-ink
      derivation is actually running. A chip showing one flat colour for a two-ink deck
      means it is not (that was the v2.17.0 bug: the zone arrays hold card objects, not
      ids, and dual-ink cards print `color` as `"Amber-Steel"`).

## 3 · Palette follows the decks changing

- [ ] Load a saved/cloud session with different decks → the whole interface repaints to
      that session's inks.
- [ ] Import a Duels.ink log or `.replay`/`.replay.gz` → same.
- [ ] Inspect Deck → replace cards so a new ink enters a deck → Save Custom Order. The
      palette picks it up.
- [ ] On the setup screen (no game loaded) nothing looks broken — it falls back to the
      Modern amber/blue.

## 4 · Single-ink decks

Start a game where at least one deck is **mono-ink**.

- [ ] That player's areas are a single ink; nothing renders transparent, black or white.
- [ ] Their node spine is a solid bar of that one ink (split of two identical colours for
      P1; a barber pole of one colour, i.e. solid, for P2).

## 5 · The multiverse node spine — the point of the feature

Play a few turns so both players have auto-saved nodes, then open the Multiverse tree.

- [ ] Every **P1** node has a **6px spine split hard in two** — first ink on the top half,
      second ink on the bottom half.
- [ ] Every **P2** node has a **45° barber-pole spine** alternating that deck's two inks.
- [ ] Node background tint and the curved connector lines use the deck inks.
- [ ] Selecting a node still shows the active ring; the spine does not change.
- [ ] Keyboard navigation (arrows + Enter) still works and the focus outline is visible.
- [ ] Zoom out until nodes are small — the barber-pole stripes are still distinguishable
      from the split.

### 5a · Mirror match (the case this feature exists for)

Start a game where **both players run the same two inks**.

- [ ] P1 and P2 nodes are the same two colours but are still instantly tellable apart by
      pattern alone.

## 6 · Auto-saves and victory nodes

- [ ] Multiverse drawer → auto-save list: each row carries its player's weave on the left
      edge, and the row text has not shifted or been clipped.
- [ ] Take a player to 20 lore. The victory node still shows the trophy, the deck-colour
      tint and the game-over dialog.
- [ ] The new victory node's spine uses the **winner's** weave.
- [ ] Open a session saved **before** v2.17.0 that contains a victory node — it still
      renders (it keeps its old gradient spine rather than a weave). No blank/black node.

## 7 · The other three palettes are untouched

- [ ] **Modern** — amber P1 / blue P2, exactly as v2.16.2. No spine patterns anywhere,
      node left border is a flat 4px colour.
- [ ] **Classic** — orange P1 / purple P2, as before.
- [ ] **Mono** — the whole interface, including card art, is grey; no ink colour leaks
      through anywhere (check the board halves, the node spines and the Tweaks chips).
- [ ] Switching Competition → Mono → Competition repaints correctly each time, with no
      stale ink colour left behind.

## 8 · Cross-cutting

- [ ] **Mobile, 360px wide:** the four palette buttons sit 2×2 and every label is fully
      readable; the board half washes and edge hairlines render; node spines render in the
      tree.
- [ ] **Text card mode** (Tweaks → Card display → Text): the palette still applies; card
      faces are unaffected.
- [ ] **Offline** (throttle to offline and reload): the palette still derives correctly
      from the cached card DB.
- [ ] Version reads **v2.17.1** on the loading screen, the setup modal and the sidebar.

---

## Known and accepted

- Victory nodes saved before v2.17.1 keep their old deck-gradient spine; only nodes saved
  from v2.17.1 on carry the winner's weave.
- The victory node's background tint still uses the card-art ink hexes rather than the
  UI-grade ink tokens, so it can read slightly more saturated than the rest of the node.
- In Mono, the Tweaks ink chips are grey like everything else; their tooltips still name
  the inks.
