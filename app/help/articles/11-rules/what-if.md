---
id: what-if
title: What-if: find a win you missed
summary: Play a lost game out again from your turns before the loss, looking for a line that would have won.
devices: [desktop, phone]
aliases: [what if, search's line, missed win, could i have won, replay analysis, review a game, post mortem, look for a win, keep going, alternate line]
targets: [what-if, what-if-panel, mini-what-if]
related: [rules-engine, import-replay, import-log, auto-save, branches, multiverse-panel]
order: 60
verified: v3.24.0
---

What-if takes a game you lost and plays it out again from your turns before the loss, one turn back at a time, looking for a line that would have won. Each line it plays becomes a branch in the [Multiverse](help:multiverse), so you can open it and play from it.

It needs the rules engine (**Assist** or **Lab**, see [The rules engine](help:rules-engine)), and a game saved turn by turn: an [imported Duels.ink replay](help:import-replay) or [text log](help:import-log), or a game played here with [auto-save](help:auto-save) on.

## Start it

Open the [Multiverse](help:multiverse) and press **What-if** in its header (on a phone, the key left of **Plot**). The What-if block opens at the top of the panel.

[Show me](show:what-if)

:::desktop
The **What-if** key in the mini Multiverse's header opens it too.
:::

Press **Look for a win**. It takes about half a minute a turn back; a dot pulses on **What-if** and on **Multiverse** while it runs, and **Stop** ends it.

## What it does at each turn back

Starting at your last turn before the loss, it goes back one of your turns at a time. First it checks your move against the search's own lines (a second or so). If you played the search's top line, that turn is skipped with the badge **Search’s line**: on the games tried, those turns rarely held the win. Up to 5 of the others are played out:

1. **The real game, replayed**: both players' real moves from that turn, which should end as the real game did (*The real game replays as it ended*). When it doesn't (a card it can't see, a move the engine can't make), What-if still tries that turn and compares the lines with What you did as the engine plays it, not with the real game.
2. **What you did**: your real move, with the search playing your later turns. It must still lose.
3. **Lines 1–4**: the search's four best other ways to play that turn, each played out to the end.

Your later turns are the search's best line. Their turns are what they really did, then the rest of their turn by the search, unless the search finds clearly better. It stops at the first turn back with a winning line.

## Read the results

[Show me](show:what-if-panel)

- Each turn back has a row (**3 back · Turn 19**) and a badge: **Win** or **No win**. For an unfinished game: **Better** or **Not better**. A skipped turn says **Search’s line** and lists What you did.
- A turn you picked as the start is always played out, even when it was the search's line.
- **What you did** and each line show the lore at the end (**19–20**), whether it **Wins** or **Loses** and on which turn, and its moves.
- A win is in Olive; their lore reaching 20 is in Coral.
- **Show** selects the line's last node in the Multiverse.
- **Keep going** looks further back. **Remove 9 losing lines** (the count varies) takes the losing branches out of the Multiverse; the toast's **Undo** puts them back.

## Games that fork, or aren't finished

- A game with more than one line, or one that isn't finished, asks where to start: select a turn in the Multiverse, then press **Start from turn N**. **Pick another start** goes back.
- An unfinished game is played to 2 turns past its last and compared on the lore race (your lore minus theirs), not on who wins. **Better** marks a line that beats What you did.
- A game played here has no record of their moves: the real game isn't replayed, the search plays their turns, and What you did is the real board after your turn, played on.

## Good to know

- It's a beta, and their side is the weak point: a "win" can come from the search not using one of their cards the way a person would. Open the branch and check it.
- The branches stay in the session. The results in the panel last while the page is open; a reload or another game starts What-if afresh.
