---
id: card-actions
title: Act on a card in play (exert, ready, damage, banish)
summary: Exert and ready, add or remove damage, banish, and the hover hotkeys for each.
devices: [desktop, phone]
aliases: [exert, ready, damage, banish, tap, untap, kill, destroy, damage counter, card drawer, card menu]
targets: [field, card-drawer]
related: [challenge, quest, modifiers, move-cards, keyboard-shortcuts]
order: 70
verified: v3.23.0
---

You can exert or ready every card in play on either side of the board, add or remove its damage, and banish it. Pick whichever way suits your device.

## Hover controls

:::desktop
Point at a card in play. A damage stepper appears on top, showing **−** `0/3` **+**. A column of icon buttons appears down the card's right edge. Hover a button to see its name. The buttons are these:

- **Challenge** and **Quest**, on your characters when they can.
- **Exert** or **Ready**.
- **Modify**, which adds a [modifier](help:modifiers).
- **Banish**.

On a small card the buttons wrap into two columns.

Under every card with willpower sits a track with one segment per point. Click a segment to set the damage exactly. Click the lit end segment to take one off.
:::

## Hover hotkeys

:::desktop
These keys act on the card under the pointer:

| Key | Does |
|---|---|
| {key:+} / {key:-} | add or remove one damage |
| {key:0} to {key:9} | set the damage to that number |
| {key:E} | exert or ready |
| {key:B} | banish |
| {key:C} | challenge mode, with this character picked |
:::

## The card menu

:::desktop
Right-click or click a card in play for its menu. Only what applies to that card shows. The menu has these groups:

- **Card** holds **Exert** or **Ready**, **Quest (+2 Lore)**, **Challenge…**, **Leave Location**, and a **Damage** stepper that stays open while you click it.
- **Modifiers** holds **Add Modifier…**, and **Remove …** for each modifier the card has.
- **Move** holds **Banish (To Discard)**, **Return to Hand**, **Put on Top of Deck** and **Put on Bottom of Deck**.
- **Stack** holds **Put Top Card of Deck Under** and **Separate Stacked Cards**.

To use the menu without a mouse, turn on **Number keys** in [Tweaks](help:tweaks). Press {key:B} then a number to open the menu of that card on your battlefield, counting from the left. The menu numbers its first nine options. Press {key:1} to {key:9} to choose one. See [Keyboard shortcuts](help:keyboard-shortcuts).
:::

## The card drawer

:::touch
Tap a card in play to open the card drawer. The head names the card's player and its state, for example `P2 · exerted · 2 / 5`. Under the card's text are these controls:

- **Damage.** Tap a segment to set it, or press **− 1** or **+ 1**.
- **Challenge**, **Quest**, **Exert** or **Ready**, and **Banish**. A key you can't use is hollow.
- **Modifiers.** The card's modifiers and **+ Add modifier**. Tap a modifier to remove it. See [Modifiers](help:modifiers).
- **Move to.** **To hand**, **Deck top**, **Deck bottom** and **Put under**, plus **Leave location** or **Separate stack** when they apply.

Step to the next card in play with **‹ ›** or a sideways {gesture:swipe} on the text. **×**, a tap outside or {key:Esc} closes the drawer.
:::

[Show me](show:field)

## Good to know

- Once damage reaches willpower, the card pulses and shows a **LETHAL · BANISH** button under it. The drawer says `lethal`. The Dojo doesn't banish the card until you do, except after a challenge.
- A banished card goes to its owner's discard with any cards under it, and its damage is cleared.
- The Dojo doesn't check card effects. Exert, ready or damage anything the cards say to.
- **Undo** takes back every change.
