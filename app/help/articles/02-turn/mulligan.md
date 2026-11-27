---
id: mulligan
title: Mulligan and your opening hand
summary: Each player's first turn opens on their mulligan. Keep the seven, or mark cards to send to the bottom and draw again.
devices: [desktop, phone]
aliases: [mulligan, opening hand, starting hand, keep hand, redraw, alter hand]
targets: [mulligan-dialog, mulligan-hand, mulligan-readout, mulligan-odds, mulligan-confirm, mulligan-leave]
related: [craft-hand, draw-odds, draw]
order: 10
verified: v3.21.1
---

Each player's first turn opens on the mulligan. Player 1 chooses as the match starts. Player 2 chooses when Player 1 ends their first turn, before Player 2's draw, so they choose from the seven they were dealt.

## Keep or send cards back

The dialog shows your seven, cheapest first. The head says whether you're **on the play** or **on the draw**. On the play, you don't draw on turn 1. On the draw, you draw one card once you've chosen.

:::desktop
Click a card to mark it to go to the bottom, and click it again to unmark it. To read a card, click the magnifier in its corner, and the card grows in place. Any click or {key:Esc} puts it back.
:::

:::phone
Tap a card to mark it to go to the bottom, and tap it again to unmark it. To read a card, {gesture:long-press} it. It shows large with its name, cost and type. Tap anywhere to close it. That tap marks nothing.
:::

A marked card sinks and shows `↓ Bottom`. Then press the one button at the foot:

- **Keep hand** shows when nothing is marked. The hand stays and the deck isn't touched.
- **Mulligan N cards** shows otherwise. The marked cards go to the bottom of the deck, you draw as many from the top, and then the Dojo shuffles the deck.

[Show me](show:mulligan-confirm)

## Read the hand before you choose

The readout under the hand follows your marks. It has three parts:

- **Curve** shows the cards you'd keep. The cards going back show dashed.
- **Inkable** counts the cards you'd keep that can be inked.
- The plan counts kept cards and redraws, for example `5 kept + 2 redraw`.

**Draw odds** show your chance to find each card. **RD** is the chance among the redraws, and the next columns are the chances within the next turns' draws. Phones show the top three rows. Press **All** for the rest.

[Show me](show:mulligan-readout)

## After a mulligan

The dialog stays open on your new hand. The new cards carry a **NEW** tag, and the readout says how many cards went back and how many you drew. You can't mark cards again. Press **Start turn**, or **Draw and start turn** for Player 2, to play.

## Good to know

- Nothing else works until the hand is settled. Hotkeys don't fire, and the turn can't end.
- **Build** and **Replay**, next to **Draw** at the top, make the hand another way. **Build** lets you pick your seven, and **Replay** copies an opening from a saved game. See [Build or replay an opening hand](help:craft-hand).
- **Undo** after the turn has started brings the mulligan back.
- **×** at the top right, or {key:Esc}, leaves for the home screen. The match stays saved, still on its mulligan. **Back to match** or **Resume** brings the dialog back. [Show me](show:mulligan-leave)
