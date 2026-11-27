---
id: gestures
title: Touch gestures
summary: Every tap, hold, swipe and drag on a phone or tablet.
devices: [phone]
aliases: [touch, tap, long press, hold, swipe, drag, pinch, phone controls, tablet]
targets: [card-drawer, hand, ink-bar, turn-notes, tree-keys, peek]
related: [screen-at-a-glance, card-actions, multiverse-navigate, keyboard-shortcuts]
order: 20
verified: v3.15.0
---

This page lists every gesture the Dojo answers to. Most are taps that open the card drawer. The rest are holds, swipes and drags.

## Cards

| Gesture | Where | What it does |
|---|---|---|
| {gesture:tap} | A card in play | Opens the card drawer with damage, **Challenge**, **Quest**, **Exert**, **Banish** and the moves |
| {gesture:tap} | A card in your hand, on a phone | Opens the card drawer for it, with **Play**, **Ink**, **Discard** and more |
| {gesture:swipe} | Sideways on the card text in the drawer | Shows the next card when you swipe left, or the previous one when you swipe right |
| {gesture:tap} | Outside the drawer | Closes the drawer |
| {gesture:drag} | A card from your hand, up | Plays it onto the field, inks it onto the ink count, or shifts it onto a matching character |
| {gesture:drag} | Any card you can pick up | Moves it onto the discard, the deck or a hand |

:::desktop touch
On a tablet, a tap on a card in your hand opens its menu instead of the drawer.
:::

[Show me](show:card-drawer)

## Challenge

| Gesture | What it does |
|---|---|
| {gesture:tap} **Challenge** | Turns challenge mode on |
| {gesture:tap} your character, then an opponent's card | Challenges that card |
| {gesture:drag} your character onto an opponent's card | Also challenges that card |
| {gesture:tap} the arrow keys, then the fist | Picks your character, swaps to aim at a target, and challenges it |
| {gesture:tap} the bare battlefield | Leaves challenge mode |

## The board

| Gesture | Where | What it does |
|---|---|---|
| {gesture:long-press} | The empty battlefield, for about half a second | Opens **Turn N notes** for the active player |
| {gesture:tap} | The ink count | Opens the inkwell sheet, where you spend and ready ink, press **Ready all** or act on each ink card |
| {gesture:tap} | The deck | Draws a card |
| {gesture:tap} | **⋮** on the deck | Opens the deck actions, inspect and shuffle |
| {gesture:tap} | The magnifier on the discard | Opens the discard |
| {gesture:tap} | **Hold to reveal hand** | Shows the other player's hand. Tap again to hide it |
| {gesture:tap} | **−** or **+** by the lore | Changes the lore by one |
| {gesture:tap} | **Quest** by your hand | Quests with every ready character |
| {gesture:tap} | **End turn** by your hand | Ends the turn |

Moving your finger cancels a long press, so scrolling never opens the notes.

[Show me](show:turn-notes)

## Mulligan

| Gesture | What it does |
|---|---|
| {gesture:tap} a card | Marks it to go to the bottom. Tap again to keep it |
| {gesture:long-press} a card | Shows it large with its name, cost and type. It stays when you lift your finger |
| {gesture:tap} anywhere | Closes the large card. That tap marks nothing |

## Multiverse

| Gesture | What it does |
|---|---|
| {gesture:tap} a node or dot | Selects it, and the panel shows it |
| {gesture:tap} **Play from here** | Loads the selected node |
| {gesture:drag} the canvas | Pans |
| {gesture:pinch} | Zooms in or out |
| {gesture:tap} ◀ or ▶ | Goes to the turn before or after |
| {gesture:tap} ▲ or ▼ | Goes to another line |
| {gesture:tap} ◎ | Goes back to where you are |
| {gesture:tap} zoom out | Shows the whole game, in the plot only |
| {gesture:long-press} an arrow key | Keeps stepping, like holding a key |

[Show me](show:tree-keys)

## Menus

- {gesture:tap} **☰** for the side rail, with the players, the game log and **Auto-save every turn**.
- {gesture:tap} **⋯** for **Save**, **Save as copy**, **Share link**, **Tweaks** and **Leave to the dojo**. Tap outside to close it.
