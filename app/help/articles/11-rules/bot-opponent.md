---
id: bot-opponent
title: Play against the bot
summary: Let the rules engine play one seat, automatically or one move at a time, and take over whenever you like.
devices: [desktop, phone]
aliases: [bot, ai opponent, computer opponent, play against computer, solo, cpu, auto play, step, take over]
targets: [bot, bot-banner]
related: [rules-engine, you-play-both-sides, undo]
order: 40
verified: v3.24.0
---

With the rules engine on, the bot can play one seat (P1 or P2) while you play the other. It plays one move at a time, and you can watch, step through or take over.

## Start the bot

:::desktop
Press **Bot** in the top bar.
:::

:::phone
Tap the robot key in the top bar.
:::

[Show me](show:bot)

In the menu:

- **Bot plays**: **Off**, **P1** or **P2**.
- **Pace**: **Auto** plays its moves one after another; **Step** waits for you to ask for each one.
- **Speed** (for Auto): **Slow**, **Normal** or **Fast**.

The top bar then says **Bot P2** (or P1). Your seat stays at the bottom of the board.

## While it plays

A banner under the top bar (at the bottom of the screen on a phone, above your Quest and End turn) shows what the bot is doing (**Its turn**, **Thinking…**) and its last move, with:

- **Auto** · **Step**: switch the pace;
- **Pause** (in Auto) or **Next** (in Step): stop, or play its next move;
- **Take over**: switch the bot off and play its seat yourself.

[Show me](show:bot-banner)

When the bot needs you to choose something during its turn (a card of yours an effect targets, say), the banner asks you.

:::desktop
Keys: {key:P} switches **Auto** and **Step**, {key:N} plays its next move.
:::

## Your turn

Play your turn as always, then press **End turn**: the engine runs the turn change (start- and end-of-turn effects) and the bot plays its turn.

## Decks with a plan

Some built-in decks come with a deck plan: how the deck wants to be played, written from a deck guide. When the bot plays one of them (today **S14 - GS - Go Wide**), the banner reads **Bot · P2 · Plan** and the bot:

- chooses its opening hand by the plan (the log says **Bot mulliganed 2 cards (deck plan)**, say);
- weighs what the plan says is worth keeping (the Go Wide plan holds on to a Strength of a Raging Fire for the right target);
- plays each of its turns as the best line the search finds for it, so it thinks a moment before its first move.

Without a plan, it keeps its opening hand and plays move by move.

## Good to know

- Each bot move is one **Undo** step, and the log says **Bot: …** for each.
- Switch it off at any time; switch it on again and it carries on from the board as it is.
- If the bot gets stuck, it pauses and the turn is yours to finish.
- A new game, or one you load (library, file, demo or a Duels.ink import), starts with the bot off.
