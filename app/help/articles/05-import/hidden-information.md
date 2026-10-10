---
id: hidden-information
title: What an import knows and doesn't
summary: Your own deck is exact from a replay; the opponent's hidden cards stay unknown until they reveal them.
devices: [desktop, phone]
aliases: [hidden cards, opponent hand, missing cards, unknown cards, why unknown, inaccurate import]
targets: []
related: [unknown-cards, import-overview]
order: 40
verified: v3.11.0
---

An import can only show what the game showed. Anything nobody saw comes in as an [unknown card](help:unknown-cards).

## From a replay file

- **Your deck** is exact: every card, in the order you'd have drawn it.
- **The opponent's hand and deck** are hidden. Cards they play, ink or show later are put back into their hand and deck in the earlier turns: soonest first in the hand, the rest in the deck. Cards they never show stay unknown.

## From a text log

- **Your deck**: the cards you go on to draw are on top, in order. The rest of the deck was never named, so it's unknown.
- **The opponent**, in the newer *You / Opponent* log: their opening hand and draws are hidden. As with a replay, cards they reveal later are filled in; the rest stay unknown.
- In the older *Player 1 / Player 2* log both hands are shown, so both sides work like your own.
- A card put into the inkwell or under a character face down isn't named either.

## Good to know

- Where the opponent's hidden cards sit (hand or deck) is the Dojo's best guess, not a fact.
- A text log can miss a step a replay has, such as an ability that exerts a character without naming it.
- Fix anything you know better: [swap cards](help:swap-cards) in a hand, or replace them in the deck.
