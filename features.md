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
