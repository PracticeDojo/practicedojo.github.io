---
id: modifiers
title: Modifiers (+strength, Challenger, Resist)
summary: Give a card in play more or less strength, willpower or lore, or Challenger +X or Resist +X, for this turn, until your next turn, or for good.
devices: [desktop, phone]
aliases: [modifier, buff, debuff, boost strength, plus strength, minus strength, challenger, resist, until end of turn, until your next turn, temporary, effect]
targets: [field, card-drawer]
related: [challenge, quest, card-actions]
order: 95
verified: v3.17.1
---

Card effects often change a character for a while. Examples are "+2 strength this turn", "gains Resist +1 until the start of your next turn" and "Challenger +3". Add these as modifiers. The Dojo counts them in challenges and quests, then takes them off when they end.

## Add a modifier

:::desktop
Point at a card in play and press its **Modify** button, which shows a plus and minus icon. You can also right-click the card and choose **Add Modifier…**.
:::

:::touch
Tap a card in play and press **+ Add modifier** in the card drawer.
:::

In the picker, choose these:

1. **Stat.** Pick **STR**, **WP**, **LORE**, **Challenger** or **Resist**.
2. **Amount.** Set it with **−** and **+**. Strength, willpower and lore can go down. Challenger and Resist only go up.
3. **Lasts.** Pick **This turn**, **Until my next turn** or **Always**.

Press **Add** or {key:Enter}. Tick **All of P1's characters** to give every character that player has in play the same modifier. Use it for songs and effects that hit them all. **Recent** keeps your last four modifiers as one-tap buttons, and the picker opens on the last one you used.

:::desktop
The picker stays open after each add, so you can give a card several modifiers or move on to another card. Press {key:←} or {key:→} to move it to the next character or location in the same battlefield. It wraps round and skips items. Press {key:↑} or {key:↓} to jump to your opponent's battlefield or yours. The card it points at is outlined. Your stat, amount and duration stay as they were. Click anywhere else, press the **×**, or press {key:Esc} to close it.
:::

:::touch
On a phone the picker is a sheet that closes after each add.
:::

## How long it lasts

- **This turn** ends when the turn ends.
- **Until my next turn** lasts through your opponent's whole turn and ends when your next turn starts. "My" means the player whose turn it was when you added the modifier.
- **Always** stays until you remove it or the card leaves play.

The log lists each modifier as it ends. A card that leaves play loses its modifiers. A character you shift onto keeps them.

## On the card

Each modifier is a pill on the card's left edge, such as `+2 STR`, `RES +1` or `CHAL +3`. The card keeps its printed numbers, and the pills show what's added. The pill's colour says how long it lasts:

- Red-orange means this turn.
- Teal means until my next turn.
- Olive means always.

A plus is a filled pill. A minus is hollow, with a coloured edge and text. The same colours mark the choices in the picker.

## Remove a modifier

:::desktop
Click its pill on the card, or right-click the card and choose **Remove …** under **Modifiers**.
:::

:::touch
Open the card drawer and tap the pill under **Modifiers**.
:::

**Undo** brings it back.

## What they change

- **Challenges.** The Dojo first adds up the challenger's printed strength, its strength modifiers and Challenger, and only the total stops at 0. So a 0-strength character with −2 strength and Challenger +2 deals 0, not 2. The defender's Resist comes off that total. The damage back works the same way, in the result and the forecast. The card's own printed Challenger and Resist still count, and modifiers add to them.
- **Quests.** Modifiers change the lore that a quest and **Quest all** gain, and which characters count as able to quest.
- **Willpower.** Modifiers change the damage track, the lethal warning, and banishing after a challenge.
