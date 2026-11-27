---
id: offline
title: Playing offline and missing card art
summary: Card names and text still show when art can't load, and this browser keeps the card database for offline starts.
devices: [desktop, phone]
aliases: [offline, no internet, no connection, cant see card pictures, missing images, blank cards, card art not loading, error loading database]
targets: [tweak-card-display]
related: [card-display, card-preview]
order: 10
verified: v3.11.0
---

Card pictures come from the internet. When one can't load, the card shows as text instead, so you can still read the board and keep playing.

## When art doesn't load

A card without its picture shows its name, version, ink cost, strength and willpower. Its full text is in the preview on desktop and in the card drawer on a phone. Face-down cards and the deck show plain dark.

Pictures come back when your connection does. Pictures that loaded once in a session stay loaded, even if the connection drops later.

## Text cards on purpose

In **Tweaks**, set **Card display** to **Text**. Every card then shows as text, and the Dojo loads no card pictures. Use it on a slow or metered connection.

[Show me](show:tweak-card-display)

## Starting without a connection

After the first visit, the Dojo keeps a copy of the card database in this browser, so it can start without downloading it again. The first visit needs a connection. Without one you see *Error loading database. Please refresh.*

The Dojo isn't an installed app. Once it's open you can play offline. Reopening it with no connection works only if your browser still has its files cached.

## Good to know

- The Dojo saves your sessions and decks in this browser, so they don't need a connection. See [Where your things are kept](help:storage).
- Making a share link, opening a link and signing in need a connection.
