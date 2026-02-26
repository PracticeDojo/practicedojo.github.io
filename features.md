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

# Progress

- [x] Feature 1: Manual Lore Scoring
- [x] Feature 2: Text on the Nodes should respect new lines
- [x] Feature 3: Loading Example Sessions
- [x] Feature 4: Inspect Discard Piles
- [x] Feature 4.1: Allow to return cards from discard to deck and/or hand
- [x] Feature 5: Zoom control in the tree view
- [x] Feature 6: Fix the "Orphan Nodes" issue
- [x] Feature 7: Turn Comments should be for each player

