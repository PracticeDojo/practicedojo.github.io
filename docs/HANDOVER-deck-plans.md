# Handover: deck plans for the bot (Feature 68)

For the next agent picking up deck plans, after the owner has tested them. Read this, then `docs/HANDOVER-rules-engine.md` (the engine as a whole: §2 item 6, gotchas 13 and 19–23) and the study's log, `docs/RSC-lorcana-engine.md` §12, 2026-11-04 (every number below). Written 2026-11-05.

## 1. State

- **Branch `claude/feat-68-deck-plans`**, pushed, v3.24.0, `main` merged in (Feature 69 shipped as v3.23.0 meanwhile). **Not merged, no PR**: the owner is testing first. Ask before opening one.
- **Preview** (Cloudflare Workers Builds, one per branch): https://claude-feat-68-deck-plans-practicedojo.heavenideasdesign.workers.dev/app/
- Checks on the branch: `app-checks` 56/56, `help.mjs --check` and `--test`, `refresh-landing.mjs --check`.
- **Owner's decisions:** plan one exact list (the GS guide's Emerald/Steel go-wide, Quest Coast IV list); no matching of similar lists ("out of scope"); keep only what wins in play.

## 2. What exists

- **A deck plan** is a JSON file in `app/defaults/plans/`, listed in its `manifest.json`. The first is `gs-emerald-steel.json`; its list ships as the default deck **S14 - GS - Go Wide** (`app/defaults/decks/set-14/gs-go-wide.txt`). The guide itself isn't in the repo; the plan says where it came from (`source`).
- **The Dojo bot with a plan** (`app/index.html`: `botRead`, `botKeepHand`, `renderBot`; `app/js/rules.js`: `planFor`, `mulligan`, `botStart`):
  - it uses a plan when 90% of the plan's list is the deck it plays (every card of its seat, any zone);
  - its opening hand: the plan's mulligan (on the play when the other seat hasn't chosen yet); the log says *Bot mulliganed N cards (deck plan)*;
  - each of its turns: the search's best line (`BOT_SEARCH`, 300 nodes, with the plan's terms), worked out on its first move and played one move at a time (`botStep`'s queue of the line's own engine moves, `Line.moves`). A move that no longer applies ends the line; the engine's bot plays the rest of the turn;
  - the banner reads **Bot · P2 · Plan** (its title names the plan);
  - without a plan, nothing changed: the engine's bot, move by move, keeping its hand.
- **In the worker** (`tools/engine-adapter/worker.ts`, rebuilt into `app/vendor/lorcana-engine/engine.worker.js`):
  - `Plan`, `planMulligan` (and the `mulligan` op), `options` (the search's moves: Bodyguard's exerted entry, a plan's ink order), `engineBonus`, `planPregame` (going first and the mulligan in `selfPlay`), `replyScore`'s `reveal`;
  - `selfPlay` takes `plan` and `rival` (the other seat played by the search too).
- **The tuner** (`tools/engine-tune.mjs`): `--deck <list>` (the explorer always plays it, against each Set 14 deck from both seats), `"plan": "<file>"` in a `--compare` entry (`"only": [keys]` keeps some parts), `--rival '{}'`.
- **Manual:** *Play against the bot* → *Decks with a plan* (`app/help/articles/11-rules/bot-opponent.md`).

## 3. The plan format

```json
{
  "id": "gs-emerald-steel", "name": "Emerald/Steel go wide", "source": "…",
  "deck": ["4 Tod - All Alone", "…"],
  "goFirst": true,
  "mulligan": { "keep": [], "keepOne": [], "keepOnDraw": [], "withCurve": [], "filler": [], "late": [], "send": [] },
  "ink": { "first": [], "never": [], "keepOne": [] },
  "engines": [{ "card": "Elinor - Renowned Diplomat", "exerted": 3, "value": 1.5 }],
  "terms": [{ "side": "mine", "zone": "hand", "where": { "name": "Strength of a Raging Fire" }, "measure": "count", "weight": 0.5 }]
}
```

- Cards by full name ("Name - Version"), as the engine's `cards.json` has them.
- **mulligan:** `keep` every copy; `keepOne` one copy; `keepOnDraw` kept on the draw, a curve card on the play; `withCurve` stays next to another character costing 2 or less; `filler` one of them, when 4 other cards stay; `late` one (the list's first), when 4 other cards stay; `send` back. Then no more uninkable cards than inkable ones (late cards go first, then second copies). Cards no list names stay.
- **ink:** `first` inked first, in order; `never`; `keepOne` never inks the last copy in hand. Else the engine's order.
- **engines:** worth `value` while the search ranks a line that ends with `exerted` of your characters exerted, for each copy of `card` in play (the trigger itself happens when the turn passes).
- **terms:** the score lab's terms (`Term`), added to the search's score.
- **The GS plan uses** `goFirst`, `mulligan` and the Strength term. `ink` and `engines` were measured neutral for it and left out (§5).

## 4. How the owner tests it

In the preview (or any copy of the branch):

1. **Tweaks → Rules engine → Assist.**
2. On the home screen, under *Default decks*: a deck for **You** (any Set 14 deck), then **S14 - GS - Go Wide** for the **Opponent**. **Start match**.
3. **Bot → P2** right away, before ending your first turn: its mulligan comes when its first turn opens. The banner should read **Bot · P2 · Plan**, and the log *Bot mulliganed N cards (deck plan)* or *Bot kept its opening hand.*
4. Play normally. **Step** shows one move at a time (**N** for the next). It thinks for a moment at the start of each of its turns.
5. For the bot **on the play**: seat Go Wide as **You**, start, then **Bot → P1** while the mulligan is up. You then play P2.

What to watch, against the guide:

| The guide says | What the bot should do | Comes from |
|---|---|---|
| Keep a hand that puts 3 characters on the board by turn 3 | Mulligan to that | the plan's mulligan (6 of the guide's 9 example hands as the guide keeps them) |
| Turn 1 a 1-drop (Tod with Vixey in hand; White Rabbit on the draw) | Plays it | the search |
| Tod then Vixey for 2 | Plays it | the search |
| Ursula on turn 2–3 against song decks | Plays her early, takes your best song | the search |
| Woolter enters exerted when you have challengers | Exerted entry | the new Bodyguard move |
| Elinor behind Woolter; 3 exerted at the end of the turn | Sets it up | the search (the engine bonus was neutral, left out) |
| Strength sung for free by Woolter or Max Goof, on your best character, board counted first | Sings it, not with Vixey or Mushu | the search |
| Hold a Strength | Doesn't fire it on a 1-drop | the Strength term |
| Don't draw with The Queen when it puts you in range of 20 | Declines | the search |
| Keep a Strength in hand | Inks another card first (a Strength in hand scores 0.5 more); it may still ink one when the engine's two ink choices are both Strength | the Strength term (the ink rules didn't win and are out) |

When something looks wrong, note the turn and what the guide says it should have done, and export the game: **Multiverse → Export** (a session file). Send the file and the notes; the next session can reload the board at that turn and see the search's lines (Proposed plays, Lab → Score).

## 5. Measured (study §12, 2026-11-04)

The list against each Set 14 deck from both seats, fresh games each round, sign test on the games only one side won:

- Against the engine's bot it wins 86% with no plan (too close to the ceiling), 91% with the first cut (18 v 5, z = 2.71).
- Against the same search (`--rival '{}'`), 192 games a round: 69% with no plan; **mulligan and going first 77%** (22 v 8, z = 2.56); **with the Strength term 73–75%** on two rounds (pooled 40 v 23, z = 2.14). The ink order (16 v 11), Elinor's engine, more bodies when behind (16 v 16) and the revealed hand (14 v 14) made no difference. The Bodyguard exerted entry off: 3 v 0 for keeping it.
- A game against the search takes about 40 s on one core; 192 games are about 35 min on 4.

```bash
export DOJO_ENGINE_CACHE=<scratch>/engine-cache
node tools/build-engine.mjs        # after any change to tools/engine-adapter/*; commit the minified build
node tools/engine-tune.mjs --deck app/defaults/decks/set-14/gs-go-wide.txt --rival '{}' --holdout 192 --tag <fresh> \
  --compare '[{"plan":"app/defaults/plans/gs-emerald-steel.json"},{"plan":"<variant.json>"}]'
```

Run it detached (`nohup setsid … &`) and watch the log: a container restart kills it (one was lost on 2026-11-05). Each `--tag` is a fresh set of deals; the same tag replays the same games exactly.

## 6. Next steps (owner to choose, after testing)

1. **Fix what the owner's tests find.** Most will be the search's scoring on a board (reload the exported game at that turn) or a plan rule. Change one thing, A/B it with `--rival`, keep it only if it wins.
2. **The mulligan's three misses** (Angela on the play, Toulouse v Circle of Life, both fillers): the guide's own examples disagree; the matchup one needs the opponent's inks before the mulligan.
3. **The bot facing a planned deck** reads its plan: expect Strength for free from turn 3 (count their board), Ursula on 2, Toulouse's action lock, Elinor as the card to kill. Not built; needs the deck recognised from cards seen (fair play), then their reply or a risk term.
4. **More plans** from the owner's guides: one JSON each (§3), the guide's example hands through `DojoEngine.mulligan`, an A/B.
5. **The search for every deck** (not only planned ones), and **ink drops** for the bot (handover gotcha 19).
6. **Merge** into `main` when the owner says so: PR from this branch, version as it stands then (main may have moved again).

## 7. Gotchas from this work

- Against a weak opponent a plan's worth hides (the list already wins 86%): measure with `--rival`.
- The bot's own choices while it plays its line are the line's next moves (`botResolve` stops at them); answering one of its prompts differently from what the search expected ends the line, by design.
- `status.otp` says who went first; the pre-game asks are `chooseWhoGoesFirst` and `alterHand` candidates, built by hand in `planPregame`.
- Ursula's reveal leaves `cardMeta[id].revealed`; `reveal: true` lets the search's reply play those cards (off: no gain).
- With no `ink` in the plan, the search tries the engine's two favourite inks; the Strength term makes inking a Strength 0.5 worse than inking another card, so it inks one only when both choices are Strength. If testers see it, `ink.keepOne` is the fix (it was neutral in play).
- The bot as P1: switch it on after **Start match**, while the mulligan is up; it chooses its hand then (checked 2026-11-05).
