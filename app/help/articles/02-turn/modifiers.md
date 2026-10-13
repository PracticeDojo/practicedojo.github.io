---
id: modifiers
title: Modifiers (+strength, Challenger, Resist)
summary: Give a card in play +/− strength, willpower or lore, Challenger +X or Resist +X, for this turn, until your next turn, or for good.
devices: [desktop, phone]
aliases: [modifier, buff, debuff, boost strength, plus strength, minus strength, challenger, resist, until end of turn, until your next turn, temporary, effect]
targets: [field, card-drawer]
related: [challenge, quest, card-actions]
order: 95
verified: v3.17.1
---

Card effects often change a character for a while: "+2 strength this turn", "gains Resist +1 until the start of your next turn", "Challenger +3". Add these as modifiers and the Dojo counts them in challenges and quests, then takes them off when they end.

## Add a modifier

:::desktop
Point at a card in play and press its **Modify** button (the plus and minus icon), or right-click it and choose **Add Modifier…**.
:::

:::touch
Tap a card in play and press **+ Add modifier** in the card drawer.
:::

In the picker, choose:

1. **Stat**: **STR**, **WP**, **LORE**, **Challenger** or **Resist**.
2. **Amount** with **−** / **+**. Strength, willpower and lore can go down; Challenger and Resist only go up.
3. **Lasts**: **This turn**, **Until my next turn** or **Always**.

Press **Add** (or {key:Enter}). Tick **All of P1's characters** to give every character that player has in play the same modifier, for songs and effects that hit them all. **Recent** keeps your last four modifiers as one-tap buttons, and the picker opens on the last one you used.

:::desktop
The picker stays open after each add, so you can give a card several modifiers or move on to another card. Press {key:←} / {key:→} to move it to the next character or location in the same battlefield (it wraps round; items are skipped), and {key:↑} / {key:↓} to jump to your opponent's battlefield or yours. The card it points at is outlined. Your stat, amount and duration stay as they were. Click anywhere else, press the **×**, or press {key:Esc} to close it.
:::

:::touch
On a phone the picker is a sheet that closes after each add.
:::

## How long it lasts

- **This turn**: ends when the turn ends.
- **Until my next turn**: lasts through your opponent's whole turn and ends when your next turn starts. "My" is whoever's turn it was when you added it.
- **Always**: stays until you remove it, or the card leaves play.

The log lists each one as it ends. A card that leaves play loses its modifiers; a character you shift onto keeps them.

## On the card

Each modifier is a pill on the card's left edge, such as `+2 STR`, `RES +1` or `CHAL +3`. The card keeps its printed numbers, so you can still do the maths in your head; the pills show what's added. The pill's colour says how long it lasts:

- red-orange: this turn
- teal: until my next turn
- olive: always

A plus is a filled pill; a minus is hollow, with a coloured edge and text. The same colours mark the choices in the picker.

## Remove a modifier

:::desktop
Click its pill on the card, or right-click the card and choose **Remove …** under **Modifiers**.
:::

:::touch
Open the card drawer and tap the pill under **Modifiers**.
:::

Undo brings it back.

## What they change

- **Challenges**: the challenger's printed strength, its strength modifiers and Challenger are added up first, and only the total stops at 0. So a 0-strength character with −2 strength and Challenger +2 deals 0, not 2. The defender's Resist comes off that, and the damage back works the same way, in the result and the forecast. The card's own printed Challenger and Resist still count, and modifiers add to them.
- **Quests**: the lore a quest and **Quest all** gain, and which characters count as able to quest.
- **Willpower**: the damage track, the lethal warning, and banishing after a challenge.
