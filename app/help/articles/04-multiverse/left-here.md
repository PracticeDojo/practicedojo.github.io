---
id: left-here
title: "Left here" snapshots
summary: When you jump away from an unsaved board, the Dojo keeps it as a dashed "Left here" snapshot.
devices: [desktop, phone]
aliases: [left here, snapshot, lost my board, where you jumped from, keep as node, unsaved changes]
targets: [tree-canvas]
related: [branches, multiverse-panel, mini-multiverse]
order: 70
verified: v3.9.1
---

When you jump to another node from a board you haven't saved, the Dojo keeps that board as a "Left here" snapshot first. A jump never loses your work.

## When a snapshot is kept

Every jump checks the board you're leaving: **Play from here**, and on desktop a double-click, {key:Enter} or a click in the mini multiverse. If the board has changed since it was loaded or saved, it's kept as a snapshot. If it's exactly a node or snapshot that's still in the tree, nothing is added.

## Find a snapshot

A snapshot hangs off the node you were last on, on a dashed line:

- in cards, a dashed card titled **Left here** and the time, like **Left here · 14:32**,
- in the plot, a dashed ring,
- in the mini multiverse, a dashed hollow dot.

## Use a snapshot

Select it. The panel says **Where you jumped from** and offers:

- **Play from here** loads that board again.
- **Keep as node** turns it into a real node where it hangs, named like **Turn 9 - Player 1 (kept 14:32)**. Then you can rename it and write a note.
- The bin discards it. The toast offers **Undo**.

[Show me](show:tree-canvas)

## Good to know

- Only the last five snapshots are kept. A sixth pushes out the oldest, so keep the ones that matter as nodes.
- A snapshot isn't a node until you keep it: it can't be renamed and has no note.
