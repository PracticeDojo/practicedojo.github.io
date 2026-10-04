# Duels.ink Replay JSON Structure Analysis

This document outlines the structure of the `.json` replay logs exported from duels.ink (e.g., `019ea30a-6bbf-7518-8736-fd4db478b072_p1.json`) and explores how we can leverage this data to reconstruct the "Multiverse Tree" within the Practice Dojo.

## 1. High-Level JSON Structure

The replay file is a single JSON object containing metadata, the initial game state, and a chronological list of state deltas (patches).

```json
{
  "format": "duels-replay-v1",
  "gameId": "019ea30a-6bbf-7518-8736-fd4db478b072",
  "perspective": 1,
  "createdAt": 1780852400133,
  "playerNames": { "1": "HeavenIdeas", "2": "Mia Ies" },
  "winner": 1,
  "victoryReason": "lore",
  "turnCount": 10,
  "baseSnapshot": { ... }, // The complete initial state of the game
  "frames": [ ... ]        // The chronological array of actions and state patches
}
```

### 1.1 `baseSnapshot`
This object contains the complete state of the game at the very beginning (during the coin toss / mulligan phase).
- `myPlayer`: Contains arrays for `hand`, `field`, `items`, `inkwell`, `discard`, and `deckOrder`. Notably, it includes **full card objects** (with `id`, `name`, `cost`, `color`, `rulesText`, `imageUrl`, etc.) and unique `instanceId`s for every card.
- `opponent`: Contains counts (e.g., `handCount: 7`, `deckCount: 53`) and empty arrays, since from `perspective: 1`, the opponent's private information is hidden.
- `firstPlayer`: Indicates who won the coin toss / is going first.

### 1.2 `frames`
The `frames` array is the core engine of the replay. Instead of text lines, the game state is advanced using **JSON Patch (RFC 6902)** operations.

A typical frame looks like this:
```json
{
  "seq": 4,
  "actionType": "ADD_TO_INK",
  "player": 1,
  "turnNumber": 1,
  "patch": [
    {
      "op": "add",
      "path": "/myPlayer/inkwell/0",
      "value": { /* full card object */ }
    },
    {
      "op": "remove",
      "path": "/myPlayer/hand/6"
    }
  ],
  "takenAction": {
    "type": "ADD_TO_INK",
    "player": 1,
    "cardId": "10-57",
    "cardInstanceId": "019ea30a-6bc1-7579-8780-3c4c5653bea7",
    "cardName": "Olaf - Helping Hand",
    "source": "hand"
  }
}
```

- `actionType`: A high-level categorization of the action. Known types include: `CHOOSE_STARTING_PLAYER`, `MULLIGAN`, `ADD_TO_INK`, `PLAY_CARD`, `END_TURN`, `ACTIVATE_ABILITY`, `QUEST`, `BOOST`, `RESPOND_TO_PROMPT`, `ATTACK`, `GAME_FINISH`.
- `patch`: An array of JSON patch operations (`add`, `remove`, `replace`) that mutate the state from the previous frame to the current frame.
- `takenAction`: (Optional) A semantic summary of the action. This is incredibly useful for generating human-readable log messages without parsing strings!

---

## 2. Recreating the Multiverse Tree

Currently, `practice_dojo.html` reconstructs the game state by parsing lines of text from a `.md` file, tracking card locations manually, and guessing deck orders.

With the JSON format, the process becomes entirely deterministic and much more robust:

### 2.1 The State Machine Approach
To recreate the multiverse tree, we don't need to guess card locations anymore. We can build a virtual state machine:
1. Load `baseSnapshot` into a `virtualState` object.
2. Iterate through the `frames` array.
3. For each frame, apply the operations in `patch` to `virtualState`. (We can use a lightweight JSON patch library or write a simple applicator for `add/remove/replace`).
4. This ensures that at any given frame, `virtualState` perfectly matches the engine's internal state.

### 2.2 Generating Tree Nodes (Bookmarks)
In the current implementation, a bookmark node is saved at the turn boundary. We can replicate this:
- Monitor `actionType === 'END_TURN'`.
- When `END_TURN` occurs, we have reached a turn boundary.
- We then take the *current* `virtualState` and map it to the Practice Dojo's internal `App.state` schema (e.g., mapping `myPlayer.hand` to `state.players[0].hand`, translating `instanceId` to our format, applying the `drying` and `exerted` flags correctly).
- Save this mapped state as a bookmark node.

### 2.3 Generating the Node Comment
In the `.md` import, the node `comment` is created by filtering out boilerplate markdown log lines.
With JSON, we can build a much cleaner `comment` by iterating over the `takenAction` objects accumulated during that turn:
- `ADD_TO_INK`: "- Player 1 inked `takenAction.cardName`"
- `PLAY_CARD`: "- Player 1 played `takenAction.cardName`"
- `QUEST`: "- Player 1 quested with `takenAction.cardName` for `takenAction.loreGained` lore"
- `ATTACK`: "- Player 1 challenged `takenAction.targetName` with `takenAction.cardName`"

This allows us to generate perfect, standardized markdown summaries for the tree nodes without any brittle regex parsing.

### 2.4 Handling Deck Inference and Hidden Cards
Because the JSON is from `perspective: 1`, the opponent's hand and deck order are mostly hidden. When mapping to the Practice Dojo state (which expects full visibility for sandboxing), we use an "Unknown Placeholder" (`cardId: -999`) for the opponent's hidden cards.

To construct the final deck summary strings (`deck1` and `deck2`) for the UI:
1. **Embedded Decklists**: The `.json` export natively includes a top-level `decklist` array containing the exact 60 cards for the player who exported the log (tracked by `perspective`). We use this to generate a 100% accurate deck string without any inference!
2. **Deduplication via instanceId**: For the opponent, we must infer their deck based on cards they play or ink. To prevent inflating the deck size (e.g., counting a character 5 times if it stays on the field for 5 turns), we track the `instanceId` of every card. `instanceId` is a unique UUID assigned to the physical card. By storing discovered cards in a `Map<instanceId, cardId>`, we perfectly deduplicate the opponent's inferred decklist.

### 2.5 Card ID Formatting (`set-number` vs Numerical)
`duels.ink` identifies cards natively using a "set-number" format (e.g., `"10-57"`). However, standard LorcanaJSON databases (like the one used in the Dojo) index cards using numerical integers (e.g., `145`). 

If we pass `"10-57"` directly into the UI state, the Dojo will fail to find the card and render an "Unknown Card". To bridge this gap, the Dojo's `resolveCardName` function uses regex `^(\w+)-(\d+)$` to detect the `duels.ink` format and match it against the `setCode` and `number` fields in the LorcanaJSON database, retrieving the correct numerical ID before instantiating the card.

## 3. Next Steps for Implementation

1. **JSON Patch Applicator**: We need a small function to apply `op: "replace" | "add" | "remove"` to a JS object given a JSON Pointer `path`.
2. **State Mapper**: Write an adapter function that takes a `duels.ink` state snapshot and maps it to the `App.state` schema expected by Practice Dojo (handling P1/P2 assignments and card property mapping).
3. **Turn Grouping Engine**: A loop that applies patches, accumulates `takenAction` summaries, and spits out a Multiverse Timeline array when it hits `END_TURN` frames.
4. **UI Integration**: Update the "Import Duels.ink Log" modal to accept `.json` files and route them through this new parser.
