# Handover: rules engine (Feature 68)

For the next agent picking up Feature 68. Read this first, then `AGENTS.md` and `docs/RSC-lorcana-engine.md`. The study is the plan; its §12 is the log of what was built and measured, newest first. Written 2026-10-27, updated 2026-10-28 after the scoring plan (study §8.1).

## 1. Ground rules

- **Branch:** all of this lives on the long-lived branch **`feat/68-rules-engine`**. Commit and push to it directly. Never open a PR from it into `main`; it ships only when the owner says so. Merge `main` into it when `main` moves (no rebase, no force-push). There are no version bumps, landing-page refreshes or manual articles until it ships (AGENTS.md, *Long-lived branch*).
- **The AGENTS.md rule isn't on `main` yet.** It's on `claude/docs-lorcana-engine-feasibility` (head `2c10864`, docs only: the study, the Feature 68 entry, the AGENTS.md section). Until it's merged, a session that starts from `main` won't see it. The owner was asked whether to open that PR and hasn't answered; ask again.
- **The sandbox comes first.** The Dojo is a sandbox where the player is the referee. Rules mode is opt-in (Tweaks → *Rules engine: Off · Assist*), never blocks a move, and Off must leave today's Dojo untouched.
- **Owner preferences this session:**
  - they asked for the `ponytail` skill (smallest complete change) and the `caveman` skill (short answers) at the start;
  - they want work measured, not guessed: numbers, game-by-game comparisons, screenshots;
  - they test with real game files (a reported bug arrived as a `.dojo.json.gz` and a screenshot).

## 2. What exists

| Piece | Where | What it does |
|---|---|---|
| Engine build | `tools/build-engine.mjs` | Sparse-clones TheCardGoat/tcg-engines at the pinned commit `6de59de` (MIT) into `$DOJO_ENGINE_CACHE` (default `<tmp>/dojo-engine-build`), installs the runtime packages, and bundles with esbuild into `app/vendor/lorcana-engine/` (`engine.worker.js` 249 KB gzip, `cards.json` 517 KB gzip, `VERSION`, `LICENSE`). `--dev` builds unminified for profiling (don't commit that). Upstream edits are in its `PATCHES` list; the build fails if one no longer applies. |
| Worker adapter | `tools/engine-adapter/worker.ts` | Bundled into the worker. Ops: `init`, `names`, `analyze`, `explore`, `selfPlay`, `botGame`, `roundTrip`, `searchCost`. Runs as a classic Web Worker, or in Node as a plain script that sets `globalThis.DojoEngine`. |
| Bridge | `app/js/rules.js` (`DojoRules`) | `boardFromState` turns a Dojo state into the worker's board, keyed by card. `analyze` and `explore` map places back to instance ids. `stateForLine` turns a line's end into a Dojo state; it reuses the same card objects and throws rather than lose a card. `actText` and `whyText` give the copy. `score` reads the board as it stands, with each card's share. Also the worker client. |
| What-if | `app/js/whatif.js` (`DojoWhatIf`) | Branch `claude/feat-68-what-if`. Reads each turn's real moves from a replay's log at import (`movesFromReplay`, kept on the node as `real`), fills a board's unknown cards from later boards (`filled`), and runs the levels back from the loss (`run`), calling the worker's `whatIf` op through `DojoRules.whatIf`. The UI is a block in the Multiverse's panel (`#tp-whatif`): App's `openWhatIf`, `runWhatIf`, `whatIfBranch` (each line as a branch the moment it's played, ending on a victory node), `whatIfShow`, `renderWhatIf` and its meter. |
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
cd practicedojo.github.io && git checkout feat/68-rules-engine
export DOJO_ENGINE_CACHE=<scratch>/engine-cache       # anywhere outside the repo
node tools/build-engine.mjs                           # after any change to tools/engine-adapter/*
node tools/engine-spike.mjs --games 1                 # bridge check, bot games, demo round trips, search cost
node tools/app-checks.mjs                             # 30 headless checks (CI runs them)
node tools/help.mjs --check && node tools/refresh-landing.mjs --check
node tools/engine-tune.mjs --compare '[{"exposed":0.5},{"hand":0.2}]' --holdout 256 --tag check5   # A/B changes, ~8 min each + 8 for the start
```

- The vendored files in `app/vendor/lorcana-engine/` are committed and must be the **minified** build.
- `engine-spike.mjs` downloads LorcanaJSON (`allCards.json`) into `$DOJO_ENGINE_CACHE` the first time.
- **Browser checks** go through `.claude/skills/dojo-screenshots/shoot.mjs --steps <module>`.
  - In a steps module, turn Assist on with `App.loadTweaks()`, set `t.rules = 'assist'`, then `saveTweaks` and `applyTweaks`. Keep `t.theme = document.documentElement.dataset.theme`, or the theme resets.
  - Wait for `App.rulesView`, then call `App.suggestPlays()` and wait for `App._plays.result`.
  - To load a session file: first wait until the home screen is up and the card DB is loaded, then `App._applySessionData(data); App.leaveSetup(); App.render()`. Otherwise start-up puts the home screen back.
- In Node, load the bundle by setting `globalThis.window = globalThis`, then `require('app/vendor/lorcana-engine/engine.worker.js')` and `require('app/js/rules.js')`. `DojoEngine.<op>(args)` then runs synchronously.

## 6. Measured so far (details in §12)

- Phase 0: all gates pass except search on busy boards. Cold start 105 ms. Legal moves 2.3 ms. A bot turn about 50–110 ms. A search node 5–6 ms (22 ms on a busy board).
- Every board of the Set 14 demo (76) round-trips identically. All proposed lines (206–208) map back to Dojo boards.
- Card bridge: 3,451 of 3,452 cards from sets 1–14 reach the engine card of the same name (the last differs only in punctuation and is found by number).
- Explorer against the engine's bot: 34% before bot finishing, about 52–59% after, 64% with the tuned weights. On 256 fresh games each, tuned v starting weights: 163 v 150 wins; games only one side won, 18 v 5; z = 2.71.
- The scoring plan (2026-10-28, tuner at 60 nodes a search): reply, race and threat took it from 65% to 70% on 512 fresh games; games only one side won, 41 v 15; z = 3.47. A full re-tune afterwards fitted its 64 games and lost on 256 fresh ones (176 v 181), so the weights stayed.

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
10. **Trigger restrictions don't read the turn owner.** "During your turn" works out the turn from who went first (`status.otp`) and `G.turnsCompletedByPlayer`. `hydrate` sets both to agree with the board's active player; a loaded board without them broke player one's triggers after the engine's first turn change.

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

**What-if** (spike done 2026-10-30, study §12; branch `claude/feat-68-what-if`): load a lost game and look for a line that wins, going back one of your turns at a time (up to 5), their turns replaying what they really did unless the score finds clearly better. The worker op `whatIf` there is a SPIKE (no app code yet); the experiment's page script lives outside the repo. First cut built 2026-10-31 (study §12): Multiverse → What-if, needs a game imported from a Duels.ink replay. Next, if the owner wants: games from text logs (their parsed events could give the real moves), unfinished games (best lore race 2 turns past the end), and merging the branch into `feat/68-rules-engine`.

Other open work:
- **Phones:** a tap opens the card drawer (`renderCardSheet`), which has no *Rules* section yet. *Suggest* is inside the ☰ drawer.
- **Not passed to the engine yet:** cards played this turn (only the count of inked cards is). There is no mid-turn bag or pending state in the Dojo.
- **Phase 1b:** make the menu's *Rules* rows actionable, with effects and target prompts run by the engine (§6 of the study).
- **Bot opponent, next:** the stronger bot (the Proposed plays search finds its line, then it plays it one move at a time; the search's lines would have to keep their engine candidates to be replayed); its mulligan from the engine (it keeps its hand now); "What would the bot do?" for your own side (§7); effects that last into your turn are dropped at the Dojo board (you're the referee there).
- **Upstream reports:** the scry bug, the speed fix, and the bot gaps (Taran, Meilin Lee, Remember Me v Retro Leviathan decking out, no candidates for plays from the discard or Bodyguard's exerted entry); to check: Merlin's Shop and Smithy's move trigger. Re-pin and rebuild when upstream fixes them; a `PATCHES` entry that stops matching tells you.
- **When it ships:** a manual article and tour step, `targets.json` ids, a version bump, and a landing refresh.

## 9. Open questions for the owner

- Should the docs PR (`claude/docs-lorcana-engine-feasibility` → `main`) be opened, so every session sees the branch rule?
- What next: more scoring (§8), Phase 1b (playing moves through the engine), or the bot opponent?
- From the study §11: phones or desktop first, Assist or the bot first, and whether to contact upstream.
