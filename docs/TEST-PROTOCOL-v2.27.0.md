# TEST PROTOCOL — Practice Dojo v2.27.0

Scope: **Feature 46 · Field Unit visual redesign.** A restyle of the whole app to `docs/DESIGN-field-unit.md`.
Nothing should behave differently except where noted. Use the Set 13 demo (home → *Pick up again* → Explore)
at 1600×1000, then 1280×800, then a 390×844 phone.

## A — Shell and well
| # | Step | Expected |
|---|------|----------|
| A.1 | Load the app | Loading screen is chassis (light warm grey) with the mark in ink, mono label |
| A.2 | Home | Chassis page, paper modules, the paste field is a black glass well; *Start match* is the only orange button |
| A.3 | Paste a decklist (or *A decklist*) | Readout card on paper; *Play it as you* is an outlined paper tool, *Start match* stays the one orange key |
| A.4 | Open the demo | Top bar 46px chassis with paper tools; turn chip is black glass with the turn number in orange |
| A.5 | Look for orange | Only: End turn, the turn number, both lore numerals, auto-save switch, NEW pips, the board's centre rule (on a saved branch) |

## B — Board (desktop)
| # | Step | Expected |
|---|------|----------|
| B.1 | Each half | Left: player tag (ink ticks, `P2 · TO PLAY` / `P1 · WAITING`) and the discard column; centre: field, ready row, hand; right: deck slab and lore box |
| B.2 | Discard column | Header `DISCARD  N` with a search button; newest first, name left, `cost/str/lore` right; *+N more* after 8 rows expands, *Show fewer* collapses |
| B.3 | Right-click a discard row | Card menu (Play Card to Field / Return to Hand / Top / Bottom of Deck); each works |
| B.4 | Drag a discard row to your field / hand | Card moves; the row disappears |
| B.5 | Right-click the discard header or empty column | Pile menu (Inspect Discard Pile) |
| B.6 | Click the deck slab | Draws a card; right-click opens the deck menu |
| B.7 | Lore box − / + | Numeral changes; HAND · CTL / BCR / RDS / LVI listed under it |
| B.8 | Ready row −, +, Ready all; click an ink card | Counts update; picked ink opens *Exert · To hand · Discard* in place |
| B.9 | Hover a field card | Damage stepper, verbs and willpower track on glass; *NEW* pip on cards played this turn |
| B.10 | Hover a hand card | *PLAY* / *INK* outline chips (not orange); both work |
| B.11 | Turn notes (bottom left) | Glass box, paper text; typing and blurring saves; the note appears in the log |
| B.12 | Challenge mode | Top-bar *Challenge* inverts to glass; red hairline round the halves; banner on paper |
| B.13 | End turn | Board flips; opponent's hand shows small card backs under *HOLD TO REVEAL HAND* |

## C — Rail and odds
| # | Step | Expected |
|---|------|----------|
| C.1 | Player rows | Paper rows: ink ticks (P2 striped), name, `28 deck · 2 hand`; active player outlined in ink |
| C.2 | Meters | 3px track, black marker at the active player's share, values with ticks at both ends |
| C.3 | Hover a card | Art (or text card) on a glass inset; CTL / BCR / RDS / LVI under it |
| C.4 | Log | Steps mute, banish / challenge / quest lines in ink, `— Turn 16 begins —` rules, notes as glass blocks |
| C.5 | Draw odds | Paper module; columns *Card · Left · 1 · 2 · 3*; inks as ticks before names; zero-copy rows grey with `—` |
| C.6 | Window to 1280×800 | Board still fits without halves overlapping; odds column narrower |

## D — Multiverse and timelines
| # | Step | Expected |
|---|------|----------|
| D.1 | Open Multiverse | Chassis header with the canvas hint; glass canvas; paper nodes with ticks, `Turn 16 · P1: 10 - P2: 11 · 20:27` |
| D.2 | Node sections | Label · value grid: Played / Inked / Drawn / Discarded / Banished / Quested / Starting hand |
| D.3 | Edges | Grey hairlines; the path from the root to the current node is orange; current node has an orange border and foot bar |
| D.4 | Compact view, reset zoom, arrows + Enter, edit / delete node | All work as before |
| D.5 | Timelines | Drawer over the rail on translucent chassis; top-bar *Timelines* inverts to glass; *+ Save current state* adds a node |

## E — Tweaks
| # | Step | Expected |
|---|------|----------|
| E.1 | Accent swatches | First is *Signal* (default); others recolour End turn, lore, turn number, live path |
| E.2 | Palettes | Competition / Modern / Classic change the ticks only; Mono greys everything, lore numerals stay readable on glass |
| E.3 | Card display: Text | Paper card faces: cost pip in the card's ink (disc = inkable, hexagon = not), strength pip, orange lore pip, willpower `W` |
| E.4 | Panel layout: Floating, Hide, Docked | Floating: rail floats beside the board; Hide: board fills the space; Docked restores |
| E.5 | Card size slider | Cards scale as before |

## F — Overlays
| # | Step | Expected |
|---|------|----------|
| F.1 | Inspect deck / discard, mulligan, craft hand, card search | Paper modal, cards on a glass well; one orange confirm |
| F.2 | Dialogs, Undo toast | Paper dialog; toasts are glass pills |
| F.3 | Library, deck editor, account | Paper on chassis, rows with hairlines |

## G — Phone (390×844)
| # | Step | Expected |
|---|------|----------|
| G.1 | Board | Edge-to-edge glass; player bars in raised glass; lore numerals orange; every top-bar tool fits |
| G.2 | Tap a field card / the ink bar / a hand card | Card drawer and ink sheet on paper; hand focus on a glass scrim with an orange *Play* |
| G.3 | ☰ | Rail slides in on chassis |
