---
id: mulligan
title: Mulligan and your opening hand
summary: Each player's first turn opens on their mulligan: keep the seven, or mark cards to send to the bottom and draw again.
devices: [desktop, phone]
aliases: [mulligan, opening hand, starting hand, keep hand, redraw, alter hand]
targets: [mulligan-dialog, mulligan-hand, mulligan-readout, mulligan-odds, mulligan-confirm]
related: [craft-hand, draw-odds, draw]
order: 10
verified: v3.11.0
---

Each player's first turn opens on the mulligan. Player 1 chooses as the match starts. Player 2 chooses when Player 1 ends their first turn, before Player 2's draw, so they choose from the seven they were dealt.

## Keep or send cards back

The dialog shows your seven, cheapest first. The head says whether you're **on the play** (no draw turn 1) or **on the draw** (you draw one once you've chosen).

:::desktop
Click a card to mark it to go to the bottom; click it again to unmark it. To read a card, click the magnifier in its corner: the card grows in place. Any click or {key:Esc} puts it back.
:::

:::phone
Tap a card to mark it to go to the bottom; tap it again to unmark it. To read a card, {gesture:long-press} it: it shows large with its name, cost and type. Tap anywhere to close it; that tap marks nothing.
:::

A marked card sinks and shows `↓ Bottom`. Then press the one button at the foot:

- **Keep hand** when nothing is marked: the hand stays and the deck isn't touched.
- **Mulligan N cards** otherwise: the marked cards go to the bottom of the deck, you draw as many from the top, then the deck is shuffled.

[Show me](show:mulligan-confirm)

## Read the hand before you choose

Under the hand, the readout follows your marks: the **Curve** of the cards you'd keep (the ones going back show dashed), **Inkable** (how many you'd keep can be inked) and the plan (`5 kept + 2 redraw`).

**Draw odds** show your chance to find each card: **RD** among the redraws, then within the next turns' draws. Phones show the top three rows; press **All** for the rest.

[Show me](show:mulligan-readout)

## After a mulligan

The dialog stays open on your new hand. The new cards carry a **NEW** tag and the readout says how many went back and were drawn. You can't mark cards again. Press **Start turn** (or **Draw and start turn** for Player 2) to play.

## Good to know

- Nothing else works until the hand is settled: no hotkeys, and the turn can't end.
- **Craft hand** picks your seven by hand instead. See [Craft a starting hand](help:craft-hand).
- **Undo** after the turn has started brings the mulligan back.
- Leave for the home screen mid-mulligan and the dialog is waiting when you come back.
