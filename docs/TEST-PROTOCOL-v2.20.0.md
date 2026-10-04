# TEST PROTOCOL — Practice Dojo v2.20.0

Scope: **Feature 39 · Home screen "The inkwell"**. The device library (sessions, decks, file format,
migration, §9.4 escaping) is unchanged from v2.19.0. Run `TEST-PROTOCOL-v2.19.0.md` sections A, C, D
and G for that. This protocol covers the new home screen and Library drawer.

File under test: `app/index.html`.

---

## Setup

1. Serve the repo root with any static server, or use https://practicedojo.github.io/app/ after deploy.
2. Desktop ≥ 1200px wide, and a phone (or DevTools 390×844 with touch emulation).
3. Have ready: a decklist on the clipboard, `docs/samples/019ea30a-…_p1.json` (a replay),
   `docs/samples/new_log_style_v01.md`, and a `.dojo.json.gz` you exported.
4. Confirm the home screen header and sidebar show **v2.20.0**.

---

## A — The field

| # | Step | Expected |
|---|------|----------|
| A.1 | Load the app on desktop | Headline "Paste a decklist or a Duels.ink game." The field has focus (accent border). On a phone it does **not** take focus (no keyboard pops up) |
| A.2 | **A decklist** example | Readout: DECKLIST · two ink pips pop in · "A 60-card Amethyst/Ruby deck" · "60 of 60 cards recognised" · *Play it as you* / *Play against it* / *Save to My decks* |
| A.3 | Change one card name to nonsense | Readout says 56 of 60 and names the skipped line in amber |
| A.4 | *Play it as you* | The list sits in the You seat; the field clears; toast "That list is your deck" |
| A.5 | Click outside the field, then Ctrl+V a decklist | It lands in the field and is read |
| A.6 | *Save to My decks* → keep the suggested name | Toast "Saved …". A new chip appears under the seats |
| A.7 | **A Duels.ink log** example | DUELS.INK LOG · "A 34-turn game" · *Study this game* → board loads with 34 nodes; title "… (Duels.ink)" |
| A.8 | Paste `new_log_style_v01.md` | "This newer log format can't be imported yet", pointing to the replay file. No button, nothing breaks |
| A.9 | **Choose a file** → the replay `.json` | DUELS.INK REPLAY · from <file> · "HeavenIdeas vs Mia Ies · 18 turns" · *Study this game* / *Play my deck from it* |
| A.10 | *Play my deck from it* | You seat = "Amethyst/Ruby · HeavenIdeas", 60 |
| A.11 | Drag a `.dojo.json.gz` over the page | The field's border turns through all six inks while dragging. Drop → SAVED SESSION with title and summary → *Open it* opens it as a new session |
| A.12 | Type "hello" | NOT RECOGNISED, with what a decklist and a log look like |
| A.13 | Reduced motion on (OS setting) | No spinning border, no pip pop, no slide-in |

## B — On the table

| # | Step | Expected |
|---|------|----------|
| B.1 | Fresh profile | Both seats "Random cards" with a dashed box. Chips show the default deck(s) |
| B.2 | Click a chip, then another | First fills You, second fills Opponent. A third replaces Opponent |
| B.3 | Look at the deck boxes | You = split weave, Opponent = barber pole, in each deck's inks |
| B.4 | Seat an 8-card list | Its count shows **8** in amber |
| B.5 | ✕ on a seat | Back to Random cards |
| B.6 | **Start match** | Board loads with those decks. An empty seat gives 60 random cards |
| B.7 | Reload | Saved decks from last match are seated again; a pasted list is not |

## C — Pick up again

| # | Step | Expected |
|---|------|----------|
| C.1 | After playing a match, go home (↻) | First row = that match, highlighted, "Back to it". *Back to match* in the header |
| C.2 | Reload | First row says **Resume** and opens it |
| C.3 | Several sessions | Up to four, newest first after the last one |
| C.4 | Fresh profile | "Every match you play is kept here, on this device. Nothing yet." |

## D — Library drawer

| # | Step | Expected |
|---|------|----------|
| D.1 | **Library** (header, with a session count) | Drawer from the right, focus on the Sessions tab. ←/→ switch tabs |
| D.2 | Sessions: Open / Rename / Duplicate / Export / Delete / Import file | Work as in v2.19.0; *Pick up again* updates after each |
| D.3 | Decks: **You** / **Opponent** on a deck | Drawer closes; that seat holds the deck; toast names it |
| D.4 | Decks: copy icon on a default, New deck, Import .txt, From a replay | Editor opens in the drawer; saving adds a chip on the home screen |
| D.5 | Edit a My deck that's seated | The seat picks up the new name and list |
| D.6 | Escape with the drawer open | Drawer closes; home screen stays. Escape again with a live match → back to the board |
| D.7 | Phone | Drawer is full width; row actions wrap under the title |

## E — Hotkeys

| # | Step | Expected |
|---|------|----------|
| E.1 | On the home screen (focus not in the field) press `m`, `t`, `q`, Space | Nothing happens to the board behind it |
| E.2 | On the board | All hotkeys work as before |
