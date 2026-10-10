---
id: multiverse
title: What the Multiverse is
summary: Every saved turn is a node in a tree; jump to any of them and play a different line from there.
devices: [desktop, phone]
aliases: [timeline, timelines, tree, save points, what if, replay a turn, go back to a turn]
targets: [multiverse, tree-canvas, tree-panel]
related: [auto-save, branches, nodes, multiverse-panel]
order: 10
verified: v3.9.1
---

The Multiverse keeps every turn you've saved, so you can go back to any of them and play it another way.

Each saved board is a **node**. Nodes link up turn by turn into a line: the game as you played it. Go back to an earlier node, play on from it, and the new turns grow a second line from that point: a branch. All the lines together make a tree, and that tree is the Multiverse. It's how you answer "what if I had challenged instead of quested on turn 6?": play both and compare.

## Open the Multiverse

:::desktop
Click **Multiverse** in the top bar, or press {key:M}. Press {key:M} or {key:Esc} again, or the ✕, to go back to the board.
:::

:::phone
Tap the branch icon in the top bar. Tap ✕ to go back to the board.
:::

[Show me](show:multiverse)

## What you see

- **The canvas** draws the tree, the earliest turns on the left. The path from the start to the node you're on is highlighted; the other lines are grey.
- **The panel** sits beside the canvas (under it on a phone). It shows the node you select, with **Play from here**, and holds **Save current unfinished turn**.

[Show me](show:tree-panel)

## Good to know

- Nodes come from [auto-save](help:auto-save) at the end of each turn, from [saving the turn you're in](help:save-unfinished-turn), and from imported Duels.ink games. When a player reaches 20 lore, the Dojo also saves a **Game Over** node that closes the branch.
- Selecting a node only shows it. Your board changes when you press **Play from here**.
- Jumping never loses the board you leave: see ["Left here" snapshots](help:left-here).
- The tree is part of the session: it's saved with it, and **Export** in the Multiverse header writes the session to a file, tree included.
