---
id: keyboard-shortcuts
title: Keyboard shortcuts
summary: Every key the Dojo listens to, on the board, on a card, in the Multiverse and in dialogs.
devices: [desktop]
aliases: [hotkeys, keys, keyboard, key bindings, space, esc, escape, enter, arrow keys]
targets: [mini-multiverse-keys]
related: [hotkeys-not-working, card-actions, multiverse-navigate, gestures]
order: 10
verified: v3.23.0
---

This page lists every key the Dojo answers to, grouped by where it works. Keys are single presses. The Dojo leaves anything with Ctrl, Cmd or Alt to your browser. If a key does nothing, see [Shortcuts don't do anything](help:hotkeys-not-working).

## Anywhere on the board

| Key | What it does |
|---|---|
| {key:Space} | **End turn**. If a button has focus, Space presses that button instead |
| {key:U} | **Undo** the last action, like **Undo** in the top bar |
| {key:Q} | **Quest** with every ready character of the active player that has lore and isn't drying |
| {key:M} | Open or close the **Multiverse** |
| {key:T} | **Save current unfinished turn**. It opens the Multiverse with the form, ready for you to type the name |
| {key:C} | Turn **Challenge** mode on or off |
| {key:Esc} | Close the innermost thing that's open. The order is below |

**Esc** closes one thing at a time, in this order:

1. a card's menu
2. the card drawer
3. the inkwell sheet
4. a picked ink card
5. the picked challenger
6. challenge mode
7. the Multiverse
8. the Library
9. the home screen, which takes you back to your match if one is on the board
10. a card you're looking at in the mulligan
11. **Inspect deck**, **Inspect discard**, the log import window or the card search

## Number keys

**Number keys** starts off. Turn it on in [Tweaks](help:tweaks) first. Then these keys work:

| Key | What it does |
|---|---|
| {key:1} to {key:9} | Open the menu of that card in your hand, counting from the left |
| {key:B} then {key:1} to {key:9} | Open the menu of that card on your battlefield, in the order on screen |
| {key:H} | Go back to your hand, so the next {key:1} to {key:9} picks a card in it. {key:B} and {key:H} close a card's open menu |

The picked card shows in the card inspector.

## On a card under the pointer

Point at a card in play, on either side, and press one of these keys:

| Key | What it does |
|---|---|
| {key:+} or {key:=} | Add 1 damage |
| {key:-} | Remove 1 damage |
| {key:0} to {key:9} | Set the damage to that number |
| {key:E} | Exert or ready |
| {key:B} | Banish to the discard |
| {key:C} | Open challenge mode with this character picked as the challenger. It must be one of the active player's characters |

These keys work only while no window is open over the board, and not in challenge mode. The card's menu shows the same keys beside **Exert**, **Challenge…** and **Banish**. With the pointer over a card in play, {key:0} to {key:9} and {key:B} act on that card instead of picking one.

## In a card's menu

With **Number keys** on, the menu numbers its first nine options.

| Key | What it does |
|---|---|
| {key:1} to {key:9} | Choose that option |
| {key:↑} {key:↓} | Move through the options |
| {key:←} {key:→} | Open the previous or next card's menu, in your hand or on your battlefield |
| {key:Esc} | Close the menu |

## In challenge mode

| Key | What it does |
|---|---|
| {key:←} {key:→} | Go to the previous or next card on the side you're on. The first arrow picks your first ready character |
| {key:↑} {key:↓} | Go to the row above or below. {key:↑} off your top row moves to the opponent's cards, and {key:↓} off theirs comes back |
| {key:Enter} | Challenge the card you're aiming at |
| {key:Esc} | Drop the picked challenger, then leave challenge mode |

[Read more](help:challenge)

## A card with keyboard focus

Press {key:Tab} to move through the cards.

| Key | What it does |
|---|---|
| {key:Enter} or {key:Space} | Open the card's menu. In challenge mode, pick the card or challenge it |
| {key:↑} {key:↓} | Move through the menu's items |
| {key:Enter} | Choose the item |
| {key:Esc} | Close the menu |

The cards in the discard list beside the board open their menu the same way.

## With the bot playing

These keys work while the [bot](help:bot-opponent) plays a seat:

| Key | What it does |
|---|---|
| {key:P} | Switch the bot between **Auto** and **Step** |
| {key:N} | Play the bot's next move |

## Card drawer

On a touch screen with a keyboard, such as a tablet, the card drawer takes these keys:

| Key | What it does |
|---|---|
| {key:←} {key:→} | Go to the previous or next card, in the hand or in play on that card's side |
| {key:Esc} | Close the drawer |

## Multiverse

| Key | What it does |
|---|---|
| {key:←} | Select the turn before, which is the node's parent |
| {key:→} | Select the turn after, which is the node's first child |
| {key:↑} {key:↓} | Select the branch above or below, which is the next node that grows from the same parent |
| {key:Enter} | **Play from here**, which loads the selected node |
| {key:T} | **Save current unfinished turn** |
| {key:M} or {key:Esc} | Close the Multiverse |

With the mouse, drag the canvas to pan, scroll to zoom, and double-click a node to play from it.

These keys work while you edit in the panel:

| Key | What it does |
|---|---|
| {key:Enter} or {key:Space} on the note | Start editing the note |
| {key:Enter} in a node's name | Save the name |
| {key:Ctrl+Enter} in a note | Save the note. On a Mac, press {key:Cmd+Enter}. Clicking away also saves |
| {key:Esc} in a name or note | Cancel the edit |
| {key:Enter} in the save form's **Name** | **Save node** |
| {key:Esc} in the save form | Close the form |

[Show me](show:tree-canvas)

## Mini multiverse

Click the map or one of its step keys first, so it has focus. Then these keys work:

| Key | What it does |
|---|---|
| {key:←} | Go to the previous turn |
| {key:→} | Go to the next turn on this line |
| {key:↑} {key:↓} | Go to the line above or below |
| {key:Home} | Go back to the last branch point, or the start |
| {key:End} | Go on to the next branch point, or the line's end |

Click a dot to load it. Drag or scroll the map to pan.

[Show me](show:mini-multiverse-keys)

## Menus and dialogs

| Where | Key | What it does |
|---|---|---|
| Dialogs | {key:Enter} | Confirm with the main button |
| Dialogs | {key:Esc} | Cancel |
| A note dialog, like **Turn N notes** | {key:Enter} | Start a new line |
| A note dialog | {key:Ctrl+Enter} or {key:Cmd+Enter} | Save |
| Session title | {key:Enter} | Keep the new name |
| Session title | {key:Esc} | Put the old name back |
| Library tabs | {key:←} {key:→} | Switch between **Sessions**, **Decks** and **Links** |
| A Library row's **⋯** menu | {key:↑} {key:↓} {key:Home} {key:End} | Move through the items |
| A Library row's **⋯** menu | {key:Esc} or {key:Tab} | Close the menu. Esc closes the menu before the Library |
| Inkwell | {key:Esc} | Put down a picked ink card |
| Mulligan | {key:Esc} | Put back a card you're looking at. The mulligan itself stays until you settle the hand |

While a dialog is open, the board's keys do nothing.

## Help

| Key | What it does |
|---|---|
| {key:?} | Open or close help, except while you're typing |
| {key:/} | Jump to the help search |
| {key:↑} {key:↓} | Move through the search results |
| {key:Enter} | Open the result |
| {key:Esc} | Clear the search, then go back from an article, then close help |
| {key:Backspace} in an empty search | Go back from an article to the contents |

## Good to know

- **Q** and **Space** still act on the board while the Multiverse is open. They quest and end the turn on the board behind it.
- A phone has no shortcuts. See [Touch gestures](help:gestures).
