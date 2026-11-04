---
id: score-lab
title: The score lab
summary: See how the engine scores a board, change the weights, keep profiles, and add your own terms.
devices: [desktop, phone]
aliases: [score, weights, lab, profile, evaluation, terms, my terms, new term, card numbers, tune]
targets: [tweak-rules, score-tab]
related: [proposed-plays, rules-engine]
order: 50
verified: v3.22.0
---

[Proposed plays](help:proposed-plays) are ranked by a score: a number for how good the board is for the player whose turn it is. The score lab shows that score and lets you change it. Switch it on in [Tweaks](help:tweaks): **Rules engine** → **Lab** (Lab includes everything Assist does).

## The Score tab

:::desktop
Press **Score** at the top of the draw odds column.

[Show me](show:score-tab)

- **Score now**: the score for the player to move.
- **Terms**: each part of the score (**lore**, **lore on board** yours and theirs, **board**, **exposed**, **hand**, **ink**, **race to 20**, **their turn**), with a box to switch it on or off, its weight, and what it's worth on this board now. Type a weight, or click a term's name for a slider. Point at a term to see what it measures.
:::

:::phone
The Score tab is on desktop only (phones don't have the draw odds column). The card numbers below still show.
:::

## Card numbers

In Lab, each card in play shows its share of the score (**+1.5**, **−3.7**): what it adds through lore on board, board and exposed, and your terms that count cards in play. The numbers follow every change to the board.

:::mouse
Point at a number for the sum behind it (*lore on board 2 × 0.6 = +1.20*).
:::

## Profiles

A profile is a set of weights and terms, kept in this browser. The list at the top of the Score tab picks the one in use.

- **Default** is the engine's own weights. It never changes: edit it and you get a draft (**Default · edited**) that you keep with **Save** as a new profile.
- **⋯** has **Save as…**, **Rename**, **Delete**, **Undo edits**, **Export** (to a file) and **Import**.

With a profile other than Default, each proposed line shows **↑** or **↓** against where Default put it, and the open line lists **All terms** with what each changed. Changing the weights marks the lines as old: press **Search again**.

## Your own terms

Under **Your terms**, **+ New term** adds a part of your own to the score:

- **Whose** cards (mine or theirs) and **Where** (in play, hand, inkwell, discard);
- filters: **Type**, **Keyword**, **Class**, **State** (ready, exerted, damaged), **Can** (quest, challenge), **Does** (what its abilities do: draw, removal, ramp, lore), **Cost** from–to, **Named**;
- a **Measure** (how many, lore, strength, willpower left, cost), a **Weight**, and **When**: **Always**, or only when **Ahead** or **Behind** in the race.

The form shows what the term is worth on this board and rings the cards it counts. A term that looks at cards they hold or inked is marked **peeks**: it uses what the Dojo shows you, which the real game wouldn't.

## Good to know

- Profiles are kept in this browser. Export one to keep it or move it to another device.
- The score is a guess, tuned by play against the engine's own bot. A higher score isn't a promise of a win.
