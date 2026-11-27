---
id: rules-engine
title: The rules engine (beta)
summary: What the rules engine is, how to switch it to Off, Assist or Lab, and what it never does.
devices: [desktop, phone]
aliases: [rules, rules mode, engine, beta, legal moves, ai, computer, assist, lab, rules engine off]
targets: [tweak-rules]
related: [rules-assist, proposed-plays, bot-opponent, score-lab, what-if, tweaks]
order: 10
verified: v3.22.0
---

The rules engine is an optional helper that knows Lorcana's rules. It runs in your browser, next to the board, and reads the board as you play. It's a **beta**. It misses some cards and situations, and it may change.

The board stays yours. The engine never blocks a move, and you're still the referee, as in [You play both sides](help:you-play-both-sides). Switch it off and the Dojo works as it did before.

## Switch it on

In [Tweaks](help:tweaks), **Rules engine** has three choices:

- **Off** is the default. You get the sandbox with no engine.
- **Assist** marks what the rules allow, suggests plays, can play a seat as a bot, and runs What-if.
- **Lab** adds the score lab to Assist. In the score lab you see and change how the engine scores plays.

[Show me](show:tweak-rules)

The first time you switch it on, the Dojo loads the engine and its card data, about 800 KB. After that it starts at once.

## What it does

- **Marks the legal moves** on the board and lists them in each card's menu. See [What the rules allow](help:rules-assist).
- **Suggests plays** for the rest of the turn and can put one on the board. See [Proposed plays](help:proposed-plays).
- **Plays a seat** as your opponent, one move at a time. See [Play against the bot](help:bot-opponent).
- **Shows the score** behind the suggestions, and in Lab lets you change it. See [The score lab](help:score-lab).
- **Looks for a win you missed** in a game you lost. See [What-if](help:what-if).

## Good to know

- When the engine and the board disagree, the board wins. Fix the board by hand, as you always could.
- The engine only knows what's on the board. It doesn't know which cards were played earlier this turn, except how many you inked. It also doesn't know about an effect that's waiting to be resolved.
- The engine drops an effect that lasts into the next turn when the bot hands a turn back to the board.
- On a phone, a tap on a card opens the card drawer, which has no rules list yet. The marks on the cards still show.
- This browser keeps the setting.
