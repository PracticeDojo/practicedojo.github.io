# Features Document

This is a document to track the features of the Practice Dojo.

# Features

## Feature 1: Manual Lore Scoring

### User Story
As a player, I want to be able to manually score lore points for myself and my opponent so that I can keep track of the game state.


## Feature 2: Text on the Nodes should respect new lines

### User Story
As a player, I want new lines to be respected on the text on the nodes so that I can add notes to the nodes.

## Feature 3: Loading Example Sessions

### User Story
As a player, I want to be able to load example sessions so that I can practice with different scenarios.

### Details
- Load them from ../multiverse_examples/ folder in the repo. 
- Add a dropdown to select the example session. In the main Intro Screen.
- Add a button to load the example session. In the main Intro Screen.

## Feature 4: Inspect Discard Piles

### User Story
As a player, I want to be able to inspect the discard piles of both players so that I can keep track of the game state.

### Details
- Use the same way that you can inspect the deck in the main game. Using the right click context menu. But No need to allow reordering of the discard pile. or reshuffling the discard pile.

### Feature 4.1: Allow to return cards from discard to deck and/or hand

### User Story
As a player, I want to be able to return cards from the discard pile to the deck and/or hand so that I can practice with different scenarios.

### Details
- Use the same way that you can return cards from the deck to the hand in the main game. Using the right click context menu. 


## Feature 5: Zoom control in the tree view

### User Story
As a player, I want to be able to zoom in and out of the tree view so that I can better see the nodes.

### Acceptance Criteria
- The tree view should be zoomable using the mouse wheel.
- The zoom should be smooth and responsive.
- The zoom should be tied to the mouse wheel.
- The zoom should be able to be reset to default.


### Details
- Add a zoom control in the tree view tied to the mouse wheel.


## Feature 6: Fix the "Orphan Nodes" issue

### User Story
As a player, I want the tree view to be a true representation of the game history, without any "orphan nodes" (nodes that are not connected to the main tree), so that I can trust the visualization and easily navigate through the game history.

### Details
- When loading a session, ensure that all nodes are properly connected to the tree.
- Fix the issue where some nodes appear disconnected from the main tree.
- Ensure that the tree view accurately reflects the game history, with proper parent-child relationships between nodes.

## Feature 7: Turn Comments should be for each player

### User Story
As a player, I want the turn comments to be for each player so that I can keep track of the game state. 

### Details
- At the moment the comments for the turn appear for both players. I want them to be for each player separately.
- when the change of turn happens, the comments should be updated for each player separately.

## Feature 8: Allow a mode that Creates a Save every turn

### User Story
As a player, I want the practice dojo to automatically save the game state every turn so that I can easily resume the game later.

### Details
- There should be a custom tickbox that allows the practice dojo to automatically save the game state every turn.
- The state save should be stored in the same way as the current saves.
- The save should be named in a way that indicates the turn number and the player that was playing.

## Feature 9: Cloud Session Saving/Loading

### User Story
As a player, I want to be able to save and load practice sessions to/from a Supabase database so that I can easily share scenarios or move between devices.

### Details
- Replace the static Example Sessions dropdown with a dynamic list pulled from a `dojo_sessions` table in Supabase.
- Add a "Save to Cloud" button in the Timelines Drawer to instantly push the current serialized state up to the database.

## Feature 10: Replace cards in deck

### User Story
As a player, I want to be able to Replace cards in the deck so that I can practice with different scenarios.

### Details
- When we inspect the deck we should add an option to Replace the cards in the deck.
- The option should be to "replace" a card in the deck with another card. 
- You right click on a card in the deck and select "replace" from the context menu.
- This will open a fuzzy search that allows you to search for cards and add them to the deck and remove the other card that was there before.
- The search should be filtering for the 2 legal colors of your deck.
- Once you've replaced as many cards as you want, only when you click on the existing "Save Custom Order" button, it will save the deck like normal and create the corresponding bookmark like we do now.


## Feature 10.1: Replace all copies of a card in the deck

### User Story
As a player, I want to be able to replace all copies of a card in the deck so that I can practice with different scenarios.

### Details
- When we inspect the deck we should add an option to replace all copies of a card in the deck.
- The option should be to "replace all copies of" a card in the deck with another card. 
- You right click on a card in the deck and select "replace all copies of" from the context menu.
- This will open a fuzzy search that allows you to search for cards and add them to the deck and remove all copies of the other card that was there before.
- The search should be filtering for the 2 legal colors of your deck.
- Once you've replaced all copies of the card you want, only when you click on the existing "Save Custom Order" button, it will save the deck like normal and create the corresponding bookmark like we do now.


## Feature 11: Transparent BG in the Timelines Modal GUI

### User Story
As a player, I want the timelines modal GUI to have a transparent background so that I can see the game state behind it.

### Details
- The timelines modal GUI should have a transparent background so that I can see the game state behind it.
- The background should be semi-transparent so that I can see the game state behind it.
- The BG should be slightly blurred so that I can see the game state behind it.




## Feature 12: Keyboard Navigation in Multiverse Tree

### User Story
As a player, I want to be able to navigate the node graph using the keyboard arrows and hit enter to load the state, so that I can quickly explore timelines without using the mouse.

### Details
- Allow the user to navigate the node graph using the keyboard arrows.
- When you hit enter, load that state.



## Feature 13: Allow markdown for comments on nodes

### User Story
As a player, I want to be able to use markdown in the comments on nodes so that I can format them nicely.

### Details
- Allow the user to use markdown in the comments on nodes.
- The markdown should be rendered in the tree view.
- The markdown should be rendered in the node details panel.


## Feature 14: Save cards played that turn when autosaving

### User Story
As a player, I want the practice dojo to save the cards and represent the cards played that turn when autosaving so that I can easily see what cards were played that turn.

### Details
- When the practice dojo autosaves, it should also save the cards played that turn as a visual representation in the node.
- We should reuse the information that we already have in the game state for the cards played that turn.
- We shouldn't duplicate the data in the JSON. This is only a visual representation.


## Feature 15: Detect when the Branch is over

### User Story
As a player, I want the practice dojo to know when a branch is over and the game has been won or lost so that it can visually represent that in the node.

### Details
- When a player reaches 20 lore or more, the branch is over. 
- The same applies if the other player reaches 20 lore or more.
- The game ends, and the branch is over, save that state.
- Display a message on the main screen. And have a dialog window that asks if they want to go to the multiverse view to see other timelines.
- If they choose to go to the multiverse view, the tree should automatically center on the current node and zoom out so that the current node is fully visible.
- Make sure to color the node in the colors of the players deck colors, ie if they are playing ruby/amethyst then color the node with the red/purple colors.

## Feature 16: Color timeline nodes based on active player
### User Story
As a player, I want the timeline nodes in the Multiverse Tree to be colored based on the active player so that I can easily visually distinguish which player's turn the saved state belongs to.

### Details
- The nodes in the Multiverse Tree should be colored using the active player's HUD border color.
- Player 1's color is Orange (#a86b32) and Player 2's color is Purple (#3f2e70).
- When a node is automatically or manually saved, it should receive the correct active player color.

## Feature 17: Importing Logs from Duels ink

### User Story
As a player, I want to be able to import logs from Duels.ink into the practice dojo so that I can easily see the game state and continue from any turn that I want.

### Preparation
- I have a log under `/practice_dojo/logs/log_example_v01.md`
- Consume it and extract how the came states are represented in the md file.
- Create a game state converter for each turn in the log that is compatible with the current game state format. So that the state is the same as the actual game state.
- at the beginning there are opening hands and mulligans that show cards from both players. assume that you won't know all the cards of the deck, but you can infer them from the cards that are played during the game. As well as these first hands and mulligans.
- Keep track of all the cards and try to rebuild the order of the deck. you can create "unknown cards" placeholders for the rest of the deck that you don't know.
- Make sure that these place holders are able to be swapped out for other cards if needed (using the current card swapping system).
- If the user doesn't like the rebuilt deck, they can always edit the deck manually using the current card editing system. 

### Details
- When a player imports a log from Duels.ink, it should be saved to the practice dojo as a new node.
- The node should be colored in the colors of the players deck colors, ie if they are playing ruby/amethyst then color the node with the red/purple colors.


## Feature 18: Swapping cards in your hand

### User Story

- I want to be able to swap cards that I have in my hand for other cards in the same way that we have for the deck. 


### Details
- When right clicking a card should add the option to swap the card. 
- It should use the same exact modal as swapping cards in the deck.
- When the modal closes, it should update the hand in the current game state.
- The search should be filtering for the 2 legal colors of your deck.
- If one or more cards were swapped, when I save a bookmark, both manually or autosave, the new state should display the correct hand, not the original hand. And it should branch into a different branch.


## Feature 19: Drag card to opponents card to perform Challenge

### User Story
As a player, I want to be able to drag a card from my board to an opponent's card so that I can perform a challenge.
An Arrow should appear linking the two cards.

### Details
- When a player drags a card from their board to an opponent's card, it should perform a challenge.
- An arrow should appear linking the two cards.
- The challenge should be resolved in the same way as the actual game:
  - Add damage equal to the challenger's strength + modifiers from card effects like "challenger". 
  - And substract any damage counters depending on the defender's ability like "resist".
  - Do the oppossite for the challenger. Add damage counters based on the defender's strength + modifiers like challenger.
  - And substract any damage counters depending on the challenger's ability like "resist".
  - If the defending character has 0 strength or less, it should be sent to the discard.
  - If the challenger character has 0 strength or less, it should be sent to the discard.
- The game state should be updated accordingly.


## Feature 20: Add button to fill in all unknown cards in a deck

### User Story
As a player, I want to be able to click a button that fills in all the unknown cards in my deck with real cards and appropriate quantities so that I can have a more accurate representation of my deck.

### Details
- When a player clicks a button, it should fill in all the unknown cards in their deck with real cards.
- The cards should be inferred based on the cards already in the deck and the cards that have been played during the game.
- For the cards that are in the deck, it should try to match the quantities of the cards that are already in the deck.
- It can ask the user to select one of the existing decks from the practice dojo to use as a base for the unknown cards.
- Otherwise the user can paste a decklist that they want to use as the basis.
- If the player doesn't like the cards that were chosen, they can always click the button again to choose different cards.


## Feature 21: Import Duels.ink Replays (JSON / .replay)

### User Story
As a player, I want to import a Duels.ink `.json` / `.replay` export (format `duels-replay-v1`) into the Practice Dojo so that the multiverse tree is reconstructed deterministically — without the brittle text parsing the `.md` importer relies on.

### Details
- Accepts the JSON replay through the same "Import Duels.ink Log" modal (paste or file). File picker accepts `.md`, `.txt`, `.json`, `.replay`.
- The replay is a state machine: a `baseSnapshot` plus a `frames` array of RFC 6902 JSON Patch operations. The importer applies the patches to a virtual state and snapshots one bookmark node per player-turn (each `END_TURN`).
- Card identities use the duels.ink `"setCode-number"` id (e.g. `"10-57"`), resolved against LorcanaJSON's `setCode`/`number` via a new set-number index.
- **Deck-order deduction is preserved and strengthened:** the perspective player's deck order comes from the live `myPlayer.deckOrder` (deck top = last element, reversed for the Dojo), and the deck *string* comes from the embedded exact `decklist` (100% accurate). The opponent's deck is shown as unknown placeholders, with its deck string inferred from revealed cards, deduped by `instanceId`.
- Node comments are built from each frame's semantic `takenAction` (ink / play / quest / challenge / activate), so summaries are clean with no regex parsing.
- The `.md` importer is unchanged and fully backward compatible; the format is auto-detected.


## Feature 22: Read Gzipped (.replay.gz) Replays

### User Story
As a player, I want to import the gzipped replay files Duels.ink gives me (`*.replay.gz`) directly, without having to decompress them first.

### Details
- Duels.ink replay downloads are gzip-compressed (`<gameId>_p1.replay.gz`). The importer now auto-decompresses gzip on import — magic-byte sniffed (`1f 8b`) and decompressed in-browser via `DecompressionStream`, falling back to plain-text decoding for uncompressed files.
- The file picker accepts `.gz` (alongside `.md`, `.txt`, `.json`, `.replay`). Plain pasted text still works as before.
- Everything stays self-contained in the single HTML file — no servers or external services.
- (A direct "load my games from the Duels.ink API" feature was explored but dropped: Duels.ink serves no CORS headers, so a static single-file app can't call it without an external proxy, which we chose not to add.)


## Feature 23: Craft Ideal Starting Hand

### User Story
As a player, at the start of my first turn I want to craft my ideal starting hand instead of relying on a random draw or mulligan, so I can theorycraft from a specific opening.

### Details
- A "Craft Hand" button sits next to "Mulligan" and shares the same visibility (turn 1 only, until the active player has mulliganed or crafted).
- Opens a modal showing every **unique** card in the player's deck (the whole 60-card pool reconstructed across all zones).
- Left-click a card to add a copy to the starting hand; right-click removes a copy. Copies are capped at how many the deck actually contains (e.g. a 3-of can't be added a 4th time).
- The hand must total exactly 7 cards before Confirm is enabled. A live counter and a per-card `selected/available` badge guide the user.
- On confirm: the chosen cards become the hand, the remaining cards become the shuffled deck, other zones (field/inkwell/discard) and ink are reset, and the player is locked out of further mulligan/craft (sets `hasMulliganed`).
- Stays self-contained in the single HTML file.


---

# Refactor

## Refactor 1: JSON format

### User Story
As a developer, I want the JSON game state to be way more optimized and organized.

### Details
- The JSON Structure is bloated and is not optimized. 
- It contains a lot of redundant information.
- It is not very organized.
- It is not very efficient.
 


# Progress

- [x] Feature 1: Manual Lore Scoring
- [x] Feature 2: Text on the Nodes should respect new lines
- [x] Feature 3: Loading Example Sessions
- [x] Feature 4: Inspect Discard Piles
- [x] Feature 4.1: Allow to return cards from discard to deck and/or hand
- [x] Feature 5: Zoom control in the tree view
- [x] Feature 6: Fix the "Orphan Nodes" issue
- [x] Feature 7: Turn Comments should be for each player
- [x] Feature 8: Allow a mode that Creates a Save every turn
- [x] Feature 9: Cloud Session Saving/Loading
- [x] Feature 10: Replace cards in deck
- [x] Feature 10.1: Replace all copies of a card in the deck    
- [x] Feature 11: Transparent BG in the Timelines Modal GUI
- [x] Feature 12: Keyboard Navigation in Multiverse Tree
- [x] Feature 13: Allow markdown for comments on nodes
- [x] Feature 14: Save cards played that turn when autosaving
- [x] Feature 15: Detect when the Branch is over
- [x] Feature 16: Color timeline nodes based on active player's color
- [x] Feature 17: Importing Logs from Duels.ink
- [x] Feature 18: Swapping cards in your hand
- [x] Feature 19: Drag card to opponents card to perform Challenge
- [ ] Feature 20: Add button to fill in all unknown cards in a deck
- [x] Feature 21: Import Duels.ink Replays (JSON / .replay)
- [x] Feature 22: Read Gzipped (.replay.gz) Replays
- [x] Feature 23: Craft Ideal Starting Hand
