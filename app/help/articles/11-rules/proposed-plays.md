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

With the rules engine on, **Suggest** tries orders of play for the rest of the turn and shows the best lines. Each line says what to play, quest and challenge, the lore it gains, and why it scores.

## Ask for plays

:::desktop
Press **Suggest** beside **Quest**, or the **Plays** tab at the top of the draw odds column. The lines appear in that tab after a few seconds.

[Show me](show:suggest)
:::

:::phone
Tap **☰**, then **Suggest**. The lines open in a **Proposed plays** sheet at the bottom. **×** closes it.
:::

The search plays the board for the player whose turn it is. If the board changes, the lines say so. Press **Search again**, or **↻** at the top, to look again.

## Read a line

Each line has a row with four figures:

- its number.
- the lore it gains, like **+2 lore**.
- the lore after it, like **18–2**.
- its score compared with ending the turn now, like **+4.0**.

Line 1 is open. It lists its steps in order, such as **Play**, **Quest** and **Ink**, with what an ability did under its move. Its **Why** lists the three reasons that moved its score most, like **lore +2.0** and **exposed −1.0**.

The other lines are closed. Each one says how it differs from line 1, as in *Like line 1, but play Strength of a Raging Fire → Prince Phillip instead of play Elinor*. Click or tap a row to open it.

**Show 8 more lines** shows the rest, and its number counts the lines left. The search keeps up to 12 lines.

A red row at the top means ending the turn now loses, because their characters can reach 20 next turn. The row says whether the lines stop that.

:::mouse
Point at a card in a step to see it. Point at an ability for its text, or at a reason or the score for what it means.
:::

## Play it, or keep it

- **Play it** puts the end of the line on the board. It's one step, so **Undo** takes it back. The Dojo writes the turn's recap and log as if you'd played the line.
- **Save as branch** keeps the line as a new node in the [Multiverse](help:branches), without changing the board.

## Good to know

- The score is a guess at how good the board is for you. It counts lore, what's in play, what's exposed to a challenge and the opponent's best reply. [The score lab](help:score-lab) shows the score and lets you change it.
- The search has a time limit. On a busy board it may stop early and say so. The lines are still the best it found.
