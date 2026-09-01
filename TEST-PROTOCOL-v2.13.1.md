# Test Protocol — v2.13.1 (Feature 31: Multiverse Node Sections)

File under test: `practice_dojo/practice_dojo.html`
A/B baseline: `git show HEAD:practice_dojo/practice_dojo.html` (the last committed version).

**What changed:** multiverse tree nodes now show five card sections — **Cards Played / Cards Inked /
Cards Drawn / Cards Discarded / Cards Banished** — as the default view, with a compact view that
reproduces the old node. Several actions that were never tracked (inking by drag, discarding,
drawing) are now tracked.

---

## 0. Smoke

- [ ] Load the page. Loading screen, setup modal and sidebar all read **v2.13.1**.
- [ ] Start a normal game with two decks. Board renders, no console errors.

## 1. The tracking fixes (this is where v2.13.0 was broken)

Play one full turn doing **each** of these, then end the turn and open the Multiverse.

- [ ] **Ink by dragging** a card from hand onto the inkwell → appears under **Cards Inked**.
      *(This was the bug: only the right-click "Add to Inkwell" path was tracked.)*
- [ ] **Ink by right-click** → "Add to Inkwell" → also appears under **Cards Inked**.
- [ ] Neither of those inked cards appears under **Cards Played**.
- [ ] **Play by dragging** hand → field: appears under **Cards Played**.
- [ ] **Play by right-click** → "Play Card": appears under **Cards Played**.
- [ ] **Draw** by clicking your deck: appears under **Cards Drawn**.
- [ ] The automatic **draw step** card (drawn when the turn starts) appears under **Cards Drawn** of
      the node for *that* turn — **not** the previous turn's node.
- [ ] **Discard from hand** (right-click a hand card → Discard, or drag it to the discard pile):
      appears under **Cards Discarded**, *not* Banished.
- [ ] **Banish from the field** (right-click a field card → Banish, or drag it to the discard pile):
      appears under **Cards Banished**, *not* Discarded.
- [ ] **Challenge** that kills a character: the dead character appears under **Cards Banished**.
- [ ] **Shift** a card onto its base version: appears under **Cards Played**.

## 2. Turn recap text (node comment)

- [ ] The auto-saved node's comment shows the recap list with the new lines in order:
      **Drew / Inked / Played / Shifted / Discarded / Banished** (only the non-empty ones).

## 3. Buffers reset every turn (regression fix)

- [ ] Turn **off** the "Auto-save every turn" checkbox. Play 3 turns, doing something each turn.
- [ ] Save a **manual bookmark** on turn 3. Its sections show only **turn 3's** cards — not
      everything since turn 1. *(Previously the buffers were only cleared when auto-save was on.)*
- [ ] Turn auto-save back on; nodes still show one turn each.

## 4. Full view layout

- [ ] Nodes are taller and show five labelled rows in order: Played, Inked, Drawn, Discarded,
      Banished.
- [ ] Each label has a coloured dot on the left and a **count** on the right; an empty section shows
      a dim `—` and no thumbnail row.
- [ ] Every node is the **same height**, whether a section holds 0 or 15 cards.
- [ ] A section with many cards scrolls **sideways** inside its row; the node never grows.
- [ ] Node comment area is still readable (scrolls if the recap is long).

## 5. Compact view

- [ ] Click the **list icon** in the tree header (left of Reset Zoom).
- [ ] Nodes shrink to the old size, showing only a centred `Cards Played` strip with the larger
      35×50 wrapped thumbnails — visually identical to the baseline file.
- [ ] Nodes with nothing played show no strip at all.
- [ ] Icon + tooltip flip to *Switch to full nodes*; clicking again returns to full.
- [ ] After toggling, the node you were looking at is still **centred** (not scrolled off-screen).
- [ ] Reload the page, reopen the Multiverse: the last view mode is remembered.

## 6. Layout / navigation still correct

- [ ] Connector lines meet the **vertical middle** of each node in both views.
- [ ] Nodes never overlap vertically, including branched trees (restore an old node, play a turn).
- [ ] Arrow keys move the nav highlight; **Enter** restores the highlighted node.
- [ ] Wheel zoom, drag-to-pan and **Reset Zoom** work.
- [ ] Opening the Multiverse centres on the active node in **both** view modes.

## 7. Node editing / deleting untouched

- [ ] Pencil opens the inline edit form; Save updates name/comment; Cancel discards.
- [ ] Trash deletes with the Undo toast; children reattach to the parent.
- [ ] Victory node (a player to 20 lore) still shows the trophy + deck-ink gradient, plus sections.

## 8. Backward compatibility (old sessions)

- [ ] Load a **cloud session** or example session saved before this version.
- [ ] Its nodes show *Cards Played* populated exactly as before (legacy nodes fall back to the old
      list, so inked cards may still appear under Played there — expected).
- [ ] The other four sections show `—` on those legacy nodes.
- [ ] Save a new bookmark on top of the restored session → the new node has properly split sections.

## 9. Importers

- [ ] Import a Duels.ink **`.md`** log (`logs/log_example_v01.md`). Turn nodes show Played, Inked,
      Drawn and Banished. Discarded is empty (the log has no discard lines).
- [ ] Import a Duels.ink **replay** (`logs/019ea30a-…_p1.json`). Nodes show Played and Inked;
      Banished on turns where a challenge killed something. Drawn/Discarded are empty by design.
- [ ] Gzipped `.replay.gz` import still works.

## 10. Sidebar auto-saves (should be UNCHANGED)

- [ ] Timelines drawer auto-save rows look exactly as before: name, stats, up to 5 thumbnails, `+N`
      overflow. No new sections there.

## 11. Mobile (360px wide)

- [ ] On a 360px viewport, open the Multiverse. Nodes readable, sections don't overflow their box,
      rows scroll sideways with a finger.
- [ ] The header toggle button is reachable and doesn't push Reset Zoom / Close off-screen.

---

### Known / accepted behaviour

- Deck-edit nodes ("Custom arrangement created from Inspect Deck") show empty sections in full view —
  they don't represent a turn.
- Sections count **both players'** cards for that turn (a node is a turn, not a side) — e.g. an
  opponent character killed by your challenge shows under Banished.
- Opening hands and mulligan redraws are **not** counted as Drawn.
- Replays can't report draws or discards; those two sections stay empty on replay imports.
