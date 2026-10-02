# TEST PROTOCOL — Practice Dojo v2.18.0

Scope: **Feature 37 · Card interaction redesign** — Option A field controls, challenge
mode + forecast, the touch card drawer, the phone hand fan, and the inkwell counter.
The game engine (moveCard / performChallenge / banish …) is unchanged; only how you
reach it changed.

File under test: `practice_dojo/practice_dojo.html`.

---

## Setup

1. Desktop: a normal browser window ≥ 1200px wide. Phone: a real phone, or DevTools
   device toolbar at **390×844** with touch emulation on.
2. Load two decks and start a game. Play a few characters for both players, put
   some ink down, and exert one character on each side.
3. Confirm the sidebar / setup shows **v2.18.0**.

---

## A — Option A field controls (desktop)

| # | Step | Expected |
|---|------|----------|
| A.1 | Hover one of your characters | −/+ stepper appears on top, a small icon column on the right (Challenge, Quest, Exert, Banish). Hovering an icon shows its name |
| A.2 | Click **+** three times without moving the mouse | Damage goes 1 → 2 → 3; the controls stay up between clicks; each click shakes the card, flashes red and floats "+1" |
| A.3 | Look under any card | A thin willpower track, one segment per willpower point, damaged segments red |
| A.4 | Click segment 4 of a 5-willpower card | Damage is exactly 4. Click segment 4 again → 3 |
| A.5 | Set damage to its willpower | Card pulses red; a **LETHAL · BANISH** pill sits on its bottom edge; clicking it banishes (card fades out) |
| A.6 | Hover an **exerted** card and an **opponent** card | Controls are there too (opponent: no Challenge / Quest) |
| A.7 | Hover a card and press `+`, `-`, `3`, `0`, `e`, `b` | Damage +1 / −1 / set 3 / set 0, exert↔ready (rotates), banish |
| A.8 | Move the pointer off every card and press `q`, `t`, `m`, `Space` | Quest-all, Timelines, Multiverse, End turn — unchanged |
| A.9 | Right-click a field card | Menu grouped **Card / Move / Stack**, key hints (E, C, B), a **Damage − n/w +** row. Clicking − / + changes damage and the menu stays open |
| A.10 | Quest a character | Card lifts briefly, "+N ◆" floats, lore goes up |

## B — Challenge mode (desktop)

| # | Step | Expected |
|---|------|----------|
| B.1 | Click **Challenge** in the top bar (or press `c` with nothing hovered) | Board gets a red outline; banner "CHALLENGE MODE · Drag or tap any of your characters…"; hover controls disappear |
| B.2 | Click one of your characters | It lifts with a white ring; banner names it; opponent cards get a red outline |
| B.3 | Hover an opponent card (Forecast = Light) | A red aim arrow + one line over the target, e.g. "✕ Banishes Elsa · Mickey 4/5" |
| B.4 | Click the opponent card | Attacker lunges, arrow shows, both cards flash with their damage; anything lethal is banished ~1s later. Log has the usual challenge line |
| B.5 | Pick an **exerted** or **drying** character, or target a **ready** opponent | Allowed; the log adds "(… is exerted … — allowed in the sandbox.)" |
| B.6 | Still in the mode, drag a character onto an opponent | Resolves the same way. You stay in the mode |
| B.7 | Banner → Forecast **Full**, pick an attacker | Every opponent shows an outcome badge (green = you banish it, amber = trade, red = you lose yours) |
| B.8 | Hover a target in Full | Forecast card beside it; striped ghost damage on both tracks; cards that would be banished are hatched "BANISHED" |
| B.9 | Forecast **Off** | Only the arrow, no text |
| B.10 | `Esc` | First clears the picked attacker, second leaves the mode. **Done** also leaves |
| B.11 | Hover a card → click its **Challenge** icon | Enters the mode with that card already picked |
| B.12 | Outside the mode, drag a character onto an opponent (Forecast Light) | Forecast line appears while hovering the target; drop resolves (as before) |
| B.13 | Tweaks → **Challenge forecast** | Same setting as the banner; survives a reload |
| B.14 | End the turn while in the mode | Mode stays on for the new active player; any picked attacker is cleared |

## C — Card drawer (touch / phone)

| # | Step | Expected |
|---|------|----------|
| C.1 | Tap a field card | Drawer slides up: name/stats, damage segments, −1 / +1, Challenge · Quest · Exert · Banish, then To hand · Deck top · Deck bottom · Put under |
| C.2 | Tap segment 3, then +1 | Damage 3 then 4; drawer updates in place |
| C.3 | Tap Exert / Quest | Applies; drawer stays open with the new state |
| C.4 | Tap Banish / To hand / Deck top | Drawer closes, card leaves the field |
| C.5 | Card at a Location / with cards stacked under | Drawer also offers Leave location / Separate stack |
| C.6 | Eye icon | Opens the preview (sidebar drawer) |
| C.7 | Tap the dimmed area above the drawer | Closes |
| C.8 | Drawer → **Challenge** | Challenge mode with that card picked; every opponent shows an outcome badge; banner at the bottom with a big **Done** |
| C.9 | Tap an opponent | Challenge resolves (badge numbers were right) |
| C.10 | Long-press-drag a field card onto an opponent | Still challenges (touch drag shim unchanged) |

## D — Phone hand fan (≤760px)

| # | Step | Expected |
|---|------|----------|
| D.1 | Look at the bottom of the screen | Hand is a fan peeking up from the edge, label "Hand · N — tap or drag up"; Quest / End turn buttons sit above it |
| D.2 | Tap the fan | Fans out larger, board dims |
| D.3 | Tap a card in the open fan | Large card with **Play · −N ink** (or "Play anyway · N short"), **Ink** (disabled if not inkable), Swap · Discard · Deck top · Deck btm |
| D.4 | Play / Ink / Discard / Deck top from there | Action happens, fan closes |
| D.5 | Swap | Opens the existing card search |
| D.6 | Drag a card straight up from the closed fan onto the field | Plays it (ink paid) |
| D.7 | Drag a card onto the ink counter | Inks it |
| D.8 | Drag a card onto a same-name character | Shifts |
| D.9 | Tap the dimmed board while the fan is open / `Esc` | Fan closes |
| D.10 | Scroll the board to the bottom | Nothing important is hidden behind the fan |

## E — Inkwell counter

| # | Step | Expected |
|---|------|----------|
| E.1 | Look at both pile rows | "◆ 4/5" counter + one pip per ink (dim = spent); no mini ink cards any more |
| E.2 | Ink a card this turn | "+1" tag on the counter |
| E.3 | Drag a card onto the counter | Inks it (drop zone unchanged) |
| E.4 | Click / tap the counter | Inkwell panel (desktop popover; phone bottom sheet): Spend 1, Ready 1, Ready all, one row per ink card |
| E.5 | Spend 1 / Ready 1 / Ready all | Counter and pips update |
| E.6 | Row → Exerted/Ready toggle, To hand, Discard | Works; ink totals stay right (To hand: 5/5 → 4/4) |
| E.7 | Opponent (top) counter | Opens the opponent's inkwell |
| E.8 | Click outside (desktop) / tap the scrim (phone) | Panel closes |

## F — Regression checks

| # | Step | Expected |
|---|------|----------|
| F.1 | Desktop hand hover | PLAY / INK chips unchanged; click opens the hand menu as before |
| F.2 | Drag hand → field / discard / deck / opponent's zones | Unchanged |
| F.3 | Locations: drag a character onto your Location | Moves there; the Location shows the stepper/track if it has willpower |
| F.4 | Undo after damage, challenge, ink actions | Each is one undo step |
| F.5 | Timelines / bookmarks / multiverse save + restore | Unchanged (no new state fields were added) |
| F.6 | OS "reduce motion" on | No shakes/floats/lifts; everything still works |
| F.7 | Text-only card mode (Tweaks) | Controls and track still render over text cards |

---

## Fail signals

- Hover controls flicker or vanish after each **+** click → the re-render lost the hover (`is-hovered`).
- Clicking an icon opens the context menu instead → the card face is above the controls (z-index).
- Phone: tapping a field card opens the old context menu → touch detection (`hover: none`) didn't apply.
- Ink numbers drift after **To hand** from the panel → it must go through `moveCard`.
