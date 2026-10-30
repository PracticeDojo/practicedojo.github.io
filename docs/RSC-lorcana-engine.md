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
- Speed (measured in Phase 0, §12): in a browser worker a bot action takes about 8–16 ms and a bot turn about 50–110 ms. A whole game takes 0.6–2 s.
- Quality (Phase 0, §12): in 3 of 8 bot-vs-bot games, the bot hit a prompt it couldn't answer and conceded.

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

`dojo cardId (LorcanaJSON) → App.cardDB[id] → key "<setCode>-<number>|<full name>" → engine definition with that name (the number picks among same-named entries, and is the fallback)`. *Corrected 2026-10-27: by number alone it named the wrong card; promo printings reuse main-set numbers in the engine data (§12).*

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

**Cost and budget.** One node costs one restore, one apply, one fingerprint, and a light enumeration of candidates. Measured in Phase 0 (§12): one node takes 5–6 ms on a desktop in a quiet position, which is 160–180 nodes per second per worker. On a busy board with 18 candidates it takes about 22 ms, or 45 per second. With 4× CPU throttling as a phone stand-in, it's 4–5 times slower. A typical turn has 10–40 candidates at the root and 4–8 steps, and about 1,000–3,000 nodes after deduplication. That's seconds on a desktop, so we use `navigator.hardwareConcurrency − 1` workers and split the root moves between them. Phones get a smaller *k*, one worker and no reply check.

**Done when:** on 10 saved positions from the demos, the explorer finds the line a strong player picked within its top three, in under 3 s on a desktop.

### 8.1 Scoring plan (2026-10-27)

**Result (2026-10-28, §12):** *reply*, *race* and *threat* kept; *lethal*, *inkLate* and *cost* dropped.

Where the score goes next. It takes the principles of *Mastering Competitive Lorcana* (DarkWings | Chupa, Metafy), a guide the owner shared, and asks of each: does the score already see it, and if not, what term would? The guide's ideas are paraphrased here; the guide isn't copied into the repo. Results are in §12.

**The terms we have, checked against the guide**

| Term (weight) | Guide principle | Verdict |
|---|---|---|
| lore (1) | Lore is the only way to win. | Keep; it sets the scale. But it's linear: 2 lore at 4–4 counts the same as at 18–17. → *lethal*, *race*. |
| lore on board (0.6) | Pressure: what my board will quest for. Threat assessment: what theirs will. | One weight for both sides, but a defender's denied lore can be worth more than lore gained. → *threat* for theirs. |
| board (0.08) | Card value: a character is worth what it does before it's answered. | Keep. Stats only, so a cheap answer to an expensive card looks even. → *cost*. |
| exposed (0.4) | Trading: don't hand them free trades. | Keep. It guesses their challenges: any attacker that could banish counts, once for every target. → *reply* asks their bot instead. |
| hand (0.11) | Card advantage: usable cards. | Keep. Only my hand counts; theirs rarely changes in my turn. Hand quality later. |
| ink (0.525) | Resource management: ink early, but a card inked is a card lost. | Linear forever. Past the top of the curve, more ink is a card lost for little. → *inkLate*. |
| win (1000) | — | Keep. Now also −1000 when they reach the lore to win (only possible with *reply*). |

**New terms.** Each is a weight in `WEIGHTS`; at its "off" value the score is exactly as before.

| Term | Off | Guide principle | What it does |
|---|---|---|---|
| reply | 0 | "If I play this, what does my opponent have to do next?" Threat assessment; the board after the trade. | For the best 6 distinct lines (and ending the turn now), the engine's bot plays their next turn with the cards they have in play: quests, challenges, abilities, moves. Never their hand, which the player can't see. The line is scored again after it, without *exposed* (their challenges have happened). 0 = off, 1 = the score after their turn. About 0.3 s more per search. |
| lethal | 0 | The race: "am I winning, or do I need to slow it down?" One character can be all that stands between them and 20. | Minus `lethal` when their lore on board reaches the lore they still need: they quest first, so they win next turn unless it's dealt with now. |
| race | 0 | Role: aggressor or defender, set by who wins if nothing changes. | Turns each side needs to the lore to win at the rate in play (capped at 9), theirs minus mine. |
| threat | 0.6 | Defender: lore you deny can matter more than lore you gain. | Their lore on board gets its own weight. |
| cost | 0 | Tempo and trades: what each side invested; a cheap answer to an expensive threat. | Ink cost of the cards in play, mine minus theirs. It counts items and locations, which *board* misses. |
| inkLate | 1 | Resource management: don't ink what you'll miss. | Ink past 7 counts × `inkLate`. |

**Later, if these leave room**
- **Exposure by matching** (handover): each of their characters challenges once, and trades count. Only if *reply* loses, since it covers the same ground.
- **Ahead or behind** (the guide's risk chapter): protect a lead (more weight on *exposed*), take risks when behind (less). Needs *race* to tell which.
- **Threat by role:** the bot's deck profiles tag some cards `mustAnswerThreat`, `drawEngine` or `tempoThreat` (`automation/deck-profile.ts`). Their cards with those tags could count more. The tags are hand-curated, for a few dozen cards.
- **Hand quality:** cards castable next turn count more; their hand counts too (discard).
- **Hidden information:** the chance they hold removal ("play around it").

**Not the score's job**
- **Sequencing** (draw before you ink, plan the whole turn first) belongs to the search. The beam already tries orders, and merged positions make the order free. The steps could list inking last when it doesn't matter.
- **Mulligans** are the bot's; the Dojo doesn't propose them.

**How each change is kept or dropped**
- The tuner now ends a search at a node cap (60, about what 600 ms covered) instead of the clock, so the same weights replay the same games. Before, two runs of the same weights disagreed on about 1 game in 16; now they agree on all. A game one side wins and the other loses is then down to the change.
- `--compare` takes a list and plays the start once. **Screening:** each change alone against today's weights, on the same 256 fresh games.
- **Keep** a change when the sign test on the games only one side won gives z ≥ 1.96 and the lore margin doesn't drop. Between 1 and 1.96, play 256 more on another tag and pool them. Otherwise drop it and take its code out.
- Then the kept changes together against today's weights, on another fresh tag. Then re-run the coordinate search over all the weights (handover, next steps).
- The caveats of §12 stay. This measures beating the engine's bot, which stands in for good advice. *Reply* uses that same bot as the opponent model, so it may look better in tuning than against people.

---

## 9. Roadmap

Each phase is one or more entries in `docs/features.md` and ends in a decision.

| Phase | Work | Gate (measured, not guessed) |
|---|---|---|
| **0 · Spike** (days). **Done 2026-10-26: go** (§12) | `tools/build-engine.mjs` at a pinned SHA. A worker that hydrates the Set 14 demo and lists legal moves. A bot-vs-bot game in the worker. A timing page. | Bundle gzip ≤ 600 KB and cards gzip ≤ 1.5 MB, or split by set. Cold start ≤ 1.5 s desktop and ≤ 4 s mid-range phone. `getAvailableMoves` ≤ 20 ms. A bot turn ≤ 300 ms. One search node ≤ 10 ms. The demo's hydrate → project is lossless. **If any gate fails badly, stop and rethink.** |
| **1a · Bridge, read-only**. **First cut 2026-10-26** (§12) | Card and state bridge, highlights, "why not" | The demos round-trip |
| **1b · Assist** | Execute, effects, prompts, translation, persistence | §6 done |
| **2 · Bot**. **First cut 2026-10-30** (§12), on `claude/feat-68-bot-opponent` | Seats, loop, Step mode, perspective, hint | §7 done |
| **3 · Explorer**. **First cut 2026-10-26: proposed plays** (§12), ahead of 1b at the owner's call | Search, scoring, ghost branches | §8 done |
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

---

## 12. Spike log

Measured results, newest first. The work itself lives on `feat/68-rules-engine` (AGENTS.md, *Long-lived branch*).

### 2026-10-30 · Tier 2, first cut: the bot opponent

Built on `claude/feat-68-bot-opponent` (cut from `feat/68-rules-engine`), as the spike below said it could be.

- **The key:** top bar → **Bot** (next to Challenge, while the rules engine is on) opens a menu: *Bot plays* Off · P1 · P2, *Pace* Auto · Step, *Speed* Slow · Normal · Fast. On, the key reads "Bot P2" and a banner under the top bar shows the bot's last move ("Play Strength of a Raging Fire → Prince Phillip"), Auto / Step, Pause or Next, and **Take over**. P switches Auto and Step; N plays its next move.
- **One move at a time:** each move, and everything it sets off, is one Undo step, logged as "Bot: …", and counted in the turn's recap. Undo pauses the bot.
- **The engine keeps the game for the bot's turn** (worker ops `botStart`, `botStep`, `botChoose`, `botPass`) and the board shows each finished move. A board changed since its last move (your edit, Undo, a loaded node) is read again first.
- **The engine runs the turn changes** both ways (`endTurn({ engine })` takes its board instead of the sandbox's own ready and draw), so start- and end-of-turn abilities happen. The exception is the second player's first turn while their opening hand waits: the sandbox does that one. Every turn still gets its Multiverse node.
- **Your choices during its turn** show in the banner as buttons (one per distinct option). Moves made before the question wait for the answer and go onto the board with it.
- **Your seat stays at the bottom** while the bot is on (`bottomSeat()`; the halves' "to play / waiting" follow the turn). Take over switches it off and the board flips as usual; switched on again, the bot carries on from the board as it is.
- **The bot keeps its opening hand** (shortcut: the engine's own mulligan isn't asked yet). It plays the engine's default bot, from its own view (it doesn't see your hand).
- **It never concedes:** stuck on a prompt it can't answer, it pauses and says so; the turn is yours to finish.
- Checked in the browser: from the demo's turn 1, the bot (P2) kept its hand and won on turn 7 while you only ended turns (0-0, 0-1, 0-4, 0-8, 0-13, 0-19, 0-20), with no deadlock and no stuck prompt; on turn 4 its Chernabog asked you (Milo Thatch, Max Goof, or skip) and the game went on after the answer; Step and N play one move; P switches the pace; Take over flips the board back. `app-checks` 33/33 (one new: the bot plays P2's turn and the engine hands it back).

### 2026-10-29 · Spike: can the bot play against you, one action at a time?

The owner asked for a bot opponent (Tier 2, §7) that plays its actions one by one so you can watch, and that you can take over from and hand back to at any moment. Checked before any code, with a temporary worker op (not kept) on the 71 boards of the Set 14 demo, the bot playing the side whose turn it is.

- **One action at a time:** yes. The bot's next move is the first of `enumerateAutomatedActionsForCurrentActor()`'s candidates, and each can be described ("Play Max Goof", "Sweet remix", "Quest with Angel").
- **Back onto the Dojo board:** at every point where nothing is resolving, all 247 such steps map back with no card lost. The other 49 steps are mid-resolution (an ability on the stack) and belong to the move that set them off: show them under it, as the Plays tab does.
- **The engine has to stay alive for the bot's whole turn.** Re-reading the Dojo board before each action changed the bot's play on 21 of 71 boards: the Dojo board doesn't carry effects that last the turn (26 steps had some), what was played this turn, or abilities still resolving. So during the bot's turn the worker keeps one engine and the Dojo shows it; it is re-read from the Dojo only when you change the board.
- **The engine has to run the turn change.** 6 of the 8 default decks have start- or end-of-turn cards (Mickey Mouse - Best in Town, Elinor - Renowned Diplomat, Milo Thatch - Getting His Hands Dirty, Nick Wilde, Minnie Mouse, Cinderella, Aurora, Rourke). With the engine passing the turn, on all 57 boards where the game went on it was your turn, you had drawn and your cards were ready, and Elinor's end-of-turn damage fired. The other 14 boards ended with the bot questing to 20. So the Dojo's End turn has to take the engine's result instead of doing its own ready and draw.
- **Your choices during its turn:** they come up (twice during turns, and Elinor's targets at the turn change are the bot's). The candidates for you can be listed and described, so the app can ask you.
- **Hidden information:** the server's planning board is the player's own view (`getAutomatedPlanningBoardForPlayer`, `role: "player"`), so the bot doesn't see your hand or your deck order.
- **Your side at the bottom:** the Dojo flips the board to the player whose turn it is. `render()` and two drop handlers (`position === 'bottom' ? activePlayer : …`) are all that tie the bottom to the active player, so a seat lock is small.
- **Known limits:** effects that last into your turn aren't kept by the Dojo while you play (you're the referee, as everywhere in the sandbox); the bot can get stuck on a few prompts the upstream bot can't answer (§12, tuning), and must then stop and hand you the turn, never concede; its mulligan wasn't checked.

### 2026-10-28 · Fix: the same board gave different lines

**Reported:** the day and night screenshots of the same board showed a different line 2.

**Causes**
- **The app's search stopped on the clock** (2.5 s desktop, 1.2 s phone), so how far it got depended on the machine and its load. On the demo's turn 9 at the phone budget, four runs stopped at 107, 139, 140 and 139 nodes and gave three different line 2s. The first search after loading is slower still (cold code). The tuner had moved to a node budget during the scoring plan; the app hadn't.
- **Their reply re-ranked the top `2 × lines` plans**, so the number of lines asked for changed the ranking. A deeper search could push a line out of that set: 146 nodes gave a worse line 2 than 139. *Show more* (16 re-ranked instead of 8) could reorder the list, which is why it had to re-sort.

**Fix**
- The search ends at a node budget (`nodes: 300`), with the clock as a 10 s safety net; the panel says "stopped early" if it trips. With no clock at all, every demo board's search finishes on its own within 206 nodes (median 60): 1.0 s median, 2.2 s at p90, 3.1 s at worst on desktop, with the reply. Phones run the same search, several times slower, and get the same lines.
- Their reply always re-ranks the best 12 distinct plans (`replyLines`); `lines` only cuts the list. The app asks for 12 once, shows 4, and *Show more* reveals the rest with no second search (it would return the same lines).
- Checked: four runs of the app's search on that board give identical lines, and so do the app on desktop and phone widths, day and night (the same 12 lines, 146 nodes, about 1.8 s each in headless Chromium).
- Re-ranking 12 plans instead of the tuner's old 6 costs nothing measurable: on 256 fresh games, 170 v 171 wins, one game differs.

### 2026-10-28 · Proposed plays move into the odds column

The owner asked for the plays as a tab of the right-hand column, laid out for quick reading, with hover help. Prototyped first as mock-ups drawn into the live app (accordion v compare-and-detail); the owner picked the accordion, 4 lines with more on demand, and no "their reply" row (it needs the bot's reply moves back from the worker; later, if ever).

- **Where:** the draw-odds column gets two tabs, *Odds* and *Plays*, while the rules engine is on. *Suggest* opens the Plays tab (a bottom sheet on phones, where the column is hidden).
- **Reading a line:** line 1 open, the others closed to how they differ from it, at most three steps ("Like line 1, but Quest with Max Goof → Don Karnage instead of To Wither a Flower"). The engine's steps are grouped: an unnamed effect from the card whose ability just fired is that ability's target, so "Play Milo Thatch ↳ SCHOLAR'S GAMBIT → Malicious, Mean, and Scary, Vixey" replaces three rows.
- **Their win is an outcome, not a number:** with the reply in the score, ending the turn on a board where they can reach 20 scores −1000, so every line that stops it read +1014. A red row now says "Ending the turn now loses", lines that don't stop it say "They win next", and the numbers leave the ±1000 out.
- **Why:** the three reasons that moved most, each explained on hover. The race and threat copy reads the weights the worker now returns, so it stays true after a re-tune.
- **More lines:** 4 by default (the worker re-ranks 8 with the reply). *Show more lines* searches for 8 and merges the new ones; a wider search can find better lines, so the list re-sorts and the open line stays open.
- Checked: `app-checks` 32/32 (two new: the grouping and the diff copy). Screenshots of desktop day and night, the hover states, more lines, and phones.

### 2026-10-28 · Scoring plan: their reply, the race, their threat

The plan is §8.1. Six new terms, each a weight whose "off" value scored exactly as before, A/B'd against the 2026-10-27 weights.

**First, sharper measuring** (`tools/engine-tune.mjs`):
- A tuning search now ends at 60 nodes instead of 600 ms. The same weights replay the same games: 32 of 32 identical (before, 1 game in 16 differed).
- `--compare` takes a list and plays the start once. It reports how many concedes were wins, and gives the sign test again without games either side conceded.
- About 1 game in 6 ends in a forced concede, and most of them (84–91% in two runs) are the bot conceding to the explorer. They are free wins for any weights, so they dilute every comparison.

**Screening:** each change alone against today's weights, on the same 256 fresh games (today's: 160 wins, 63%).

| Change | Only it won · only today's won | z | Then |
|---|---|---|---|
| reply 1 | 14 · 5 | 2.06 | confirm |
| race 0.5 | 15 · 4 | 2.52 | confirm |
| threat 0.9 | 12 · 7 | 1.15 | play again |
| cost 0.1 | 10 · 5 | 1.29 | play again |
| threat 0.4 | 1 · 2 | −0.58 | dropped |
| lethal 5 | 1 · 2 | −0.58 | dropped |
| inkLate 0.5 | 1 · 0 | 1.00 | dropped |

Lethal and inkLate changed 3 and 1 games of 256: the cases are rare in these games, and *reply* sees a coming lethal anyway.

**Confirming**, on three more sets of 256 fresh games, pooled per change:

| Change | Games | Only it won · only today's won | z |
|---|---|---|---|
| reply 1 + race 0.5 + threat 0.9 | 512 | 41 · 15 | 3.47 (3.66 without concedes) |
| reply 1 + race 0.5 | 512 | 38 · 9 | 4.23 |
| reply 1 | 512 | 30 · 9 | 3.36 |
| race 0.5 | 512 | 35 · 12 | 3.36 |
| threat 0.9 | 512 | 26 · 9 | 2.87 |
| cost 0.1 | 512 | 18 · 15 | 0.52, dropped |
| race 1 (alone; with reply and threat) | 256 each | 16 · 3; 18 · 13 | no better than 0.5 |

- **Adopted: reply 1, race 0.5, threat 0.9.** On the 512 fresh games where all three ran: 357 v 331 wins (70% v 65%), margin +4.4 v +3.1 lore.
- In plain terms: look at what their board does next turn before choosing; count the race to 20 in turns, not just lore; and lore you deny is worth half as much again as lore you gain.
- The gains shrank from screening to fresh games (the best of many tries is partly luck). Quote the pooled fresh numbers.

**Re-tuning all the weights afterwards found nothing.** The coordinate search (64 games a try, 3 rounds, 104 min) moved every weight and reached 45 of 64 on its own games, up from 38. On 256 fresh games it lost: 176 v 181 wins for the adopted weights, z −1.29. It had fitted its 64 games. The adopted weights stay. Next time, tune on more games a try, or screen single changes with `--compare` as above.

**In the app**
- Over 26 demo boards with the app's settings (2.5 s budget), a search went from 0.60 to 0.78 s on average, and from 1.55 to 1.88 s at worst. The top line changed on 3.
- On the demo's last board, line 1 is now "Play Elinor · Quest with Vixey · Ink The Queen" (+4.0).
- A line's "why" can now name *race to 20* and *their turn*.

**Caveats**
- *Reply* models the opponent with the same bot it's tuned against, which is part of why it helps. Against people the gain may be smaller.
- *Reply* ignores their hand on purpose (the player can't see it), so removal from hand still goes unseen (§8.1, *Later*).

### 2026-10-27 · Proposed plays: modifiers, keywords, the bot finishes lines, tuned weights

**Modifiers reach the engine.** `hydrate` turns the Dojo's card modifiers (Feature 61, now on the board shape as `mods`) into the engine's own:
- strength, willpower and lore become `stat-modifier` continuous effects;
- Challenger and Resist become temporary keywords (`temporaryKeywords` / `temporaryKeywordValues`, keyed `Challenger` / `Resist`; the projection reads the values back in lower case).
- "This turn" lasts for the turn, "until my next turn" through the next one, "always" without end.

Checked on a demo board: +3 strength, +2 lore, +4 willpower and Resist each move the score by the expected amount.

**The score reads keywords** from the engine's projected cards, which already count modifiers and granted keywords (`unitOf`):
- An exerted character is *exposed* only to attackers that can challenge it: an Evasive one only to Evasive or Alert attackers.
- An attacker banishes it if its strength + Challenger − the defender's Resist ≥ its willpower left.
- An exerted Bodyguard halves the exposure of the others.
- Reckless and can't-quest characters bring no lore next turn. Resist counts as body.

Checked: an exerted Max Goof is exposed; with Resist 9 he isn't; give the opposing Milo Challenger +9 and he is again. Vixey and White Rabbit (Evasive) are never exposed to that board.

**The bot finishes each line.** After the search, the default bot plays on from the best four lines, and from the start of the turn, until it would pass. Short and finished lines both stay, and the score picks.
- Before this, a search cut off by the clock (the tuner's 600 ms) often skipped inking and the last quests.
- Against the bot over 64 games, the explorer went from 34% to 52% wins.

**Tuning** (`tools/engine-tune.mjs`, `selfPlay` op):
- **Set-up:** on its own turns the explorer plays its best line with the weights under test. Everything else is the default bot. The games are every pairing of the eight Set 14 default decks, from both seats.
- **Search:** coordinate search, ×1.5 / ÷1.5, 64 games per try, at tuning-speed search (600 ms, beam 4, 6 moves a position). It took 48 min.
- **Result:** exposed 0.6 → 0.4, hand 0.25 → 0.11, ink 0.35 → 0.525. Lore on board and body stayed. In plain terms: ink every turn, don't hoard cards, quest a little more boldly.
- **First check** (128 fresh games): 72 → 81 wins, margin −0.3 → +2.9. That's within one standard error.
- **Second check** (`--compare`, 256 fresh games, game by game on the same deals): 150 → 163 wins (59% → 64%), margin −0.2 → +3.0. The tuned weights won 18 games the old ones lost and lost 5 the old ones won (sign test z = 2.71). **Adopted.**
- **Caveats:**
  - The weights are tuned to beat this bot, which is a proxy for good advice, not the same thing.
  - About one game in seven ends in a forced concede from upstream bot gaps, which adds noise.
  - Tuning at 600 ms while the app searches for 2.5 s is assumed to carry over.

**After all of it:** `app-checks` 30/30. On the reported board (next entry), the app proposes "Quest with Mickey Mouse ×2 · Ink Dale · Shift Pocahontas onto Pocahontas · Quest with Pocahontas" (+6 lore).

### 2026-10-27 · Fix: proposed plays named cards that weren't in the game

**Reported:** on a Set 14 Princess Aggro v Rockstar Aggro board, *Suggest* proposed "Quest with Mushu" and "Challenge Angel with Mushu". Mushu was in neither deck. It also proposed "Tip the scales" and "Play Ursula", which came from Mushu's abilities.

**Cause: the card bridge (§5.2) matched cards by set and number alone.**
- In the engine's card data, promo, special and challenge printings are separate entries that reuse main-set numbers. For example, `set13-12` is Pocahontas - Guiding the Tribe (rare), Mushu - Stealthy Dragon (special) and Tigger - Hunny Barbarian (promo). 160 numbers are shared like this.
- The index kept whichever came first, so the Pocahontas on the board was hydrated as Mushu.
- 76 out of 76 demo round trips still came back identical, because the projection turned the id back into the same number. The round trip couldn't catch a wrong card, only a lost one.

**Fix: cards are named by a key, `"<setCode>-<number>|<full name>"` (`App.cardKey`).**
- The worker's `defOf` decides by name.
- Among engine entries with that name, it prefers a regular printing (common to legendary, epic, enchanted, iconic) with the same number. Pocahontas - Guiding the Tribe and Cinderella - Unintentional Icon are the two names whose entries differ in rules.
- The number is only a fallback, and only among regular printings.
- The projection hands back the key each card was hydrated from.

**Checked**
- `tools/engine-spike.mjs` now opens with a *Card bridge* check: 3,451 of 3,452 LorcanaJSON cards from sets 1–14 reach the engine card of the same name. The one left is "Has Set My Heaaaaaaart...", whose punctuation differs; it reaches the right card by its number. Matching by number alone would have got 260 wrong.
- On the reported board, the lines now use Pocahontas ("Challenge Angel with Pocahontas", "Quest with Pocahontas"), with no Mushu, and the board round-trips identically.

### 2026-10-26 · Tier 3, first cut: proposed plays

**On the board.** With Tweaks → *Rules engine: Assist* on, the sidebar gets a **Suggest** key beside Quest. It opens *Proposed plays*, a paper panel beside the board (a bottom sheet on phones) with up to three lines for the rest of this turn. Each line shows:
- its steps ("Play Elinor · Quest with Vixey · Ink The Queen"). The opponent's forced choices are dimmed, as "Opponent: …";
- the lore it gains (or *Wins*), and its score against doing nothing more;
- the two parts of the score that moved most ("lore +2.0 · exposed −1.5");
- **Play it**, which puts the line's end on the board as one Undo step. The turn recap, played-this-turn and log are recorded as the sandbox records its own moves.
- **Save as branch**, which adds a Multiverse node beside the one you're on and leaves the board alone.

If the board changes while the panel is open, the panel says so and offers *Suggest again*.

**The search** (`explore` in the worker; §8 had the plan):
- It's a beam over the bot's legal candidates, in its strategy's order. The default beam is 6 lines; each position tries at most 8 moves, of which at most 2 are inks.
- Positions reached by two orders of play are merged (`positionKey`). When the opponent must choose during my turn, the bot chooses for them; if it can't, that line is dropped.
- Only positions with nothing left to resolve can end the turn. The best ones that are different plans come back; another order or another inked card doesn't count as a different plan.
- The time budget is 2.5 s on desktop and 1.2 s on phones.
- `evaluate` scores a position for the player whose turn it is. The weights are in `WEIGHTS`:
  - lore difference;
  - lore on board next turn, mine minus theirs (0.6);
  - strength plus willpower left (0.08);
  - exerted characters that the strongest opposing character could banish next turn (−0.6 × their worth);
  - cards in hand (0.25);
  - ink (0.35);
  - reaching the lore to win (+1000).
- `DojoRules.explore` maps each line's end back to a Dojo state with the same card objects, modifiers included. `stateForLine` throws rather than drop a card.

**Checked**
- On all 76 Set 14 demo boards, every proposed line (208 lines) maps back to a Dojo board that the engine reads back identically.
- In Node, a search takes 0.55 s median and 1.5 s at most, at a 1.5 s budget. In the browser it was 0.6–0.8 s on the demo board.
- On one demo board it finds a win: Play Angel, use Angel's ability on Don Karnage, quest with Darkwing Duck and Elinor, reaching 20.
- In the app: Suggest, Play it (16 → 18 lore, all 120 cards accounted for, recap and log written), Undo, and Save as branch all work.
- `app-checks` passes 30/30. `help.mjs --check` and `refresh-landing.mjs --check` pass.

**Limits (to say in the manual when it ships)**
- It plans one turn, mine. The opponent's reply isn't searched; only the "exposed" term guesses at it.
- The weights are hand-set and don't model Evasive, Bodyguard, Ward or Resist.
- No hidden information is used: it sees the hand as the Dojo shows it.
- Bot planner gaps (spike log, finding 4) can make a line drop out.
- Suggest on phones sits in the ☰ drawer.

### 2026-10-26 · Phase 1a, first cut: the engine reads the live board

**On the board.** Tweaks has a new *Rules engine: Off · Assist* switch, Off by default. With Assist on, whenever the board changes (`render()` → `App.rulesRefresh()`, keyed on `boardSig`), the worker hydrates the board and lists what the player whose turn it is may do:
- **Cards with a legal move** get a hairline ring and one round pip per kind of move. The pips use the function-key colours: Olive for quest and ink, Coral for challenge, Bone for play, sing, shift, move and abilities.
- **The card menu** opens with a *Rules* section, read-only:
  - each legal move, with the target count for challenge, sing, shift and move ("Challenge · 1 target");
  - for a hand card, why it can't be played ("Needs 4 ink, 1 ready");
  - for a card the engine doesn't know: "Not in the rules engine: it's yours to resolve".
- **Nothing is blocked**, and the sandbox actions are unchanged. Off drops every mark, and the worker never loads.

**Code**
- `App` (`app/index.html`, "Feature 68"): `rulesOn`, `rulesView`, `rulesRefresh()`, `snOf()` and `rulesPips()`. Plus the mark in `createCardElement`, the section in `showContextMenu` and the Tweaks switch.
- `DojoRules` (`app/js/rules.js`) starts the worker on first use and turns its places (`"1:hand:3"`) back into instance ids.
- The worker op is `analyze`. `hydrate` now records each card's Dojo place, and seeds `G.turnMetadata.inkedThisTurn` from `state.turnActions.inked`.
- Styles are at the end of `field-unit.css`.

**Checked** (headless, Set 14 demo):
- A first reading takes about 50 ms in the browser.
- In Node, `analyze` over all 76 demo boards takes 18 ms on average (p95 31 ms).
- After inking a card in the sandbox, "Ink" disappears from the rest of the hand.
- With 1 ink ready, Elinor says "Needs 4 ink, 1 ready", while Strength of a Raging Fire can still be sung.
- Turning Off clears it.
- Day and night menus were shot and look right.
- `app-checks` passes 30/30. `help.mjs --check` and `refresh-landing.mjs --check` pass.

**Not yet (the rest of 1a)**
- **Phones:** a tap opens the card drawer, which has no Rules section yet. The pips do show.
- **Not passed to the engine yet:**
  - modifiers (Feature 61);
  - cards played this turn (only the ink count is passed);
  - mid-turn bag and pending state (there is none: the Dojo has no such thing yet).
- **Unknown cards** become cost-0 placeholders in the engine, and are left out of the results.
- **Not done yet:** a manual article and a tour step. Write them when it ships (AGENTS.md: no landing or version work on this branch).

### 2026-10-26 · Phase 0 spike: **go**

**What was built** (all on `feat/68-rules-engine`):
- `tools/build-engine.mjs`
  - Takes a sparse checkout of tcg-engines at `6de59de`, installs the engine's runtime packages at upstream's locked versions, and bundles with esbuild 0.27.7.
  - Produces `app/vendor/lorcana-engine/` (`engine.worker.js`, `cards.json`, `VERSION`, `LICENSE`).
  - Upstream edits sit in one `PATCHES` list. The build fails if one no longer applies. `--dev` builds unminified for profiling.
- `tools/engine-adapter/worker.ts`: the worker adapter. It runs as a classic Web Worker, or as a plain script that sets `globalThis.DojoEngine`. Ops:
  - `init`: card index.
  - `botGame`: a whole bot-vs-bot game from two decklists.
  - `roundTrip`: hydrate → legal moves → project, compared field by field.
  - `searchCost`: what one search node costs.
- `app/js/rules.js` (`DojoRules`): `boardFromState()` turns a Dojo state into the worker's board shape, and a small worker client sends it requests.
- How to measure:
  - `tools/engine-spike.mjs` measures in Node.
  - `app/lab/engine.html` measures in a browser.
  - To run the lab headless at full speed and at 4× CPU throttling: `node .claude/skills/dojo-screenshots/shoot.mjs --path /app/lab/engine.html --widths 1440 --themes day --steps <a steps module that calls runSpike()>`.

**Gates.** Browser numbers are headless Chromium in the cloud container. "Phone" means the same page with Chrome's 4× CPU throttling (its "mid-tier mobile" preset), as a stand-in.

| Gate | Target | Measured | |
|---|---|---|---|
| Worker bundle | ≤ 600 KB gzip | 974 KB raw · **245 KB gzip** · 196 KB brotli | Pass |
| Card data (3,374 cards, English) | ≤ 1.5 MB gzip | 3.7 MB raw · **517 KB gzip** · 303 KB brotli | Pass |
| Cold start (script, cards, parse, index), without download time | ≤ 1.5 s desktop, ≤ 4 s phone | **105 ms** in the worker · 268 ms phone | Pass |
| Demo round trip, every node of the Set 14 demo | lossless | **76 / 76 boards identical**. Hydrate 9.6 ms (max 19), phone 40 ms | Pass |
| `getAvailableMoves` on those boards | ≤ 20 ms | mean **2.3 ms**, max 9.2 · phone mean 9.6, max 38 | Pass |
| Bot turn | ≤ 300 ms | mean **47–113 ms**, worst turn 382 ms · phone mean 200–470 ms, worst 1.65 s | Pass, but a long turn can be slow on a phone |
| One search node | ≤ 10 ms | quiet board **5–6 ms** · busy board (18 candidates) **22 ms** · phone 21–26 / 106 ms | Pass on quiet boards, **fails on busy ones** |

Node 22 is about 1.3× slower than the browser on the same bundle. Its numbers are in `tools/engine-spike.mjs` output.

**Findings**
1. **The bridge works.**
   - Hydrating the engine from Dojo states keeps every zone, exert, damage, drying, location, card under, lore and ink drop on all 76 demo boards.
   - Engine instance ids are the fixture's `t000001…`, assigned in a known order, so Dojo ↔ engine identity can be computed up front.
   - Every card in the demo is known to the engine, matched by `<setCode>-<number>`.
2. **Upstream bug (to report):** the bot's scry fallback (`automation/planner.ts`, `getScryLookedAtCardIds`) looked at `deckCards.slice(0, amount)`. That's the bottom of the deck: the engine's deck top is the end of the array (`zone-operations.ts` draws with `slice(-n).reverse()`). Every "look at the top N" card with no revealed-cards snapshot made the bot's pick invalid and the bot conceded (first seen with Nani - Stage Manager). It's patched in our build, and games went from ending on turn 7 at 2–2 lore to reaching 20.
3. **Upstream speed (to report):** `getStatePlayerIds` (`static-ability-utils.ts`) and `getProjectionPlayerIds` (`derived-state.ts`) walk every card's index entry through mutative proxies, once per static-effect check, which is quadratic. Every player is already in `G.lore` and `ctx.playerIds`. Patching both took a busy board's search node from **71 ms to 30 ms** in Node.
   - The profile is flat now. The next spots: `buildStaticEffectRegistry` is rebuilt per check, a `Shift N` regex is parsed from card text at runtime, and proxy `get` calls.
   - About 2× more looks reachable upstream.
4. **The bot still gives up.** In 3 of 8 Set 14 bot-vs-bot games, the bot met a prompt it couldn't answer and conceded:
   - **Taran - Magically Armed**: target combinations over the search cap.
   - **Meilin Lee - Losing Control**: its scry pick fails the hand filter.
   - One matchup (Remember Me v Retro Leviathan) plays 34 abilities, quests 3 times, and decks out on turn 24.

   For the Dojo, the bot must **never concede**. When it's blocked, it hands the prompt to the player ("the bot can't resolve this; do it by hand") and carries on. Report each card upstream.
5. **No i18n build step is needed.** The engine imports its log messages as JSON, so Paraglide isn't used. Only one upstream line stops a classic-worker build: a Bun-only top-level `await` in `testing/index.ts`, which is patched out.
6. The test harness (server plus two in-memory clients) costs little more than a bare `LorcanaServer` restored from the same state, which costs about 0.4 ms to build. The search uses the bare one.
7. Restore (`loadState` of a structured clone, about 21 KB of state) costs about 0.25 ms. Applying a move and listing the next candidates are what cost time.

**What it means for the tiers**
- **Tiers 1 and 2: go.** Every number is well inside budget on desktop and fine on a throttled phone.
- **Tier 3: go, with limits.** On a desktop, a 2 s budget over 3 workers gives about 300–1,000 nodes. That's enough for a beam of 8 over a quiet turn, but thin on busy boards. Phones get "suggest the next move" (one step deep) rather than whole turns. Upstream speed fixes (finding 3) would widen this; offer them as PRs.

**Next (Phase 1a, bridge read-only):** wire `DojoRules` into the board behind a hidden toggle. Hydrate the live board, highlight the legal moves, and show the "why not" reasons. Report upstream: the scry bug (finding 2), the speed fix (3) and the three bot gaps (4).
