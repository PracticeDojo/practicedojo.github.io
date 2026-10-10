---
id: branches
title: Branching: try another line
summary: Play from an earlier node and do something different: the new turns grow a new branch.
devices: [desktop, phone]
aliases: [branch, alternate line, what if, replay a turn, try again, take back a turn, compare lines]
targets: [tree-canvas]
related: [multiverse, multiverse-panel, left-here, undo]
order: 60
verified: v3.11.0
---

To try another line, go back to an earlier node and play on from it. The new turns grow a new branch, and the line you played before stays exactly as it was.

## Try another line

1. Open the Multiverse and select the node to go back to. An auto-save named **Turn 6 - Player 1 Active** is the board at the start of Player 1's turn 6, so pick it to replay that turn.
2. Press **Play from here**. You're back on the board, at that point in the game.
3. Play the turn differently and end it. With auto-save on, the new node hangs off the one you played from, beside the turn that followed before: that's a branch.
4. Keep playing. Every turn you end adds to the new line.

[Show me](show:tree-canvas)

## Compare the lines

The path to the node you're on is highlighted; the other lines are grey. Select nodes on each line and compare their **Lore race to 20** and **Turn recap** in the panel. The plot shows the whole game at once (see [Cards and plot](help:multiverse-views)).

## Go back to the first line

Select any node on it and press **Play from here**.

## Good to know

- Branching never changes or deletes the nodes you already have.
- The board you leave is kept as a ["Left here" snapshot](help:left-here) if it wasn't saved.
- **Undo** doesn't reach across a jump: its history starts fresh from the node you play from.
- When a player reaches 20 lore, a **Game Over** node closes the branch, and the Dojo offers **View Multiverse** or **Stay Here**. You can still go back and play a branch where the other player wins.
