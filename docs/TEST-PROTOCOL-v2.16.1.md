# Test Protocol — v2.16.1 (Features 34 & 35: Turn Starting Hand + Cards Quested)

File under test: `practice_dojo/practice_dojo.html`
A/B baseline: `git show HEAD:practice_dojo/practice_dojo.html`.

**What changed:** multiverse nodes gain two sections — **Cards Quested**, and **Turn Starting Hand**
at the bottom (the hand you began that turn with, after your draw, with every card that left your
hand during the turn greyed out and crossed with a diagonal rule). The starting-hand row **wraps**
onto a second line rather than scrolling sideways. Nodes are taller in the full view (510px).

---

## 0. Smoke

- [ ] Loading screen, setup modal and sidebar all read **v2.16.1**. If not, hard-refresh (Ctrl+F5).
- [ ] Start a game with two decks. No console errors.

## 1. Turn 1 — the opening hand

- [ ] Play turn 1 for P1: ink one card, play one card, then end the turn.
- [ ] Open the Multiverse. The turn-1 node's **Turn Starting Hand** row shows **7 cards**.
- [ ] The card you **inked** and the card you **played** are greyed and crossed out; the other five
      are in full colour.
- [ ] The section count reads `7 · −2`, and hovering it says "2 of 7 left the hand this turn".

## 2. Mulligan and Craft Hand feed it

- [ ] New game. **Mulligan** 3 cards, then play the turn and end it. The node's starting hand is the
      **post-mulligan** 7 — none of the cards you threw back appear.
- [ ] New game. **Craft Hand**, pick 7, play the turn and end it. The node shows the **crafted** 7.

## 3. Later turns

- [ ] Play through to turn 3 or 4. Each node's starting hand shows that turn's hand **including the
      card drawn at the start of that turn**, and never the next turn's hand.
- [ ] The cards still in hand when you passed are **not** crossed out.
- [ ] Duplicate check: get **two copies of the same card** into your starting hand and play only one.
      Exactly **one** of the two thumbnails is crossed out.
- [ ] A card that left the hand by being **discarded** (right-click → Discard) is crossed out too —
      not just plays and inks.
- [ ] A card **put back on top of the deck** from hand is crossed out (it left the hand).

## 4. Both players

- [ ] P2's nodes show P2's starting hand, not P1's.
- [ ] A node written on P1's turn never marks P2's cards.

## 5. Manual bookmarks

- [ ] Mid-turn (after playing a card or two), save a **manual bookmark**. Its Turn Starting Hand
      shows this turn's opener with the cards played *so far* crossed out.

## 6. Restore / undo

- [ ] Restore an earlier node, play a turn, end it → the new node's starting hand is correct for the
      restored line.
- [ ] Reload the page and resume from local storage → starting-hand data survives on existing nodes.
- [ ] A node saved **immediately after** restoring, before ending a turn, may show an empty starting
      hand (`—`). That's expected, not a bug — there's no capture to compare against.

## 6b. Cards Quested (Feature 35)

- [ ] Quest with a single character (right-click → Quest, or the QUEST hover chip). End the turn.
      The node's **Cards Quested** row shows that character.
- [ ] Quest with **everything** (the quest-all button). End the turn. **Every** character that
      quested appears in the row — not just one.
- [ ] The node's comment recap contains a `- **Quested:**` line naming them.
- [ ] A character that quested is also crossed out in Turn Starting Hand **only if it was in your
      hand that turn and left it** — a character already on the board isn't in the starting hand at
      all. (Play a character on turn 3, quest with it on turn 4: it appears in turn 4's Quested row
      and is absent from turn 4's starting hand.)

## 7. Layout

- [ ] Full-view nodes are taller than before and show all seven sections in order: Played, Inked,
      Drawn, Discarded, Banished, **Cards Quested**, **Turn Starting Hand**.
- [ ] Every node is the **same height**, whatever each section holds.
- [ ] A 7-card starting hand fits on **one** line — no sideways scrolling anywhere in that row.
- [ ] A 9–12 card starting hand **wraps onto a second line** and the node **does not** get taller
      (the comment area shrinks instead).
- [ ] A very large hand (15+, draw a lot before ending the turn) caps at two rows and scrolls
      **vertically** inside the section — never sideways, never past the node.
- [ ] Connector lines still meet the vertical middle of each node; no vertical overlap in branched
      trees.
- [ ] **Compact view** is unchanged — Cards Played only, old node size.
- [ ] Opening the Multiverse still centres on the active node.

## 8. Legacy sessions

- [ ] Load a cloud/example session saved before this version: Turn Starting Hand shows `—` on those
      nodes, and nothing else about them changed.

## 9. Importers

- [ ] Import a Duels.ink **`.md`** log: turn nodes show a starting hand, with cards played/inked that
      turn crossed out.
- [ ] Import a Duels.ink **replay**: same. (Both are reconstructions matched by card name/id rather
      than card instance — indicative, not exact.)

## 10. Palettes and text mode

- [ ] In **Text** card mode the crossed-out cards are still clearly distinguishable from the held
      ones.
- [ ] In **Mono** palette the slash is grey like everything else, but the greyed/dimmed treatment
      still separates left-the-hand from still-held.

## 11. Mobile (360px)

- [ ] The taller nodes are still usable; the starting-hand row scrolls sideways with a finger.

---

### Known / accepted behaviour

- "Left the hand" means exactly that — it doesn't distinguish played from inked from discarded. The
  other five sections say which.
- Imported nodes infer "left" by card id, so with duplicates across zones the marking can be
  approximate.
