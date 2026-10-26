# Turn replay: four prototypes

**Question:** how do we show a played turn, action by action, so a player sees what happened (challenges, quests, who sang what, triggers) and can go back and play it differently?

Four prototypes, all built on the app's own `app/css/field-unit.css` and running on **real turns from the Set 14 demo** (`app/defaults/demos/set14_example2.dojo.json.gz`). Each answers a different question about the same turn:

| | Answers | What it is |
|---|---|---|
| **A · Tape** (`A-tape.html`) | *What happened?* | The board replays the turn one step at a time. Each step is drawn where it happens: a Coral arrow for a challenge with the damage at both ends, Trace lines from the singers to the song, lore flying to the lore box, ink draining. Cards travel between zones; what left the board stays as a ghost in its slot. Under the well, the **tape**: decisions as keys, consequences hanging under their cause, steps still to come hollow. The panel says the step in a sentence, shows the maths (`0 + 5 = 5 / 6`), why it happened (`Vixey is exerted (sang) · 04`) and **Play from here**. ← → step, Space plays. |
| **B · Lanes** (`B-lanes.html`) | *Where did my turn go?* | The turn as a score: one column per step, one lane per resource. Lore and ink as stairs, a lane per character, card in hand and opposing character. A character's lane is a line while it's ready and becomes a band in the colour of what spent it: Olive quested, Trace sang, Coral challenged. Their characters fill with damage until ✕. The last column says what was left: unused ink, idle characters. The receipt on top: lore +3, ink 4/4, theirs banished 2 (cost 9), yours 1 (cost 1), lore given up 3. |
| **C · Chain** (`C-chain.html`) | *Why did it work?* | An arc diagram on one timeline. Above the line, what each step set off. Below, what made a later step possible: damage that added up to a banish, the exerts a trigger needed, a character played early enough to be counted. The panel writes it as sentences, generated from the links. |
| **D · Fork** (`D-fork.html`) | *What if I'd done it differently?* | The turn as played on the left; **your version** on the right is the same script, editable: move a decision earlier or later, swap it ("Vixey quests instead"), drop it, add one. The engine replays it from the same board at once, refuses what the rules refuse (`CAN'T · Don Karnage costs 6; only 4 ink ready`), and compares the two endings. A line already saved in the multiverse loads as your version, with where each line went to the end of its game. |

The verb colours are the card drawer's function keys (`DESIGN-field-unit.md`, "Function keys"), so a step reads the same on the tape as on the key that made it: Coral challenge, Olive quest/ink/lore, Trace sing (an exert), Graphite banish/discard, danger red damage, Bone the rest. The signal stays the live thing: the step you're on and Play from here.

## What the real turns show

These came out of the prototypes, not out of the session's recap:

- **T4 · P2 "The answer":** Don Karnage (6 willpower) died to exactly 6: 5 from Strength of a Raging Fire, which counted Elinor because she was played first, plus 1 from Elinor's COORDINATED EFFORTS, which needed 3 exerted characters, one of them Vixey, the singer. Play Elinor after the song, or let Vixey quest, and Karnage survives (D: "Same lore, but Don Karnage (5/6) survives").
- **Same turn:** Darkwing Duck died in its challenge because it was already damaged from Karnage's LASTING IMPRESSION the turn before (C draws that arc from the turn's start).
- **T10 · P1 "The wipe":** the wipe only works in order. Malicious, Mean, and Scary (free, from Max Goof's NUMBER ONE HIT) puts 1 on each; To Wither a Flower then deals 2 to each *damaged* one. Wither first hits nothing (D: "Wither before Max Goof quests").
- **T10 · P1 again:** the session charged 3 ink for the free song. The replay ends the turn with 4 ink ready, the session with 1. A replay that's checked against the saved board catches referee slips (A shows it as a CHECK).
- **T9 · P2 fork:** "Fight back" (The Queen trades with Max Goof, Angel's GOOD AIM kills Karnage) costs 1 lore and 3 of their board lore, and moves the loss from T11 (27–18) to T12 (21–18).

## The data this needs

Today a node keeps the board at the start of the turn, the recap (played, inked, quested, banished…) and the Dojo's own log (`Moved Circle of Life to field.`, `You quested with 2 characters for 3 lore.`). That's not enough: who sang, what was targeted, what was free and in what order are lost.

- **Store the turn as a script, not as boards.** Each node keeps its turn's actions: verb, card, actors, targets, cost, and the action it hangs under. Boards for every step come from replaying the script from the node's board. That's `_engine.js` here: about 300 lines, a few hundred bytes per turn.
- **Where the scripts come from.** Live play: every board action already goes through `saveState()` (35 call sites); record the action there. Duels.ink text logs: the importer already reads singers, challenge damage and triggers line by line; emit actions instead of only turn snapshots. Replays: every frame has a `takenAction`.
- **Check every replay** against the next node's board. `_make-data.mjs` does it for all six turns here; a mismatch is a parser bug or a referee slip.
- **Card effects.** The engine computes the few effects these turns need (Strength counts your characters, Elinor counts exerts, banishes from damage, "each damaged character"). In D, a decision's recorded consequences move with it and recompute where the effect is known. An unknown effect keeps its recorded outcome, and the player is the referee as everywhere else in the Dojo. A rules engine for every card isn't the goal.

## Recommendation

**Build A as the turn view, with C's "why" lines in its panel (already there) and D as its edit mode.** A is the interaction asked for: step through, see each action where it happened, Play from here. D is what makes "replay it differently" fast: try the other order in one click instead of replaying the turn by hand, then Play your version from here to continue it as a new line. B is the strongest analysis view but the least needed day to day; it could come later as a toggle on the tape. C's diagram is the best explainer of a combo turn and could live in the Multiverse panel for the selected node.

Order: the action script first (record it in live play, emit it from the log importer), then A, then D.

## Opening the prototypes

Serve the repo root (for example with the screenshot tool, or `python3 -m http.server`) and open `/docs/design/turn-replay/A-tape.html`. The top bar switches prototype and turn. URL: `#t4p2.5` opens turn T4 · P2 at step 5 (`t4p1`, `t4p2`, `t8p1`, `t10p1`, `t9p2a`, `t9p2b`).

Files: `_engine.js` compiles a script into steps, links them and checks the result. `_make-data.mjs` builds `_data.js` from the demo and checks every script against the saved boards (`node docs/design/turn-replay/_make-data.mjs`). `_shared.js` / `_shared.css` hold what A–D share: step names and colours, card faces, the top bar.
