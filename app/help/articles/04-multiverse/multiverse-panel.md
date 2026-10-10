---
id: multiverse-panel
title: The panel: select, play from here, rename, notes, delete
summary: Select a node to read it in the panel, play from it, rename it, edit its note or delete it.
devices: [desktop, phone]
aliases: [load a turn, restore, jump to turn, load save, rename node, delete node, edit note, lore race]
targets: [tree-panel, selected-node, tree-dock]
related: [nodes, branches, left-here]
order: 50
verified: v3.11.0
---

The panel shows the node you select. Read it there first, then play from it, rename it, change its note or delete it.

## Select a node

:::desktop
Click a node, or a dot in the plot. The arrow keys move the selection (see [Moving around](help:multiverse-navigate)).
:::

:::phone
Tap a node or a dot, or move the cursor with the thumb keys. The panel is under the canvas: scroll down to read all of it.
:::

Selecting doesn't touch your board. The panel shows **Selected** (with **· you are here** on the node you're on), the name, the turn, lore and time, the note, **Lore race to 20** and the **Turn recap** as cards.

[Show me](show:selected-node)

## Play from here

Press **Play from here**. The board becomes that node's board and the Multiverse closes.

:::desktop
Or double-click the node, or press {key:Enter}.
:::

If the board you left wasn't saved, it's kept as a ["Left here" snapshot](help:left-here).

## Rename a node

Click its name in the panel, type, and press {key:Enter} (or click away). {key:Esc} cancels.

## Edit the note

Click the note, or **Add a note…** when it's empty. The whole text is yours to edit, turn recap included; Markdown works. Click away to save. {key:Esc} cancels.

:::desktop
{key:Ctrl+Enter} saves too. Clicking a note on a node opens it here.
:::

## Delete a node

Press the bin, in the panel or on the node. Its later turns aren't lost: they move up to hang off the node before it. The toast offers **Undo**.

## Good to know

:::desktop
The panel docks on the right. The columns button in the Multiverse header moves it to the left (or back), and the Dojo remembers the side. [Show me](show:tree-dock)
:::

- A "Left here" snapshot has **Keep as node** instead of a name and note to edit.
