---
id: challenge
title: Challenge
summary: Challenge an opposing card by dragging or tapping, with a forecast of what happens before you commit.
devices: [desktop, phone]
aliases: [attack, fight, challenge mode, combat, block]
targets: [challenge-mode, challenge-banner, challenge-keys, field, opponent-field]
related: [forecast, card-actions, modifiers]
order: 90
verified: v3.21.1
---

In a challenge, your character and the opposing card deal their strength to each other as damage. The Dojo works out the damage, exerts your character and banishes any card whose damage reaches its willpower. It counts [modifiers](help:modifiers) on either card, such as +strength, Challenger, Resist and willpower.

## Challenge mode

Press **Challenge** in the top bar, or press {key:C}. A bar across the board reads **CHALLENGE MODE**.

:::desktop
Drag one of your characters onto an opposing card. You can also click your character, then click the target. With a character picked, hovering a target shows the forecast.

The arrow keys work like the phone's thumb keys. The first arrow picks your first ready character, and {key:←} {key:→} {key:↑} {key:↓} step through your characters. {key:↑} off your top row moves to the opponent's cards. The arrows then aim at a target, which lights up, and a red arrow runs to it with the forecast. Press {key:Enter} to challenge. {key:↓} off their bottom row goes back to your characters.
:::

:::touch
Tap one of your characters, then tap an opposing card. Once you've picked, every opposing card shows a badge with the outcome. Dragging also works.
:::

:::phone
Thumb keys sit at the bottom right of your side, like the Multiverse's. The mode starts on your first ready character. ◀ ▶ ▲ ▼ step through your characters. The swap key, or ▲ off your top row, moves to the opponent's cards. The arrows then aim, and a red arrow runs from your character to the target. Press the fist to challenge. Press swap again to go back to your characters. Tapping also works. Tap an opposing card to aim at it, and tap it again to challenge.

A tap on the bare battlefield leaves challenge mode.
:::

You stay in the mode to challenge again. Press **Done** to leave. The first {key:Esc} drops the picked character, and the second leaves. Ending the turn also leaves the mode.

[Show me](show:challenge-mode)

## Start from a character

:::desktop
Hover your character and press its challenge button, or right-click it and choose **Challenge…**. Challenge mode opens with it picked. You can also drag your character onto an opposing card without entering the mode. That works on a character standing at a location and on the location itself.
:::

:::touch
Tap your character and press **Challenge** in the card drawer. Challenge mode opens with it picked. Tap the target.
:::

## The forecast

Before you commit, the Dojo shows each card's damage after the challenge and whether it's banished, with labels such as **✕ Banishes …** and **⇄ Trade**. Choose how much it shows with **Off**, **Light** or **Full** in the challenge bar. See [Challenge forecast](help:forecast).

## Good to know

- Damage is strength, plus **Challenger +N** on the challenger, minus **Resist +N** on the card taking it. Only a card's own printed Challenger and Resist count. An ability may give them to another character, as in "give chosen character Resist +2", or only under a condition, as in "while you have no cards in your hand". Add those as a [modifier](help:modifiers) when they apply. The Dojo doesn't apply other abilities. Fix damage by hand afterwards.
- The Dojo doesn't stop an exerted or drying challenger, or a ready target. It allows them and notes it in the log.
- The Dojo doesn't check Bodyguard, Evasive and similar keywords. You're the referee.
- One **Undo** takes back the whole challenge.
