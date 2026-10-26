---
id: mini-multiverse
title: The mini multiverse
summary: The small map beside the board: click a dot to jump, step through a line, find branch points.
devices: [desktop]
aliases: [mini map, minimap, small map, sidebar map, branch point, step through turns, lore race, lore graph, lore chart]
targets: [mini-multiverse, mini-multiverse-keys, lore-race]
related: [multiverse-navigate, left-here, branches]
order: 100
verified: v3.19.0
---

The mini multiverse is a small map of the whole tree in the side rail, under the players. Jump to any turn with one click, or step through a line, without opening the full Multiverse.

![The mini multiverse: the line you're on in orange, other lines in grey, and the step keys under the map](img/mini-multiverse-{theme}.webp)

## Read the map

- Each dot is a saved turn; each row is a line. A branch takes the nearest free row.
- The line you're on is highlighted, with filled dots. Turns ahead of you on it (a line you stepped back along) are dashed rings.
- The node you're on has a ring, dashed once the board has changed since it.
- "Left here" snapshots are dashed hollow dots. A won branch ends in a square dot and a bar.
- The head reads like **T14 · P2 · 8–8** (turn, player, lore) for the node you're on, or the dot under the pointer, whose name shows at the foot.
- **Edited · kept if you jump** at the foot means your board has changed since its node.

[Show me](show:mini-multiverse)

## Jump to a turn

Click a dot: the board becomes that turn straight away, with no **Play from here**. Drag or scroll the map to pan. The button in the head opens the full Multiverse.

## Step through a line

The keys under the map load the turn they step to:

- **⏮** back to the last branch point behind you, or the start.
- **◀** the turn before. **▶** the next turn on the line.
- **⏭** on to the next branch point ahead, or the end of the line.
- **↑** **↓** the nearest turn on the line above or below.

Click the map first and {key:←} {key:→} {key:↑} {key:↓}, {key:Home} and {key:End} do the same.

[Show me](show:mini-multiverse-keys)

## Lore race

Under the map, **Lore race** draws both players' lore turn by turn along the line you're on, from turn 1. P1 is the solid line, P2 the dashed one, and the dashed line at the top is 20, the win. The orange numbers at the right are the lore at the node you're on, marked by the thin orange line. Turns ahead of you on the line show faint. It follows every jump and step.

[Show me](show:lore-race)

## Good to know

- Stepping back keeps the rest of the line ahead of you, so **▶** retraces it.
- On a board you've changed since its node, **◀** reloads that node and **▶** goes on to the next turn.
- A board you leave unsaved is kept as a ["Left here" snapshot](help:left-here).
- Phones don't show the map or the lore race. Use the [thumb keys](help:multiverse-navigate) in the Multiverse instead.
