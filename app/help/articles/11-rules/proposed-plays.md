---
id: proposed-plays
title: Proposed plays (Suggest)
summary: Ask the engine for the best ways to play the rest of the turn, read why, then play one or keep it as a branch.
devices: [desktop, phone]
aliases: [suggest, best move, best play, hint, what should i play, lines, plays tab, play it, save as branch, solver]
targets: [suggest, plays-tab, plays-sheet]
related: [rules-engine, score-lab, branches, undo]
order: 30
verified: v3.22.0
---

With the rules engine on, **Suggest** tries orders of play for the rest of the turn and shows the best lines: what to play, quest and challenge, the lore each gains, and why it scores.

## Ask for plays

:::desktop
Press **Suggest** beside **Quest**, or the **Plays** tab at the top of the draw odds column. The lines appear in that tab after a few seconds.

[Show me](show:suggest)
:::

:::phone
Tap **☰**, then **Suggest**. The lines open in a **Proposed plays** sheet at the bottom; **×** closes it.
:::

The search plays the board for the player whose turn it is. If the board changes, the lines say so: press **Search again** (or **↻** at the top) to look again.

## Read a line

Each line has a row: its number, the lore it gains (**+2 lore**), the lore after it (**18–2**), and its score against ending the turn now (**+4.0**).

- **Line 1 is open**: its steps in order (**Play**, **Quest**, **Ink**, …, with what an ability did under its move) and **Why**, the three reasons that moved its score most (**lore +2.0**, **exposed −1.0**).
- **The others are closed** and say how they differ from line 1 (*Like line 1, but play Strength of a Raging Fire → Prince Phillip instead of play Elinor*). Click or tap a row to open it.
- **Show 8 more lines** (or however many are left) shows the rest: the search keeps up to 12.
- A red row at the top means ending the turn now loses: their characters can reach 20 next turn. It says whether the lines stop that.

:::mouse
Point at a card in a step to see it, at an ability for its text, or at a reason or the score for what it means.
:::

## Play it, or keep it

- **Play it** puts the end of the line on the board. It's one step: **Undo** takes it back. The turn's recap and log are written as if you'd played it.
- **Save as branch** keeps the line as a new node in the [Multiverse](help:branches), without changing the board.

## Good to know

- The score is a guess at how good the board is for you, from lore, what's in play, what's exposed to a challenge and their best reply. [The score lab](help:score-lab) shows it and lets you change it.
- The search has a time limit. On a busy board it may stop early and say so; the lines are still the best it found.
