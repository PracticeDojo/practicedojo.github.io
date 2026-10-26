# Lorcana rules engine in the Dojo: feasibility study

Research only. Nothing here is built yet. It asks whether the open-source Lorcana engine in
[TheCardGoat/tcg-engines](https://github.com/TheCardGoat/tcg-engines) can give the Dojo three new things, and how to add them without breaking what the Dojo is:

1. **Rules assist.** An opt-in mode where the Dojo knows what actions need: targets, lore, draws, triggered abilities. It does the bookkeeping the player does by hand today. When the mode is off, the Dojo is the sandbox it is now.
2. **Bot opponent.** Play against a bot, fully or step by step.
3. **Turn explorer.** Use the bot's logic to try many orders of play for a turn, score them, and show the best lines in the Multiverse.

Upstream state read: `main` at `6de59de` (public sync 2026-W41, 2026-10-09). Paths below are relative to
`submodules/lorcana/packages/lorcana/` in that repo unless they start with `app/` or `docs/` (this repo).

---

## 1. Verdict

**It's feasible, but only in the browser.** On the Cloudflare free tier the engine must run on the player's device, in a Web Worker. A Cloudflare Worker can't run it: the free plan allows 10 ms of CPU per request (§4).
Hosting the engine as static files costs nothing and fits well within the limits.

| Tier | Feasible? | What the engine gives us | What we must build | Size |
|---|---|---|---|---|
| 0. Spike | Yes, needs a build | Browser-safe TypeScript, MIT licence | Pinned build to one vendored bundle, plus measurements | S |
| 1. Rules assist | Yes. Hardest part | Legal moves, move options, why a play is disabled, effects, prompts, manual moves for sandbox edits | **The state bridge** (Dojo board ↔ engine), the card ID bridge, prompt UI | L |
| 2. Bot opponent | Yes. Cheap once tier 1 exists | `takeAutomatedActionForCurrentActor`, 5 strategies, decision traces | A turn loop, seat and perspective handling, controls | M |
| 3. Turn explorer | Yes, with limits | Candidate lists with strategy ranking and per-axis "why"; state fingerprints | **A search layer**: the bot never looks ahead. Also an evaluation function and the Multiverse output | L |

The engine is a strong base: sets 1–14 are encoded as data, about 3,440 card definitions, about 2,865 card test files, and only 6 cards flagged `missingImplementation`. The risk is not the rules. It's how the code is shipped. The packages aren't published, the repo is a weekly export of a private monorepo, the toolchain is unusual, and the API is large and still changing (§3.5). Everything below is designed around that risk: one pinned build, a narrow adapter, and contract checks in CI.

**Recommendation:** do Phase 0 (§9) before committing to anything. It's a few days and answers every number this study can only estimate. Then build tier 1's bridge properly. Tiers 2 and 3 both stand on it.

---

## 2. What the Dojo is (the constraints)

These come from `docs/personal_dojo_dev_guide.md` and `AGENTS.md`. Any design that breaks one of them is wrong.

| Constraint | Source | Consequence for the engine |
|---|---|---|
| **A sandbox, not a referee.** "Users must be allowed to make illegal moves." "Do not add strict Phase/Step state machines." | Guide §1, §5.2 | Rules mode is **opt-in, advisory, and never blocks**. Drag and drop always works. With rules on, a free move is a logged *override*, not an error. |
| **The board is one plain object, `App.state`, and timelines are full snapshots** | Guide §3, §4.2 | The Dojo state stays the single source of truth. The engine is a *shadow* we can rebuild from any snapshot (§5.3). |
| **No build step, no bundler, no framework.** A new concern gets one classic `<script src>` in `app/js/` exposing one global | AGENTS.md "Splitting rule" | The engine arrives as a **frozen, vendored bundle** built by a repo tool (like `tailwind.css` is frozen). The app gets `app/js/rules.js` → `DojoRules`. |
| **Everything runs in the browser, works offline, and works on phones** | README, guide §14 | The engine runs in a Web Worker. Its card data is cached in IndexedDB the way `allCards.json` is. Phone budgets are smaller. |
| **Session files are untrusted** | Guide §20.4 | An engine snapshot inside a session file is never trusted. It is checked against the board or thrown away (§5.6). |
| **The active player is always drawn at the bottom** | Guide §4.4 | Bot play needs a "my seat stays at the bottom" option (§7). |

The Dojo already does by hand much of what the engine automates: modifiers (Feature 61, `app/js/modifiers.js`), ink drops (Feature 60), challenge mode (Feature 62–63), mulligan mode (Feature 54), per-turn records (`state.turnActions = {drawn, inked, played, shifted, discarded, banished, quested}`), and the "you're the referee" tour (Feature 59). Rules mode should *drive* those existing pieces, not replace them.

---

## 3. What the engine is

### 3.1 The repo

| | |
|---|---|
| Licence | MIT (repo root and `submodules/lorcana/LICENSE`). Bundling is fine; ship the notice with the bundle. Card names and text remain Disney/Ravensburger property; the Dojo already displays them under the same fan-content terms. |
| Shape | Monorepo of games. Lorcana packages: `lorcana-engine` (rules, moves, effects, automation), `lorcana-cards` (definitions), `lorcana-types`, `lorcana-interaction` (UI view-model), `lorcana-simulator` (their Svelte app), `lorcana-server-adapter`. Shared code comes from `submodules/agnostic-simulator/packages/*` (`bot-core`, `shared`, `card-model`, `protocol`). |
| Distribution | **Not on npm.** Every package is `"private": true` and links to the others with `workspace:*` / `link:../../..` paths. Upstream says production services live in a private repo, and this one is a weekly export (`Public sync 2026-W41`). |
| Toolchain | Node 24, pnpm 10.33, Bun, Vite+ (`vp`), TypeScript 7 native preview. The engine's log messages come from Paraglide i18n code generated at build time (`i18n:compile`). The generated files aren't in the repo. |
| Docs | `lorcana-engine/README.md` is stale: it describes a `@tcg/core` `RuleEngine` API that no longer exists. The real entry point is `lorcana-engine/src/index.ts`. `lorcana-engine/src/automation/README.md` is accurate and good. |
| Activity | Weekly syncs. Large bug-report files (`bug_reports_pending.md` is 7,400 lines), so card bugs exist and get fixed continuously. |

### 3.2 Card coverage

- `lorcana-cards/src/cards/001` … `014`: one TypeScript file per card, for **sets 1–14**. Definitions are **pure data**: abilities are JSON-like objects, and keyword helpers such as `singer(5)` return objects. So the whole catalogue can be exported as JSON at build time.
- About 3,440 definitions and about 2,865 `*.test.ts` files. Only six cards are flagged `missingImplementation: true` (Cri-Kee, Dalmatian Puppy Tail Wagger, Sina, Amos Slade, Syndrome, Violet Parr).
- Every card has `printings[]` with `setCode: "set1"` and `collectorNumber: "2"`, plus `externalIds.lorcast` and `tcgPlayer`. **This is the bridge to the Dojo's IDs**: the Dojo already indexes LorcanaJSON cards as `"<setCode>-<number>"` (`App.setNumberIndex`, guide §7.4).
- The source is 6.4 MB of definitions plus 5.3 MB of `*.i18n.ts` translations. We'd ship English only.
- A gap to plan for: when a new set comes out, the engine will add it some weeks after LorcanaJSON does. Cards it doesn't know fall back to a vanilla definition (`fallback-card-definition.ts`). Rules mode must say so on the card ("not automated, resolve by hand") rather than get it silently wrong.

### 3.3 The engine API we'd use

Everything below runs in `LorcanaServer` (`lorcana-engine/src/lorcana-server.ts`), the authoritative engine object. It needs no network: the "server" is just the copy that holds the whole state.

| Need | Engine call | Notes |
|---|---|---|
| Build a mid-game board | `LorcanaMultiplayerTestEngine.createWithFixture(p1, p2, opts)` with `TestInitialState` (`hand / deck / play / inkwell / discard / lore / inkDrops`; each card can carry `exerted, damage, isDrying, atLocation, cardsUnder, publicFaceState`) | It's in `/testing`, but their production vs-AI mode uses it (`lorcana-simulator/.../vs-ai/human-vs-ai-orchestrator.svelte.ts`). The fields match the Dojo's `CardInstance` almost one for one. |
| Save / restore exactly | `getLorcanaServerAuthoritativeSnapshot`, `loadLorcanaServerAuthoritativeSnapshot`, `loadState` (`serialization.ts`) | Deterministic. The RNG seed lives in `state.ctx.random`. |
| What can I do? | `getAvailableMoves()` → `[{moveId, selectableCardIds}]`, then `getMoveOptions(...)` → targets, abilities, sing-together singers, selectable costs | A two-layer API built for a UI (`available-moves.ts`). |
| Why can't I? | `getPlayCardDisabledReason`, `getShiftPlayDisabledReason`, `getSingPlayDisabledReason`, `canChallenge`, `previewChallenge` | Gives "why not" for free. Good for learning. |
| Do it | `playCard / quest / challenge / putIntoInkwell / activateAbility / moveCharacterToLocation / passTurn / mulligan / singSong / playSongTogether` | Each returns a `CommandResult` with `gameEvents` and `moveLogs`. |
| Prompts | `getPendingChoice`, `getPendingEffects`, `getBagEffects`, `getEffectTargetInfo(bagId)` → `{cardCandidates, min, max}`, `resolveEffect / resolveBag / respondWith(...)` | Triggered abilities queue in a "bag", and choices wait as pending effects. |
| Sandbox edits | `manualMoveCard(card, zone, position)`, `manualExertCard`, `manualReadyCard`, `manualDryCard`, `manualSetDamage`, `manualSetLore`, `manualSetInkDrops`, `manualShuffleDeck`, `manualPassTurn` (`runtime-moves/debug/manual-moves.ts`, `ignorePriority: true`) | **Very important for us:** nearly every Dojo drag-and-drop has an exact engine counterpart, so sandbox moves can keep the engine in sync instead of throwing it away. |
| Bot | `enumerateAutomatedActionsForCurrentActor()`, `takeAutomatedActionForCurrentActor({traceSink})`, `getCurrentActorId()` | §3.4. |
| Logs | `formatMoveLog`, `getMoveLogHistory` | Readable lines for the turn's note. |

**Browser-safe.** No `fs`, `path`, `crypto` or `process` in the engine runtime. The only `node:*` imports are in tooling the bundle never reaches: `lorcana-cards/src/cards/similarity.ts`, `lorcana-engine/src/i18n/check-custom-event-usage.ts` and `testing/unit-harness/variant-coverage.ts`. The runtime dependencies are `mutative`, `nanoid`, `seedrandom`, `zod`, `@logtape/logtape` and `@tcg/bot-core` (21 KB, plus `zod`). Their own simulator runs human-vs-bot entirely in the browser.

### 3.4 The bot

From `lorcana-engine/src/automation/README.md` and `types.ts`: **"The bot is a legal move lister plus a sorter."**

1. Work out who must act: a pending chooser, the bag, first-player choice, mulligan, or priority.
2. Build candidates in the families `chooseWhoGoesFirst, alterHand, resolveBag, resolveEffect, putCardIntoInkwell, playCard, activateAbility, quest, challenge, moveCharacterToLocation`. Each candidate is a **plain, serialisable object**, and each is validated by the engine.
3. Rank them with a strategy. The default is `deck-aware-lore-race`. Others are `best-deck-aware-lore-race`, `best-deck-aware-oracle-lore-race` (sees the opponent's deck), `board-control-lore-race` and `aggressive-board-control-lore-race`. Every ranked candidate carries `heuristics[]` and `contributors[]` with an axis (`mulligan | ink | play | challenge | target`), a value and a `reason`. **That's a ready-made "why".**
4. Try them in order. After 3 failures it passes the turn, then concedes. Deadlocks are detected by state fingerprint (`computeAutomatedActionStateFingerprint`).

Limits:
- **It does no lookahead.** Each choice is greedy and one step deep. It's decent for practice. It doesn't plan a turn.
- The search caps (`targetPool 8`, `targetCombinationsPerFamily 16`, `choiceIndices 8`, `singerCombinations 16`) skip huge target pools.
- It skips a few prompt shapes and leaves a diagnostic: "name a card" with no candidates, some ordered-destination choices, and multi-choice branches.
- Speed: their 100- and 200-game bot-vs-bot benchmarks have 600 s timeouts. That suggests no more than a few seconds per game under Bun, but **it isn't measured.** Phase 0 measures it.

### 3.5 Risks in the upstream

| Risk | Mitigation |
|---|---|
| No published package, links between workspaces | Build from a **pinned commit** with a repo tool. Never depend on `main`. |
| A large, changing API (`lorcana-engine-base.ts` is 5,634 lines) | Use one adapter, about 15 engine calls, all in the worker. Contract tests in `tools/app-checks.mjs` run the adapter against the three demos on every upgrade. |
| Fixture building lives under `/testing` | It's what their own vs-AI mode uses. If it moves, the adapter changes in one place. |
| Card bugs | They're upstream's, and they get fixed. Rules mode is advisory, and the player can override anything. Report bugs upstream. |
| New sets arrive late | A vanilla fallback, with a flag on the card (§3.2). |
| The project could stall or close | We vendor a working build. The Dojo keeps working with the last good engine, and sandbox mode never depended on it. |

---

## 4. Cloudflare free tier

The site is a Worker with static assets only (`wrangler.toml`: `[assets] directory = "./"`, no `main`).

| Limit (Workers Free, checked 2026-10-26 at developers.cloudflare.com/workers/platform/limits) | Value | What it means for us |
|---|---|---|
| Static asset requests | **Free and unlimited**. They don't run a Worker. | Hosting the engine bundle and card data costs nothing. |
| Static asset file size | 25 MiB per file | The bundle (~1–3 MB) fits easily. |
| Files per version | 20,000 | No issue. |
| Worker CPU | **10 ms per request** | Engine setup alone, which parses the catalogue and builds the board, would exceed it. A bot turn or a search would exceed it many times over. **A server-side engine is out.** |
| Worker requests | 100,000 a day | Not relevant if nothing runs on a Worker. |
| Memory | 128 MB per isolate | Not relevant either. |

Paid Workers (about $5 a month, up to 5 minutes of CPU) would make a server engine *possible*, but there's no reason to have one: each player's own device is free, works offline, and grows with the number of players. Supabase (shares, accounts) is unaffected.

**What must not happen:** a design where `run_worker_first` routes asset requests through a Worker script. That would put the engine's static files under the 100k-a-day limit. Keep `.assetsignore` and `wrangler.toml` as they are, and add the vendored files under `app/`.

---

## 5. Architecture

### 5.1 Pieces

```
app/index.html (App)                         app/js/rules.js  (DojoRules, one global)
  state  ── board snapshot ───────────────▶  request/response over postMessage,
  render ◀─ moves, options, prompts ───────  request ids, timeouts, worker restart
                                                        │
                                                        ▼
                                  app/vendor/lorcana-engine/engine.worker.js   (classic worker, IIFE)
                                    adapter: hydrate · project · translate · bot · search
                                    engine:  LorcanaServer + automation (pinned build)
                                                        │  fetched lazily, cached in IndexedDB
                                                        ▼
                                  app/vendor/lorcana-engine/cards.en.json(.gz)
                                  app/vendor/lorcana-engine/LICENSE, VERSION (upstream SHA)
```

- **`tools/build-engine.mjs`** (repo tooling, never loaded by the site, like `refresh-landing.mjs`): it clones tcg-engines at the pinned SHA, installs with the upstream lockfile, compiles Paraglide, bundles `src/adapter.ts` (ours, kept in `tools/engine-adapter/`) with esbuild into **one classic-worker IIFE**, exports the catalogue as English-only JSON, and writes `VERSION`. The output is committed. CI checks that `VERSION` matches the pin and that the adapter's contract tests pass.
- **Why a worker:** the engine is synchronous and CPU-bound. In a worker the board never freezes, a stuck search can be killed (`worker.terminate()`), and a malformed snapshot can only crash the worker, never the page.
- **Loading:** nothing loads until rules mode, the bot or the explorer is first switched on. Sandbox users download nothing new.
- **Card data:** the engine only needs definitions for the cards in the match. The adapter can take just those from the cached catalogue. If size matters on phones, the catalogue can be split by set.

### 5.2 Card ID bridge

`dojo cardId (LorcanaJSON) → App.cardDB[id] → "<setCode>-<number>" → engine printing "set<N>"/"<number>" → engine definition id`

- The map is built once in the worker from the catalogue's `printings[]`. Enchanted and promo cards already resolve to their standard printing in the Dojo (guide §7.4).
- `-999` (unknown) cards become placeholders: the fixture accepts counts for hidden zones. Unknown cards in play can't be automated and are flagged.
- A check in `tools/app-checks.mjs`: every card in `app/defaults/decks/**` resolves to an engine definition. It reports the misses (new sets, typos).

### 5.3 State bridge (the core of tier 1)

**Rule: `App.state` stays canonical. The engine is a shadow that can always be rebuilt from it.**

Three operations live in the worker's adapter:

| Operation | What it does | When |
|---|---|---|
| `hydrate(board)` | Dojo snapshot → `TestInitialState` × 2 → engine. Card instance IDs = Dojo `instanceId`s, so identity is one to one. Then it sets `turn`, `activePlayer`→`otp`/priority, `turnActions.inked`→`G.inkedThisTurn`, `played`→`cardsPlayedThisTurn`, and Feature 61 modifiers (strength/willpower/lore, `turn`/`next`) → engine `stat-modifier` continuous effects, which have the same shape. | First use, after a jump in the Multiverse, after any edit the engine can't follow |
| `project(engine)` → patch | Engine zones and card meta → Dojo zones, `exerted`, `damage`, `drying`, `locationId`, `stackedCards`, `lore`, `inkDrops`, `inkReady` (count of ready ink). The App applies it through the normal mutation flow (`saveState` → mutate → `logAction` → `render`), so undo and auto-save behave as today. | After every engine move |
| `translate(sandboxAction)` | Dojo drag and drop → `manualMoveCard / manualExertCard / manualSetDamage / manualSetLore / manualShuffleDeck …` | Every sandbox action while rules mode is on |

**Staying in sync.** The engine snapshot is kept with the board as `state.engine = { sig, snap }`, where `sig = boardSig(board)` (the same idea as `markBoardKept`, guide §25.3).
- If `sig` matches the live board, the snapshot is exact and keeps everything the Dojo can't hold: bag, pending effects, "this turn" metrics, once-per-turn uses, cost reductions, and play-from-discard permissions.
- If it doesn't match (an edit that couldn't be translated, an old session, an import), we **re-hydrate**. That loses only engine-only, short-lived state. The App shows one line: *"Rules re-synced from the board. Effects lasting until end of turn were cleared."* It never blocks.

**Field map**

| Dojo (`CardInstance` / `Player`) | Engine | Round trip |
|---|---|---|
| zone arrays `deck/hand/field/inkwell/discard` (deck top = index 0) | `deck:<p>` (top = last), `hand`, `play`, `inkwell`, `discard` | Exact (reverse the deck) |
| `exerted`, `damage`, `drying` | `exerted`, `damage`, `isDrying` | Exact |
| `locationId` | `atLocation` / meta `atLocationId` | Exact |
| `stackedCards` (shift, cards under) | `cardsUnder` | Exact |
| `faceUp` in the inkwell | `publicFaceState` | Exact |
| `lore`, `inkDrops` | `G.lore`, ink drops | Exact |
| `inkTotal`, `inkReady` | derived from inkwell cards being exerted | Exact if we exert `inkTotal − inkReady` ink cards |
| `card.mods` (Feature 61) | `G.continuousEffects` stat-modifier | Strength, willpower and lore for `turn`/`next` are exact. Challenger, Resist and `always` have no manual counterpart (an upstream PR, or flag them) |
| `turnActions`, `cardsPlayedThisTurn` | `G.turnMetadata` (`inkedThisTurn`, `cardsPlayedThisTurn`, `charactersQuesting`, …) | Partial, which is enough for "already inked" and "played this turn" |
| — | bag, pending effects, once-per-turn, cost reductions | Kept only in `state.engine.snap` |

### 5.4 Prompts

When the engine waits for a choice (a target, "you may", choose one, scry destinations, name a card), the worker returns a prompt descriptor (`getPendingChoice` + `getEffectTargetInfo`). The App shows it the way challenge mode already does: valid cards glow, a tap or click picks, and a small bar shows *Choose 1 · Skip · Do it by hand*. **Do it by hand** drops the pending effect (by re-hydrating) and gives the board back to the sandbox. The sandbox always wins.

### 5.5 Logs and notes

`formatMoveLog` lines feed `logAction`. With rules on, the turn note's recap and the card sections (Features 31/34/35) fill in automatically from engine events: draws, lore gained, banishes and challenges. The Duels.ink importers already build these recaps from logs, so the recap code exists.

### 5.6 Sessions and trust

- `state.engine` is optional. Old files don't have it and old Dojo versions ignore it. It's stored gzipped like the rest of the state, and only for the live board and for nodes made in rules mode. Bot and explorer snapshots carry no undo stack.
- **On load,** `sanitizeSessionData` never passes `state.engine.snap` to the engine as it is. The worker loads it inside `try`, re-projects it, and keeps it only if the projection's `sig` equals the board's. Otherwise it drops it and re-hydrates. A crafted snapshot can at most crash the worker, which `DojoRules` restarts.

---

## 6. Tier 1: rules assist

**The switch:** top bar *Rules: Off · Assist*. It's remembered per session, and Off is the default.

With **Assist** on:
- **Legal actions light up.** Card verbs come from `getAvailableMoves`: play, shift onto…, sing with…, ink, quest, challenge…, move to…, abilities. Disabled verbs show the engine's reason ("Not enough ink: 4 of 5", "Drying", "Bodyguard must be challenged first").
- **The engine carries out effects:** "when you play" triggers, draws, lore, damage, banishes, ready and exert. Start of turn (ready, set, location lore, draw) and end of turn (expiring effects) happen by themselves. Twenty lore wins.
- **Prompts** pick targets on the board (§5.4).
- **Challenge mode** shows `previewChallenge` (who's banished) before you commit.
- **Free moves stay free.** Drag and drop works as now. It's translated into a manual move and logged as *(override)*.
- **Off** is exactly today's Dojo.

**Steps** (each one shippable on its own):
1. *Read-only:* hydrate, then highlight legal moves and show the "why not" reasons. Nothing executes. This proves the bridge with no risk to the board.
2. *Execute simple moves:* ink, quest, challenge, vanilla play, pass. Project the result back.
3. *Effects and prompts:* the bag, pending choices, the target UI.
4. *Sandbox translation* and `state.engine` persistence. Re-hydration notice.
5. *Polish:* the turn note recap from engine events, phone layout of the prompt bar, the manual (`app/help/`) and a tour.

**Done when:** the three demos (`app/defaults/demos/*`) round-trip through hydrate → project with an identical `boardSig`. A scripted Set 14 game played in Assist matches a bot-vs-bot reference. Turning Assist off at any point leaves a normal sandbox board.

---

## 7. Tier 2: bot opponent

Most of the work is UI. The engine side is a loop in the worker:

```
while (actor === botSeat && !gameOver):
    r = takeAutomatedActionForCurrentActor({ traceSink })
    post { patch: project(engine), log: formatMoveLog(r), why: trace.contributors }
```

- **Seats:** from the home screen or the top bar, *Bot plays: P2 / P1 / both / none*. Strategy picker; the default is `deck-aware-lore-race`.
- **Pace:** Auto (one action every 250–1400 ms, matching upstream's `AI_SPEED_MS`) or **Step** (*Next action*), with the bot's choice and its "why" shown before it's applied. That's the "semi-bot".
- **One action, one `saveState`.** Undo steps back through the bot's turn one action at a time. The end-of-turn auto-save makes the usual Multiverse node, so **you can branch from any bot turn** and replay it differently. This is where the Dojo is stronger than every simulator.
- **The bot answers its own prompts during your turn** (for example "each opponent chooses one of their characters…").
- **Perspective:** the Dojo draws the active player at the bottom (guide §4.4). Bot mode needs *keep my seat at the bottom*, which is a small `render()` change.
- **Hidden information:** the bot plans from a player-scoped projection (`getAutomatedPlanningBoardForPlayer`). With the default `fair` strategies it doesn't see your hand or your deck order, even though the Dojo board shows both. `oracle` is opt-in, for a stronger bot that cheats.
- **Taking over:** at any moment the player can grab the board (sandbox edit, override). The bot carries on from the new board after a re-hydrate.
- **Hint for your own side:** *What would the bot do?* shows its top three candidates with reasons, using the same API.

**Done when:** a full bot-vs-bot game of the two Set 14 default decks runs in the browser to a winner, with no deadlock and one node per turn. Pausing, undoing and branching mid-turn work.

---

## 8. Tier 3: turn explorer

The bot doesn't search, so this tier is **ours**. It's built on two things the engine gives us: serialisable candidates with a strategy ranking, and cheap, deterministic snapshot and restore.

**The search (in the worker, with a time budget):**
- **Scope:** the rest of the active player's turn, starting from the current board.
- **Moves:** `enumerateAutomatedActionsForCurrentActor()` returns legal candidates already ranked. A **beam search** keeps the best *k* partial lines (k = 8–16), using the strategy rank to order moves.
- **Transpositions:** the order of ink, quests and independent plays often doesn't matter. Lines are deduplicated by `computeAutomatedActionStateFingerprint`, which removes most of the combinatorial blow-up.
- **End of a line:** the line ends at `passTurn`, at depth or node limits, or at the time limit (desktop 2 s, phone 1 s, shown with progress and a Stop button).
- **Scoring each final board** (one tunable function, shown to the user):
  - lore difference and distance to 20;
  - lore threat on board (ready characters' lore next turn);
  - board strength, and threats removed or exposed (characters that survive a likely challenge);
  - cards in hand and ink, with tempo.
- **Optional "reply" check:** play the opponent's next turn with the greedy bot, then score again. Two plies, with a greedy opponent model. It's slower and switched off by default.
- **Unknown draws:** if the deck order is "as set" in the Dojo, the line is deterministic. Otherwise it's sampled over N shuffles (Monte Carlo), and the result is shown as an average with a spread.

**The output (where the Dojo is unique):**
- The **top three to five lines become ghost branches in the Multiverse.** Each is a full Dojo snapshot, the end-of-turn board, with:
  - a name: "Line 2 · +4 lore · score 31";
  - a comment: the action list ("Ink Pua → Play Mickey (shift) → Quest ×3 → Challenge Gaston with Beast");
  - the "why" from the strategy contributors.
- Opening a ghost makes it a real node. The lore race (Feature 65) can draw the expected lore. Nothing new to learn in the UI: it's the Multiverse the player already uses.
- **Compare:** the line the player actually played gets the same score next to the engine's lines. That's a review tool for past games and Duels.ink imports.

**Honest limits (put them in the manual):**
- It's an idea generator and sparring partner, not a solver.
- The scoring is hand-tuned, the opponent model is greedy, and there's no reasoning about hidden information.
- The beam can miss deep combos the strategy ranks low. Raising *k* helps, and costs time.

**Cost and budget.** One node costs one restore, one apply, one fingerprint, and a light enumeration of candidates. If one node is about 2–10 ms on a desktop (to be measured in Phase 0), that's 100–500 nodes per second per worker. A typical turn has 10–40 candidates at the root and 4–8 steps, and about 1,000–3,000 nodes after deduplication. That's seconds on a desktop, so we use `navigator.hardwareConcurrency − 1` workers and split the root moves between them. Phones get a smaller *k*, one worker and no reply check.

**Done when:** on 10 saved positions from the demos, the explorer finds the line a strong player picked within its top three, in under 3 s on a desktop.

---

## 9. Roadmap

Each phase is one or more entries in `docs/features.md` and ends in a decision.

| Phase | Work | Gate (measured, not guessed) |
|---|---|---|
| **0 · Spike** (days) | `tools/build-engine.mjs` at a pinned SHA. A worker that hydrates the Set 14 demo and lists legal moves. A bot-vs-bot game in the worker. A timing page. | Bundle gzip ≤ 600 KB and cards gzip ≤ 1.5 MB, or split by set. Cold start ≤ 1.5 s desktop and ≤ 4 s mid-range phone. `getAvailableMoves` ≤ 20 ms. A bot turn ≤ 300 ms. One search node ≤ 10 ms. The demo's hydrate → project is lossless. **If any gate fails badly, stop and rethink.** |
| **1a · Bridge, read-only** | Card and state bridge, highlights, "why not" | The demos round-trip |
| **1b · Assist** | Execute, effects, prompts, translation, persistence | §6 done |
| **2 · Bot** | Seats, loop, Step mode, perspective, hint | §7 done |
| **3 · Explorer** | Search, scoring, ghost branches | §8 done |
| **Upkeep** | Re-pin when upstream fixes card bugs or adds a set. Contract tests guard each re-pin. | — |

Tiers 2 and 3 only need the read side of tier 1 (hydrate and project) plus the engine's own moves. **If tier 1 Assist ends up looking less valuable than the bot, phase 2 can come straight after 1a.**

---

## 10. Alternatives considered

| Option | Why not |
|---|---|
| Write our own rules engine | About 1,400 complex cards (`lorcana-cards/src/cards/COMPLEX_CARDS.md`) and years of upstream fixes. No. |
| Run the engine on a Cloudflare Worker or Durable Object | Not possible on the free plan's 10 ms CPU. On paid it's possible, but it costs money and only adds latency and an outage point (§4). |
| Embed their simulator (tcg.online) | No access to its state, no Multiverse, no sandbox. And its services are private. |
| Load the engine source in the page as ES modules from a CDN | It's TypeScript with build-time codegen and workspace links. It has to be built. |
| Keep the engine as the source of truth while rules are on | It breaks the sandbox and the full-snapshot timelines. The shadow model (§5.3) keeps both. |

---

## 11. Open questions for the owner

1. Should rules **Assist** be offered on phones from the start, or desktop first (because of the download size and CPU)?
2. Are you happy to **vendor a built third-party bundle** in `app/vendor/`, about 1–3 MB, as a frozen artifact like `tailwind.css`?
3. Should we **contribute upstream**, for example by publishing the engine as an npm package and adding manual moves for Challenger and Resist modifiers? Reaching out to TheCardGoat early would lower the API risk a lot.
4. For the bot: should *you* see the bot's hand, or should it be hidden in bot mode (`opponentHandRevealed` off and locked)? The bot can't see yours either way (§7).
5. Which comes first after the spike: **Assist** (better practice for everyone) or the **bot** (the bigger "wow")?
