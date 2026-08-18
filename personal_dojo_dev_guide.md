# **SYSTEM DESIGN DOCUMENT: Lorcana Practice Dojo**

## **1\. Project Overview & Core Philosophy**

The Lorcana Practice Dojo is a single-file, client-side web application designed as a **manual sandbox** for the Disney Lorcana TCG.

* **Crucial AI Directive:** This is NOT a strict rule-enforcement simulator. It is a sandbox for theorycrafting. Users must be allowed to make "illegal" moves (e.g., playing a card without sufficient ink, drawing out of turn) for testing purposes. Do not write code that hard-blocks user actions based on game rules unless explicitly requested.

## **2\. Tech Stack & Dependencies**

The application strictly adheres to a single-file structure (index.html) containing all HTML, CSS, and JavaScript.

* **Styling:** Tailwind CSS (via CDN) \+ Custom CSS in \<style\> tags.  
* **Icons:** FontAwesome 6.4.0 (via CDN).  
* **Database/Backend:** Supabase JS v2 (via CDN) for fetching user decklists.  
* **Search:** Fuse.js (via CDN) for fuzzy searching decks.  
* **External Logic:** Custom UnifiedWinProbabiliyCalculation library (via CDN) for BCR, LVI, RDS, and CTL metrics.  
* **Card Data:** LorcanaJSON (allCards.json fetched on init). Excludes 'Enchanted', 'Promo', and 'Special' rarities.

## **3\. Global State Management**

The application uses a centralized, mutable state object (App.state). To support the "Undo" and "Timeline" features, state mutations must *always* be preceded by this.saveState().

### **3.1 State Schema (TypeScript representation)**

```
interface CardInstance {  
  instanceId: string; // Unique UUID for this specific physical card in the game  
  cardId: string;     // Reference ID to LorcanaJSON cardDB  
  exerted: boolean;   // True if turned sideways  
  damage: number;     // Damage counters  
  faceUp: boolean;    // Used primarily for inkwell visibility  
  locationId: string | null; // instanceId of the Location card this character is at  
  drying: boolean;    // True if played this turn (cannot quest/challenge)  
}

interface Player {  
  id: number; // 0 or 1  
  name: string;  
  deck: CardInstance\[\];  
  hand: CardInstance\[\];  
  field: CardInstance\[\];  
  inkwell: CardInstance\[\];  
  discard: CardInstance\[\];  
  lore: number;  
  inkTotal: number;  
  inkReady: number;  
  hasMulliganed: boolean;  
}

interface GameState {  
  turn: number;  
  activePlayer: number; // 0 or 1  
  inactivePlayer: number; // 0 or 1  
  opponentHandRevealed: boolean;  
  players: \[Player, Player\];  
  history: string\[\]; // Array of JSON.stringified GameStates for the Undo stack  
  log: Array\<{ text: string, isSystem: boolean, player: number }\>;  
}
```

## **4\. Architectural Paradigms**

### **4.1 Mutation Flow**

Any function that alters App.state MUST follow this exact sequence:

1. this.saveState(); (Pushes a clone of the current state to state.history)  
2. Mutate this.state directly.  
3. this.logAction("Description of action"); (Optional but recommended)  
4. this.render(); (Completely rebuilds the DOM based on the new state)

### **4.2 Timelines & Bookmarks (Time Travel)**

* **Architecture:** We use **O(1) Full State Snapshots**, NOT Event Sourcing/Delta Logs.  
* **Why:** Lorcana involves complex shuffling and sandbox drag-and-drop actions that are too messy to serialize into discrete delta events.  
* **Implementation:** Bookmarks store a JSON.stringify of the entire App.state. Restoring a bookmark completely replaces App.state with JSON.parse of the bookmark.  
* **Safety Net:** The restoreTimeline() function automatically calls autoSaveTimeline() *before* jumping, storing the user's abandoned timeline in an autoSaves array (capped at 5\) to prevent lost data.

### **4.3 Drag and Drop API**

The app uses the native HTML5 Drag and Drop API.

* ondragstart: Attaches the instanceId to ev.dataTransfer.  
* Drop Zones (Hand, Field, Inkwell, Discard, Deck) use App.drop(ev, targetZone, position).  
* moveCard() handles the logic, automatically updating arrays and visual properties (e.g., removing drying if moving from Field to Hand).  
* **Location Handling:** Dropping a character specifically onto a Location card uses a separate dropToLocation() handler attached to the location's wrapper DOM element.

### **4.4 UI Layout & Rendering**

* **Two-Pane Layout:** Left Sidebar (288px fixed) and Right Main Area (Flex-1).  
* **Perspective Flipping:** The App.state.activePlayer is *always* rendered at the bottom (\#bottom-board). The inactivePlayer is *always* rendered at the top (\#top-board). The render() function dynamically assigns P0 or P1 to these DOM areas.  
* **Sticky Previews:** Hovering a card triggers showPreview(). There is NO mouseleave event; the preview locks in place so the user can read it.  
* **Context Menus:** Right-clicking (or left-clicking) a card opens a dynamic Context Menu populated based on the card's current loc (hand, field, inkwell).

### **4.5 Win Probability Metrics Engine**

* **Calculation:** Occurs during render() inside updateMetrics().  
* **Field Metrics (Tug-of-War):** Iterates through state.players\[X\].field, queries UnifiedWinProbabiliyCalculation, sums the BCR/LVI values, and adjusts the widths of the HTML progress bars.  
* **Hand Potential:** Iterates through state.players\[X\].hand to calculate absolute potential (CTL, BCR, RDS, LVI), displayed in badges attached to the hand containers.

## **5\. Guidelines for Future AI Development**

1. **Never alter the Single-File Structure:** All code must remain in one .html file.  
2. **Preserve the Sandbox:** Do not add strict Phase/Step state machines. The user is the referee.  
3. **Respect the Color Palette:** Use Tailwind classes. Main backgrounds: bg-gray-900. Sidebar: bg-\[\#1a1a1e\], \#151518. Player boards: \#3f2e70 (Top), \#a86b32 (Bottom). Accent colors: Purple (System/P2), Orange (P1), Blue (BCR), Yellow (LVI/Lore).  
4. **DOM Manipulations:** Do not use jQuery or complex manual DOM tracking. App.render() clears innerHTML of containers and rebuilds card elements from scratch based on state. Only mutate state, then call render.  
5. **Drying Mechanic:** If writing logic that plays a Character to the field, ensure found.card.drying \= true is applied, and ensure quest() logic checks \!c.drying.

---

## **6\. Feature 17: Duels.ink Log Import (v1.16.0)**

### **6.1 Overview**

Players can import match logs exported from Duels.ink (`.md` format) into the Practice Dojo. The importer parses the log, reconstructs game state at each turn boundary, and loads the result as a full multiverse tree — one bookmark node per turn.

Entry points: "Import Duels.ink Log" button on the setup screen and "Import Log" in the in-game Timelines drawer. Both open the **Import Log Modal** (`#import-log-modal`).

### **6.2 Import Log Modal**

* Textarea for pasting log content directly.  
* "Choose file" button reads a `.md`/`.txt` file into the textarea (same validation path).  
* **Live validation** runs on every `oninput` event via `validateDojoLog(text)`:
  * **Green** — valid log, turn count shown, Import button enabled.  
  * **Yellow** — turns found but no opening hand lines; Import enabled with warning.  
  * **Red** — no turn markers found; Import button stays disabled.  
* Import button calls `importLogFromModal()` → `_applyDojoLog(text)`.

### **6.3 Core Functions**

| Function | Purpose |
|---|---|
| `parseDojoLog(logText)` | Parses the raw markdown into `{ players, turns }`. Each turn has `draws`, `inked`, `played`, `quested`, `banished`, `challenged`, `lore`, and `rawLines` (every verbatim log line for that turn). |
| `buildSessionFromLog(parsedLog)` | Replays turns in order. Saves a full game-state snapshot **before** each turn's actions as a bookmark node. Returns a session object compatible with `importTimelines`. |
| `_applyDojoLog(logText)` | Shared core: calls parse → build → loads the session into the app (replaces state, bookmarks, autoSaves, history). |
| `validateDojoLog(text)` | Returns `{ valid, level, message }`. Levels: `'ok'`, `'warn'`, `'error'`, `'empty'`. |
| `resolveCardName(name)` | Resolves a log card name string to a cardDB entry. Tries: exact key → fullName → simpleName → Fuse.js fuzzy. Returns `null` if unknown. |
| `makeCardInstance(cardId)` | Creates a full CardInstance object with a new UUID. |
| `makeUnknownCardInstance()` | Creates a CardInstance with `cardId: -999` (unknown card sentinel). |

### **6.4 Deck Reconstruction Strategy**

* The deck is shuffled once after the mulligan — its order is initially unknown.  
* Every `Player N drew X` event reveals the next card from the top of that player's deck in sequence.  
* At each turn snapshot, `buildDeck()` constructs the deck array as:  
  `[resolved future draw cards in order] + [unknown placeholders to fill to 60]`  
* Because the full log is parsed upfront, future draws are known when building earlier snapshots.

### **6.5 Unknown Card Placeholder (`cardId: -999`)**

* Used whenever a card name from the log cannot be resolved to a `cardDB` entry.  
* `getCardImage(dbCard)` guards against `null`/`undefined` and returns the card-back URL — covers all call sites.  
* `renderInspectGrid()` renders unknown cards as a card-back tile with an `(Unknown)` label. They are fully replaceable via the existing right-click card replacement UI (Feature 10).

### **6.6 Bookmark Node Content**

Each imported turn node carries:

* **`comment`** — filtered, human-readable turn summary. Boilerplate lines (ready/set/draw steps, timers, turn-end lines) are stripped. Remaining lines have the `Player N` prefix removed and are prefixed with `- ` for markdown list rendering.  
* **`cardsPlayedData`** — array of resolved cardIds for cards played that turn. Renders as the "Cards Played:" thumbnail strip at the bottom of the node (same as autosave nodes).  
* **`color`** — active player's HUD color: P1 orange (`#a86b32`), P2 purple (`#3f2e70`).

### **6.7 Action/Song Cards**

When replaying plays from the log, `buildSessionFromLog` checks `dbCard.type`. If the type is `'Action'` or `'Song'`, the card goes directly to the **discard pile** instead of the field (matching Lorcana rules). Characters and Locations go to the field as normal.

---

## **7\. Feature 21: Duels.ink Replay (JSON / .replay) Import (v1.20.0)**

### **7.1 Overview**

In addition to the text `.md` logs (Feature 17), the Dojo imports Duels.ink **replay** exports — files with `"format": "duels-replay-v1"`, delivered as `.json` or `.replay` (identical content, different extension). Unlike the `.md` parser (which reconstructs state by parsing text lines and inferring card locations), the replay is a **deterministic state machine**: a full `baseSnapshot` plus a `frames[]` array of RFC 6902 JSON Patch operations. Replaying the patches reproduces the engine's exact state at every step, so reconstruction is robust and needs no regex parsing.

Both importers share the **same modal and the same loader tail** (`_applyDojoLog`). The format is auto-detected, and the `.md` path is completely unchanged and backward compatible.

### **7.2 Replay File Anatomy**

| Field | Meaning |
|---|---|
| `format` | Always `"duels-replay-v1"` — the detection key. |
| `perspective` | Duels player number (1 or 2) of the **log owner**. Their info is fully visible; the opponent's private info is hidden. |
| `baseSnapshot` | Complete initial state. `myPlayer` = the perspective player (full card objects), `opponent` = the other player (counts + only public zones). |
| `frames[]` | Ordered actions. Each has `seq`, `actionType`, `player`, `turnNumber`, a `patch` (RFC 6902 ops), and an optional semantic `takenAction`. |
| `decklist` | The perspective player's **exact 60-card list** (duels `"setCode-number"` ids). Used for a 100%-accurate deck string. |
| `playerNames` | `{ "1": name, "2": name }`. |

**Key engine facts (verified against real exports):**
- Card identity uses duels `"setCode-number"` strings (e.g. `"10-57"`), **not** LorcanaJSON numeric ids.
- `myPlayer.deckOrder` is an array of duels card ids; the **top of the deck is the LAST element** (draws pop the end). Mulligans/shuffles rewrite it mid-game, so only the *live* (post-replay) `deckOrder` is meaningful.
- Inkwell entries are `{ hidden, card }`. A card's full object is **stripped at end of turn** (becomes `{ hidden: true }`), so inkwell identity must be tracked separately.
- Duels `turnNumber` is a **round counter** (it increments after both players act). Each `END_TURN` frame is **one player-turn** — that's the bookmark granularity we use (matching the `.md` import's one-node-per-turn feel).

### **7.3 Core Functions**

| Function | Purpose |
|---|---|
| `detectLogFormat(text)` | Returns `{ type: 'replay', data }` if the text JSON-parses with `format === 'duels-replay-v1'`, else `{ type: 'markdown' }`. Drives routing in `_applyDojoLog` and `validateDojoLog`. |
| `applyJsonPatch(doc, ops)` | Minimal RFC 6902 applicator (`add`/`remove`/`replace`) over a JSON Pointer path. Distinguishes **array** parents (splice insert/remove) from **object** parents (set/delete key). Mutates in place. |
| `buildSessionFromReplay(replay)` | The replay engine. Returns a session object **identical in shape** to `buildSessionFromLog` (so the loader tail is shared). |
| `resolveCardName(name)` | Extended: a string matching `^\w+-\d+$` is resolved through `setNumberIndex` first (the duels bridge), before the existing name lookups. |

### **7.4 Card ID Bridge (`setNumberIndex`)**

LorcanaJSON indexes cards by numeric `id`; duels uses `"setCode-number"`. On card load we build `App.setNumberIndex["<setCode>-<number>"] = cardDB entry` (e.g. `"10-57"` → the Olaf card whose numeric id is `2246`). `resolveCardName` checks this index for any `setCode-number`-shaped string, so **both** importers benefit and there is one resolution path.

### **7.5 State Mapping (duels → Dojo)**

- Duels player **N → Dojo index N-1** (player 1 → `players[0]`, player 2 → `players[1]`), regardless of perspective. `myPlayer` maps to `players[perspective-1]`, `opponent` to the other.
- Per card: `instanceId` kept as-is; duels `id` → numeric `cardId` (or `-999` if unresolved); `exerted`→`exerted`, `damage`→`damage`, `justPlayed`→`drying`; `cardsUnder` → `stackedCards` (these are face-down/hidden, so they become unknown placeholders).
- **Perspective player deck:** `reverse(myPlayer.deckOrder)` mapped to instances — the Dojo's deck top is index 0, so reversing the duels deck (top = last) yields the correct draw order. This is live and shuffle-aware → **exact deck-order deduction**, stronger than the `.md` future-draw inference. The deck **string** comes from the embedded `decklist`.
- **Inkwell identity:** because inkwell card objects are stripped at end of turn, we track `inkIds[dojoIdx]` from every `ADD_TO_INK` `takenAction.cardId` (in order, both players). When mapping an inkwell slot, prefer `entry.card`, else fall back to the tracked id, else unknown.

### **7.6 Opponent Inference (hidden info)**

The opponent's **draws are hidden** in a perspective replay (unlike the old `Player 2 drew X` markdown), so their hand/deck cannot be known exactly. To avoid an all-unknown opponent, we infer:

1. **Pre-scan** every frame once up front, recording each opponent card the moment it first becomes visible — from `takenAction` (`cardInstanceId`/`cardId`, plus `attackerInstanceId`/`attackerCardId`) and from any card object inside an `/opponent/...` patch value (scanned recursively). Stored as `oppRevealSeq: Map<instanceId, { cardId, seq }>`, first-reveal wins.
2. At each snapshot (tracking `currentSeq` = seq of the last applied frame), the opponent's **known-but-still-hidden** cards are those in `oppRevealSeq` whose `seq > currentSeq` and that aren't already visible on board. Sorted soonest-first, they **fill the hand first** (imminent reveals look like they're in hand), then the **deck**, with `cardId: -999` placeholders filling the remaining `handCount`/`deckCount`.
3. As the replay advances, each known card leaves the hidden pool exactly when it's played, so the inferred hand/deck taper toward unknowns in the endgame.
4. **Opponent deck string (`deck2`/`deck1`)** is built from the deduped `oppRevealSeq` values (every distinct revealed card).

> **Heuristic caveat:** "hand vs deck right now" for the opponent is an educated guess (we can't see their draws). This matches the sandbox philosophy and is fully editable via the right-click replace UI.

### **7.7 Bookmark Generation**

`buildSessionFromReplay` walks the frames maintaining a **segment = one player-turn**:
- Setup frames (`CHOOSE_STARTING_PLAYER`, `MULLIGAN`) are applied but not snapshotted.
- A segment opens at the start of a player-turn (snapshot taken **before** that player's actions, after their ready+draw). Its `takenAction`s accumulate as frames are processed.
- On `END_TURN`: close the segment (push the node), apply the patch (ready+draw transition into the next turn), then open the next segment. A final `closeSegment()` after the loop captures the last partial turn (e.g. the winning `GAME_FINISH`).

Each node carries the same fields as `.md` nodes: `name` (`Turn N – Px Active`, where N is a **sequential player-turn counter** so labels match the live `turn`), `stats`, `color` (P1 `#a86b32` / P2 `#3f2e70`), `comment`, `cardsPlayedData`, and a compressed `state`. The **comment** is built from `takenAction` objects via `formatAction` (ink / play / quest with lore / challenge with banish flag / activate) — no string parsing. Actions by the non-active player in a segment are prefixed `(Opponent)`.

`currentState` is a true final-board snapshot taken after all frames are applied. `deck1`/`deck2` are assigned by dojo index (perspective player's exact `decklist` to its slot, opponent's inferred list to the other).

### **7.8 Validation & UI**

- `validateDojoLog` detects a replay first and returns a green `ok` with player names and the `END_TURN` count. Non-replay JSON (wrong `format`) returns an explicit error. Markdown behavior is unchanged below that.
- The Import Log modal's file input accepts `.md,.txt,.json,.replay,.gz`; the textarea/file copy mention replays.

### **7.9 Gzipped replays (`.replay.gz`) — Feature 22 (v1.21.0)**

Duels.ink replay downloads are gzip-compressed (`<gameId>_p1.replay.gz`). The importer reads them directly:

- `onImportLogFileSelected` reads the file as an **ArrayBuffer** (not text) and passes it to `decodeMaybeGzip(buffer)`.
- `decodeMaybeGzip` sniffs the gzip magic bytes (`1f 8b`); if present it decompresses via the browser's `DecompressionStream('gzip')`, otherwise it decodes the bytes as plain UTF-8 text. The resulting text flows into the normal paste/validate/import path, so both `.md` and `.json`/`.replay` content work whether or not they were gzipped.
- Everything stays self-contained in the single HTML file.

> **Note (dropped direction):** loading games directly from the Duels.ink API was prototyped but removed. Duels.ink serves **no CORS headers**, so a static single-file app hosted on GitHub Pages cannot call its API from the browser without an external proxy (a Supabase Edge Function was tried, then reverted to keep the app dependency-free). The reusable loader helper `_loadSessionIntoApp(session, turnCount)` introduced during that work was kept, since `_applyDojoLog` uses it.

---

## **8\. Visual Redesign Migration (v2.0.0)**

The hi-fi redesign in `practice_dojo/redesign/` was migrated onto the production tool. Full play-by-play
lives in `redesign/IMP_dojo_redesign_dev_log.md`. Architectural summary for future devs:

### 8.1 Strategy — re-skin, do **not** rewrite the engine
The production engine (state, mutation flow, undo, timelines, Duels.ink `.md`/replay/gzip import,
challenge/stack/location, craft hand, cloud) is far richer than the redesign's stubbed `dojo.js`.
So we kept the **entire `App` engine intact** and changed only the presentation layer:
- The redesign `dojo.css` is appended into the single-file `<style>` (later source wins the cascade;
  legacy rules remain below but are overridden). Design tokens are OKLCH; accent = amber; fonts = Geist.
- **Tailwind is still loaded.** The engine toggles visibility with the `.hidden` class and uses
  `.flex`/`.opacity-*`/arbitrary-value utilities, so Tailwind must stay. We added
  `.hidden{display:none!important}` to make show/hide cascade-order-proof against the Play-CDN injection.
- Body markup was rebuilt to the redesign structure (top bar, `.sidebar`, reordered `.board-half`s,
  `.drawer-overlay`, tweaks panel) **keeping every original element ID and inline `on*` handler**, so
  the drag/drop contract (`drop(ev,zone,pos)`), context menus and all wiring are byte-identical.

### 8.2 What changed in the JS (presentation only)
- `createCardElement(c, isOpp, isInk, opts)` — now returns `.card-wrap > .card`; 4th `opts` arg adds
  hover-action chips (`{chips:true, loc:'hand'|'field'}`). First three params unchanged for back-compat.
- `render()` — player badges → `.player-row is-p1/is-p2`; board tint → `.is-p1/.is-p2` (identity, Feature 16);
  divider reverts to its CSS gradient when no `activeTimelineColor`; top-bar turn pill updated + shown.
- Context menu builders emit `.ctx-item`/`.ctx-divider`. `toggleTimelines()` toggles `.is-open`.
  `showSetup()` hides the top bar.
- New: `$`, `el`, `loadTweaks/saveTweaks/applyTweaks/bindTweaks` + `ACCENT_PRESETS`. Tweaks persist in
  `localStorage['lorcana_dojo_tweaks']` (accent / card-size `--card-scale` / panel layout / player palette;
  `classic` palette restores the original `#a86b32`/`#3f2e70`). `bindTweaks()` runs on `DOMContentLoaded`.
- `showPreview`, `updateMetrics`, `updateLog`, `setHandReveal` were left **verbatim** — their IDs and
  Tailwind opacity/scale toggles are preserved in the new markup.

### 8.3 Gotchas
- Identity vs position: redesign colors halves by screen position; we override via `.board-half.is-p1/.is-p2`
  (hue from identity) + `.top/.bottom` (gradient orientation) so Feature 16 coloring is preserved.
- The tree modal markup was kept as-is (functional); only its nodes are restyled via `.tree-node`.
- Inkwell still renders full-card stacks inside `.inkwell` (not the redesign micro-stack).
- When bumping the version, update `APP_VERSION` and the three `#app-version-*` spans (loading/setup/sidebar).

---

## **9\. Mobile Compatibility Pass (v2.5.0)**

Target = normal phone (~1080×2392 device px, ~360–797 CSS px after browser chrome). Goal: bottom
(current-player) half always usable, hand visible without scroll. All work lives in the existing
`@media (max-width: 760px)` block plus 3 small hooks. Desktop untouched (rules scoped to media query).

### 9.1 Prioritise bottom half, shrink top half
- `.board-half` → `flex: 0 1 auto` (shrink to content); `.board-half.bottom` → `flex: 1 1 auto`
  (current player gets spare room). Top half only as tall as its content.
- Tightened `.field-strip` / `.field` min-heights (`calc(var(--card-h)*0.55)` / `*0.7`), board-half
  padding/gap, `.pile-row` padding. Hid `.board-bg-letter` (declutter), shrank `.lore-badge` to `scale(0.7)`.

### 9.2 Opponent (top) hand collapses by default
- `.board-half.top .hand` → `max-height: 0; overflow: hidden` on mobile (face-down cards hidden;
  only the peek button + count via sidebar). `.board-half.top .hand-meta` hidden too.
- Reveal = `body.opp-hand-revealed` class → `max-height: 210px; overflow: visible`. Class toggled in
  `setHandReveal(isRevealed)` (`document.body.classList.toggle('opp-hand-revealed', isRevealed)`).
  Existing peek button drives it: desktop hold (mouse), mobile tap (`ontouchstart=App.togglePeek`).
- Desktop reveal adds Tailwind `translate-y-[120px] scale-[1.1]` to `#top-hand`; on mobile we override
  `.board-half.top #top-hand { transform: none !important }` so peeked cards stay in flow, not fly down.

### 9.3 Top bar fits all controls
- `.topbar` → `grid-template-columns: auto minmax(0,1fr) auto`, reduced padding/gap.
- `.brand` hidden (hamburger stays). Right buttons icon-only (`span` hidden), tighter padding/gap.
- Turn pill compacted: drop the "TURN" word (`.turn-pill .mono { display:none }`), shrink font/padding,
  `.turn-actor` truncates with ellipsis.

### 9.4 Inspect deck / discard on touch
- Desktop opens these via right-click (`oncontextmenu` → `showDeckContextMenu`/`showDiscardContextMenu`).
  No right-click on touch, so added a corner `.pile-inspect` button inside each of the 4 pile divs
  (top/bottom × deck/discard). `display:none` desktop, `inline-flex` in media query.
- Buttons call `App.inspectDeck`/`App.inspectDiscard` with the correct index (top=`inactivePlayer`,
  bottom=`activePlayer`) and `event.stopPropagation()` so the deck's `onclick=drawCard` doesn't fire.
  Touch-drag shim (pointer events) lets a pure tap through, so the button click runs.
- Inspect modals already go full-screen on mobile (`.modal-card.wide`); added `.modal-backdrop { padding:0 }`
  so the 100vw card doesn't overflow horizontally.

### 9.5 Discard occlusion + lore placement fixes
- **Discard spill (desktop + mobile):** the discard pile renders full-size cards (`--card-w` 80px) inside a
  72px `.pile` slot, absolutely positioned with a fan offset. A tall stack overflowed the box and painted
  over the adjacent deck. Fix: `.pile:not(.deck) { overflow: hidden }` clips the stack to the slot, and the
  render fan was tightened from `min(i*3, 30)` to `min(i*2, 10)` (both top & bottom loops) so the top card
  stays mostly visible inside the clipped box. `.pile-inspect` z-index raised to 50 so the inspect button
  isn't buried under discard cards (cards use `zIndex = i`).
- **Lore badges (mobile):** were anchored top/bottom-**right**, so the top badge sat over the deck and the
  bottom badge hid under the hand. Now anchored **left** (`.board-half.top .lore-badge` top-left,
  `.board-half.bottom .lore-badge` bottom-left), away from the right-side piles, both visible.

---

## **10\. Card Image Rendering — `<img>` Migration (Mobile Decode Fix) (v2.6.0)**

### 10.1 The bug

On mobile, dense card grids (notably the 60-card **Inspect Deck** view) showed **blank tiles even
when the exact same card was already rendered elsewhere** (e.g. visible in hand). Investigation
confirmed two distinct layers of "reuse," only one of which was working:

- **File download — was already reused.** `getCardImage(dbCard)` returns the same URL for a given
  `cardId` everywhere, and the browser HTTP cache is keyed by URL, so each unique card image
  downloads **once**. No wasted network. (Image priority order unchanged: `images.thumbnail` →
  `images.full` → card-back URL.)
- **Decoded bitmap in RAM — was NOT reused.** Every card face was painted via CSS
  `background-image`. Browsers decode a `background-image` **per element** and do **not** reliably
  share that decoded surface between two elements, even with an identical URL. In a 60-tile grid,
  off-screen tiles never decode until scrolled, and under mobile memory pressure the engine evicts
  decoded backgrounds aggressively → blank tiles next to a loaded twin.

> Key fact: the constraint on mobile is **decoded-bitmap RAM**, not download size. A decoded image
> costs `width × height × 4 bytes` regardless of its (compressed) file size. iOS Safari has a hard
> per-tab memory ceiling and silently drops decoded surfaces (or reloads the tab) when it's hit.

### 10.2 The fix — real `<img>` with shared decode

Card faces now render as a real `<img loading="lazy" decoding="async">` instead of a CSS
`background-image`. Modern engines key the **decoded-image cache by `src` (+ rendered size)**, so
one decode is shared across every element with that `src`. `loading="lazy"` defers off-screen
decode and `decoding="async"` keeps decode off the main thread. This directly fixes the
"loaded elsewhere, blank here" symptom.

**Shared CSS** (added next to `.card`):

```css
.card-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: inherit;
    pointer-events: none;      /* drag/hover events fall through to the parent card */
    -webkit-user-drag: none;
    user-select: none;
}
```

**Shared helper** (on `App`, next to `getCardImage`):

```js
makeCardImg(dbCard) {
    const img = document.createElement('img');
    img.className = 'card-img';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.src = this.getCardImage(dbCard);
    if (dbCard && dbCard.name) img.alt = dbCard.name;
    return img;
}
```

### 10.3 Call sites converted

| Path | Before | After |
|---|---|---|
| `createCardElement` (board: hand/field/inkwell/discard/stacks) | `el.style.backgroundImage = url(...)` | `el.appendChild(this.makeCardImg(dbCard))` — img is the **first child** of `.card`, so badges (damage, stack count), the `.drying::after` "NEW" pill, and hover chips still paint on top. `.card`'s `background: var(--surface-2)` now acts as a load placeholder instead of going blank. |
| `renderInspectGrid` (60-card Inspect Deck) | `el.style.backgroundImage` | `el.appendChild(this.makeCardImg(dbCard))`. The `(Unknown)` label for `cardId: -999` cards is still appended after the img and sits on top (img is `position:absolute`, doesn't disturb the flex label). **Biggest win** — this was the worst offender. |
| `renderInspectDiscardGrid` | `el.style.backgroundImage` | `el.appendChild(this.makeCardImg(dbCard))`. |

### 10.4 Why `render()` was NOT refactored into a DOM diff

`render()` still fully tears down and rebuilds each zone (`innerHTML = ''` → rebuild from state),
which matches the architecture in §4.1 / §5.4. A keyed reconciliation was considered to avoid
re-decoding unchanged cards but **deliberately rejected**:

- The `<img>` migration already achieves the goal. When `render()` rebuilds a node, the new `<img>`
  with the same `src` hits the browser's decoded-image cache → **no re-decode, no re-fetch**. Rebuild
  cost drops to plain DOM-node creation.
- A real diff of `render()` + `buildField` is high-risk: `buildField` wires per-element stacks,
  locations, and native drag/drop handlers. The marginal saving (node creation only) does not justify
  the bug surface in this single-file, "mutate state then re-render" engine.

So the "mutate → `render()` rebuilds everything" contract in §4.1 and §5.4 is **unchanged and still
authoritative**. Do not introduce manual DOM tracking to optimise this without profiling proof that
node creation (not decode) is the bottleneck.

### 10.5 Not converted (intentional)

`background-image` was left on low-risk / low-count paths where the decode-sharing problem
doesn't bite: the **mulligan** hand (7 cards, once), the **craft pool** (unique cards only, opened
rarely), the **card-search** results grid (capped at 18), the tiny thumbnail strips (35×50 / 18×25),
and `showPreview` (a single full-res sidebar element).

> **Superseded in v2.9.0 (§12):** all of those except `showPreview` were converted to `<img>` anyway —
> not for decode reasons, but because only a real `<img>` can report a load failure and trigger the
> offline name fallback. `showPreview` is still a `background-image` and uses a probe instead.

### 10.6 Thumbnails retained

`getCardImage` still prefers `images.thumbnail`, so mobile grids decode the small thumbnail
(~`280×390` ≈ 0.4 MB bitmap) rather than the full image (~`1024×1468` ≈ 6 MB bitmap). This keeps
total decoded RAM well under the iOS ceiling and compounds the `<img>` win. Full-res is used only by
the single hover `showPreview` element.

---

## **11\. Card Shifting Detection & Action Tracking (v2.7.1)**

### **11.1 Overview**

When a card is manually stacked on top of another in the sandbox field (via `shiftOnto`), the app checks if this represents a **Shift** action. It does this by checking if the card beneath has its name (base name or full name) contained within the name of the card above (base name or full name). 

If a shift is detected, the action is formally recorded for the active turn recap and the card is added to the turn's cards-played list so that the multiverse timeline nodes can display it in their "Cards Played:" thumbnail strip.

### **11.2 State & Action Tracking**

* **`shifted` Action Type**: Added a `shifted` array to `this.state.turnActions` (initialized in `startGame()`, tracked in `_trackAction()`, and reset at the start of a turn in `endTurn()`).
* **Turn Recap Formatting**: `_formatTurnActions` is updated to include a `- **Shifted:**` list detailing any shifts executed during the turn.
* **Cards Played Buffer**: If a stack matches the shift criteria, the card ID of the shifted card is pushed to `this.state.cardsPlayedThisTurn`. This populates `cardsPlayedData` on timeline auto-saves and manual bookmark nodes.

### **11.3 Core Functions & Log Output**

* **`shiftOnto(draggedInstanceId, targetInstanceId)`**:
  * Added validation checking whether `beneathDb.name` / `beneathDb.fullName` is contained in `dbCard.name` / `dbCard.fullName`.
  * If `isShift` is true:
    * Pushes the shifted card ID to `this.state.cardsPlayedThisTurn`.
    * Tracks the action as `'shifted'` via `_trackAction`.
    * Replaces the generic stacking log with a descriptive action log: `You shifted [CardName] onto [BeneathCardName] (cost [Cost]).`

---

## **12\. Feature 27: Offline Card-Name Fallback (v2.9.0)**

### 12.1 The problem

Card artwork is fetched from a remote CDN (`getCardImage` → LorcanaJSON URLs). With no connection —
the normal mobile case — every card renders as an anonymous rectangle: the board is unreadable and a
session can't be continued. The card *data* (`allCards.json`) is already in memory at that point, so
the names are available; only the pixels are missing.

### 12.2 The fix — a text layer under the artwork

Every face-up card face is now two stacked layers inside the same host element:

1. `.card-fallback` — a `position:absolute; inset:0` box with the card **name**, **version**
   (subtitle) and **ink cost**, on a `var(--surface-2)` background.
2. `.card-img` — the artwork, appended **after** it, so a successfully loaded image covers the text
   completely. **Nothing changes visually while online.**

No JS state, no connectivity detection, no retry logic. Two behaviours fall out of the layering:

- **While loading** the (transparent) img shows nothing → the name acts as the placeholder.
- **On failure** `img.onerror` calls `img.remove()`, which also kills the browser's broken-image
  glyph → the name is what's left.

Because `render()` rebuilds everything from state (§4.1), a card that failed while offline
automatically shows its artwork again on the next render once the network is back.

### 12.3 Shared helpers (on `App`, next to `getCardImage`)

| Function | Purpose |
|---|---|
| `makeCardImg(dbCard)` | Unchanged from §10.2 **plus** `img.onerror = () => img.remove()`. |
| `makeCardFallback(dbCard)` | Builds the `.card-fallback` div: `.cf-name`, optional `.cf-version`, optional `.cf-cost`. Null-safe — an unresolved card (`cardId: -999`) reads `Unknown card`. |
| `paintCardFace(host, dbCard)` | The one call site everything uses: adds `.card-face` to `host`, appends the fallback, then the img. |
| `cardThumbHtml(dbCard, className)` | Same face as an HTML **string** (with `onerror="this.remove()"`), for the thumbnail strips that are built via `innerHTML`. HTML-escapes the name. |

### 12.4 Call sites

All of these now call `paintCardFace` (or `cardThumbHtml`) — several were still
`background-image` from §10.5 and had to become real `<img>`s, since only an `<img>` can report a
load error:

| Path | Was |
|---|---|
| `createCardElement` (board: hand/field/inkwell/discard/stacks) | `appendChild(makeCardImg(...))` |
| `renderInspectGrid` (60-card Inspect Deck) | `appendChild(makeCardImg(...))` |
| `renderInspectDiscardGrid` | `appendChild(makeCardImg(...))` |
| `renderMulliganCards` | `style.backgroundImage` |
| `renderCraftHand` (craft pool) | `style.backgroundImage` |
| `executeCardSearch` (results grid) | `style.backgroundImage` |
| `renderTree` + `renderAutoSaves` ("Cards Played" strips) | inline `background-image` in a template string |

`showPreview` (sidebar hover) is the **one exception**: it stays a `background-image` because of its
`background-size:100% auto; background-position:bottom center` framing. A `background-image` can't
report an error, so it probes instead — `new Image()` on the same URL, and on `onerror` it reveals
`#preview-fallback` (name + version). `this._previewProbe` guards against a stale probe resolving
after the user has hovered a different card.

### 12.5 Text sizing

The same fallback markup has to be legible in an 80px board card, a 140px mulligan card and a 35px
timeline thumb. `.card-face` is a **container query** context (`container-type: inline-size`) and the
text is `clamp(5px, 11cqw, 13px)` — it scales with the tile. A flat `9px` is the `@supports` fallback
for engines without container queries.

### 12.6 Gotchas

- **`innerHTML` wipes the face.** `renderMulliganCards` (the X overlay) and `renderCraftHand` (the
  count badges) used to assign `el.innerHTML = ...` *after* setting the background. They now use
  `insertAdjacentHTML('beforeend', ...)` so the face survives and the overlays land on top of it.
- **DOM order is the z-order.** The fallback is appended first, the img second, everything else after
  — so damage counters, the `.drying::after` "NEW" pill, hover chips and the `(Unknown)` label all
  still paint above the artwork. No `z-index` was added to `.card-img`; don't add one.
- **Face-down cards are untouched.** The `.card-back` branch of `createCardElement` never calls
  `paintCardFace`, so a peeked opponent hand or an un-flipped inkwell leaks nothing offline. The card
  back itself is a remote image with a `background-color` fallback → it just goes dark.
- `.tn-card-thumb` needed `overflow: hidden` so the clipped name doesn't spill out of the 35×50 /
  18×25 boxes. At 18×25 (auto-save rows) the name is only partially legible — the `title` attribute
  carries the full name.

---

## **13\. Dynamic Play-Area Card Auto-Scaling & Responsive Fit (v2.10.0)**

### **13.1 Overview**

As players deploy multiple cards to the board across turns, fixed-dimension cards wrap into multiple rows and expand the vertical height of `.board-half`, causing vertical scrolling on `.play`. Feature 28 introduces dynamic responsive auto-scaling for the active field area and dynamic horizontal compression for the hand.

### **13.2 Scoped CSS Custom Properties**

Rather than relying purely on global `:root` dimensions, `#top-field` and `#bottom-field` receive scoped CSS variables on render:
- `--field-scale`: dynamic scale multiplier computed per player board ($0.44 \le \text{scale} \le 1.0$).
- `--card-w: calc(80px * var(--card-scale) * var(--field-scale))`
- `--card-h: calc(112px * var(--card-scale) * var(--field-scale))`
- `--field-gap`: dynamically calculated gap ($3\text{px} \le \text{gap} \le 12\text{px}$)
- `padding: calc(4px * var(--field-scale)) calc(8px * var(--field-scale))`

Because `.card`, `.card-wrap`, locations, and stacks consume `var(--card-w)` and `var(--card-h)`, all child cards in that field automatically scale in unison.

### **13.3 Single-Row Priority Auto-Fit Engine (`calcFieldScale`)**

The engine aggressively prioritizes **keeping all field cards on a single row** without wrapping:
1. **Effective Card Density:** Independent cards ($1.0$ slot, $1.35$ if exerted), locations ($1.35$ slots).
2. **User's Base Scale:** `getCardScale()` reads the current user slider setting from `lorcana_dojo_tweaks` (default $1.0\times$ on desktop, $0.8\times$ on coarse pointer).
3. **Progressive Gap Tightening:** As card count increases beyond 5, the gap between cards smoothly tightens from $12\text{px}$ down to $3\text{px}$, leaving maximum horizontal room for card art.
4. **Single-Row Scaling:** Calculates the exact scale factor to fit all cards horizontally on 1 row across the full container width.
   - For up to ~18–22 cards on desktop, cards remain strictly on **1 single row** with `flex-wrap: nowrap` ($0.44 \le \text{scale} \le 1.0$).
   - Only for extreme card counts (>22 cards) does it gracefully wrap to 2 rows while continuing to scale.

### **13.4 Dynamic Hand Overlap (`calcHandOverlap`)**

When a player holds $7+$ cards in hand, `calcHandOverlap` computes a progressive negative margin `--hand-overlap` (scaling from `-32px` up to `-62px`), keeping high-card-count hands contained horizontally without overflowing.

### **13.5 Resizing & Tweaks Synchronization**

- **Tweaks Slider:** Adjusting `tweak-card-size` immediately re-renders the active board so fields re-evaluate their fit relative to the new base scale.
- **Window Resize:** A `resize` listener on `window` updates field layouts dynamically when the browser window is resized or sidebars toggle.

---

## **14\. Feature 29: Offline Hardening (v2.11.0)**

Extends §12 (offline name fallback). Two parts: more info on the fallback, and making the artwork
that *did* load stop disappearing.

### 14.1 Strength / willpower on the card fallback

`makeCardStats(dbCard, className)` (next to `makeCardFallback`) returns a `.cf-stats` row, or `null`
for cards with neither stat (Actions, Songs, Items, `cardId: -999`). Appended by `makeCardFallback`
and by `showPreview`'s text fallback.

- Layout: absolute along the bottom edge, `justify-content: space-between`, strength left / willpower
  right. `.cf-wp { margin-left: auto }` keeps willpower on the right when there's no strength (a
  Location has `willpower` but no `strength`).
- Tags are CSS `::after` letters `S` / `W`, **deliberately not** ⚔/🛡 glyphs — those are missing or
  render as color emoji depending on platform, at every tile size from 18px to 140px.
- Inherits the §12.5 container-query sizing, so no extra scaling work.

### 14.2 Why the images were dropping — and what's possible

Measured against the real hosts:

| Host | Headers |
|---|---|
| `api.lorcana.ravensburger.com` (card art) | `Cache-Control: public, max-age=604800`, **no** `access-control-allow-origin`; a request carrying an `Origin` header gets **403**. |
| `cdn.jsdelivr.net` (allCards.json) | `access-control-allow-origin: *`, `max-age=604800`. |

Consequence: card art **cannot** be `fetch()`ed, so **blob caching in IndexedDB, canvas→dataURL, and
Cache Storage are all off the table** for it. Only an `<img>` (which sends no `Origin`) can pull it.
A Service Worker could cache opaque responses, but that needs a second file and would break the
single-file rule (§5.1). Don't re-litigate this without re-checking those headers.

So the failures were: (a) `img.onerror = () => img.remove()` was permanent — one flaky request
blanked a card until the next full render; (b) `loading="lazy"` meant off-screen cards were never
fetched, so they weren't in the cache when the connection died; (c) nothing kept cache entries alive
under mobile memory pressure.

### 14.3 The fix — a live-reference warm pool

Keeping a **live `Image` object** per URL for the session keeps that resource in the browser's
in-memory cache, so every `<img>` a later `render()` builds resolves with **no network**.

| Member | Purpose |
|---|---|
| `imgWarmPool` | `url -> HTMLImageElement`. Held on purpose — this Map *is* the cache pin. Never clear it mid-session. |
| `imgWarmSeen` | URLs already queued; stops `render()` re-enqueueing every time. |
| `imgWarmFails` | Consecutive failures per URL; gives up at `IMG_WARM_MAX_ATTEMPTS` (3). |
| `collectSessionImageUrls()` | Every card image in **both decks, all 5 zones, plus `stackedCards`**, plus the card back. |
| `warmImages(urls?)` / `_pumpImageWarm()` | Queue + drain at `IMG_WARM_CONCURRENCY` (6), with 1s×attempt backoff. |
| `onBackOnline()` | `online` listener (bound in `DOMContentLoaded`): clears fails, re-warms, re-renders. |

`render()` calls `warmImages()` at its tail — cheap, since only unseen URLs do work.

### 14.4 Per-`<img>` changes

- `makeCardImg(dbCard, opts)` — `opts.lazy === false` drops `loading="lazy"`. `createCardElement`
  passes it (board cards are on screen already); grids keep lazy.
- `_onCardImgError(img)` replaces `img.remove()`: sets `visibility: hidden` (kills the broken-image
  glyph, reveals the fallback) and retries twice via `removeAttribute('src')` then re-assign —
  re-assigning the *same* `src` is a no-op, the attribute has to be removed first. `onload` clears
  the visibility. `cardThumbHtml`'s inline handlers do the same.
- `showPreview` now probes full-res → **thumbnail** (which *is* warmed) → text. `_previewProbe` is
  reassigned to the second probe so the stale-hover guard still holds.

### 14.5 Card DB cached in IndexedDB

`allCards.json` is the one thing the app can't start without, and jsdelivr allows CORS, so it *can*
be stored. `loadCardDatabase()` (used by `init()`): read `lorcana_dojo_cache` → `kv` →
`allCardsText`; if present, boot from it and refresh in the background; else fetch, boot, store.
Stored as **text** — a 9 MB string clones through IndexedDB much faster than the object graph.
Effects: offline reload boots a playable session instead of "Error loading database", and warm
starts skip the download. `idbGet`/`idbSet` swallow their own errors (private mode, quota).



