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

The engine ranks [proposed plays](help:proposed-plays) by a score. The score is a number for how good the board is for the player whose turn it is. The score lab shows that score and lets you change it. To switch it on, set **Rules engine** to **Lab** in [Tweaks](help:tweaks). Lab includes everything Assist does.

## The Score tab

:::desktop
Press **Score** at the top of the draw odds column.

[Show me](show:score-tab)

- **Score now** is the score for the player to move.
- **Terms** lists each part of the score. The terms are **lore**, **lore on board** for you and the opponent, **board**, **exposed**, **hand**, **ink**, **race to 20** and **their turn**. Each term has a box to switch it on or off, its weight, and what it's worth on this board now. Type a weight, or click a term's name for a slider. Point at a term to see what it measures.
:::

:::phone
The Score tab is on desktop only, because phones don't have the draw odds column. The card numbers below still show.
:::

## Card numbers

In Lab, each card in play shows its share of the score, like **+1.5** or **−3.7**. The share is what the card adds through lore on board, board and exposed, and through your terms that count cards in play. The numbers follow every change to the board.

:::mouse
Point at a number for the sum behind it, like *lore on board 2 × 0.6 = +1.20*.
:::

## Profiles

A profile is a set of weights and terms, kept in this browser. The list at the top of the Score tab picks the one in use.

- **Default** holds the engine's own weights. It never changes. If you edit it, you get a draft called **Default · edited**. Press **Save** to keep the draft as a new profile.
- **⋯** has **Save as…**, **Rename**, **Delete**, **Undo edits**, **Export** to a file, and **Import**.

With a profile other than Default, each proposed line shows **↑** or **↓** compared with where Default ranked it. The open line lists **All terms** with what each one changed. Changing the weights marks the lines as old, so press **Search again**.

## Your own terms

Under **Your terms**, **+ New term** adds a part of your own to the score. A term has these settings:

- **Whose** cards, mine or theirs, and **Where** they are, in play, in hand, in the inkwell or in the discard.
- Filters for **Type**, **Keyword**, **Class**, **State**, **Can**, **Does**, **Cost** and **Named**. **State** is ready, exerted or damaged. **Can** is quest or challenge. **Does** is what the card's abilities do, such as draw, removal, ramp or lore. **Cost** takes a range.
- A **Measure**, which is how many, lore, strength, willpower left or cost.
- A **Weight**.
- **When**, which is **Always**, or only when **Ahead** or **Behind** in the race.

The form shows what the term is worth on this board and rings the cards it counts. A term that looks at cards the opponent holds or inked is marked **peeks**. It uses information the Dojo shows you that the real game would hide.

## Good to know

- This browser keeps your profiles. Export one to keep it or move it to another device.
- The score is a guess, tuned by play against the engine's own bot. A higher score doesn't promise a win.
