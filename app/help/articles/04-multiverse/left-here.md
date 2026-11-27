---
id: left-here
title: "Left here" snapshots
summary: When you jump away from an unsaved board, the Dojo keeps it as a dashed "Left here" snapshot.
devices: [desktop, phone]
aliases: [left here, snapshot, lost my board, where you jumped from, keep as node, unsaved changes]
targets: [tree-canvas]
related: [branches, multiverse-panel, mini-multiverse]
order: 70
verified: v3.11.0
---

When you jump to another node from a board you haven't saved, the Dojo first keeps that board as a "Left here" snapshot. A jump never loses your work.

## When the Dojo keeps a snapshot

Every jump checks the board you're leaving. A jump is **Play from here**, or on desktop a double-click, {key:Enter} or a click in the mini multiverse. If the board has changed since it was loaded or saved, the Dojo keeps it as a snapshot. If the board matches a node or snapshot that's still in the tree, the Dojo adds nothing.

## Find a snapshot

![A node, and the dashed "Left here" snapshot hanging off it on a dashed line](img/left-here-{theme}.webp)

A snapshot hangs off the node you were last on, on a dashed line:

- In the cards view, it's a dashed card titled **Left here** with the time, like **Left here · 14:32**.
- In the plot, it's a dashed ring.
- In the mini multiverse, it's a dashed hollow dot.

## Use a snapshot

Select it. The panel says **Where you jumped from** and offers these:

- **Play from here** loads that board again.
- **Keep as node** turns it into a real node where it hangs, named like **Turn 9 - Player 1 (kept 14:32)**. Then you can rename it and write a note.
- The bin discards it. The toast offers **Undo**.

[Show me](show:tree-canvas)

## Good to know

- The Dojo keeps only the last five snapshots. A sixth pushes out the oldest, so keep the ones that matter as nodes.
- A snapshot isn't a node until you keep it. You can't rename it, and it has no note.
