---
id: hotkeys-not-working
title: Shortcuts don't do anything
summary: Why a keyboard shortcut might not fire: typing in a field, a dialog open, or the home screen.
devices: [desktop]
aliases: [hotkeys not working, keys not working, space does nothing, keyboard broken, shortcut ignored]
targets: []
related: [keyboard-shortcuts]
order: 30
verified: v3.9.1
---

The Dojo ignores its shortcuts whenever a key could mean something else. Check these, in order.

## You're typing in a field

While the cursor is in a text field (the session title, the turn notes box, the paste field, a search box), keys type letters. Click an empty part of the board, or press {key:Tab} to leave the field. In the session title, {key:Enter} keeps the name and leaves it.

## A dialog, the mulligan or the home screen is in front

- **A dialog is open.** Only its own {key:Enter} and {key:Esc} work. Answer it first.
- **The mulligan is up.** No shortcut works until you choose **Keep hand** or **Mulligan**, so {key:Space} can't end the turn by accident.
- **The home screen is in front.** Game keys never act on the board hidden behind it. {key:Esc} takes you back to your match, if one is on the board.

## A card key does nothing

{key:E}, {key:B}, {key:0}–{key:9} and the damage keys need the pointer over a card in play, and nothing open over the board (the Multiverse, **Inspect deck**, a card search). They also rest while challenge mode is on: press {key:Esc} or **Done** to leave it.

## Space pressed a button

If you just clicked a button, it keeps the focus and {key:Space} presses it again instead of ending the turn. Click an empty part of the board first.

## Good to know

- The Dojo leaves Ctrl, Cmd and Alt combinations to the browser, so {key:Ctrl+Z} doesn't undo. Use **Undo** in the top bar.
- The mini multiverse's arrow keys need the map to have focus: click it first.
- Phones have no shortcuts; see [Touch gestures](help:gestures).
