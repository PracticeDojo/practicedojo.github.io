---
id: hidden-information
title: What an import knows and doesn't
summary: A replay gives your own deck exactly. The opponent's hidden cards stay unknown until they reveal them.
devices: [desktop, phone]
aliases: [hidden cards, opponent hand, missing cards, unknown cards, why unknown, inaccurate import]
targets: []
related: [unknown-cards, import-overview]
order: 40
verified: v3.11.0
---

An import can only show what the game showed. Any card nobody saw comes in as an [unknown card](help:unknown-cards).

## From a replay file

- **Your deck** is exact. It has every card, in the order you'd have drawn it.
- **The opponent's hand and deck** are hidden. The Dojo puts the cards they play, ink or show later back into their hand and deck in the earlier turns. The soonest cards go in the hand and the rest go in the deck. Cards they never show stay unknown.

## From a text log

- **Your deck** has the cards you go on to draw on top, in order. The log never names the rest of the deck, so it's unknown.
- **The opponent's** opening hand and draws are hidden in the newer *You / Opponent* log. As with a replay, the Dojo fills in cards they reveal later, and the rest stay unknown.
- The older *Player 1 / Player 2* log shows both hands, so both sides work like your own.
- The log doesn't name a card put face down into the inkwell or under a character.

## Good to know

- The place of the opponent's hidden cards, in the hand or the deck, is the Dojo's best guess.
- A text log can miss a step that a replay has, such as an ability that exerts a character without naming it.
- Fix anything you know better. You can [swap cards](help:swap-cards) in a hand, or replace them in the deck.
