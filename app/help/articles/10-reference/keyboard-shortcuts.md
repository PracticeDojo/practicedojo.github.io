---
id: keyboard-shortcuts
title: Keyboard shortcuts
summary: Every key the Dojo listens to, on the board, on a card, in the Multiverse and in dialogs.
devices: [desktop]
aliases: [hotkeys, keys, keyboard, key bindings, space, esc, escape, enter, arrow keys]
targets: [mini-multiverse-keys]
related: [hotkeys-not-working, card-actions, multiverse-navigate, gestures]
order: 10
verified: v3.11.0
---

Every key the Dojo answers to, grouped by where it works. Keys are single presses: the Dojo leaves anything with Ctrl, Cmd or Alt to your browser. If a key does nothing, see [Shortcuts don't do anything](help:hotkeys-not-working).

## Anywhere on the board

| Key | What it does |
|---|---|
| {key:Space} | **End turn**. If a button has focus, Space presses that button instead |
| {key:Q} | **Quest** with every ready character of the active player that has lore and isn't drying |
| {key:M} | Open or close the **Multiverse** |
| {key:T} | **Save current unfinished turn**: opens the Multiverse with the form, its name ready to type |
| {key:C} | Turn **Challenge** mode on or off |
| {key:Esc} | Close the innermost thing that's open (see below) |

**Esc** closes one thing at a time, in this order: a card's menu, the card drawer, the inkwell sheet, a picked ink card, the picked challenger, challenge mode, the Multiverse, the Library, the home screen (back to your match, if one is on the board), a card you're looking at in the mulligan, then **Inspect deck**, **Inspect discard**, the log import window or the card search.

There's no key for **Undo**: press **Undo** in the top bar.

## On a card under the pointer

Point at a card in play, on either side, and press:

| Key | What it does |
|---|---|
| {key:+} or {key:=} | Add 1 damage |
| {key:-} | Remove 1 damage |
| {key:0} to {key:9} | Set the damage to that number |
| {key:E} | Exert or ready |
| {key:B} | Banish (to the discard) |
| {key:C} | Challenge mode, with this character picked as the challenger (one of the active player's characters) |

These work only while no window is open over the board, and not in challenge mode. The card's menu shows the same keys beside **Exert**, **Challenge…** and **Banish**.

## A card with keyboard focus

Press {key:Tab} to move through the cards.

| Key | What it does |
|---|---|
| {key:Enter} or {key:Space} | Open the card's menu. In challenge mode, pick the card or challenge it |
| {key:↑} {key:↓} | Move through the menu's items |
| {key:Enter} | Choose the item |
| {key:Esc} | Close the menu |

The cards in the discard list beside the board open their menu the same way.

## Card drawer

On a touch screen with a keyboard (a tablet), the card drawer takes:

| Key | What it does |
|---|---|
| {key:←} {key:→} | The previous or next card: in the hand, or in play on that card's side |
| {key:Esc} | Close the drawer |

## Multiverse

| Key | What it does |
|---|---|
| {key:←} | Select the turn before (the node's parent) |
| {key:→} | Select the turn after (the node's first child) |
| {key:↑} {key:↓} | Select the branch above or below: the next node that grows from the same parent |
| {key:Enter} | **Play from here**: load the selected node |
| {key:T} | **Save current unfinished turn** |
| {key:M} or {key:Esc} | Close the Multiverse |

With the mouse: drag the canvas to pan, scroll to zoom, double-click a node to play from it.

**Editing in the panel:**

| Key | What it does |
|---|---|
| {key:Enter} or {key:Space} on the note | Start editing the note |
| {key:Enter} in a node's name | Save the name |
| {key:Ctrl+Enter} ({key:Cmd+Enter} on a Mac) in a note | Save the note. Clicking away saves too |
| {key:Esc} in a name or note | Cancel the edit |
| {key:Enter} in the save form's **Name** | **Save node** |
| {key:Esc} in the save form | Close the form |

[Show me](show:tree-canvas)

## Mini multiverse

Click the map or one of its step keys first, so it has focus. Then:

| Key | What it does |
|---|---|
| {key:←} | Previous turn |
| {key:→} | Next turn on this line |
| {key:↑} {key:↓} | The line above or below |
| {key:Home} | Back to the last branch point, or the start |
| {key:End} | On to the next branch point, or the line's end |

Click a dot to load it; drag or scroll the map to pan.

[Show me](show:mini-multiverse-keys)

## Menus and dialogs

| Where | Key | What it does |
|---|---|---|
| Dialogs | {key:Enter} | Confirm (the main button) |
| Dialogs | {key:Esc} | Cancel |
| A note dialog, like **Turn N notes** | {key:Enter} | New line |
| A note dialog | {key:Ctrl+Enter} or {key:Cmd+Enter} | Save |
| Session title | {key:Enter} | Keep the new name |
| Session title | {key:Esc} | Put the old name back |
| Library tabs | {key:←} {key:→} | **Sessions**, **Decks**, **Links** |
| A Library row's **⋯** menu | {key:↑} {key:↓} {key:Home} {key:End} | Move through the items |
| A Library row's **⋯** menu | {key:Esc} or {key:Tab} | Close the menu (Esc closes the menu before the Library) |
| Inkwell | {key:Esc} | Put down a picked ink card |
| Mulligan | {key:Esc} | Put back a card you're looking at. The mulligan itself stays until you settle the hand |

While a dialog is open, the board's keys do nothing.

## Help

| Key | What it does |
|---|---|
| {key:?} | Open or close help (not while you're typing) |
| {key:/} | Jump to the help search |
| {key:↑} {key:↓} | Move through the search results |
| {key:Enter} | Open the result |
| {key:Esc} | Clear the search, then go back from an article, then close help |
| {key:Backspace} in an empty search | Back from an article to the contents |

## Good to know

- **Q** and **Space** still act on the board while the Multiverse is open: they quest and end the turn on the board behind it.
- On a phone there are no shortcuts. See [Touch gestures](help:gestures).
