---
id: files
title: Export and import session files
summary: Save a session as a file to back it up or send it, and open a session file.
devices: [desktop, phone]
aliases: [backup, download session, .dojo.json.gz, json file, load file, upload session]
targets: [tree-export, tree-import, lib-import, intake-file]
related: [library, share-links, storage]
order: 40
verified: v3.9.1
---

A session file holds a whole match: the board, every Multiverse node, the notes and the log. Export one to keep a backup outside this browser, or to send it to someone by hand.

## Export a session

- **The match on the board:** open the **Multiverse** and press **Export** at the top.
- **Any session:** in the Library, open the session's **⋯** and choose **Export file (.dojo.json.gz)**.

:::phone
In the Multiverse the file tools show only their icons: **Export** is the file with an arrow pointing out.
:::

[Show me](show:tree-export)

The file is named after the session, like `T8 study.dojo.json.gz` (characters a file name can't hold, such as `/`, are left out). It's compressed, so even a big Multiverse stays small. A browser that can't compress saves a plain `.dojo.json` instead.

## Open a session file

Any of these works:

- On the home screen, press **Choose a file**, or drop the file anywhere on the page. The Dojo reads it and shows **Saved session**. Press **Open it**.
- In the Library's **Sessions** tab, press **Import file**.
- In the Multiverse, press **Import**.

[Show me](show:intake-file)

The Dojo reads `.dojo.json.gz`, `.dojo.json` and older `.json` session files.

## Good to know

- Opening a file always adds a new session to your library and puts it on the board. Opening the same file twice gives you two sessions.
- Your files never go anywhere unless you send them. To send a match without a file, make a [share link](help:share-links).
- A file made by a newer Dojo asks you to reload the page to update first.
