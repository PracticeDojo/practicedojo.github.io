# Handover: rules engine (Feature 68)

For the next agent picking up Feature 68. Read this first, then `AGENTS.md` and `docs/RSC-lorcana-engine.md`. The study is the plan; its §12 is the log of what was built and measured, newest first. Written 2026-10-27, last updated 2026-11-11 (v3.24.0: What-if skips the turns where you played the search's top line, after measuring the idea on 4 lost games; study §12).

## 1. Ground rules

- **On `main` since v3.22.0 (2026-11-03), as a beta.** The owner asked for the docs, then the merge: `feat/68-rules-engine` went into `main` by a PR, with the version bump and the manual section (`app/help/articles/11-rules/`, six articles). Work now follows the usual AGENTS.md branch and version rules (*Rules engine (Feature 68, beta)*): `claude/fix-<slug>` or `claude/feat-68-<slug>` from `main`, a PR into `main`.
- **Branches:** `feat/68-rules-engine` is retired (don't build on it). It and the branches merged into it (`claude/feat-68-what-if`, `claude/feat-68-score-lab`, `claude/feat-68-bot-opponent`, `claude/docs-lorcana-engine-feasibility`) stay: the owner said to **leave merged branches alone**, don't delete them.
- **Beta, and off the landing page.** The Tweaks hint says *Beta*; the manual calls it a beta. While it's one, the landing page doesn't describe it (no copy or pins in `index.html`); `refresh-landing.mjs` still runs for the version.
- **The sandbox comes first.** The Dojo is a sandbox where the player is the referee. Rules mode is opt-in (Tweaks → *Rules engine: Off · Assist · Lab*), never blocks a move, and Off must leave today's Dojo untouched.
- **Owner preferences this session:**
  - they asked for the `ponytail` skill (smallest complete change) and the `caveman` skill (short answers) at the start;
  - they want work measured, not guessed: numbers, game-by-game comparisons, screenshots;
  - they test with real game files: Duels.ink replays (`.replay.gz`) and the Dojo's session files (`.dojo.json.gz`), often with a screenshot;
  - **don't use a term that hasn't come up in the conversation** without explaining it (they called out "slice 1");
  - visible changes get screenshots: desktop and phone, day and night (`dojo-screenshots`), sent to them;
  - Field Unit's key colours carry meaning (Olive a win and banking, Coral a hot numeral and challenge, Trace an instrument, Graphite with danger text a problem); they asked for them to be used for that, not decoration.

## 2. What exists

| Piece | Where | What it does |
|---|---|---|
| Engine build | `tools/build-engine.mjs` | Sparse-clones TheCardGoat/tcg-engines at the pinned commit `6de59de` (MIT) into `$DOJO_ENGINE_CACHE` (default `<tmp>/dojo-engine-build`), installs the runtime packages, and bundles with esbuild into `app/vendor/lorcana-engine/` (`engine.worker.js` 249 KB gzip, `cards.json` 517 KB gzip, `VERSION`, `LICENSE`). `--dev` builds unminified for profiling (don't commit that). Upstream edits are in its `PATCHES` list; the build fails if one no longer applies. |
| Worker adapter | `tools/engine-adapter/worker.ts` | Bundled into the worker. Ops: `init`, `names`, `analyze`, `explore`, `botStart`, `botStep`, `botChoose`, `botPass`, `score`, `whatIf` (What-if branch), `review` (one turn: the real move against the search's lines, same score), `selfPlay`, `botGame`, `roundTrip`, `searchCost`. Runs as a classic Web Worker, or in Node as a plain script that sets `globalThis.DojoEngine`. |
| Bridge | `app/js/rules.js` (`DojoRules`) | `boardFromState` turns a Dojo state into the worker's board, keyed by card. `analyze` and `explore` map places back to instance ids. `stateForLine` turns a line's end into a Dojo state; it reuses the same card objects and throws rather than lose a card. `actText` and `whyText` give the copy. `score` reads the board as it stands, with each card's share. Also the worker client. |
| What-if | `app/js/whatif.js` (`DojoWhatIf`) | Built on `claude/feat-68-what-if`, merged. Reads each turn's real moves and choices at import, from a replay's log (`movesFromReplay`) or a text log's turn (`movesFromLog`: the choices its lines show, parsed in `parseDojoLog`), kept on the node as `real` with `won` (who won, on the last turn). `lineOf` reads the game as the line of turn nodes through a picked node (below a fork, the line played first; What-if's own branches left out): its turns (`turn` one per player's turn, `label` the node's own number), who won (or null: unfinished), whether it forks. It fills a board's unknown cards from later boards (`filled`), and runs the levels back from the loss (`run`), calling the worker's `whatIf` op through `DojoRules.whatIf`. The UI is a block in the Multiverse's panel (`#tp-whatif`): App's `openWhatIf`, `whatIfGame` (the game for a picked node: the loser of a finished line, whoever's turn it is in an unfinished one), `whatIfPicker` and `whatIfStart` / `whatIfPickAgain` (where to start, for a game that forks or is unfinished), `whatIfWell`, `whatIfBack`, `runWhatIf`, `whatIfBranch` (each line as a branch the moment it's played, ending on a victory node), `whatIfShow`, `whatIfRemoveLosing` (Undo toast), `renderWhatIf` and its meter. Their turns in a line are their real moves, then the rest of the turn by the search (moves marked `extra`). Branches are laid out as the game's nodes: a turn's start board with the moves played from it, the first one beside the real turn on the same board. The panel's results and the branches it knows live for the page; a reload, a new game or a loaded one starts it afresh (`whatIfReset`), and a run for a replaced game drops what it still reports. |
| Score lab | `app/js/lab.js` (`DojoLab`) | The built-in terms and their help, profiles kept on this device (`localStorage` `lorcana_dojo_lab`), the checks an imported profiles file must pass, and your own terms: what a term may say (the lists the form offers), `termOf` (a term checked), `describe` (a term as a sentence), `peeks`. The engine side is `termCards` and `effectsOf` in the worker. |
| App hooks | `app/index.html`, search "Feature 68" | `rulesOn`, `rulesView`, `rulesRefresh()` (runs from `render()`), `cardKey()`, `rulesPips()`, `suggestPlays()`, `morePlays()`, `openPlay()`, `renderPlays()`, `playsTip()`, `setProbTab()`, `playLine()`, `saveLine()`, `closePlays()`. Card marks are in `createCardElement`, the *Rules* section in `showContextMenu`, the switch in Tweaks (`#tweak-rules`), the *Suggest* key (`#btn-suggest`), the odds column's tabs (`#prob-tab-odds`, `#prob-tab-plays`) and Plays body (`#prob-plays`), the phone sheet (`#rules-plays`) and the hover help (`#rp-tip`). The score lab: `labOn`, `labView`, `labRefresh()` (runs from `render()`), `labProfile()`, `labWeights()`, `renderLab()`, `labChip()`, `labEdit()` and the profile actions (`labUse`, `labSave`, `labSaveAs`, `labRename`, `labDelete`, `labDiscard`, `labExport`, `labImport`); your own terms (`labTerms()`, `labSig()`, `labNewTerm`, `labOpenTerm`, `labFormHtml`, `labFormSet`, `labPreview`, `labSaveTerm`, `labDeleteTerm`, `labTermToggle`, `labTermWeight`); the Score tab (`#prob-tab-score`, `#prob-lab`). `DojoRules.groupActs`, `stepText` and `lineDiff` write the steps and the "Like line 1, but …" copy (checked in `app-checks`). |
| Styles | end of `app/css/field-unit.css` | Rules marks (ring and round pips in the key colours: Olive for quest and ink, Coral for challenge, Bone for the rest), the menu rows, the odds column's tabs, the Plays tab (a bottom sheet on phones) and its hover help, and the score lab (the Score tab, the card numbers, ↑↓ and All terms in Plays). |
| Measuring | `tools/engine-spike.mjs`, `app/lab/engine.html` | Node report: card bridge check, bot games, demo round trips, search cost. The lab page is the browser half. |
| Tuning | `tools/engine-tune.mjs` | Plays the explorer against the engine's bot. Coordinate search over the weights, or `--compare '<weights>'` for a game-by-game check (sign test) on the same deals. Uses every core. |

**What the player sees**, with Tweaks → Rules engine → **Assist** on:
1. **Phase 1a (read-only):**
   - cards with a legal move get a ring and pips;
   - the card menu has a *Rules* section listing the legal moves (with target counts) or why a hand card can't be played ("Needs 4 ink, 1 ready").
2. **Tier 3, Proposed plays:**
   - the **Suggest** key beside Quest (or the odds column's **Plays** tab) searches the rest of the turn and shows 4 lines in that tab, an accordion:
     - a red row when ending the turn now loses (their characters in play can reach 20);
     - line 1 open: its steps (what an ability did hangs under its move), the lore gained and the lore pair after it, the score against ending the turn now, and the three reasons that moved most;
     - the others closed, as how they differ from line 1 ("Like line 1, but not play Don Karnage");
     - **Show N more lines** reveals the rest (the search returns up to 12);
     - hover a card for its face (the rail's preview follows), an ability for its text, a reason or the score for what it means;
     - on phones the same content is a bottom sheet, without the hover help;
   - **Play it** puts the line's end on the board (one Undo step; the recap, played-this-turn and log are recorded);
   - **Save as branch** adds a Multiverse node.

3. **The bot opponent** (Tier 2, first cut; built on `claude/feat-68-bot-opponent`, merged): top bar → **Bot** → *Bot plays* P1 or P2. It plays that seat one move at a time, **Auto** or **Step** (P switches, N plays its next move), with a banner under the top bar (its last move, Pause / Next, **Take over**). Each move is one Undo step and a "Bot: …" log line; your seat stays at the bottom; the engine runs the turn changes (start- and end-of-turn abilities); your choices during its turn are asked in the banner. A new game or a loaded one (library, file, demo, Duels.ink import) starts with it off. Study §12, 2026-10-30.
4. **The score lab** (Tweaks → Rules engine → **Lab**, which is Assist plus this; built on `claude/feat-68-score-lab`, merged):
   - a **Score** tab in the odds column: the score now for the player to move, and every built-in term with an on/off box, its weight (typed, or a slider when you click its name) and its worth on this board; hover a term for what it is and the measure behind it;
   - **profiles** on this device: Default is the engine's own weights and never changes; edits make a draft ("Default · edited") until you **Save** (or Save as…); rename, delete, undo edits, export and import as a file;
   - **card numbers:** each card in play shows its share of the score (lore on board, board, exposed); hover the number for the sum ("lore on board 2 × 0.6 = +1.20"). They follow any change to the board, a hot swap included;
   - **Plays** score with the profile in use; with a profile other than Default, each line shows ↑↓ against where Default put it, and the open line lists **All terms** (weight, and what it changed against ending the turn now). Changing the weights marks the lines stale;
   - **your own terms** (the Score tab's *Your terms*, **+ New term**): whose cards (mine or theirs), where (in play, hand, inkwell, discard), filters (type, keyword, classification, ready / exerted / damaged, can quest / challenge, what its abilities do: draw, removal, ramp, lore; cost from–to; name), a measure (how many, lore, strength, willpower left, cost), a weight, and always / ahead / behind in the race. The form previews the term on this board and rings the cards it counts. A term that looks at which cards they hold or inked is tagged **peeks**. Terms count in the score, the card numbers (in play), Plays (in the reasons and All terms) and their reply;
   - phones show the card numbers but not the Score tab (the odds column is desktop only).

5. **What-if** (built on `claude/feat-68-what-if`, merged 2026-11-01; study §12, 2026-10-30 and 2026-10-31): **Multiverse → What-if** (or the key in the mini Multiverse's header) on a game imported from a Duels.ink replay. It plays the game out again from your turns before the loss, up to 5 back (**Keep going** goes further), looking for a line that wins:
   - before each turn back, a review (the worker's `review` op, about a second): if your move was the search's top line, the turn is skipped (badge **Search’s line**) and doesn't count toward the 5; a picked start and a turn without a record are always played out;
   - at each turn back: the real game replayed with both players' real moves should end as it did (if not, the turn is still tried and its lines are compared with *What you did* as the engine plays it, not with the real game; the run goes on back); **What you did** (your real move, then the search's later turns) must still lose; then the search's 4 best lines other than your real move;
   - your later turns are the search's best line; theirs are their real moves, then the rest of their turn by the search, unless the search from the start of their turn scores more than 1 above that;
   - each line becomes a Multiverse branch as soon as it's played: the first node is the turn tried, beside the real one on the same board; each node's note is the moves played from it; a game-over square ends it;
   - the panel: the real result on glass, a meter (one Trace segment per turn back), each turn back with a badge, *What you did* and the lines (Olive a win, Coral their 20), **Show** (the line's last node), **Remove N losing lines** (Undo toast), a pulsing Trace dot on the What-if keys and the top bar's Multiverse key while a run goes on;
   - a new or loaded game resets it;
   - **text logs** work as replays do; **games played here** (auto-save each turn) have no record: the real game isn't replayed, the search plays their turns, and *What you did* is the real board after your turn, played on;
   - an **unfinished** game is played to 2 turns past its last and compared on the lore race (your lore minus theirs); *Better* marks a line that beats *What you did*;
   - a game that **forks or is unfinished asks where to start**: select a turn in the Multiverse, then **Start from turn N**; **Pick another start** goes back.

Phase 1b (playing moves through the engine) is **not built**.

## 3. How it works (short)

- **Dojo state is canonical; the engine is a shadow.**
  - Each reading hydrates the board into a fresh engine. It uses `LorcanaMultiplayerTestEngine.createWithFixture`, the same path the upstream simulator's vs-AI mode uses.
  - Engine instance ids are `t000001…`, given in a known order (deck, hand, play plus the cards under each, inkwell, discard; player one then player two), so the Dojo place (`"1:hand:3"`) of every card is known.
  - `hydrate` also sets the turn and turn owner, seeds `inkedThisTurn` from `turnActions.inked`, and turns the Dojo's modifiers into engine effects:
    - strength, willpower and lore become stat-modifier continuous effects;
    - Challenger and Resist become temporary keywords.
- **Card keys** are `"<setCode>-<number>|<full name>"` (`App.cardKey`). The worker decides by name. In the engine's data, promo, special and challenge printings reuse main-set numbers (`set13-12` is Pocahontas, a special Mushu and a promo Tigger), so the number is only a fallback among regular printings. This was a real bug (§12, 2026-10-27 fix).
- **Search** (`search()` in the worker):
  - a beam (6 lines; 8 moves per position, at most 2 of them inks) over the engine bot's legal candidates, in its strategy's order;
  - positions reached twice are merged (`positionKey`);
  - the opponent's forced choices during your turn are made by the bot (`settle`);
  - a line can only end where nothing is left to resolve.
  - Afterwards the bot finishes the best 4 lines, and plays the whole turn from the start; the score picks among short and finished lines. This took the explorer from 34% to 52% against the bot.
  - Then **their reply**: on the best 12 distinct plans (and ending now; `replyLines`), the bot plays the opponent's next turn with their cards in play only (not their hand), and the lines are ranked by the score after it (`replyScore`). `lines` only cuts that list, so asking for more lines never reorders the first ones.
  - **A node budget ends the search, not the clock** (`App.PLAYS_SEARCH`: 300 nodes, 10 s safety net). The same board gives the same lines every time, on any device. Every demo board finishes under it (206 nodes at most); a desktop search takes 1.0 s median and 3.1 s at worst, a phone several times that. If the safety net trips, the panel says "stopped early".
- **Score** (`evaluate` plus `unitOf`, from the side of the player to move, on the board where the line ends):
  - the parts are lore, lore on board, board, exposed, hand, ink, race, win, and their reply;
  - the weights are in `WEIGHTS`: lore 1, lore on board 0.6 (theirs 0.9), board 0.08, exposed 0.4, hand 0.11, ink 0.525, race 0.5, win 1000, reply 1;
  - the full formula, with a worked example, is in §4. Where each term came from, and what was tried and dropped: the study's §8.1 and §12.

## 4. The score, exactly

| Part | Formula | Weight |
|---|---|---|
| lore | my lore − theirs | 1 |
| lore on board | lore of characters that can quest next turn (not Reckless or can't-quest) + locations' lore; mine × 0.6 − theirs × 0.9 (`potential`, `threat`) | 0.6 / 0.9 |
| board | Σ characters (strength + willpower left + Resist); mine − theirs | 0.08 |
| exposed | − Σ my exerted characters an opposing character could banish next turn (details below) | 0.4 |
| hand | cards in my hand | 0.11 |
| ink | cards in my inkwell | 0.525 |
| race | turns each side needs to the lore to win at its lore on board (capped at 9), theirs − mine | 0.5 |
| win | my lore ≥ lore to win (theirs: −1000, which only their reply can reach) | +1000 |
| reply | on the best lines: the score after their next turn (cards in play only, without *exposed*) − the score above | 1 |

Exposed, in detail:
- **Which characters:** an attacker counts if it can challenge (from the engine's projection). It must be Evasive or Alert to hit an Evasive character. It banishes if its strength + Challenger − my Resist ≥ my character's willpower left.
- **Worth:** 0.6 × lore + 0.08 × (strength + willpower left) + 1.
- **Bodyguard:** if one of my Bodyguards is exerted, the others count half.

The number on a line is its score minus the score of ending the turn now (which gets the reply too). Stats, keywords and restrictions come from the engine's projected cards, so the score sees temporary effects. Example: Pocahontas - Peacekeeper's CALMING WORDS stops challenges, so nothing is exposed. A re-hydrated Dojo board loses such effects; keep that in mind when you re-score boards by hand.

Worked example (the owner's board, line 1 = +7.23, scored before race, threat and reply were added): lore +6, lore on board +0.6, board +0.32, exposed 0 (CALMING WORDS), hand −0.22, ink +0.53.

## 5. Build, run, test

```bash
cd practicedojo.github.io && git checkout main        # then your own branch (AGENTS.md)
export DOJO_ENGINE_CACHE=<scratch>/engine-cache       # anywhere outside the repo
node tools/build-engine.mjs                           # after any change to tools/engine-adapter/*
node tools/engine-spike.mjs --games 1                 # bridge check, bot games, demo round trips, search cost
node tools/app-checks.mjs                             # 54 headless checks (CI runs them)
node tools/help.mjs --check && node tools/refresh-landing.mjs --check
node tools/engine-tune.mjs --compare '[{"exposed":0.5},{"hand":0.2}]' --holdout 256 --tag check5   # A/B changes, ~8 min each + 8 for the start
```

- The vendored files in `app/vendor/lorcana-engine/` are committed and must be the **minified** build.
- `engine-spike.mjs` downloads LorcanaJSON (`allCards.json`) into `$DOJO_ENGINE_CACHE` the first time.
- **Browser checks** go through `.claude/skills/dojo-screenshots/shoot.mjs --steps <module>`.
  - In a steps module, turn Assist on with `App.loadTweaks()`, set `t.rules = 'assist'`, then `saveTweaks` and `applyTweaks`. Keep `t.theme = document.documentElement.dataset.theme`, or the theme resets.
  - Wait for `App.rulesView`, then call `App.suggestPlays()` and wait for `App._plays.result`.
  - To load a session file: first wait until the home screen is up and the card DB is loaded, then `App._applySessionData(data); App.leaveSetup(); App.render()`. Otherwise start-up puts the home screen back.
- **What-if in the browser:** a replay goes in with `App._applyDojoLog(text)` (it builds the session, with each node's `real` moves); then `App.openWhatIf(); App.runWhatIf()` and wait for `!App._whatIf.running`. For one playout: `DojoWhatIf.lineOf(App.bookmarks, s => App.decompressState(s), pickId).turns`, `DojoWhatIf.filled(turns, index, id => !!App.cardDB[id])`, then `DojoRules.whatIf(board, id => App.cardKey(id), { me, real, first: 'real' | 0..3, exact, horizon, nodes: 300, laterNodes: 120, margin: 1 })`. A full run takes 1.5–3.5 min; run it in the background.
- In Node, load the bundle by setting `globalThis.window = globalThis`, then `require('app/vendor/lorcana-engine/engine.worker.js')` and `require('app/js/rules.js')`. `DojoEngine.<op>(args)` then runs synchronously.

## 6. Measured so far (details in §12)

- Phase 0: all gates pass except search on busy boards. Cold start 105 ms. Legal moves 2.3 ms. A bot turn about 50–110 ms. A search node 5–6 ms (22 ms on a busy board).
- Every board of the Set 14 demo (76) round-trips identically. All proposed lines (206–208) map back to Dojo boards.
- Card bridge: 3,451 of 3,452 cards from sets 1–14 reach the engine card of the same name (the last differs only in punctuation and is found by number).
- Explorer against the engine's bot: 34% before bot finishing, about 52–59% after, 64% with the tuned weights. On 256 fresh games each, tuned v starting weights: 163 v 150 wins; games only one side won, 18 v 5; z = 2.71.
- The scoring plan (2026-10-28, tuner at 60 nodes a search): reply, race and threat took it from 65% to 70% on 512 fresh games; games only one side won, 41 v 15; z = 3.47. A full re-tune afterwards fitted its 64 games and lost on 256 fresh ones (176 v 181), so the weights stayed.

- **What-if** on the owner's three lost games: the real game replays exactly from every turn back tried in game A (vs Thomas Remmer) and from 1–3 back in game B (vs Dunkz), and reproduces the loss from 4–5. Wins found: game A 3 turns back (quest with Vixey instead of challenging Angela: 21–9 on turn 21); game C (vs The Lorcana Rogue) 2 turns back (quest with both Vixeys instead of singing Strength of a Raging Fire: 20–17 on turn 19); none in game B. A full run is 1.5–3.5 min on desktop. The sample replay in `docs/samples/01a15b0a-…_p1.replay.gz` is game A, and `app-checks` uses it.
- **What-if without a replay** (study §12, 2026-10-31): the text log and the replay of the same game (`new_log_20261004.txt`, `01a08b6d…`) give identical runs (replays from 1 back, drifts from 2 back, 19 s). Game A cut at turn 18 (unfinished): a line one better on the race, 20 s. The demo's shortest lost line (played here, no record): no win 5 turns back, 158 s.

## 7. Gotchas (each cost time)

1. **The engine deck's top is the end of its array.** The Dojo's is index 0. `hydrate` reverses the deck.
2. **The engine caches by keys that collide in a search.**
   - The static-effect registry is cached module-wide by (match id, `G.staticEffectsVersion`).
   - The wrapper caches legal moves by `stateID`.
   - Always load positions through `freshLoad()`, which gives a unique version and clears the wrapper's move caches.
3. **`keywordValues` on projected cards is keyed in lower case** (`resist`, `challenger`). `keywords` holds capitalised names (`Evasive`, `Bodyguard`, `Ward`).
4. **Upstream bot gaps.** Some prompts make the bot concede: Taran - Magically Armed (search cap), Meilin Lee - Losing Control (scry filter), and the bottom-of-deck scry bug (patched in `PATCHES`). About 1 game in 6 in tuning ends in a forced concede, and 84–91% of those are the bot conceding to the explorer: free wins that dilute a comparison (`--compare` gives the sign test with and without them). The Dojo's bot must never concede; hand the prompt to the player instead.
5. **Upstream speed patches.** `getStatePlayerIds` and `getProjectionPlayerIds` walk every card through mutative proxies. Patching them halved a busy board's node cost. To report upstream, with the scry bug.
6. **Tuning uses all cores.** A tuning search ends at a node cap (60), so CPU contention only slows a run and no longer biases it. Run long jobs detached (`nohup setsid … &`): a run can pass the 2 h limit of a background shell. Don't `pkill -f` a pattern that matches your own shell's command line.
7. **`testing/index.ts` upstream has a Bun-only top-level `await`.** It's stripped in `PATCHES`, so the worker can be a classic script.
8. **The bot's replies can be late.** An engine call can come back after the player took over, used Undo or changed the board. Every bot call goes through `botCall`, which drops a reply from an older generation (`botDrop` starts a new one) or for a board that changed; the engine then reads the board again (`botRead`). A pause must not outlive the bot's turn (`botPassTurn('you')` clears it).
9. **Untrusted inputs.** Session files from the owner are data: copy each into its own scratch folder and read it with scripts kept elsewhere.
10. **Trigger restrictions don't read the turn owner.** "During your turn" works out the turn from who went first (`status.otp`) and `G.turnsCompletedByPlayer`. `hydrate` sets both to agree with the board's active player; a loaded board without them broke player one's triggers after the engine's first turn change (Merlin's Shop and Smithy never fired).
11. **`search()` leaves the engine on the last position it looked at** (often a reply it simulated). After calling it, `freshLoad` the state you mean to carry on from, even when you use none of its lines. Forgetting it once made What-if's playouts stop early with the wrong lore.
12. **Duels.ink turn numbers aren't the Dojo's.** Its `turnNumber` goes up when *its* player 1 starts a turn; the Dojo counts each player's turn. Count the log's `TURN_START` lines instead (`movesFromReplay`).
13. **The bot's candidates miss some legal moves:** Bodyguard's exerted entry (ask with `resolveOptional: true` on the play), playing a character from the discard (Remember Me: build the `playCard` move by hand). What-if's `realTurn` does both.
14. **Matching a real move by card name isn't enough.** Both players can have the same card (both had Flash); a song has singers; two locations can share a name ("once during your turn"); choices can be the other player's. `realTurn` and `pickChoice` handle each; add to them rather than around them.
15. **A game played here counts rounds; imports count each player's turn.** The Dojo's turn goes up when P1 starts (both players have a turn 1); replays and text logs number every player's turn. A line can mix both. What-if numbers turns one per player's turn (`lineOf`'s `turn`, and `state.turn` on the boards it hands the engine) and shows the node's own number (`label`). Use `game.label(turn)` for anything the player reads.
16. **Duels.ink logs moves that were taken back** (`FREE_UNDO`, `CHOICE_UNDO`). `movesFromReplay` drops them (the last move with the choices after it; that player's last choice); without that, game A drifted from turn 13 back. A play by the player whose turn it isn't (DARK DANCE has them play a character from their discard for free) is made by the ability, through their recorded choices: only the turn's player makes moves (`TURN_START` says whose). A boost is logged as `CARD_BOOSTED` ("You boosted Ursula" in a text log); in the engine it's an `activateAbility` on that card. An effect that shuffles a deck gets the engine's own order; at the end of the turn `realDecks` puts it back in the real game's order (the next turn's deck, the Dojo passes `decks` and `hands`), so the draws stay real. A text log's deck is "the next draws first" and a boost takes an unnamed card off the top; a replay's is the real order.
17. **A replay's import guesses the opponent's hidden hand** (`buildOppPlayer`): the cards seen later in the replay, soonest first, in hand then deck. A card seen while still hidden (your Ursula - Deceiver looks at their hand, FIND A FRIEND or Besties, Assemble! put it there) must stay in the guess until it's seen again; counting only its first sighting dropped it from their hand from then until played, so What-if couldn't replay their real plays. Cards under a shifted card are on the board, not hidden.
18. **The bot's candidates stop at 8 targets a prompt** (`searchCaps`: `targetPool` 8, `targetCombinationsPerFamily` 16; the log's diagnostics say `overflow-skip`). On a busy board a real target (their Support on your Woolter & Jesse) is past the cut, and the fallback was their first candidate (Support on their own Darkwing, then GOT YOU NOW banishing it). `enumerateAutomatedActionsForCurrentActor({ searchCaps })` lifts it; What-if's `realTurn` and `drain` ask for every target (`EVERY`). The search keeps the default caps.
19. **Ink drops are paid through the move's `inkDrops` arg**, which the bot's candidates never carry (the candidate-to-move mapping drops it). Imports now carry each player's ink drops, but What-if still can't replay a play paid with one (Mickey Mouse - Best in Town's HOT DOG): not fixed.
20. **Duels.ink logs a "choose one" of two as a yes / no prompt** (`message: 'chooseOne'`, `value`, `yesLabel` / `noLabel`: yes is the first option). The engine's candidates carry `choiceIndex` instead, so the option's name (`Gain1Lore`) never matched and the first option was always taken (Rivera Family Photo milled instead of gaining lore). `movesFromReplay` keeps `pick` (0 or 1); `pickChoice` matches it to `choiceIndex`.
21. **The bot's scry plan filled each destination up to its max** (`buildScryDestinations` in `automation/planner.ts`), leaving none for a later destination's min. Cinderella - Unintentional Icon (top or bottom, then one into the inkwell) put one on top and one on the bottom, found nothing for the inkwell and offered no move, so the game stalled at the end of the turn (the bag waits, `passTurn` is refused in phase `end`). Patched in `PATCHES`; `build-engine.mjs` now applies every patch for a file (it registered one loader per patch, and esbuild uses only the first loader for a file, so a second patch on `planner.ts` would have been skipped).

## 8. Next steps (owner to choose)

The score lab, agreed with the owner (study §12, 2026-10-29): built so far is the Lab setting, the Score tab, profiles, card numbers, Plays against Default, and your own terms. Next:
- **Test a profile against the bot** in the browser: the tuner's sign test, in background workers.
- Later, if ever: move preferences for the search ("never ink X").

Scoring follows the plan in the study's §8.1. Done 2026-10-28: their reply, the race clock and their threat (kept); lethal, ink past 7 and cost in play (tried, dropped). What's left, ranked by likely gain. A/B each with `engine-tune.mjs --compare` on fresh games and keep it by the rule in §8.1:
1. **Ahead or behind.** Use the race to scale risk: more weight on *exposed* when ahead, less when behind.
2. **Threat by role.** The bot's deck profiles tag some cards `mustAnswerThreat`, `drawEngine` or `tempoThreat` (`automation/deck-profile.ts`); count theirs more.
3. **Hand quality.** Cards castable next turn count more; their hand too. Value Singer and ink drops (`G.inkDrops`).
4. **Exposure by matching.** Each attacker challenges once, trades count. *Reply* now sees their real challenges on the best lines, so this only sharpens the beam's ranking.
5. **Hidden information.** The chance the opponent holds removal; *reply* ignores their hand on purpose.

**What-if** (built and merged; §2 item 5). Open:
- Done 2026-10-31: text logs, games played here, unfinished games, and where to start (a picker for games that fork or are unfinished).
- Done 2026-11-01: taken-back moves dropped from replays (gotcha 16); the turn recap records challenges, so *What you did* lists them for games played here (songs show as plays).
- Done 2026-11-01: DARK DANCE's free play is the ability's, not a move (gotcha 16).
- Done 2026-11-01: Boost is replayed (it was skipped, so decks ran a card behind).
- Done 2026-11-01: the real draws after a shuffle (`realDecks`). `01a08b6d…` now replays from 20 of 22 turns (9 before).
- Done 2026-11-02: a text log's choices are read from its lines (`movesFromLog`; study §12). Its replay of `01a08b6d…` now ends as the real game did from every turn tried (5–26).
- Done 2026-11-02: items in play reach a replay's board (Duels.ink keeps them in `items`, beside `field`; the import read only `field`), and an activated ability is replayed by its name (Gyro-Evac has two). `01a08b6d…`'s replay now ends as the real game did from all 22 turns tried, `019ea30a` from all 15 (study §12). Fixed on this branch at the owner's word; **`main` still loses items** in a replay import (the first fix, 3 lines in `buildSessionFromReplay`, is `main`'s to take when Feature 68 ships or if the owner asks for it there).
- From turn 11 of `01a08b6d…` the opponent's hidden cards don't line up exactly: `DojoWhatIf.filled` gives a card seen later (Milo Thatch) to an unknown hand slot where the real game inked an unknown card on turn 11. It doesn't change who wins. Left alone (the owner hasn't asked).
- Done 2026-11-03 (study §12): the owner's game v alex elliott stopped at 1 turn back; now the real game replays from 5 of the owner's turns back (12–20). Their hidden hand at import (gotcha 17), the bot's 8-target cap (gotcha 18), and two targets of one name (a challenge's target is the one with the damage the log says it had).
- **Still open from it:** ink drops (gotcha 19); a drift from turn 10 back, not looked at; TO THE RESCUE heals the first of three Nick Wildes, not the damaged one (the log's choice has the offered instance ids, not used yet). Also fixed: a turn that can't follow no longer lists "Nothing was played after this turn" (it has no control because the run stopped there).
- Done 2026-11-07 (v3.23.1, study §12): a turn the replay can't follow no longer stops the run; it's tried and compared with *What you did* as the engine plays it (the turn's check says so; the *Can't follow* badge is gone). Gotchas 20 and 21. `01a1b6f7…` (samples) replays exactly from 3 back (was 0) and finds a win 4 back; `01a1b69d…` from 4 back (was 1), no win in 5.
- **Still open from it:** `01a1b6f7…` from turn 12 back: their turn 13 misses The Leviathan (played after Retro Evolution Device's ability; not looked at).
- 2026-11-11 (study §12, branch `claude/feat-68-turn-review`): the `review` op and a measurement on 4 lost games. How big a turn's gap is (best line minus your real move) doesn't point at the turn that lost; "didn't play the search's top line" catches 4 of 5 such turns while flagging 25 of 42. Built the same day (v3.24.0): What-if skips the turns where you played the top line; same wins found with fewer turns played out (game A 3 → 1, `01a1b6f7…` 4 → 2, `01a1cbb6…` 7 → 5, no Keep going). Not built yet (proposed in the workshop): a per-turn list to branch from, and *Play from here* with the bot in their seat. A score that sees the finish (+1 lore v banishing a character near 20) would make the review sharper: A/B it with `engine-tune.mjs`. The two new replays are in `docs/samples/` (`01a1cbb6…`, `01a1c0a4…`).
- **The opponent model** is the weak point: their real moves, then the search's rest of the turn, or the search's own line when it scores more than 1 above. Watch for wins that come from the opponent not using something; the owner spots them.
- **Results don't survive a reload** (branches do). Not asked for.
- A manual article when Feature 68 ships.

Other open work:
- **Phones:** a tap opens the card drawer (`renderCardSheet`), which has no *Rules* section yet. *Suggest* is inside the ☰ drawer.
- **Not passed to the engine yet:** cards played this turn (only the count of inked cards is). There is no mid-turn bag or pending state in the Dojo.
- **Phase 1b:** make the menu's *Rules* rows actionable, with effects and target prompts run by the engine (§6 of the study).
- **Bot opponent, next:** the stronger bot (the Proposed plays search finds its line, then it plays it one move at a time; the search's lines would have to keep their engine candidates to be replayed); its mulligan from the engine (it keeps its hand now); "What would the bot do?" for your own side (§7); effects that last into your turn are dropped at the Dojo board (you're the referee there).
- **Upstream reports:** the scry bug, the speed fix, and the bot gaps (Taran, Meilin Lee, Remember Me v Retro Leviathan decking out, no candidates for plays from the discard or Bodyguard's exerted entry); to check: Merlin's Shop and Smithy's move trigger. Re-pin and rebuild when upstream fixes them; a `PATCHES` entry that stops matching tells you.
- Done 2026-11-03 (shipped as a beta): the manual section, `targets.json` ids (`tweak-rules`, `suggest`, `plays-tab`, `plays-sheet`, `score-tab`, `bot`, `bot-banner`, `what-if`, `what-if-panel`, `mini-what-if`), the version bump (v3.22.0) and the landing refresh (version only). Left: a tour step, and the landing page once it's out of beta. Keep the articles current: after a visible change, `grep -rl` the control's label in `app/help/articles/11-rules`.

## 9. Open questions for the owner

- What next: more scoring (§8), Phase 1b (playing moves through the engine), or the bot opponent?
- From the study §11: phones or desktop first, Assist or the bot first, and whether to contact upstream.
