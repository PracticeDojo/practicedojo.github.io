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


## Feature 24: auto updating card probabilities

### User Story

- As a player I want to know the probabilities of drawing a certain card in my deck at any moment. 

### Details
- At any point in the game a right side pane should show what the probabilities of you drawing a certain card is, based on the cards in your deck and the cards in your hand and discard pile, cards played etc.
- it should do this using the hypergeometric probability of drawing cards that is a standard in calculating these odds for card games. 
- the probabilities should be updated in real-time as the game state changes.
- it should be a compact panel, that doesn't take up too much space, but is still easy to read.
- full card name only, no card details. Only if you hover over the you should show a image of the card in the left panel card details section.
  
  

## Feature 25: Mulligan draw odds

### User Story
As a player, while choosing which cards to mulligan I want to see live draw odds that account for the cards I've marked to throw back, so I can make that decision with real numbers instead of gut feeling.

### Details
- The mulligan modal gains a compact odds panel (same row style as the Draw Odds pane) beside the 7 opening-hand cards. It updates in real time as cards are marked/unmarked.
- Models the exact Lorcana mulligan: marked cards go to the **bottom** of the deck, the replacements are drawn from the top (so marked cards can never appear among the redraws), and only then is the deck shuffled (so marked copies **do** count again for later turn draws).
- Columns, with M = number of cards currently marked:
  - **RD (Redraw)** = P(at least one copy among the M replacement draws).
  - The three draw windows = **cumulative** P(at least one copy in the redraws OR in the next N turn draws). Uses the same editable window values (default 1/2/3) as the main Draw Odds pane.
- Rows are the whole card pool, same as the main pane: copy-count badge (copies drawable from deck), ink-colored names, grayed when a card can no longer be drawn, hover shows the card preview in the left panel.
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
 


## Feature 26: Design-system hardening (v2 file)

### User Story
As a player, I want the Dojo's high-stakes moments (winning, saving, deleting, errors) to feel like part of the app instead of raw browser popups, and I want the whole tool to be usable by keyboard.

### Details
- Shipped in `practice_dojo_v2.html` (A/B against untouched `practice_dojo.html`; test protocol in `TEST-PROTOCOL-v2.md`).
- Reusable styled dialog component replaces every native `confirm`/`prompt`/`alert`; game over gets a celebratory trophy dialog.
- Deleting a multiverse node or auto-save shows an Undo toast (8s) instead of deleting silently; deleting the active node moves the pointer to its parent.
- Keyboard/screen-reader access: cards focusable with Enter/Space opening their menu, context-menu items are real buttons with arrow-key navigation, Escape closes menus and dismissible modals, modals carry dialog ARIA.
- Multiverse tree, toasts, auto-save list ported from legacy Tailwind purple/gray onto the design tokens; bookmark colors stored as `--p1`/`--p2` token refs so they follow palette tweaks; legacy hex colors mapped at render.
- Victory nodes: trophy icon + winner's deck-ink gradient as a left edge strip and background tint (`is-victory`), replacing the old border-image hack; mono-ink winners use their single ink color.

## Feature 27: Offline card-name fallback

### User Story
As a player on mobile with a flaky or absent connection, I want every card to still show its name when the artwork can't be downloaded, so I can keep playing a session instead of staring at blank rectangles.

### Details
- Every face-up card face paints a text layer (card name, version/subtitle, ink cost) **underneath** the artwork. When the image loads it covers the text completely, so nothing changes visually while online.
- If the image fails to load (offline, blocked, 404) the `<img>` removes itself, revealing the name — no broken-image glyph. The text is also visible during the load, acting as a placeholder.
- Covers every surface that shows a card: board (hand / field / inkwell / discard / stacks), Inspect Deck, Inspect Discard, mulligan hand, Craft Hand pool, card-search results, the timeline-node and auto-save "Cards Played" thumbnail strips, and the sidebar hover preview.
- The fallback text auto-scales to the size of the tile it sits in, so it's readable on an 80px board card and on a 35px timeline thumbnail alike.
- Face-down cards (opponent hand, un-flipped inkwell) are unaffected — no hidden information is leaked.
- Stays self-contained in the single HTML file.

## Feature 28: Dynamic Play-Area Card Auto-Scaling / Responsive Fit

### User Story
As a player, when I put more and more cards into the play area (across any base card-size setting), I want the cards to dynamically auto-scale and fit into the available area so that the full board remains visible on a single row without having to scroll down.

### Details
- Cards on the field (`#top-field` and `#bottom-field`) aggressively prioritize staying in **1 single row** with `flex-wrap: nowrap` for up to ~18–22 cards on desktop.
- Dynamically tightens the gap between cards ($12\text{px}$ down to $3\text{px}$) as card density grows, maximizing space for card art.
- Computes an optimal `--field-scale` multiplier ($0.44 \le \text{scale} \le 1.0$) based on active card density (characters, items, locations, exerted states) and container width.
- Scoped custom properties (`--card-w`, `--card-h`, `--field-gap`, padding) cleanly downscale independent cards, shifted stacks, location cards, and characters stacked at locations in sync.
- Works seamlessly across all user-selected base size settings in the Tweaks panel (`0.7×` to `1.4×`), scaling down proportionally from the user's chosen base size when density demands it.
- Dynamically compresses hand overlap (`--hand-overlap`) when a player holds 7+ cards, preventing horizontal hand overflow.
- Window and viewport resize events automatically recalculate and apply optimal card scaling in real time.
- Preserves a legible scale floor ($0.44\times$) so card artwork, damage counters, drying badges, and hover action chips remain crisp and clickable.
- Stays self-contained in the single HTML file.

## Feature 29: Offline hardening — card stats on the fallback + images that stay loaded

### User Story
As a player on a flaky or absent connection, I want a card whose artwork can't load to still tell me its strength and willpower, and I want the artwork that *did* load to stay loaded instead of dropping out mid-session.

### Details
- The offline card-name fallback (Feature 27) now also prints **strength** (bottom-left) and **willpower** (bottom-right), tagged `S` / `W`. Cards without those stats (Actions, Songs, Items) show nothing extra; a Location shows just its willpower. Scales with the tile like the rest of the fallback text, and appears in the sidebar hover preview fallback too.
- **Images stop dropping once loaded.** A failed image used to remove itself permanently, so one flaky request blanked that card until the next full render. It now hides (revealing the name) and retries twice, and reconnecting re-renders the board.
- **Both decks are pre-warmed, not just what's on screen.** Every card image across both decks and every zone is pulled into the browser cache in the background (6 at a time) and held by a live `Image` reference for the session, so later renders resolve from memory with no network — the reason cards survive going offline mid-session.
- Board cards load eagerly (they're visible immediately); lazy loading is kept for the big grids.
- The hover preview falls back to the (pre-warmed) thumbnail when the full-res art can't be fetched, and only then to text.
- **The card database is cached in IndexedDB**, so a reload with no connection still boots into a playable session instead of "Error loading database" — and a warm start skips the ~9 MB download. Refreshed in the background for the next launch.
- Stays self-contained in the single HTML file.

## Feature 30: Offline text card in the preview pane

### User Story
As a player whose card artwork can't load — or who just prefers reading text — I want the preview pane to recreate the card from the data: full name, version, type, every ability in full, and the complete stat line.

### Details
- When the full-res art and the thumbnail both fail, the preview pane rebuilds the card as text instead of showing just a name: cost badge (gold circle if inkable, dark hexagon if not), name + version, type/subtype line, **every ability in full**, and a strength / willpower / lore footer (plus move cost for Locations).
- Abilities are rendered from the structured data, not scraped from the printed text: keyword abilities show as `Singer 5` with their reminder text dimmed and italic, named abilities show the ability name in the accent color followed by its effect, and activated abilities show their cost before the em-dash. Song/Action body text is included.
- Set, artist, flavour text, rarity and card number are deliberately left out — they don't affect a decision.
- Lorcana's symbols (ink, exert, strength, willpower, lore) are drawn as inline SVG rather than printed as characters: three of the five are missing from common system fonts and would otherwise show as empty boxes.
- The card's ink color runs down the left edge of the header; dual-ink cards show both.
- **Tweaks → Card preview: Art / Text.** Art (default) shows the artwork and only falls back to text when it can't be fetched; Text always shows the text card. Persisted with the other tweaks; switching redraws the currently previewed card immediately.
- The pane grows to fit a wordy card (up to 34vh) and scrolls beyond that; in Art mode its height is unchanged.
- Needs no network at all — the card data is already in memory, and cached in IndexedDB since v2.11.0.
- Stays self-contained in the single HTML file.

## Feature 31: New display section in Multiverse Tree view Nodes

### User Story
- I want to have more information visually displayed on the multiverse tree view
- I want the individual nodes to show cards inked, banished in a similar fashion to how currently we have "Cards Played"
- I want to have this view be the default but have a compact view where the nodes are displayed like now, only displaying cards played

### Details
- the nodes should still have a fixes height. in this new default view they should be higher to display the different sections
- the sections in order should be: Cards played, Cards Inked, Cards Banished. 
- we should implement this in a modular way so that if in the future we want to add new section it's trivial
- we need to make sure that this works with logs imported from duels.ink as well as the normal logs creted by the dojo.


## Feature 32: Text only mode

### User Story
- As a player, I want to have a text only mode for the game
- I want to have a text only mode for the game that removes all card images and only displays the card text

### Details
- This should use the existing card text functionality from Feature 30
- the card should be displayed using the card text
- it should be possible to switch between the two modes using the tweaks menu
- We should make sure that the cards details section works with this mode as well for all cards like we implemented for locations

### Notes
- **One toggle only**: Tweaks → Card display: Art / Text governs the board, every card grid and the preview pane together. The separate preview-only Art/Text row from Feature 30 was removed — two near-identical rows just meant the wrong one got clicked.
- Inkable vs uninkable is shown on the text face the way the card prints it: a gold disc for inkable, a dark hexagon for uninkable, plus a flatter face tint on uninkable cards so the two stay distinguishable at the smallest card sizes.
- Text mode makes no card-image requests at all: the image warm pool is skipped and the face-down card back becomes a CSS pattern instead of a remote image.

## Feature 33: Grayscale (Mono) player palette

### User Story
As a player, I want a grayscale palette option in Tweaks that desaturates the whole interface, while still letting me tell the two players apart.

### Details
- Third option in **Tweaks → Player palette**: Modern / Classic / **Mono**.
- No colour anywhere in the interface: chrome, badges, metric bars, timeline nodes, the ink identity strips on cards, and the card artwork itself.
- The two players stay distinguishable by **lightness** rather than hue — P1 reads bright, P2 reads heavy. (Desaturating the normal palette alone would collapse amber P1 and blue P2 into nearly the same gray.)
- Persisted with the other tweaks and applied instantly.
- Stays self-contained in the single HTML file.


## Feature 34: Turn Starting Hand section on multiverse nodes

### User Story
- As a player I want each multiverse node to show the hand I started that turn with, after my draw.
- I want to see at a glance which of those cards left my hand by the time I passed the turn.

### Details
- New section at the **bottom** of the node's section stack: **Turn Starting Hand**.
- Contents = the active player's hand at the start of that turn, captured **after the draw step** (and after a mulligan or crafted hand on turn 1).
- Cards that left the hand during the turn — played, inked, discarded, put back on the deck, anything — are **greyed out and crossed with a diagonal rule**; the cards still held stay in full colour. The section count reads e.g. `7 · −4`, with a tooltip spelling it out.
- Matching is by card instance, so a second copy of the same card isn't wrongly marked.
- The starting-hand row **wraps onto a second line** instead of scrolling sideways, so a whole hand is visible at once. Its thumbnails are one size smaller so a normal 7-card opener still fits on one line.
- Imported Duels.ink logs and replays fill the section from the reconstructed hand, inferring "left" by card id from what was played or inked that turn.

## Feature 35: Cards Quested section on multiverse nodes

### User Story
- As a player I want each multiverse node to show which characters quested during that turn.

### Details
- New **Cards Quested** section, between Cards Banished and Turn Starting Hand.
- Filled by both quest paths: questing a single character and the "quest with everything" action.
- Also appears in the node's turn recap text as a `- **Quested:**` line.
- Imported Duels.ink logs and replays fill it from their quest events.


## Feature 36: "Competition" player palette

### User Story
- I want the default palette to be a new palette Called: Competition 
- I want this palette to take into account the 2 colors of each deck the 2 players are playing and shade their player corresponding areas in the gui in those 2 corresponding colors

### Details

- the player areas should follow this color scheme 
- the nodes in the multiverse should also follow this color scheme. we should make sure that the node left spine that currently is one color has the 2 colors. we should give it 2 different patterns in the spine to differentiate the two different players if they are playing the same colours
- for example player 1 spine should just be split in 2 and have the two colours. while player 2 spine should have a "barber shop 💈" pattern almond the spine of the node displaying it's corresponding 2 colors.

### Notes
- **Competition is now the default palette** (Modern / Classic / Mono remain). Anyone with a palette already saved in Tweaks keeps it.
- The palette is *derived*, not fixed: `applyCompetitionPalette()` reads each player's inks off the live decks and writes them onto `<html>` as `--p1`/`--p2` (the deck's first ink, canonical ink order) plus new `--p1-2`/`--p2-2` (the second ink). Every rule that already read `--p1`/`--p2` therefore picks up the deck colour for free — HUD, lore badges, metric bars, log entries, turn pill, tree connector lines.
- Inks get UI-grade OKLCH values (`inkTokenMap`), not the card-art hexes in `inkColorMap`, so the `-hi`/`-soft`/`-faint` ramps and every `color-mix()` behave, and a Steel deck stays readable on the dark shell. Steel keeps near-zero chroma.
- Re-derived on every `render()`, so loading a session, importing a Duels.ink log or editing a deck repaints the palette. With no game loaded it falls back to Modern rather than painting half a palette.
- **Two weaves, one per player.** Where both inks share a surface they are woven, not blended: **P1 = hard 50/50 split**, **P2 = 45° barber pole**. Colour alone can't tell a mirror match apart — pattern can. The same two weaves appear on the multiverse node spine (6px), the auto-save rows, the sidebar player rows and a hairline along each board half's outer edge, so the mark means the same thing everywhere.
- Board halves wash from the player's first ink at their own edge to the second ink toward the centre line; pile rows carry both.
- Nodes recover their owner via `bookmarkPlayerIndex()` (stored colour → player). Victory nodes store an explicit `playerIdx`, since their colour is the winner's deck ink; pre-existing victory nodes keep their old gradient spine.
- Tweaks shows which pair was picked up for each side, with the player's weave in the chip.
- **v2.17.1 fix:** `getDeckColors()` was already broken and made the palette look inert. Zone arrays hold card *objects* (`{instanceId, cardId, …}`) but only `field` was mapped to ids, so deck/hand/discard/inkwell looked up `cardDB[object]` and found nothing; and a dual-ink card prints `color` as `"Amber-Steel"`, which lowercases to a key no ink map has. Both fixed (`colors` array preferred, hyphen split as fallback). This also repairs the victory-node deck gradient (Feature 15) and the setup-screen ink pair (session summary), which had the same defect.
- **v2.17.1:** one-time migration flips installs that already had `palette: "modern"` in localStorage over to Competition, stamped so a later deliberate switch back is never undone.

## Feature 37: Card interaction redesign (Option A, challenge mode, phone hand & card drawer, ink counter)

### User Story
- As a player I want damage counters and the common card actions to be fast and obvious, without digging through a long menu.
- As a player I want challenging to be reliable — not a fiddly drag between hover controls — and to see the outcome before I commit.
- As a player on a phone I want every card action reachable with a thumb, and a hand that doesn't eat the screen.

### Details
Chosen from the head-to-head prototypes (Option A + "Challenge mode" + "A on phone" + "Hand 1 · Fan" + "Inkwell as a counter").
- **Option A field controls** (both boards, exerted cards too): hover shows a −/+ damage stepper on top and icon verbs down the right edge (Challenge, Quest, Exert/Ready, Banish). A willpower track sits under every card — click a segment to set damage exactly. Damage ≥ willpower pulses the card and shows a one-tap *LETHAL · BANISH* pill.
- **Hover hotkeys** (pointer over a field card): `+` / `−`, `0–9` set damage, `E` exert/ready, `B` banish, `C` challenge. Global `Q` / `T` / `M` / `Space` are unchanged.
- **Context menu** for field cards is grouped (Card / Move / Stack) with key hints, a *Challenge…* entry and an inline damage stepper that stays open.
- **Challenge mode** (top-bar *Challenge*, the card's challenge verb, or `C`): hover controls step aside so the whole card is the drag handle; any of the active player's characters can challenge any opposing card, by dragging or by tapping yours then theirs. Rules are not enforced (sandbox) — exerted / drying / ready targets are noted in the log. You stay in the mode to chain challenges; leave with *Done* or `Esc`. Ending the turn also leaves it, dropping any picked challenger (v2.26.1).
- **Forecast** setting *Off / Light / Full* (banner + Tweaks): Light = one line over the target; Full = forecast card, striped ghost damage on both tracks, a hatch on anything that would be banished and an outcome badge on every opponent. Also shown when dragging a character onto an opponent outside the mode.
- **Touch devices**: tapping a field card opens the **card drawer** — damage segments, ±1, Challenge / Quest / Exert / Banish, then To hand / Deck top / Deck bottom / Put under (+ Leave location / Separate stack when they apply, and Preview). Challenge from the drawer uses tap-to-target with outcome badges.
- **Phone hand (≤760px)**: the hand is a fan peeking up from the bottom edge. Tap to fan it out, tap a card for a large view with Play / Ink / Swap / Discard / Deck top / Deck bottom, or drag a card straight up onto the field, the ink counter or a matching character (shift).
- **Inkwell as a counter**: ready / total (`4/5`), one pip per ink, a `+1` tag once inked this turn. Still a drop target. Click/tap it for the inkwell panel (popover on desktop, bottom sheet on phones): Spend 1, Ready 1, Ready all, and each ink card with Ready↔Exerted, To hand, Discard.
- **Animations**: exert/ready rotate, damage shakes + flashes + floats the amount, quest lifts the card, played/shifted cards arrive, banished cards fade; challenge lunges the attacker. All off under *prefers-reduced-motion*.


## Feature 38: Deck & session library on this device (ARCH Phase 1, v2.19.0)

### User Story
- As a player I want every match I play to be kept on my device, so I can come back to any of them, not just the last one, and without signing in.
- As a player I want my own decks and a set of default decks one click away when I start a match.
- As a player I want the sessions I import or share to be safe to open, even when they come from someone else.

### Details
Phase 1 of `docs/ARCH-accounts-and-library.md`. Nothing here needs an account or Supabase.
- **`app/js/library.js` (`DojoLibrary`)**: IndexedDB database `practice_dojo` with stores `decks`, `sessions` (metadata), `session_blobs` (gzipped file) and `kv` (prefs: `lastSessionId`, `lastDecks`). The card DB cache (`lorcana_dojo_cache`) is untouched.
- **Every match is a session.** Start match, opening a file, a Duels.ink log/replay import and opening a demo each create one. Every change autosaves it (debounced ~1 s, flushed when the tab is hidden). A failed device save now shows a toast instead of failing silently.
- **Home screen** replaces the setup overlay: Continue card (the last session) plus tabs **New match**, **My sessions**, **Decks**, **Demos**.
  - New match: deck pickers list *My decks* and *Default · Set N*; a pasted list gets **Save to My decks**; last match's picks are preselected.
  - My sessions: ink pips, title, turn, lore, nodes, lines, updated time. Open, Rename, Duplicate, Export, Delete.
  - Decks: My decks (P1 / P2 / Edit / Delete) and Default decks (P1 / P2 / Copy to My decks). New deck, Import .txt, From Duels.ink replay (the replay's exact `decklist`). Ink pips and counts are computed from the card DB.
  - Demos: from `app/defaults/demos/manifest.json`. Opening one makes a device copy.
- **Topbar**: editable session title, **Save** and **Save as copy**. The Timelines drawer's cloud *Save* became *Copy*.
- **Session file v2** (`.dojo.json.gz`): `{format, version: 2, app, id, title, savedAt, summary, data}` where `data` is the unchanged v1 payload. Import reads gzipped v2, plain v2 and plain v1.
- **Defaults in the repo**: `app/defaults/decks/manifest.json` (+ one `.txt` per deck) and `app/defaults/demos/manifest.json`.
- **One-time migration**: the old `localStorage['lorcana_dojo_session']` Continue slot becomes a library session and the key is removed. Big multiverses that used to hit the ~5 MB localStorage cap now save.
- **Security (§9.4)**: node names, stats, comments, turn notes and player names from session files are escaped; node comments go through `marked` and then **DOMPurify**; node ids that aren't plain tokens are re-issued on load (they sit inside inline handlers); node colours with `url()` are dropped.
- **No Supabase at startup.** The old project's decks and cloud demos are no longer read or written (D10), and supabase-js is no longer loaded. Phase 2 brings Supabase back in `app/js/cloud.js` for share links.

## Feature 39: Home screen redesign — "The inkwell" (v2.20.0)

### User Story
- As a new player I want the first screen to tell me what to do, and to accept whatever I already have (a decklist, a Duels.ink game, a saved session) without making me find the right button first.
- As a returning player I want my last match one click away, and my sessions and decks out of the way until I need them.

### Details
Chosen from three prototypes in `docs/design/home-redesign/` (option **B**). Replaces the Feature 38 tabbed home screen; the device library underneath is unchanged.
- **One field** ("Paste a decklist or a Duels.ink game"): paste, type, choose a file, or drop a file anywhere on the page. Pasting anywhere on the home screen lands in the field. A **readout** says what it understood and offers the next step:
  - decklist → ink pips, "A 60-card Amethyst/Ruby deck", recognised/skipped → *Play it as you*, *Play against it*, *Save to My decks*
  - Duels.ink text log (Player 1 / Player 2 format) → turn count → *Study this game*
  - Duels.ink replay (`.json` / `.replay.gz`) → players and turns → *Study this game*, *Play my deck from it*
  - session file (`.dojo.json.gz` or old `.json`) → title and summary → *Open it*
  - Duels.ink's newer "You / Opponent" log → says it can't be imported yet and points to the replay file (parsing it is `docs/IMP-newLog.md`, not done)
  - anything else → explains what a decklist and a log look like
- **Example buttons** load the default deck or a sample Duels.ink log (`app/defaults/examples/duels-ink-log.txt`).
- **On the table**: two seats (You / Opponent) with the player's ink weave on a deck box, a card count (amber if not 60), and a clear button. Deck chips (My decks + default decks) fill the first open seat. Last match's saved decks are seated again. An empty seat plays 60 random cards.
- **Pick up again**: the last session first (*Resume*), then recent sessions and any demos. *All sessions* opens the Library.
- **Library drawer** (header button): Sessions (open, rename, duplicate, export, delete, import file) and Decks (seat as You / Opponent, edit, delete, copy a default, new deck, import .txt, from a replay).
- Game hotkeys (M, T, Q, Space…) no longer act on the board hidden behind the home screen. Escape closes the Library first.

## Feature 40: Share links for decks and sessions (ARCH Phase 2, v2.21.0)

### User Story
- As a player I want to send a friend a short link to a deck or a whole multiverse, without either of us making an account.
- As the person who shared, I want to see my links and delete them.

### Details
Phase 2 of `docs/ARCH-accounts-and-library.md` (§9), on the Dojo's own Supabase project (`supabase/migrations/20261004120000_shares.sql`).
- **Share** from the topbar (the match on the board), from Library → Sessions (any saved session) and from Library → Decks (my decks and default decks). The dialog shows the short link `…/app/?s=<10 characters>` with **Copy link**.
- **Creating a link** signs the browser in anonymously, invisibly (no login screen). supabase-js loads only at that moment, pinned with an integrity hash; startup makes no Supabase calls.
- **Opening a deck link** puts the list in the home-screen field as a *Shared deck* with *Play it as you* / *Play against it* / *Save to My decks*.
- **Opening a session link** loads it on the board with a banner, "Shared · <title> · not saved yet · **Save a copy**". Nothing is saved to the viewer's library until they choose to (topbar Save does the same). A reload reopens the link.
- **Library → Shared** lists this browser's links: Copy link, Open in a new tab, Delete (the link then opens as "This share is no longer available").
- Links are frozen snapshots. Limits fail closed with plain messages: 20 links a day and 100 in total per person, sessions up to 10 MB compressed, and new session links pause if shared storage passes 700 MB.
- `.github/workflows/supabase-keepalive.yml` pings the project on Mondays and Thursdays so it never pauses.

## Feature 41: Import Duels.ink's current text logs ("You / Opponent", v2.22.0)

### User Story
- As a player I want to paste the log Duels.ink gives me today and study the game, not only the older "Player 1 / Player 2" logs.

### Details
Implements `docs/IMP-newLog.md`, and goes further where real logs needed it. Old-format logs still import.
- **Both formats, one parser.** "You" / "Player 1" is the log's owner (P1); "Opponent" / "Player 2" is P2. Every line becomes an event for the player who did it, replayed in log order, so actions on the other player's turn count (e.g. the opponent drawing from Demona on your turn).
- **Hidden information:** the opponent's hand starts as 7 unknown cards; their hidden draws are unknown cards; anything they play, ink or discard is named from then on.
- **Now understood:** card names with commas ("Besties, Assemble!"), discounted plays ("cost 4 → 3, LOOSE CHANGE"), cards revealed into hand, discards, songs and their singers, boost / cards put under, cards returned to deck or hand (with the cards under them), damage from challenges, moved damage counters, undo ("took back their action"), cards put into the inkwell from the deck, and activated abilities (exert or banish, read from the card's printed cost).
- **Node snapshots** are taken after the ready and draw steps, like a replay import, so each node shows the board the active player acts on.
- Checked against the replay of the same game (`docs/samples/new_log_20261004.txt` + `01a08b6d-…_p1.replay.gz`): 24 of 27 nodes identical. Of the other three, two are the text import keeping an item on the board that the replay import drops, and one is an exert the log doesn't name a target for.

## Feature 42: Optional accounts — Discord & Google sign-in (ARCH Phase 3, v2.23.0)

### User Story
- As a player who uses the Dojo on more than one device, I want to sign in so my decks and sessions are on all of them.
- As a player who doesn't want an account, I want nothing to change.

### Details
Phase 3 of `docs/ARCH-accounts-and-library.md` (§8). Database: `supabase/migrations/20261004200000_accounts.sql`.
- **Sign in** (home header): *Continue with Discord* (and *Google* once it's switched on in Supabase; the dialog lists whichever providers are enabled). Optional; signed out, nothing loads or calls Supabase. A browser that already shared links is *linked* to the account, so its links come along. If that Discord/Google account already exists, the Dojo offers to sign in to it instead (the links stay with the browser).
- **First sign-in on a device with decks or sessions:** "Save N decks and M sessions from this device to your account?" *All / Choose… / Not now*.
- **Sessions:** autosave stays on the device. **Save** writes the device and the account (revision-checked); a session already in the account is also saved when the tab is hidden with unsaved changes. If it changed on another device: *Overwrite with mine* or *Save mine as a copy*.
- **Library · Sessions** shows *This device · Account*, *Changes not in account* (cloud button saves) or *Newer in account* (cloud button downloads), plus an *Only in your account* group (Open downloads it once). Delete asks *This device / Account / Both*.
- **Decks follow you:** saving a deck when signed in also saves it to the account; account decks are pulled onto the device when you sign in or open Library · Decks. Deleting a linked deck removes it from both.
- **Account menu:** who you're signed in as, usage (sessions of 50, decks of 200), *Sign out*, which asks whether to keep or remove this device's account copies.
- Limits: 200 decks and 50 sessions per account; no new account sessions once the project's storage passes 900 MB. Anonymous share identities can't touch account data.

## Feature 43: Phone player bars, Quest / End turn in the hand tray, ink this turn (v2.24.0)

### User Story
- As a player on a phone I want lore, ink and my piles in one tidy bar per player, with nothing floating on top of the deck or discard.
- As a player I want Quest and End turn where my thumb already is, by my hand.
- As a player I want to see at a glance whether (and how much) I've inked this turn.

### Details
Chosen from three phone mock-ups: the bars of "C · Open bar" with the buttons of "A · Slim strip".
- **Player bars (≤760px):** lore and ink are large numbers straight on each player's bar; lore's −/+ sit stacked beside it, ink pips beside the count in rows of five. Discard and deck are mini cards on the right: discard shows its top card and a count, deck its count; the inspect / deck-menu buttons stay on them. The floating lore badges are hidden on phones. ≤360px: smaller numbers and tighter spacing so 10/10 ink still fits.
- **Quest / End turn** sit in the hand tray, either side of the *Hand · N* label, and hide while the hand is fanned open.
- **Ink this turn (all sizes):** the ink tag now shows the real count (`+2`), and the pips for cards inked this turn get a bright core. On phones the tag reads *+N inked* beside INK, and the current player's bar shows a dashed *No ink yet* until they ink. The opponent's bar keeps showing what they inked on their last turn.
- Desktop layout unchanged.
- **Bigger drop targets (v2.26.0):** on phones the ink counter fills its bar from lore to the piles, so the whole stretch takes a card to ink. On all sizes the field fills its strip, so a card dropped anywhere in the play area (not only on the row of cards) is played.

## Feature 44: Phone hand — one tap to a card, swipe through the hand (v2.25.0)

*Superseded by Feature 49 (v3.2.0): a hand card now opens the card drawer. One tap, swipe and ← / → carry over.*

### User Story
- As a player on a phone, when I tap my hand I want the card I tapped shown big with its actions straight away, not a second tap later.
- As a player I want to tap another card in the fanned hand to switch to it, and swipe the big card left / right to step through my hand.
- As a player in text mode, or offline, I want the big card to show the recreated text card rather than just its name.

### Details
- **One tap:** tapping the closed hand opens the fan *and* focuses the tapped card (big card + Play / Ink / Swap / Discard / Deck top / Deck btm).
- **Switch:** while a card is focused the fan stays above the dim backdrop, so tapping another hand card switches to it. The focused card sits raised with an accent outline.
- **Swipe:** a horizontal swipe on the big card cycles the hand (left = next, right = previous, wrapping at the ends); the card follows the finger and springs back on a short drag. Chevrons either side and ← / → do the same. A *3 / 7* counter sits under the card.
- **Text card:** the big card is the artwork over the recreated text card (cost, name, type line, abilities, stats). Text mode shows only the text card; while the art loads or when it can't load (offline), the text card shows through. A long card's text scrolls vertically without breaking the swipe.
- **Short phones:** the big card shrinks with the viewport height (252px down to 168px) so the actions stay clear of the fanned hand.
- Desktop unchanged.

## Feature 45: Inkwell as cards — in the ink bar on desktop, a compact sheet on phones (v2.26.0)

### User Story
- As a player I want to manage my inkwell without a big panel of near-identical "Face-down card" rows.
- As a player on desktop I want to do it right in the ink bar, without a popup.

### Details
Chosen from three mock-ups ("A · Stepper + ink pips", "B · Compact list", "C · Card tiles"): C.
- **Inkwell cards:** each ink is a small card: the card back when face down, its art with a blue ring when inked this turn. Spent ink is dimmed and tilted. Click/tap one to get *Exert/Ready · To hand · Discard* for it.
- **Desktop (≥761px):** the ink bar itself holds everything; clicking the bar no longer opens a panel. Left: ready count (*4/7 READY*, *+N* inked this turn), −/+ (spend / ready one) and *Ready all*. Right: the ink cards, overlapping like a hand once they don't fit. A clicked card opens up in place with its actions; click it again or press Escape to close. Both players' bars work the same way. Dropping a card anywhere on the bar still inks it.
- **Phones:** the bar keeps its count and pips; tapping it opens a bottom sheet (about 210px for 7 ink, was 565px): count, −/+, *Ready all*, the cards in a grid, and one action bar for the tapped card.
- **Putting a card down (desktop):** a click anywhere outside the ink cards, Escape, or ending the turn deselects the picked card; clicking another ink card picks that one instead.

## Release v3.0.0: Field Unit

The Field Unit visual overhaul ships as a major version. It bundles Feature 46 (the redesign), Feature 47 (Kiln night theme and the signal family) and Refactor 3 (CSS moved to `app/css/`), developed as v2.27.0 → v2.28.1 on the `claude/zen-knuth-82rdia` branch. Nothing about the data changed: sessions, decks, share links and session files from v2 open as before. Test protocols: `docs/TEST-PROTOCOL-v2.27.0.md` and `docs/TEST-PROTOCOL-v2.28.0.md`.

## Feature 46: Field Unit visual redesign (v2.27.0)

### User Story
- As a player I want the Dojo to look like a calibrated instrument: calm controls on the outside, the match and the multiverse in a dark well, and colour only where it means something.
- As a player I want every reading the board already gives me to stay — nothing removed to make it look tidy.

### Details
Implements the "Field Unit" design system (`docs/DESIGN-field-unit.md`) across the app. No feature was removed; data formats are unchanged.
- **Shell and well.** A warm mineral chassis (`#E7E2D8`) with paper modules (`#F4F0E8`) for the top bar, the rail, draw odds, menus, modals, home and library; the board, the multiverse canvas, the card preview and the turn notes sit in black glass (`#121212`). The old role tokens (`--bg`, `--surface`, `--text`, …) are redefined for the shell and again on the glass scopes, so every existing rule picks up the right side.
- **One signal.** Orange `#E4572E` is End turn / Start match / a dialog's confirm, the live lore numerals, the turn number, auto-save when on, the "NEW" pip on cards that entered this turn, and the branch you are on (the board's centre rule and the multiverse path to the current node). Tweaks → Accent now derives every accent tone from one hue (`--accent-l/c/h`); **Signal** is the new default (installs move across once).
- **Inks are ticks.** Player identity is two 3×16 ink ticks (P2's striped, so a mirror match still reads) on the player rows, the board tag, every multiverse node and auto-save, the meters and the log. The board washes, purple node glow and coloured odds names are gone; Competition / Modern / Classic / Mono still choose the tick colours. Ink colours are the Field Unit six.
- **Board (desktop).** Each half is *discard 168 · field · lore 92*: a discard column listing the real pile (newest first, cost/strength/lore; rows drag, right-click, preview like the card; *+N more* past eight), a paper deck slab, a glass lore box, the ready row (`2 / 9 READY`, −, +, Ready all as glass outlines), your hand in a raised-glass tray, the turn note as glass with paper text. Since v3.4.1 the lore box shows only the lore count (the hand's CTL · BCR · RDS · LVI stats are gone), the lore box and your turn note are as tall as the hand beside them, and the deck is a card-shaped (5:7) slab the size of the ink cards, at the end of the ready row as on phones. Phones keep the Feature 43–45 layout in the new colours.
- **Rail.** Paper player rows (`28 deck · 2 hand`), win-probability meters as a track with an ink marker and figures at both ends, a hover-details module, a log where steps are mute, banishes / challenges / quests are ink and turn boundaries read `— Turn 17 begins —`.
- **Draw odds.** Paper module: card, copies left, then the three windows; zero-copy rows stay, greyed, with em dashes. On narrower desktops (≤1321px) the odds and board columns tighten.
- **Multiverse.** Paper nodes (230px) on the glass canvas: ticks, title, a subline with the lore pair and the save time, the recap, then a label · value grid of Played / Inked / Drawn / Discarded / Banished / Quested / Starting hand. Edges are `#6A655E` hairlines; the path to the node you are on is signal. The canvas hint is shown in the header.
- **Type.** Inter (with its display optical size) for names and prose, Liberation Mono for labels, indexes and figures (self-hosted, OFL, `app/fonts/`).
- **Fixes on the way.** Tweaks → Panel layout *Floating* and *Hide* used to squash or lose the board; both lay out properly now.

## Feature 47: Kiln night theme and the signal family (v2.28.0)

### User Story
- As a player I want a dark version of the Dojo for late sessions, that follows my device unless I pick one.
- As a player I want to swap the accent without it ever clashing with the ink colours that name cards and players.

### Details
Implements version 2 of `docs/DESIGN-field-unit.md` (Kiln dark mode, signal family).
- **Tweaks → Theme: Auto / Day / Night.** Auto follows the device's light/dark setting and keeps following it while the app is open. The choice is applied before first paint (a few lines in `<head>`), so a night user never sees the day shell flash.
- **Kiln** (night): warm black chassis `#141311`, warm dark paper `#221F1B`, a blacker well `#0C0C0C`, glass raised `#161412`, light ink `#F4F0E8`, hairlines `#2C2924`. Only the palette flips: every surface, card face, node, sheet and modal follows. Native controls switch with `color-scheme`.
- **Signal family.** By day the signal is Ember `#E4572E`; on Kiln it is Radio `#E86B2A` with dark text on the key. Tweaks → Accent offers only the approved swaps: **Signal** (the theme's own), **Coral**, **Olive** (its lore numeral lifts to `#C6C45A` on the well) and **Trace**. Each carries the text colour that sits on it. The old Amber / Rose / Emerald / Violet / Azure accents were ink colours, so a saved pick of one falls back to Signal.
- **CSS file.** The Field Unit tokens, themes, palettes and component styles moved from the inline `<style>` to `app/css/field-unit.css`, loaded right after it (pixel-identical move). The older inline rules stay put.

## Feature 56: Multiverse on phones — thumb keys, the key on top, the plot first (v3.9.0)

### User Story
- As a player on a phone, I want to move through the Multiverse with my thumb, one turn or one line at a time, without pinching in to hit a dot, so I can find a turn and play from it.

### Details
- **Thumb keys at the well's foot**, clustered right where the plot's key used to be, in two rows of three: **zoom out**, **▲**, **◎** (back to where you are), then **◀ ▼ ▶**. The arrows move the cursor: the panel under the well shows the turn the cursor is on, and **Play from here** loads it, as on desktop.
  - **◀** the turn before. **▶** the turn after: back the way you came (◀ remembers it), else along the branch you're on, else the oldest.
  - **▲ / ▼** the nearest turn above / below on **another line**: never one the cursor's own line runs through (a line zigzags across rows in the plot), and near the same point in the game.
  - **◎** back to the node you're on (hollow when you're there). **Zoom out** fits the whole game in the well and stays down; press it again, or step, to come back in close. Plot only (its place stays empty in cards): the card layout is far too wide to fit a phone.
  - **Hold** an arrow to keep stepping, like a keyboard's. A key that can't go anywhere is hollow.
- **The key moves to the top** of the well, as a strip over the plot with a hairline under it, where the fitted plot used to leave empty glass.
- **The plot by default.** A phone opens the Multiverse on the plot until you pick a view with the Plot tool (a saved preference, as before). It opens up close, on the cursor (zoom 1, dots big enough to read and tap), instead of fitting the whole game; centring and fitting leave out the strips the key and the keys cover.
- **The keys follow the cursor**: each step centres the plot on it. A pinch zoom is kept; zoom out's fit is undone by the next step.
- **Header.** Reset zoom moved under the thumb (zoom out), and the dock-side toggle, meant to hide on phones but shown by a CSS specificity slip, is gone there: Import, Export, Log, Plot and Close remain.
- **The look.** The well is dark in both themes, so the keys are the neutral function key as it sits on dark (Kiln's bone `#312D28`, paper glyph, a darker foot that drops when pressed, 44px, 10px radius). ◎ carries the plot's "you are here" ring in signal; zoom out held down inverts to paper.
- **Desktop and tablets are unchanged**: the arrow keys still walk the tree, the key stays at the foot, and the plot opens fitted.

## Patch: Card picture in the card drawer (v3.8.1)

### Details
- **The card drawer shows a small picture of the card** at the top right of its text, beside the name and type line, for a card in hand and a card in play. It shares a grid row with the name and type, so it never covers the card's text.
- **It mirrors the board:** an exerted card (and a Location) lies sideways, turned 90° the way the board turns it; Ready stands it back up.
- **No art?** If the image can't load, a blank card with the dojo mark shows instead, like the deck on the board.

## Feature 55: Step through the cards in play in the card drawer (v3.8.0)

### User Story
- As a player on a phone or tablet, I want to step from one card in play to the next in the card drawer, the way I step through my hand, so I can read the board or act on several cards without closing and reopening the drawer.

### Details
- **The board's card drawer steps like the hand's** (Feature 49), with the same code: ‹ › in the head, ← / →, or a sideways swipe on the card text; the next card slides in from that side, and it wraps at either end.
- It steps through the cards in play **on that card's side**, in the order the board lays them out: the cards on their own, then each location after the characters at it. The head shows where you are: `P1 · exerted · 2 / 5`.

## Feature 54: Mulligan mode — each player's first turn opens on their mulligan (v3.7.0)

### User Story
- As a player, I want each player's first turn to start with the mulligan, so I never have to remember a button, and the second player chooses from the seven they were dealt, not from eight after an early draw.

### Details
- **Before:** the first player had to press **Mulligan** on turn 1. When they passed, the second player drew for the turn straight away, and only then could press Mulligan, with that extra card in hand.
- **Mulligan mode.** A new game opens on Player 1's mulligan. When Player 1 ends their first turn, Player 2's turn opens on theirs, after the ready step and **before the draw step**. The dialog stays up until the hand is settled; Esc, Space and the other hotkeys do nothing behind it, and no turn can end.
- **Keep or send back.** Tap cards to mark them, as before. One button settles it: **Keep hand** with nothing marked, **Mulligan N cards** otherwise. **Craft hand** is the dialog's other way out (Feature 23); its **Back** returns to the mulligan.
- **The rule.** A mulligan puts the marked cards on the bottom of the deck, draws as many from the top, then shuffles the deck, so a card you send back can't be redrawn (the official Lorcana order; Feature 25's odds model it). **Keeping your hand doesn't touch the deck: no shuffle.**
- **After a mulligan** the dialog stays open on the new hand: `Turn 1 · after the mulligan`, the cards it drew carry the board's signal **NEW** pip, the readout shows the new hand (*7 in hand · 2 new*, with *2 to the bottom, 2 drawn, deck shuffled*), and the odds are the shuffled deck's (the redraw column goes). Cards can't be marked again. **Start turn** (Player 1) or **Draw and start turn** (Player 2) goes on. Keeping or crafting goes straight to the turn. Undo after the turn has started comes back to the choice.
- **The look.** A paper dialog. The head reads `Opening hand · Turn 1 · on the draw` (or *on the play*), the player's deck icon and name, *Then you draw +1* (or *No draw turn 1*) and the deck size. The hand sits on glass in one row of seven, cheapest first; tablets and phones put it in 4 + 3. A marked card sinks and dims behind a dashed outline with a `↓ Bottom` tag, instead of the old red ring and X.
- **The readout** under the hand, live as you mark: the **curve** of the cards you'd keep (cost 1–6 and 7+, the cards going back as dashed bars on top), **inkable** (a pip per kept card, filled when it can be inked, and `4 / 5`), and the plan (*5 kept + 2 redraw*, *Keeping all 7*; phones show the redraw count).
- **Draw odds** (Feature 25) sit beside the well on desktop, as tall as it and scrolling, titled *Draw odds · if you send 2*. Phones show the top three rows under the well, and **All** opens the rest.
- **Looking at a card.** With a mouse, each card has a **magnifier** in its top-right corner (a 22px glass control): click it and the card grows in place to about twice its size, big enough to read, over its neighbours. Any click or Esc puts it back, and that click does nothing else. Clicking the card itself marks it. On a touch screen there's no magnifier: **press and hold** a card and it shows large over the screen with its name, cost, inkable and type while your finger is down, and goes when you let go. The hold doesn't mark the card; a tap still does.
- **Phones.** The dialog fills the framed screen: small cards in 4 + 3, the readout, the odds, then a fixed foot with **Craft** and the confirm key.
- **Then the draw.** Once Player 2 has chosen, they draw for the turn (logged as the turn's draw), their Turn Starting Hand is captured, and the auto-save of Player 1's first turn is written. So the *Turn 1 - Player 2 Active* node holds the board Player 2 plays from, and stepping through the Multiverse never lands in the dialog.
- **Undo** after the decision comes back to the dialog. A board waiting on its mulligan keeps that through a reload, a save or a share link, and the dialog comes back when you return to it from the home screen.
- **The sidebar's Mulligan and Craft buttons are gone**; the dialog replaces them. Boards saved before this version don't open the dialog.
- State: `mulliganPending` (the active player is choosing, or looking at their new hand), `drawPending` (their draw step and the auto-save wait for it) and `mulliganDrawn` (the cards a mulligan drew, while the new hand is on show), saved only while set.

## Feature 53: Mini Multiverse in the sidebar, in place of Win Probability (v3.6.0)

### User Story
- As a player, I want a small map of the multiverse beside the board, so I can jump to any turn with one click and step through a line turn by turn without opening the full Multiverse.

### Details
- **Win Probability is gone.** The sidebar's BCR / LVI meters, the CTL · BCR · RDS · LVI figures under the hovered card, and the external win-probability script that computed them (loaded from a third-party GitHub repo at `@main`) are removed. The hover card's freed height goes to the log.
- **The map.** The Win Probability slot now holds a paper module with the tree drawn as lines on a glass well, in the style of the landing page's hero map: a line keeps its row and a branch takes the nearest free row, so a whole game fits in a few rows. A row carries on into the child with the longest line (usually the game as played), so the map holds still while you move. The line you're on is signal; ahead of you, the line you stepped back along is dashed signal; the node you're on has a signal ring, dashed once the board has changed since it. "Left here" snapshots are dashed hollow dots. Every other turn is numbered along the top; the foot shows the counts, "Edited · kept if you jump", or the name of the dot under the pointer. The head reads `T14 · P2 · 8–8` for the node you're on (or the dot under the pointer), with a button that opens the full Multiverse.
- **Moving.** Click a dot to load it. Drag or scroll to pan; the map follows the node you're on. The keys: **⏮** the last branch point behind you (or the start), **◀** previous turn, **▶** next turn on the line, **⏭** the next branch point ahead (or the line's end), **↑ / ↓** the nearest node on the line above / below. With the map or a key focused, the arrow keys, Home and End do the same. Stepping back keeps the rest of the line ahead of you, so ▶ retraces it. On a board you've changed since its node, ◀ reloads that node and ▶ goes on to the next turn.
- **Autosave before a jump, only when it's needed.** Every jump (the mini map and the full Multiverse's *Play from here*) still keeps the board you leave as a "Left here" snapshot, but only when that board isn't already saved: unchanged since it was loaded from, or saved as, a node or snapshot that's still in the tree. Stepping through a line no longer fills the five snapshot slots with copies of saved nodes and pushes out the one holding your unsaved work. The mini map's jumps are quiet (no toast or flash) unless a snapshot was kept.
- **Desktop only.** Phones hide the module; the phone's multiverse navigation will be its own feature.
- **Code.** The layout, drawing, panning and step targets live in `app/js/mini-multiverse.js` (the `MiniVerse` global); App feeds it the nodes and loads what it picks. Styles in `app/css/field-unit.css`.
- **Landing page.** "How it works" step 2 shows the mini multiverse under the board in place of the BCR meter.

## Feature 52: Long press the board to write the turn's note on a phone (v3.5.0)

### User Story
- As a player on a phone, I want to add a note to the turn I'm in without waiting for the turn to end, so I can write down what happened while I play.

### Details
- The notes panel is hidden on phones, so a turn's note could only be changed afterwards, from its Multiverse node.
- **Long press** (about half a second) on the empty battlefield opens a **Turn N notes** dialog with the active player's note for this turn. **Save** stores it (saving empty clears it), **Cancel** or Esc leaves it as it was. Enter adds a line; Ctrl/Cmd+Enter saves.
- Cards, piles, the hand, buttons and the lore controls keep their own touch behaviour and don't start a long press. Moving the finger or scrolling cancels it. It's the same note the desktop panel edits, so the next auto-save and the Multiverse pick it up.
- **Look.** The dialog is a paper module that follows day / night. The writing area is the Field Unit Note: glass fill, paper text, a `TURN 16 NOTE · PLAYER 2` label row with a pen, and a hairline that lights while you type.
- The styled dialog gained a `multiline` option (a glass note around a textarea), `noteLabel` and `allowEmpty`.

## Patch: Tweaks panel cleaned up (v3.4.12)

### Details
Tweaks keeps only what is still in use: Theme, Accent, Card size, Card display, Challenge forecast and Player palette.
- **Panel layout removed.** Docked / Floating / Hide is gone with its code and CSS; the rail is always docked. A saved Floating or Hide choice is dropped on load.
- **Player palette: Competition · Modern · Mono**, on one row. Classic is gone (a saved Classic becomes Modern).
- **Modern uses two signals**, Olive P1 / Trace P2, instead of the Amber / Sapphire inks, so a fixed pair never reads as a card's ink.

## Patch: Opponent's hidden cards named in log imports (v3.4.10)

### Details
A Duels.ink text log hides the opponent's hand and draws, but names every card when they play, ink or discard it. The import now reads the whole game first and fills the opponent's unknown hand and deck in each node with the cards they reveal later: soonest first in the hand, the rest in the deck. A replay import already did this.
- Checked against the replay of the same game: the opponent's hand is the same in every node. The deck shows 2 fewer known cards than the replay. The replay file names two more Donald Ducks that the log never names, so the log cannot place them.
- Cards the opponent never reveals stay unknown. Old-format logs, which show both hands, are unchanged.

## Patch: Share links on practicedojo.win (v3.4.8)

### Details
The site moved to `practicedojo.win`, served by Cloudflare from this repo (ARCH D20).
- **Links use the new domain.** A share link made on the live site (`practicedojo.win`, its workers.dev address, or the old `github.io`) is always `https://practicedojo.win/app/?s=…`. Cloudflare previews and localhost keep their own address, so a test link opens the code under test.
- **Old links keep working.** `practicedojo.github.io` sends every visitor to the same path on `practicedojo.win`, `?s=` and `#` included, before the page loads. Opening a link never depended on the domain: it's one Supabase lookup.
- **Sign-in** needs the domain in Supabase's redirect list (done: `.win`, workers.dev and its previews, `github.io`, localhost). `supabase/config.toml` matches.
- **Not carried over:** the browser keeps storage per domain, so a device library, an anonymous share identity and a sign-in on `github.io` don't appear on `.win`. Signed-in users get their account items back by signing in again.

## Landing page: up to date with v3.4 (v3.4.3)

### Details
The public page (`index.html`) caught up with the app's releases since v3.0.0. The app is unchanged, so there is no version bump (as for *Landing page: Field Unit*).
- **One command keeps it current.** `node tools/refresh-landing.mjs` copies `APP_VERSION` into every `data-app-version` element of `index.html`, rebuilds `js/landing-multiverse-data.js` from the Set 13 demo (`tools/landing-data.mjs`, which used to be a by-hand step), and retakes the app screenshots with the dojo-screenshots skill (`tools/landing-shots.mjs`). `--no-shots` skips the browser; `--check` exits 1 when the version or the data is stale. `AGENTS.md` asks for it after any visible change to the app.
- **Board screenshot retaken.** The v3.4.3 board, day and night: the grouped top bar, deck icons, the deck card in the ink row, lore and notes as tall as the hand. Pin 05 moved onto Challenge.
- **New section 02 · On your phone.** The phone board and the card drawer (Dumbo tapped), day and night, with four pinned notes: the drawer of keys, the hand under the board, lore, ink and deck in one row, and Quest and End turn in the hand tray. Later sections are renumbered 03–06, and the nav gets *Phone*.
- **Multiverse explorer in the v3.4 look.** Nodes carry the owner's deck icon and show their comment as a glass note (the auto-save's stock line is hidden), with only the delete button. The side panel follows the app's: *Selected* with the deck icon and name, the note as glass (*Turn 16 note · Player 2*), the lore race with deck icons, and *Turn recap* with a **Show in nodes** switch that flips compact and full nodes, in step with the header tool. The line-so-far and branch chips stay, to walk the tree. The header uses the branch icon in signal and the app's hint.
- **Deck icons where the app has them.** The hero's lore labels, the canvas legend, the imported turns, the "On the table" seats and deck chips, and the board mock. Ink ticks stay on the win-probability meter, as in the app.
- **Copy.** The intake chips have the app's icons; the feature list's library row now describes the shelves.

## Patch: Notes are glass in the Multiverse (v3.4.3)

### Details
- **A note looks the same everywhere.** A node's comment, the panel's note and the save form's note field now use the board's glass Note: paper text on glass, with a label row saying whose note it is (`NOTE` in a node, `TURN 15 NOTE · PLAYER 2` in the panel) and a pen, so it reads as yours to edit.
- **Click to edit.** Clicking a note in a node selects that node and opens its note in the panel's editor, cursor in the text (a double-click on a note no longer jumps). In the panel, click the note (or Enter / Space on it). The editor is the same glass box with its hairline lit; click away or Ctrl+Enter saves, Esc cancels.
- **Hover** lights the note's hairline (`#C9C3B8`). Phones show the label and pen all the time.
- **Inside a node** the note is glass raised (`#1A1A1A`) with a `#2A2A2A` hairline, so it sits on the paper card. A node with nothing to show has no note block; the panel shows a dashed one with *Add a note…*.
- **The auto-save's stock line** *Auto-saved at start of turn.* is no longer shown. It stays in the saved comment until the note is edited.

## Patch: Turn recap text back in the Multiverse (v3.4.2)

### Details
- Feature 51 showed only the player's note, cut off at `**Turn recap**`, so the text an end-of-turn auto-save or an imported log writes (*Drew / Inked / Played / Quested / Banished…*) seemed to have stopped. It was still saved; it just wasn't shown.
- **Nodes** show their whole comment again, note and turn recap, at the pre-panel compact height (250px; the comment scrolls). "Show in nodes" still adds the card sections on top.
- **The panel** shows the whole comment too, and clicking it edits all of it, as the old in-node editor did. The card thumbnails stay under *Turn recap*.
- The panel's markdown is drawn in paper ink: its bold labels (*Turn recap*, *Drew:*…) were near-white on paper.

## Feature 51: Multiverse panel — Timelines merged into the Multiverse (v3.4.0)

### User Story
- As a player I want one place for my timelines: see the tree, save the turn I'm in, read a node's turn and jump to it, without a separate Timelines drawer.
- As a player I want to look at a node before I jump to it, and to rename it or change its note by clicking on them.
- As a player I want the panel on the side of the screen I prefer.

### Details
Proposal 1 of the Timelines + Multiverse merge, with the playtest notes applied.
- **One view.** The Timelines drawer is gone. The Multiverse (top bar, the sidebar's branch button, **M**) is a glass canvas plus a paper **panel**. The drawer's Import / Export / Log moved to the Multiverse header; Save as copy was already in the top bar.
- **Dock either side.** The header's columns button moves the panel left or right; the choice is saved with the Tweaks. Phones stack the panel under the canvas.
- **Save current unfinished turn.** One button (or **T** from anywhere) reveals a name and a note. The name starts as `Turn N - Player X (unfinished)`; the note starts as the turn's note plus a recap of everything done so far this turn (drew, inked, played, quested, banished…), the same recap an end-of-turn auto-save writes. The form shows the cards the node will keep, and the node gets the same card sections an auto-save would.
- **Select, then play.** Clicking a node selects it and the panel shows it; it no longer restores. **Play from here**, **Enter** or a double-click restores. Arrow keys move the selection as before.
- **Edit in place.** Click the node's name to rename it (Enter saves, Esc cancels). Click its note to edit it (click away or Ctrl+Enter saves). Only the player's note is edited; the recap block stays with the node. The pen button and the edit form inside the node are gone.
- **Lore race to 20** for the selected node, and its **turn recap as cards** (Played, Inked, Drawn, Discarded, Banished, Quested, Starting hand — empty sections left out). Nodes saved before card sections existed show their text recap too.
- **Show in nodes.** A switch in the recap puts every section back inside every node, as before (saved preference). Off (the default) nodes are lean: title, subline, the note and the Played strip.
- **Auto-saves are dashed nodes.** The snapshots taken before each jump (the drawer's "Auto-saves (time jumps)", still the last five) hang off the node you were on, with a dashed edge. Select one to **Play from here**, **Keep as node** (it becomes a real node where it hangs) or discard it (with Undo). Restoring the oldest of the five no longer fails when the jump's own snapshot pushes it out.
- **Delete** stays on each node and is also in the panel, both with Undo.
## Feature 50: Library shelves — what's on this device and what's in your account (v3.3.0)

### User Story
- As a player I want to see at a glance which sessions and decks live only on this device and which are in my account on every device, without reading small print on each row.
- As a player who isn't signed in I want to be told that clearing this browser's data deletes my library, and what signing in would change.

### Details
Chosen from three prototypes in `docs/design/library-clarity/`: **B · Shelves**, with the Library button of C · Places map.
- **Shelves by place.** Library · Sessions sorts sessions into *In your account + this device*, *Only on this device* (with **Save all N to account**) and *Only in your account*. Each shelf has a spine in its place colour (two bars when it's in both places), a mono name and count, and one plain sentence about what that means. Signed out, everything sits on *On this device* (it says clearing site data or switching browser loses them) above an empty dashed *Your account · optional* shelf with **Sign in**.
- **Rows say only what's out of step:** *Changed here since your last Save* with **Save to account**, or *Your account has a newer copy* with **Get newer copy**. Account-only rows offer **Download & open**.
- **Decks** get the same shelves (*In your account + this device*, *Only on this device*, and **Built in**, which replaces *Default decks*, grouped by set). **Links** (was *Shared*: the word also read as "on all my devices") is one *Public links* shelf.
- **Place colours** from the key family, never an ink colour: Trace this device, Olive your account, Coral public links, a neutral line for built in (`docs/DESIGN-field-unit.md` · Place colours).
- **Quieter rows.** Title and actions on top, details under them. **Open** is a paper tool; only the match on the board gets the signal (*Back to it*). Rename, Share a link, Duplicate, Export and Delete move into a **⋯** menu (arrow keys, Home / End, Escape closes it before the Library; it opens upwards near the bottom). On phones the actions sit at the foot of each card.
- **Home.** The Library button shows `▮ 5 ▮ 4`: sessions on this device (Trace) and, signed in, in your account (Olive). Pick up again rows carry their shelf's spine, and the box ends with the shelves summed up (or *All on this device only · Sign in to keep them in an account*).
- **Fix:** the Library tabs no longer collapse to 1px when the list is taller than the drawer (about 9 sessions on a phone).

## Patch: Top bar grouped by job (v3.2.6)

### Details
- **Left: the way home and the session.** `‹ DOJO` with the torii mark goes back to the home screen (the match stays saved). It replaces the reset button, whose ↻ arrow read as Undo flipped. Then the session title, **Save**, **Save as copy** and **Share**.
- **Centre: the turn control.** **Undo**, the turn chip and **Challenge** are one joined control, so Undo sits on the turn it undoes. Undo's icon is the only circular arrow left in the bar.
- **Right: Multiverse and Tweaks.** Multiverse is a paper button with a branch icon in the signal colour (the signal marks the branch you are on). The Timelines button left the bar: Timelines opens from the sidebar and with **T** until it merges into the Multiverse view.
- **Narrow desktops** (761–1100px): Undo and Challenge are icon-only.
- **Phones:** ☰ · Undo | turn | Challenge · Multiverse · ⋯. The ⋯ menu holds Save, Save as copy, Share link, Tweaks and Leave to the dojo. A second tap, Escape or a tap outside closes it.

## Patch: Deck icon (v3.2.5)

### Details
- **Deck icon** (`img/deck_icon.svg`): a card in the deck's first ink with a star cut out of it in the second. It replaces the two-bar ink ticks in the sidebar player rows, the board's player tags, the phone card drawer, auto-saves, multiverse nodes, the home seats and deck chips, and the Tweaks palette readout. Player 2's card is striped so a mirror match still reads.
- **Favicon:** the landing page and the app use the deck icon as their tab icon.

## Patch: Home page in two columns (v3.2.4)

### Details
- **Brand column.** The home page's left column is the brand: the Practice Dojo mark in ink (black by day, light on Kiln, never orange), `PRACTICE DOJO` in mono caps with the version under it, and the tagline *A Lorcana Sandbox. Come in, play, rewind.* in Inter Display, the second beat muted.
- **Everything else to the right.** Theme, account and Library sit at the top right; under them the headline, the intake well, the readout, and the table and recent sessions side by side. Nothing was removed or rewired.
- **Hero headline.** *Paste a decklist / or a Duels.ink game.* uses the landing page hero's type (`display/xl`: Inter Display 500, up to 72px, the second beat muted on its own line), and the line under it the landing's lede (16px).
- **No glows or gradients** on the page.
- **Tablets** (761–1023px) put the brand in a row beside the controls; **phones** stack the brand (a 44px mark), then the controls, then the headline. This also fixes the phone header, where Library used to run off the screen.

## Patch: Self-hosted Inter and Inter Display (v3.2.2)

### Details
- Inter came from Google Fonts, which sent fixed-weight files without the optical-size axis (and nothing at all when the request was blocked), so titles never got Inter Display and weights like 520 / 560 snapped to 500 / 600.
- Now self-hosted in `app/fonts/` for the app and the landing page, built from the official Inter 4.1 release (OFL, `app/fonts/Inter-OFL.txt`), Latin subset:
  - `InterVariable.woff2` (216 KB) and `InterVariable-Italic.woff2` (239 KB, loaded only when italic text appears): family **Inter**, weight and optical-size axes.
  - `InterDisplayVariable.woff2` (142 KB): family **Inter Display**, the same font pinned at opsz 32, every weight.
- `--font-display` is now `'Inter Display', 'Inter', …` (lore numerals, deck counts, the home headline). On the landing page the headlines, section titles, lore numerals and step titles use it. Both pages preload Inter and Inter Display; the Google Fonts links are gone.
- Rebuild (fonttools + brotli): `fonttools varLib.instancer InterVariable.ttf opsz=32 -o InterDisplay-var.ttf`, then `pyftsubset <font> --unicodes="U+0000-024F,U+02B0-02FF,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+25A0-25FF,U+2600-26FF,U+2700-27BF,U+FEFF,U+FFFD" --layout-features='*' --flavor=woff2` for each of the three.

## Patch: Framed phone board (v3.2.1)

### Details
- On phones the playfield is framed like the multiverse canvas and like the desktop well: 8px of chassis round it (plus the bottom safe area) and 16px corners, where it used to run edge to edge.
- The hand tray (Quest, the hand label, End turn and the peeking hand) moves in with it and sits on the well's bottom edge; the peeking cards are clipped at the well's rounded corners. Desktop is unchanged.

## Feature 49: Phone hand in the card drawer (v3.2.0)

### User Story
- As a player on a phone I want a card from my hand to open the same drawer as a card on the board, so picking a card and acting on it feels the same everywhere.

### Details
Replaces the Feature 44 hand focus (big card over a glass scrim, with the fan above it).
- **One tap on a hand card opens the card drawer** in its hand mode: the owner's ticks and `P2 · in hand · 3 / 7` with ‹ › and Close, the card's full text card on glass, a `Cost 5 · inkable … 8 ink ready` readout (danger when short), then keys: **Play** (the signal key, two wide; hollow *Play anyway · N short* when short on ink), **Ink** (Olive), **Discard** (Graphite), and Swap / Deck top / Deck bottom under `More`.
- **Step through the hand** with ‹ ›, ← / →, or a sideways swipe on the card text (it follows the finger and springs back on a short drag); the next card slides in from that side. Vertical drags scroll a long card.
- Escape or the backdrop closes it; an action closes it and runs. The drawer closes if its card leaves where it was (played, inked, moved).
- The hand fan no longer opens on phones and the `#hand-focus` overlay is gone (its JS and CSS removed). Desktop is unchanged.

## Feature 48: Phone card drawer and hand as function keys (v3.1.0)

### User Story
- As a player on a phone I want a card's full text in its drawer while I pick an action, without a trip to the preview.
- As a player I want the drawer and the hand to feel like one instrument: every control a key, each action always the same colour.

### Details
Adds *Function keys* to `docs/DESIGN-field-unit.md` (version 3).
- **Card text in the drawer.** The touch card drawer shows the card's full text card (the text-mode preview's `buildCardTextView`) on glass. A long card scrolls inside it (capped at about a third of the screen), so the actions stay in reach. The eye button that opened the sidebar preview is gone.
- **Head is state, not title.** The drawer's head is the owner's ink ticks and the card's state on the board (`P2 · exerted · 2 under`, or `in play`) with Close. The name, type and stats are in the text card.
- **Function keys.** Every control is a key with a darker foot that drops when pressed. Challenge is Coral, Quest Olive, Exert / Ready Trace, Banish Graphite with a red label. Damage segments, −1 / +1 and the moves are neutral keys; the moves are an even row under a `Move to` label. Lit damage is a red key; the lethal segment keeps a red foot. A key you can't press is hollow.
- **Phone hand.** Same keys on the glass overlay: Play is the view's signal key (hollow when short on ink: *Play anyway · N short*), Ink is Olive, Discard Graphite; Swap / Deck top / Deck bottom are neutral keys under `More`.
- No ink colour is used on a key. Desktop is unchanged.

## Landing page: Field Unit (v3.0.0)

### Details
The public page (`index.html`) follows Field Unit too, as `docs/DESIGN-field-unit.md` · *Marketing chassis* describes. The app is unchanged, so there is no version bump: the page is part of the v3.0.0 release.
- **Chassis and well.** Mineral chassis, paper modules at 22px, and the demo match in black glass insets. The old glows, gradients, gradient text and icon tiles are gone. Inter (display cut) for headlines and prose, Liberation Mono for labels and figures. Each headline's second half is muted `#8A847A`.
- **One signal.** Launch is the only filled key in a view (the nav's Launch is an emphasised paper tool). The signal also marks the line you're on, live lore numerals, the turn number, NEW pips and spec-row indexes.
- **Spec rows, not feature cards.** Hairline rows indexed `01`–`08` in signal mono replace the icon grids.
- **Day and night.** Kiln at night. The page reads the app's Tweaks → Theme before first paint, and its Auto / Day / Night switch writes back only that choice, so the site and the Dojo match.
- **Real v3 screenshots.** The Set 13 demo at turn 16, by day and by night (`img/dojo_board_day.webp`, `img/dojo_board_night.webp`), with five pins matching the notes under it. The page shows the one that matches the theme.
- **Multiverse sections in the v3 look.** The hero map, imported-turns list, explorer and side panel draw the app's v3 tree: paper nodes with ink ticks, label · value sections, quiet edges and the live path in signal. The mock log and the "How it works" tree slice come from the same demo data, replacing the old static mock and `img/multivers_gui_01.png`.
- **Copy brought up to date.** The feature list adds the library and share links, and day and night. The hotkeys add C (challenge mode). The stale "single-file" and "v1.0" lines and the dead "Metrics" link are gone.
- **No Tailwind on the landing page.** Styles moved to `css/landing.css`.

## Refactor 3: CSS out of `app/index.html` (v2.28.1)

### Details
- The inline `<style>` block (about 7,300 lines) moved unchanged to `app/css/base.css`, linked where it was, before `app/css/field-unit.css`. `app/index.html` is now markup and JavaScript (about 10,500 lines). Day and night screenshots before and after are pixel-identical.
- Rule (AGENTS.md · Styles): CSS lives in `app/css/`; new styles go in `field-unit.css`; `base.css` is only pruned area by area; inline `style="…"` is for runtime values.

## Refactor 2: Own repository (v2.18.1)

### Details
- The Dojo moved from `heavenideas/heavenideas.github.io/practice_dojo/` to `PracticeDojo/practicedojo.github.io`, keeping its git history. See `docs/ARCH-accounts-and-library.md` §12.1.
- New layout: landing page at `/`, the Dojo at `/app/`, shared images in `/img/`, docs in `/docs/`, sample logs in `/docs/samples/`.
- The two large `multiverse_examples/` files and the `_bundle/` restore loader were left behind and removed from history.
- No behaviour change.


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
- [x] Feature 20: Add button to fill in all unknown cards in a deck
- [x] Feature 21: Import Duels.ink Replays (JSON / .replay)
- [x] Feature 22: Read Gzipped (.replay.gz) Replays
- [x] Feature 23: Craft Ideal Starting Hand
- [x] Feature 24: auto updating card probabilities
- [x] Feature 25: Mulligan draw odds
- [x] Feature 26: Design-system hardening (v2 file — dialogs, delete undo, keyboard access, multiverse token redesign)
- [x] Feature 27: Offline card-name fallback
- [x] Feature 28: Dynamic Play-Area Card Auto-Scaling / Responsive Fit
- [x] Feature 29: Offline hardening — card stats on the fallback + images that stay loaded
- [x] Feature 30: Offline text card in the preview pane
- [x] Feature 31: New display section in Multiverse Tree view Nodes
- [x] Feature 32: Text only mode
- [x] Feature 33: Grayscale (Mono) player palette
- [x] Feature 34: Turn Starting Hand section on multiverse nodes
- [x] Feature 35: Cards Quested section on multiverse nodes
- [x] Feature 36: "Competition" player palette
- [x] Feature 37: Card interaction redesign (Option A, challenge mode, phone hand & card drawer, ink counter)
- [x] Refactor 2: Own repository
- [x] Feature 38: Deck & session library on this device (ARCH Phase 1)
- [x] Feature 39: Home screen redesign — "The inkwell"
- [x] Feature 40: Share links for decks and sessions (ARCH Phase 2)
- [x] Feature 41: Import Duels.ink's current text logs ("You / Opponent")
- [x] Feature 42: Optional accounts — Discord & Google sign-in (ARCH Phase 3)
- [x] Feature 43: Phone player bars, Quest / End turn in the hand tray, ink this turn
- [x] Feature 44: Phone hand — one tap to a card, swipe through the hand
- [x] Feature 45: Inkwell as cards — in the ink bar on desktop, a compact sheet on phones
- [x] Feature 46: Field Unit visual redesign
- [x] Feature 47: Kiln night theme and the signal family
- [x] Refactor 3: CSS out of app/index.html
- [x] Landing page: Field Unit
- [x] Feature 48: Phone card drawer and hand as function keys
- [x] Feature 49: Phone hand in the card drawer
- [x] Patch: Framed phone board
- [x] Patch: Self-hosted Inter and Inter Display
- [x] Patch: Home page in two columns
- [x] Patch: Deck icon
- [x] Patch: Top bar grouped by job
- [x] Feature 50: Library shelves — what's on this device and what's in your account
- [x] Feature 51: Multiverse panel — Timelines merged into the Multiverse
- [x] Patch: Turn recap text back in the Multiverse
- [x] Patch: Notes are glass in the Multiverse
- [x] Landing page: up to date with v3.4
- [x] Patch: Share links on practicedojo.win
- [x] Patch: Tweaks panel cleaned up
- [x] Feature 52: Long press the board to write the turn's note on a phone
- [x] Feature 53: Mini Multiverse in the sidebar, in place of Win Probability
- [x] Feature 54: Mulligan mode — each player's first turn opens on their mulligan
- [x] Feature 55: Step through the cards in play in the card drawer
- [x] Feature 56: Multiverse on phones — thumb keys, the key on top, the plot first
