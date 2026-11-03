---
id: rules-engine
title: The rules engine (beta)
summary: What the rules engine is, how to switch it on (Off, Assist, Lab), and what it never does.
devices: [desktop, phone]
aliases: [rules, rules mode, engine, beta, legal moves, ai, computer, assist, lab, rules engine off]
targets: [tweak-rules]
related: [rules-assist, proposed-plays, bot-opponent, score-lab, what-if, tweaks]
order: 10
verified: v3.22.0
---

The rules engine is an optional helper that knows Lorcana's rules. It runs a Lorcana rules engine in your browser, next to the board, and reads the board as you play. It's in **beta**: it's useful already, but it misses some cards and situations, and it can change.

The board stays yours. The engine never blocks a move: you're still the referee, as in [You play both sides](help:you-play-both-sides). Switch it off and the Dojo is exactly as it was.

## Switch it on

In [Tweaks](help:tweaks), **Rules engine** has three choices:

- **Off** (the default): the sandbox, with no engine.
- **Assist**: the engine marks what the rules allow, suggests plays, can play a seat as a bot, and runs What-if.
- **Lab**: Assist, plus the score lab, where you see and change how plays are scored.

[Show me](show:tweak-rules)

The first time you switch it on, the Dojo loads the engine and its card data (about 800 KB). After that it starts at once.

## What it does

- **Marks the legal moves** on the board and lists them in each card's menu. See [What the rules allow](help:rules-assist).
- **Suggests plays** for the rest of the turn and can put one on the board. See [Proposed plays](help:proposed-plays).
- **Plays a seat** as your opponent, one move at a time. See [Play against the bot](help:bot-opponent).
- **Shows the score** behind the suggestions, and lets you change it (Lab). See [The score lab](help:score-lab).
- **Looks for a win you missed** in a game you lost. See [What-if](help:what-if).

## Good to know

- It's a beta. When the engine and the board disagree, the board wins: fix the board by hand, as you always could.
- The engine only knows what's on the board. It doesn't know which cards were played earlier this turn, apart from how many you inked, or an effect that's waiting to be resolved.
- An effect that lasts into the next turn is dropped when the bot hands a turn back to the board.
- On a phone, a tap on a card opens the card drawer, which has no rules list yet. The marks on the cards still show.
- The setting is kept in this browser.
