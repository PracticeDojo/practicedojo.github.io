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


