---
id: auto-save
title: Every turn is saved
summary: With auto-save on, every turn gets a node in the Multiverse with the board it starts from and what was done in it.
devices: [desktop, phone]
aliases: [autosave, auto save, save every turn, save game, checkpoint]
targets: [auto-save, end-turn]
related: [save-unfinished-turn, multiverse, end-turn]
order: 20
verified: v3.18.1
---

With **Auto-save every turn** on, the Dojo gives every turn a node in the Multiverse. It saves the whole game turn by turn without you doing anything.

## Turn auto-save on or off

:::desktop
The **Auto-save every turn** switch sits at the foot of the side rail, above **Quest** and **End turn**.

[Show me](show:auto-save)
:::

:::phone
Open the ☰ menu. The **Auto-save every turn** switch is near the bottom, above **Quest** and **End turn**.

[Show me](show:menu)
:::

## What an auto-save keeps

When a turn starts, after the player has readied and drawn, the Dojo saves the board as a node. Its name gives the turn and the player. **Turn 5 - Player 2 Active** holds the board at the start of Player 2's turn 5. When that turn ends, the same node gets these:

- the note written for that turn. See [Turn notes](help:turn-notes).
- a **Turn recap** of what was drawn, inked, played, shifted, discarded, quested, challenged and banished that turn.
- the cards behind the recap, in sections such as **Played**, **Inked** and **Drawn**.

So a node is one turn, with the board it starts from and what was done in it. Load it to play that turn again. The new node hangs off the node you were on, so the tree follows the line you're playing.

## Good to know

- With the switch off, ending a turn saves nothing. Save by hand with [Save current unfinished turn](help:save-unfinished-turn).
- The switch is on each time you open the Dojo. Turning it off lasts until you reload.
- Each player's turn 1 node holds the dealt hand, before the mulligan. Load it to mulligan again or build a different opening hand.
- If you play a turn again from its node and end it, the new line gets a node of its own beside the old one. The old node keeps its note and recap. See [Branching](help:branches).
- When a player reaches 20 lore, the Dojo saves a **Game Over** node even with auto-save off.
