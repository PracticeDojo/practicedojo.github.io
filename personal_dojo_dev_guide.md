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


