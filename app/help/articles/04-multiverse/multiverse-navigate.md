---
id: multiverse-navigate
title: Moving around: keys, thumb keys, zoom
summary: Pan, zoom, and step through turns and lines with the arrow keys or the thumb keys.
devices: [desktop, phone]
aliases: [pan, zoom, scroll, arrow keys, thumb keys, cursor, next turn, previous turn, reset zoom, find my turn]
targets: [tree-canvas, tree-keys, tree-zoom-reset]
related: [multiverse-views, mini-multiverse, multiverse-panel]
order: 90
verified: v3.11.0
---

Move around the Multiverse canvas, and step the selection through turns and lines to find the one you want. Nothing loads until you press **Play from here**.

## Pan and zoom

:::desktop
Drag the canvas to pan. Scroll to zoom in or out at the pointer. **Reset zoom** (the button left of ✕) fits the whole plot; in cards it goes back to full size at the start of the tree.

[Show me](show:tree-zoom-reset)
:::

:::phone
Drag with one finger to pan, {gesture:pinch} to zoom.
:::

## Arrow keys

:::desktop
The arrow keys move the selection, and the canvas follows it:

- {key:←} the turn before.
- {key:→} the turn after (the oldest one, if the line branches there).
- {key:↑} {key:↓} the next branch up or down from the same node.
- {key:Enter} plays from the selected node.
:::

## Thumb keys

:::phone
Six keys sit at the canvas's foot. They move the cursor, and the panel under the canvas shows the turn it's on.

- **◀** the turn before. **▶** the turn after: back the way you came, else along the line you're on.
- **▲** **▼** the nearest turn on another line above or below, near the same point in the game.
- **◎** back to the node you're on.
- **Zoom out** (the magnifier) fits the whole game. Press it again, or step, to come back in close. It's there in the plot only.

Hold an arrow to keep stepping. A key that can't go anywhere is hollow.

[Show me](show:tree-keys)
:::

## Good to know

- Opening the Multiverse selects the node you're on (or the newest) and centres on it.
- On desktop, the [mini multiverse](help:mini-multiverse) in the side rail steps through the tree and loads each turn straight away.
