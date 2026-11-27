---
id: what-if
title: What-if: find a win you missed
summary: Play a lost game out again from your turns before the loss, looking for a line that would have won.
devices: [desktop, phone]
aliases: [what if, missed win, could i have won, replay analysis, review a game, post mortem, look for a win, keep going, alternate line]
targets: [what-if, what-if-panel, mini-what-if]
related: [rules-engine, import-replay, import-log, auto-save, branches, multiverse-panel]
order: 60
verified: v3.23.1
---

What-if takes a game you lost and plays it out again from your turns before the loss, one turn back at a time, looking for a line that would have won. Each line it plays becomes a branch in the [Multiverse](help:multiverse), so you can open it and play from it.

What-if needs the rules engine on **Assist** or **Lab**. See [The rules engine](help:rules-engine). It also needs a game saved turn by turn. That can be an [imported Duels.ink replay](help:import-replay) or [text log](help:import-log), or a game played here with [auto-save](help:auto-save) on.

## Start it

Open the [Multiverse](help:multiverse) and press **What-if** in its header. On a phone it's the key left of **Plot**. The What-if block opens at the top of the panel.

[Show me](show:what-if)

:::desktop
The **What-if** key in the mini Multiverse's header also opens it.
:::

Press **Look for a win**. It takes about half a minute for each turn back. A dot pulses on **What-if** and on **Multiverse** while it runs, and **Stop** ends it.

## What it does at each turn back

What-if starts at your last turn before the loss and goes back one of your turns at a time, up to 5 turns. At each one it plays these lines:

1. **The real game, replayed.** It replays both players' real moves from that turn, which should end as the real game did. The panel then says *The real game replays as it ended*. Sometimes the replay doesn't match, because of a card the engine can't see or a move it can't make. What-if then still tries that turn, and compares the lines with What you did as the engine plays it, not with the real game.
2. **What you did.** It plays your real move, with the search playing your later turns. This line must still lose.
3. **Lines 1 to 4.** It plays the search's four best other ways to play that turn, each to the end.

On your later turns, What-if plays the search's best line. On the opponent's turns, it plays their real moves and then lets the search finish their turn, unless the search finds a clearly better move. It stops at the first turn back with a winning line.

## Read the results

[Show me](show:what-if-panel)

- Each turn back has a row, like **3 back · Turn 19**, and a badge that reads **Win** or **No win**. For an unfinished game, the badge reads **Better** or **Not better**.
- **What you did** and each line show the lore at the end, like **19–20**, whether the line **Wins** or **Loses** and on which turn, and its moves.
- A win shows in Olive. The opponent's lore reaching 20 shows in Coral.
- **Show** selects the line's last node in the Multiverse.
- **Keep going** looks further back. **Remove 9 losing lines** takes the losing branches out of the Multiverse, and its number counts them. The toast's **Undo** puts them back.

## Games that fork, or aren't finished

- A game with more than one line, or one that isn't finished, asks where to start. Select a turn in the Multiverse, then press **Start from turn N**. **Pick another start** goes back.
- What-if plays an unfinished game to 2 turns past its last turn and compares the lore race, your lore minus theirs, instead of who wins. **Better** marks a line that beats What you did.
- A game played here has no record of the opponent's moves. What-if doesn't replay the real game, the search plays the opponent's turns, and What you did is the real board after your turn, played on.

## Good to know

- What-if is a beta, and the opponent's side is its weak point. A "win" can come from the search not using one of their cards the way a person would. Open the branch and check it.
- The branches stay in the session. The results in the panel last while the page is open. A reload or another game starts What-if afresh.
