---
id: multiverse
title: What the Multiverse is
summary: Every saved turn is a node in a tree. Jump to any of them and play a different line from there.
devices: [desktop, phone]
aliases: [timeline, timelines, tree, save points, what if, replay a turn, go back to a turn]
targets: [multiverse, tree-canvas, tree-panel]
related: [auto-save, branches, nodes, multiverse-panel]
order: 10
verified: v3.18.1
---

The Multiverse keeps every turn you've saved, so you can go back to any of them and play it another way.

Each saved board is a **node**. Nodes link up turn by turn into a line, which is the game as you played it. Go back to an earlier node and play on from it, and the new turns grow a second line from that point. That second line is a branch. All the lines together make a tree, and that tree is the Multiverse. Use it to answer a question like "what if I had challenged instead of quested on turn 6?". Play both lines and compare them.

## Open the Multiverse

:::desktop
Click **Multiverse** in the top bar, or press {key:M}. Press {key:M}, {key:Esc} or the ✕ to go back to the board.
:::

:::phone
Tap the branch icon in the top bar. Tap ✕ to go back to the board.
:::

[Show me](show:multiverse)

## What you see

- **The canvas** draws the tree, with the earliest turns on the left. The path from the start to the node you're on is highlighted, and the other lines are grey.
- **The panel** sits beside the canvas, or under it on a phone. It shows the node you select, with **Play from here**, and holds **Save current unfinished turn**. With the rules engine on, **What-if** in the header opens [What-if](help:what-if) at the top of the panel.

[Show me](show:tree-panel)

## Good to know

- Nodes come from three places. [Auto-save](help:auto-save) adds one at the start of each turn, [saving the turn you're in](help:save-unfinished-turn) adds one, and imported Duels.ink games add theirs. When a player reaches 20 lore, the Dojo also saves a **Game Over** node that closes the branch.
- Selecting a node only shows it. Your board changes when you press **Play from here**.
- Jumping never loses the board you leave. See ["Left here" snapshots](help:left-here).
- The tree is part of the session, and the Dojo saves it with the session. **Export** in the Multiverse header writes the session to a file, tree included.
