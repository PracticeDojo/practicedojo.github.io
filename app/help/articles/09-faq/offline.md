---
id: offline
title: Playing offline and missing card art
summary: Card names and text still show when art can't load, and the card database is kept for offline starts.
devices: [desktop, phone]
aliases: [offline, no internet, no connection, cant see card pictures, missing images, blank cards, card art not loading, error loading database]
targets: [tweak-card-display]
related: [card-display, card-preview]
order: 10
verified: v3.11.0
---

Card pictures come from the internet. When one can't load, the card shows as text instead, so the board stays readable and you can keep playing.

## When art doesn't load

A card without its picture shows its name, version, ink cost, and strength and willpower. Its full text is still there: in the preview on desktop, in the card drawer on a phone. Face-down cards and the deck go plain dark.

Pictures come back by themselves when your connection does. Pictures that loaded once in a session stay loaded, even if the connection drops later.

## Text cards on purpose

In **Tweaks**, set **Card display** to **Text**. Every card then shows as text, and the Dojo loads no card pictures at all: handy on a slow or metered connection.

[Show me](show:tweak-card-display)

## Starting without a connection

The Dojo keeps a copy of the card database in this browser after the first visit, so it can start without downloading it again. The very first visit needs a connection: without one you see *Error loading database. Please refresh.*

The Dojo isn't an installed app. Once it's open you can play offline, but reopening it with no connection works only if your browser still has its files cached.

## Good to know

- Your sessions and decks are saved in this browser, so they don't need a connection. See [Where your things are kept](help:storage).
- Share links, opening a link, and signing in need a connection.
