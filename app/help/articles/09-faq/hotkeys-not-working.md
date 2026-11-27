---
id: hotkeys-not-working
title: Shortcuts don't do anything
summary: Why a keyboard shortcut might not fire, such as typing in a field, an open dialog, or the home screen.
devices: [desktop]
aliases: [hotkeys not working, keys not working, space does nothing, keyboard broken, shortcut ignored]
targets: []
related: [keyboard-shortcuts]
order: 30
verified: v3.23.0
---

The Dojo ignores its shortcuts whenever a key could mean something else. Check these causes, in order.

## You're typing in a field

While the cursor is in a text field, keys type letters. Text fields include the session title, the turn notes box, the paste field and the search boxes. Click an empty part of the board, or press {key:Tab} to leave the field. In the session title, {key:Enter} keeps the name and leaves the field.

## A dialog, the mulligan or the home screen is in front

- **A dialog is open.** Only its own {key:Enter} and {key:Esc} work. Answer it first.
- **The mulligan is up.** No shortcut works until you choose **Keep hand** or **Mulligan**, so {key:Space} can't end the turn by accident.
- **The home screen is in front.** Game keys never act on the board hidden behind it. {key:Esc} takes you back to your match, if one is on the board.

## A card key does nothing

{key:E}, {key:B}, {key:0} to {key:9} and the damage keys need the pointer over a card in play. Nothing can be open over the board, such as the Multiverse, **Inspect deck** or a card search. The keys also don't work while challenge mode is on. Press {key:Esc} or **Done** to leave it.

With **Number keys** on in [Tweaks](help:tweaks), {key:1} to {key:9} on their own pick a card in your hand. {key:B} then a number picks a card on your battlefield. Move the pointer off the cards in play first, or those keys go to the card under it.

## Space pressed a button

If you just clicked a button, it keeps the focus, and {key:Space} presses it again instead of ending the turn. Click an empty part of the board first.

## Good to know

- The Dojo leaves Ctrl, Cmd and Alt combinations to the browser, so {key:Ctrl+Z} doesn't undo. Press {key:U} or **Undo** in the top bar.
- The mini multiverse's arrow keys need the map to have focus. Click it first.
- Phones have no shortcuts. See [Touch gestures](help:gestures).
