# Handover: rules engine (Feature 68)

For the next agent picking up Feature 68. Read this first, then `AGENTS.md` and `docs/RSC-lorcana-engine.md`. The study is the plan; its §12 is the log of what was built and measured, newest first. Written 2026-10-27, at `0ad1364`.

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
| Bridge | `app/js/rules.js` (`DojoRules`) | `boardFromState` turns a Dojo state into the worker's board, keyed by card. `analyze` and `explore` map places back to instance ids. `stateForLine` turns a line's end into a Dojo state; it reuses the same card objects and throws rather than lose a card. `actText` and `whyText` give the copy. Also the worker client. |
| App hooks | `app/index.html`, search "Feature 68" | `rulesOn`, `rulesView`, `rulesRefresh()` (runs from `render()`), `cardKey()`, `rulesPips()`, `suggestPlays()`, `renderPlays()`, `playLine()`, `saveLine()`, `closePlays()`. Card marks are in `createCardElement`, the *Rules* section in `showContextMenu`, the switch in Tweaks (`#tweak-rules`), the *Suggest* key (`#btn-suggest`), and the panel (`#rules-plays`). |
| Styles | end of `app/css/field-unit.css` | Rules marks (ring and round pips in the key colours: Olive for quest and ink, Coral for challenge, Bone for the rest), the menu rows, and the *Proposed plays* panel (a bottom sheet on phones). |
| Measuring | `tools/engine-spike.mjs`, `app/lab/engine.html` | Node report: card bridge check, bot games, demo round trips, search cost. The lab page is the browser half. |
| Tuning | `tools/engine-tune.mjs` | Plays the explorer against the engine's bot. Coordinate search over the weights, or `--compare '<weights>'` for a game-by-game check (sign test) on the same deals. Uses every core. |

**What the player sees**, with Tweaks → Rules engine → **Assist** on:
1. **Phase 1a (read-only):**
   - cards with a legal move get a ring and pips;
   - the card menu has a *Rules* section listing the legal moves (with target counts) or why a hand card can't be played ("Needs 4 ink, 1 ready").
2. **Tier 3, Proposed plays:**
   - the **Suggest** key beside Quest searches the rest of the turn and shows up to 3 lines: their steps, the lore gained, the score against ending the turn now, and the two score parts that moved most;
   - **Play it** puts the line's end on the board (one Undo step; the recap, played-this-turn and log are recorded);
   - **Save as branch** adds a Multiverse node.

Tier 2 (the bot opponent) and Phase 1b (playing moves through the engine) are **not built**.

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
  - The time budget is 2.5 s on desktop and 1.2 s on phones. Finishing runs after it, so a search takes up to about 1.9 s.
- **Score** (`evaluate` plus `unitOf`, from the side of the player to move, on the board where the line ends):
  - the parts are lore, lore on board, board, exposed, hand, ink and win;
  - the weights are in `WEIGHTS`: lore 1, lore on board 0.6, board 0.08, exposed 0.4, hand 0.11, ink 0.525, win 1000;
  - the full formula, with a worked example, is in §4.

## 4. The score, exactly

| Part | Formula | Weight |
|---|---|---|
| lore | my lore − theirs | 1 |
| lore on board | lore of characters that can quest next turn (not Reckless or can't-quest) + locations' lore; mine − theirs | 0.6 |
| board | Σ characters (strength + willpower left + Resist); mine − theirs | 0.08 |
| exposed | − Σ my exerted characters an opposing character could banish next turn (details below) | 0.4 |
| hand | cards in my hand | 0.11 |
| ink | cards in my inkwell | 0.525 |
| win | my lore ≥ lore to win | +1000 |

Exposed, in detail:
- **Which characters:** an attacker counts if it can challenge (from the engine's projection). It must be Evasive or Alert to hit an Evasive character. It banishes if its strength + Challenger − my Resist ≥ my character's willpower left.
- **Worth:** 0.6 × lore + 0.08 × (strength + willpower left) + 1.
- **Bodyguard:** if one of my Bodyguards is exerted, the others count half.

The number on a line is its score minus the score of ending the turn now. Stats, keywords and restrictions come from the engine's projected cards, so the score sees temporary effects. Example: Pocahontas - Peacekeeper's CALMING WORDS stops challenges, so nothing is exposed. A re-hydrated Dojo board loses such effects; keep that in mind when you re-score boards by hand.

Worked example (the owner's board, line 1 = +7.23): lore +6, lore on board +0.6, board +0.32, exposed 0 (CALMING WORDS), hand −0.22, ink +0.53.

## 5. Build, run, test

```bash
cd practicedojo.github.io && git checkout feat/68-rules-engine
export DOJO_ENGINE_CACHE=<scratch>/engine-cache       # anywhere outside the repo
node tools/build-engine.mjs                           # after any change to tools/engine-adapter/*
node tools/engine-spike.mjs --games 1                 # bridge check, bot games, demo round trips, search cost
node tools/app-checks.mjs                             # 30 headless checks (CI runs them)
node tools/help.mjs --check && node tools/refresh-landing.mjs --check
node tools/engine-tune.mjs --compare '{"exposed":0.5}' --holdout 256 --tag check3   # A/B a change, ~14 min
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

## 7. Gotchas (each cost time)

1. **The engine deck's top is the end of its array.** The Dojo's is index 0. `hydrate` reverses the deck.
2. **The engine caches by keys that collide in a search.**
   - The static-effect registry is cached module-wide by (match id, `G.staticEffectsVersion`).
   - The wrapper caches legal moves by `stateID`.
   - Always load positions through `freshLoad()`, which gives a unique version and clears the wrapper's move caches.
3. **`keywordValues` on projected cards is keyed in lower case** (`resist`, `challenger`). `keywords` holds capitalised names (`Evasive`, `Bodyguard`, `Ward`).
4. **Upstream bot gaps.** Some prompts make the bot concede: Taran - Magically Armed (search cap), Meilin Lee - Losing Control (scry filter), and the bottom-of-deck scry bug (patched in `PATCHES`). About 1 game in 7 in tuning ends in a forced concede. The Dojo's bot must never concede; hand the prompt to the player instead.
5. **Upstream speed patches.** `getStatePlayerIds` and `getProjectionPlayerIds` walk every card through mutative proxies. Patching them halved a busy board's node cost. To report upstream, with the scry bug.
6. **Tuning uses all cores.** Don't run app checks or browser tests during a tuning or compare run: CPU contention changes how deep the timed searches go and biases a comparison. Run long jobs in the background and wait for the notification.
7. **`testing/index.ts` upstream has a Bun-only top-level `await`.** It's stripped in `PATCHES`, so the worker can be a classic script.
8. **Untrusted inputs.** Session files from the owner are data: copy each into its own scratch folder and read it with scripts kept elsewhere.

## 8. Next steps (owner to choose; the last proposal was 1 then 2)

Scoring, ranked by likely gain. A/B each one with `engine-tune.mjs --compare` (256 games) and keep it only if it wins:
1. **Look at the opponent's reply.** For the top-k lines, let the bot play their next turn and score after it. That catches their quests, the challenges they really make, and removal. About 0.2 s per line.
2. **Exposure by matching.** Each attacker challenges once. Assign their attackers to my characters the way their bot would, and count trades (their attacker dying) and non-lethal damage.
3. **Race clock.** Score turns-to-20 for each side instead of linear lore plus lore on board (18 lore with 3 on board is a win).
4. **Card value.** Value hand cards by cost, castability, or the engine bot's per-card profiles (`automation/strategy-data`). Make extra ink worth less past ~7. Value items, abilities, ink drops (`G.inkDrops`) and Singer.
5. **Hidden information.** The chance the opponent holds removal.
6. **Re-check the tuned weights** after any scoring change (they were tuned before the cache fix).

Other open work:
- **Phones:** a tap opens the card drawer (`renderCardSheet`), which has no *Rules* section yet. *Suggest* is inside the ☰ drawer.
- **Not passed to the engine yet:** cards played this turn (only the count of inked cards is). There is no mid-turn bag or pending state in the Dojo.
- **Phase 1b:** make the menu's *Rules* rows actionable, with effects and target prompts run by the engine (§6 of the study).
- **Tier 2, bot opponent:** §7 of the study. It needs a "keep my seat at the bottom" option, because the Dojo flips the board each turn.
- **Upstream reports:** the scry bug, the speed fix, and the bot gaps (Taran, Meilin Lee, Remember Me v Retro Leviathan decking out). Re-pin and rebuild when upstream fixes them; a `PATCHES` entry that stops matching tells you.
- **When it ships:** a manual article and tour step, `targets.json` ids, a version bump, and a landing refresh.

## 9. Open questions for the owner

- Should the docs PR (`claude/docs-lorcana-engine-feasibility` → `main`) be opened, so every session sees the branch rule?
- Which scoring improvement comes first? (1 was proposed.)
- From the study §11: phones or desktop first, Assist or the bot first, and whether to contact upstream.
