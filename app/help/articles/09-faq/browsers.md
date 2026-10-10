---
id: browsers
title: Browsers and devices
summary: Which browsers the Dojo runs in, and what changes on a phone or tablet.
devices: [desktop, phone]
aliases: [browser, chrome, safari, firefox, edge, ipad, tablet, mobile, phone layout, supported devices]
targets: []
related: [screen-at-a-glance, gestures, storage]
order: 50
verified: v3.11.0
---

The Dojo runs in the browser: nothing to install. Use a current Chrome, Edge, Firefox or Safari, on a computer, tablet or phone.

## What the browser needs

- **Storage (IndexedDB)** for your sessions, your decks and the card database. Some private windows block it; then nothing is kept. See [Where your things are kept](help:storage).
- **Compression** for session files and share links. Without it, the Dojo still saves on the device, but it can't share a session or open a `.gz` file.
- **A connection the first time**, to download the card database. See [Playing offline](help:offline).

## Phone, tablet or computer

The layout follows the width of the window, and the controls follow how you point.

- **760 pixels wide or less** gets the phone layout: one player bar per player, your hand along the bottom, the card drawer, the **⋯** menu and the Multiverse's thumb keys. No mini multiverse or draw odds column.
- **Wider** gets the desktop layout: the side rail with the mini multiverse, the preview, the log and the draw odds.
- **A mouse** gets hover controls on cards, right-click menus and [keyboard shortcuts](help:keyboard-shortcuts).
- **A touch screen** gets taps instead: a tap on a card in play opens the card drawer. See [Touch gestures](help:gestures).

A tablet is the desktop layout with touch. Turning a phone sideways, or zooming the browser, can change the layout.

## Good to know

- Each browser keeps its own library. Sessions saved in Safari don't show up in Chrome; sign in to have them in both.
