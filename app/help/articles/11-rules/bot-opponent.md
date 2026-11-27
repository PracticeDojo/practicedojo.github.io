---
id: bot-opponent
title: Play against the bot
summary: Let the rules engine play one seat, by itself or one move at a time, and take over whenever you like.
devices: [desktop, phone]
aliases: [bot, ai opponent, computer opponent, play against computer, solo, cpu, auto play, step, take over]
targets: [bot, bot-banner]
related: [rules-engine, you-play-both-sides, undo]
order: 40
verified: v3.22.1
---

With the rules engine on, the bot can play one seat, P1 or P2, while you play the other. It plays one move at a time, and you can watch, step through or take over.

## Start the bot

:::desktop
Press **Bot** in the top bar.
:::

:::phone
Tap the robot key in the top bar.
:::

[Show me](show:bot)

The menu has three settings:

- **Bot plays** is **Off**, **P1** or **P2**.
- **Pace** is **Auto** or **Step**. **Auto** plays its moves one after another. **Step** waits for you to ask for each one.
- **Speed** sets the pace of **Auto** to **Slow**, **Normal** or **Fast**.

The top bar then says **Bot P2** or **Bot P1**. Your seat stays at the bottom of the board.

## While it plays

A banner shows what the bot is doing, such as **Its turn** or **Thinking…**, and its last move. On desktop the banner sits under the top bar. On a phone it sits at the bottom of the screen, above your Quest and End turn. It has these controls:

- **Auto** and **Step** switch the pace.
- **Pause** in Auto stops the bot. **Next** in Step plays its next move.
- **Take over** switches the bot off so you play its seat yourself.

[Show me](show:bot-banner)

When the bot needs you to choose something during its turn, such as a card of yours that an effect targets, the banner asks you.

:::desktop
{key:P} switches between **Auto** and **Step**, and {key:N} plays the bot's next move.
:::

## Your turn

Play your turn as always, then press **End turn**. The engine runs the turn change, with its start-of-turn and end-of-turn effects, and the bot plays its turn.

## Good to know

- Each bot move is one **Undo** step, and the log says **Bot: …** for each one.
- Switch the bot off at any time. When you switch it on again, it carries on from the board as it is.
- If the bot gets stuck, it pauses and you finish the turn.
- A new game starts with the bot off. So does a game you load from the library, a file, a demo or a Duels.ink import.
