---
id: draw-odds
title: Draw odds
summary: The chance to draw each card in your next draws, updated as the game changes.
devices: [desktop]
aliases: [probability, odds, chance to draw, hypergeometric, outs, percentages]
targets: [draw-odds]
related: [mulligan, inspect-deck]
order: 60
verified: v3.11.0
---

**Draw odds**, on the right of the board, shows the chance of drawing at least one copy of each card in your next few draws. It follows the active player's deck and updates after every change.

[Show me](show:draw-odds)

## Read the odds

Each row is a card in the player's whole list, wherever its copies are now:

- **Left**: copies still in the deck.
- The three number columns: the chance, in percent, of drawing at least one copy within the next 1, 2 or 3 draws.

Rows with the most copies left come first. A card with no copies left stays in the list, greyed out with dashes. The number next to the title is the deck size. Point at a row to see the card in the preview.

## Change the draw windows

Click a column's number (1, 2 or 3) and type how many draws it should cover, from 1 to 60. The mulligan's odds use the same three windows.

## Hide the pane

Click the arrows at the top right of **Draw odds** to fold it into a thin strip; click them again to open it.

## Good to know

- The odds assume the deck is in random order. After you stack a deck by hand, they don't know the order you set.
- Unknown cards from an import are grouped in one **Unknown** row.
- On a phone there's no draw odds pane; the mulligan shows its own odds. See [Mulligan](help:mulligan).
