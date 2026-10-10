# ARCH: User Manual, Search and Guided Tours

> **Status:** v0.2, accepted. All six open questions decided as proposed (§14, 2026-10-10). M0 built (§5.7).
> **Scope:** Practice Dojo (`app/index.html` in `PracticeDojo/practicedojo.github.io`).
> What's done and what's left is tracked in [`TODO-help-and-tour.md`](TODO-help-and-tour.md). Open questions are in [§13](#13-open-questions); decisions go in the log in [§14](#14-decision-log).

Planned as **Feature 57** (the manual: viewer, search, content) and **Feature 58** (guided tours) in `docs/features.md`.

---

## 1. What we're building

Three things, built on one content source:

1. **A user manual** inside the app. Short articles about how each part of the Dojo works, grouped into sections. Players look things up; they don't read it front to back.
2. **Fuzzy search** over that manual. A player types what they want in their own words ("how do I go back", "mana", "attack", "dark mode") and gets the right article and section, even with typos.
3. **Guided tours** for first-time players. Opt in, never forced. The tour points at the real controls on a practice board and waits for the player to try each one.

All three adapt to the device: a phone gets phone instructions (tap the card, the card drawer, thumb keys), a desktop gets desktop ones (hover controls, right-click, hotkeys). The player can switch the manual to the other device's instructions.

## 2. Principles

1. **Opt in, never in the way.** No tour starts on its own and no modal greets a new player. The offer is one quiet strip on the home screen, and *Not now* means never again. Help is one key (`?`) or one menu item away.
2. **One source for words.** Every explanation is written once, in an article. Tours link to articles instead of repeating them. Contextual `?` links open articles.
3. **Point at the real thing.** Prefer *Show me* (highlight the live control) over screenshots. Screenshots go stale; the live control can't.
4. **Device-aware, not device-locked.** The manual shows the instructions for the device in use, and can show the other one.
5. **Works offline and signed out.** The manual is a static file from the repo, cached by the browser like the app. No Supabase, no network calls of its own, no tracking. Tour progress lives on the device.
6. **Stays true.** The manual names controls by their real labels, and a tool checks that the controls it points at still exist (§10). A visible change to the app comes with its manual change in the same PR.
7. **YAGNI and the splitting rule.** New concerns get their own classic `<script src>` file in `app/js/` with one global. No build step for the site, no bundler, no framework. Changes to `app/index.html` are small hooks, listed in §11.

---

## 3. Big picture

```
 Authors (people and agents)                     tools/help.mjs
 app/help/articles/**/*.md  ──┐                  build · --check · test
 app/help/tours/*.json      ──┼──────────────────────────┐
 app/help/targets.json      ──┤                          ▼
 app/help/synonyms.json     ──┘            app/help/manual.json  (generated, committed)
                                                         │ fetched once, on first open
┌────────────────────────────── Browser ─────────────────┴──────────────────────────────┐
│                                                                                        │
│  entry points: ? key · top bar Help · ⋯ menu · home · [data-help] links · #help/<id>   │
│        │                                                                               │
│        ▼                                                                               │
│  DojoHelp (app/js/help.js) ── drawer / sheet, contents, article view, device switch    │
│        │        └─ DojoHelpSearch (app/js/help-search.js) ── Fuse index, synonyms      │
│        │                                                                               │
│        ├─ "Show me" ──► DojoSpotlight (app/js/spotlight.js) ── dim, ring, callout      │
│        │                       ▲                                                       │
│        └─ "Take a tour" ─► DojoTour (app/js/tour.js) ── steps, predicates, scratch     │
│                                 │                       board                          │
│                                 ▼                                                      │
│                       App (app/index.html): render hook, key hook, scratch session     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Piece | File | Global | Knows about |
|---|---|---|---|
| Manual viewer | `app/js/help.js` | `DojoHelp` | the bundle, the DOM of the help drawer, device detection |
| Search | `app/js/help-search.js` | `DojoHelpSearch` | records and Fuse only (pure, testable in Node) |
| Spotlight | `app/js/spotlight.js` | `DojoSpotlight` | the target registry and the page's DOM; nothing about help or tours |
| Tours | `app/js/tour.js` | `DojoTour` | tour files, step predicates, `App` (reads state, opens the scratch board) |
| Content | `app/help/` | — | — |
| Styles | `app/css/field-unit.css` (a `Help & tours` section) | — | Field Unit tokens |

---

## 4. Device model

The app already tells layouts and inputs apart, and the manual uses the same two tests (`App.isPhoneUI()`, `App.isTouchUI()`):

| Tag | Means | Test |
|---|---|---|
| `desktop` | the desktop layout (wider than 760px) | `!(max-width: 760px)` |
| `phone` | the phone layout (760px or narrower) | `(max-width: 760px)` |
| `mouse` | a pointer that hovers | `(hover: hover)` |
| `touch` | no hover (finger) | `(hover: none)` |

A tablet is `desktop` + `touch`: the desktop board, but a tap on a field card opens the card drawer (Feature 37). That's why input and layout are separate tags.

**In the manual:** the viewer starts on the device in use and shows a *Desktop · Phone* switch in its header (the `.seg` control the home screen uses for the theme). The switch changes the layout tag only; the input tag follows the layout (`desktop` → `mouse`, `phone` → `touch`), except on a real tablet, where *Desktop* keeps `touch`.

**What differs by device** (the articles that need variant blocks):

| Topic | Desktop | Phone |
|---|---|---|
| Card actions | hover controls, right-click menu, hover hotkeys | tap → card drawer (function keys) |
| Hand | hand tray, drag to play or ink | peeking fan, tap → card drawer, drag up |
| Inkwell | ink bar with ink cards | count on the player bar, tap → bottom sheet |
| Lore, deck, discard | lore box, deck slab, discard column | one player bar per player |
| Turn notes | notes box beside the hand | long press the empty battlefield |
| Top bar | grouped tools | ☰ · turn control · Multiverse · ⋯ menu |
| Multiverse | cards or plot, arrow keys, mini multiverse in the rail | plot first, thumb keys, panel under the canvas |
| Mulligan | magnifier on each card | press and hold a card |
| Shortcuts | keyboard shortcuts | gestures |

---

## 5. Content model

### 5.1 Layout

```
app/help/
  articles/
    01-start/first-match.md
    01-start/screen-at-a-glance.md
    02-turn/ink-a-card.md
    …
  tours/
    basics.json
    basics.dojo.json.gz        ← the practice board the tour starts on
    multiverse.json
    import.json
  img/                         ← the few screenshots worth keeping (§5.6), generated
  targets.json                 ← named UI targets for "Show me" and tours (§7.1)
  synonyms.json                ← player words → Dojo words (§6.3)
  sections.json                ← section ids, titles and order
  manual.json                  ← GENERATED by tools/help.mjs; the only file the app fetches
```

- **One article per file** so several authors (or agents) can write at once without touching the same file.
- **Folders are sections**, prefixed for order. An article's `id` is its file name without `.md`, and must be unique across folders (the tool checks).
- **`manual.json` is generated and committed**, like `js/landing-multiverse-data.js`. The site stays build-free: the tool runs on a developer's machine or in an agent session, never on the server.

### 5.2 Article file

```markdown
---
id: ink-a-card
title: Ink a card
summary: Put a card from your hand into your inkwell, face down, to pay for cards later.
devices: [desktop, phone]          # who it's for. Default: both
aliases: [put into inkwell, ink drop]
targets: [ink-bar, hand]           # named targets this article explains (§7.1)
related: [inkwell, play-a-card, end-turn]
verified: v3.9.1                   # the app version this was last checked against
---

You can ink one card a turn. Inked cards pay for the cards you play.

## Ink a card

:::desktop
Drag a card from your hand onto your **Ink** bar. Or right-click the card and choose **Ink**.
:::

:::phone
Tap the card in your hand. In the card drawer, press **Ink**.
Or drag the card up onto the ink count on your player bar.
:::

[Show me](show:ink-bar)

## Good to know

- The Dojo doesn't enforce the one-ink-a-turn rule. The ink tag shows **+1** once you've inked this turn.
- To take it back, press **Undo**.
```

**Front matter** (a small YAML subset: strings and inline lists only, parsed by the tool):

| Key | Required | Notes |
|---|---|---|
| `id` | yes | `[a-z0-9-]+`, unique; the file name |
| `title` | yes | sentence case, the task or the thing ("Ink a card", "The Multiverse") |
| `summary` | yes | one sentence; shown in search results and the contents |
| `devices` | no | `[desktop]`, `[phone]` or both (default). An article for one device still shows on the other, marked |
| `aliases` | no | extra words players might search for, beyond `synonyms.json` |
| `targets` | no | named targets the article explains; checked by the tool |
| `related` | no | article ids, listed at the article's foot |
| `verified` | yes | app version it was checked against; the tool warns when it falls a minor behind |
| `order` | no | position within its section (default: by file name) |

### 5.3 Markdown and the extensions

Plain Markdown, rendered with `marked` and cleaned with DOMPurify (both already loaded). Four extensions, handled by `help.js` before `marked` runs:

| Write | Renders | Notes |
|---|---|---|
| `:::desktop` … `:::` | the block only on that device | Tags: `desktop`, `phone`, `mouse`, `touch`. Several tags must all match: `:::desktop touch` is a tablet. Blocks don't nest |
| `{key:M}` `{key:Shift+?}` | a keycap | Styled as a neutral function key (Bone), mono |
| `{gesture:long-press}` | a gesture chip | `tap`, `double-tap`, `long-press`, `swipe`, `drag`, `pinch` |
| `[Show me](show:ink-bar)` | a *Show me* tool | Highlights the named target (§7). Hidden when the target isn't on screen on this device |
| `[Mulligan](help:mulligan)` | a link to another article | `help:<id>` or `help:<id>#<heading-slug>` |

Images: `![The plot](img/multiverse-plot.webp)`. Rare (§5.6).

When an article has a block for the other device but not this one, the viewer adds one line under it: *On a phone this works differently · Show phone*.

### 5.4 Sections and the article list

`sections.json` fixes the order. The ids below are the contract for M0: writers fill these files, tours and `?` links point at these ids. Add to the list freely; renaming an id means fixing every link to it (the tool finds them).

**01 · Getting started** (`01-start/`)
| id | Title | Device variants |
|---|---|---|
| `what-is-the-dojo` | What the Dojo is | — |
| `first-match` | Start your first match | small |
| `screen-at-a-glance` | The screen at a glance | **yes** |
| `you-play-both-sides` | You play both sides | — |
| `tours` | Guided tours | — |

**02 · Playing a turn** (`02-turn/`)
| id | Title | Device variants |
|---|---|---|
| `mulligan` | Mulligan and your opening hand | **yes** |
| `craft-hand` | Craft a starting hand | small |
| `draw` | Drawing cards | small |
| `ink-a-card` | Ink a card | **yes** |
| `inkwell` | Your inkwell: ready, spend, ready all | **yes** |
| `play-a-card` | Play a card | **yes** |
| `card-actions` | Act on a card in play (exert, ready, damage, banish) | **yes** |
| `quest` | Quest and lore | **yes** |
| `challenge` | Challenge | **yes** |
| `locations-and-stacks` | Locations, shift and cards under | **yes** |
| `move-cards` | Move cards: to hand, deck top or bottom, discard | **yes** |
| `end-turn` | End your turn | **yes** |
| `undo` | Undo | small |
| `turn-notes` | Turn notes | **yes** |
| `winning` | Winning a game (20 lore) | — |

**03 · Cards and decks** (`03-cards/`)
| id | Title | Device variants |
|---|---|---|
| `card-preview` | Read a card: preview and text mode | **yes** |
| `inspect-deck` | Look through your deck and reorder it | **yes** |
| `inspect-discard` | Your discard pile | **yes** |
| `swap-cards` | Swap a card in your hand or deck | **yes** |
| `unknown-cards` | Unknown cards and filling them in | small |
| `draw-odds` | Draw odds | desktop only (phones: mulligan odds) |
| `decks` | Your decks: new, import, edit | small |
| `default-decks` | Built-in decks and demos | — |

**04 · The Multiverse** (`04-multiverse/`)
| id | Title | Device variants |
|---|---|---|
| `multiverse` | What the Multiverse is | — |
| `auto-save` | Every turn is saved | — |
| `save-unfinished-turn` | Save the turn you're in | small |
| `nodes` | Reading a node | — |
| `multiverse-panel` | The panel: select, play from here, rename, notes, delete | **yes** |
| `branches` | Branching: try another line | — |
| `left-here` | "Left here" snapshots | — |
| `multiverse-views` | Cards and plot | **yes** |
| `multiverse-navigate` | Moving around: keys, thumb keys, zoom | **yes** |
| `mini-multiverse` | The mini multiverse | desktop only |

**05 · Importing games** (`05-import/`)
| id | Title | Device variants |
|---|---|---|
| `import-overview` | Study a Duels.ink game | — |
| `import-log` | Import a text log | small |
| `import-replay` | Import a replay file | small |
| `hidden-information` | What an import knows and doesn't | — |

**06 · Sessions, library and sharing** (`06-library/`)
| id | Title | Device variants |
|---|---|---|
| `sessions` | Sessions save themselves | — |
| `save-and-rename` | Save, save as copy, rename | **yes** |
| `library` | The Library: sessions, decks, links | small |
| `files` | Export and import session files | — |
| `share-links` | Share a deck or a session | **yes** |
| `open-a-shared-link` | Open a link someone sent you | — |

**07 · Your account (optional)** (`07-account/`)
| id | Title | Device variants |
|---|---|---|
| `account` | Why sign in (and why you don't have to) | — |
| `sign-in` | Sign in and out | — |
| `account-sync` | What goes to your account, and conflicts | — |

**08 · Settings** (`08-settings/`)
| id | Title | Device variants |
|---|---|---|
| `tweaks` | Tweaks | small |
| `theme` | Day, night and accent | — |
| `card-display` | Card size and Art / Text | — |
| `palette` | Player palette | — |
| `forecast` | Challenge forecast | small |

**09 · Help and fixes** (`09-faq/`)
| id | Title | Device variants |
|---|---|---|
| `offline` | Playing offline and missing card art | — |
| `storage` | Where your things are kept, and how to lose them | — |
| `hotkeys-not-working` | Shortcuts don't do anything | desktop only |
| `share-limits` | Share link limits | — |
| `browsers` | Browsers and devices | — |

**10 · Reference** (`10-reference/`)
| id | Title | Device variants |
|---|---|---|
| `keyboard-shortcuts` | Keyboard shortcuts | desktop only |
| `gestures` | Touch gestures | phone only (and tablets) |
| `glossary` | Glossary | — |

About 60 articles. Most are 100–300 words.

### 5.5 Writing style

The manual sounds like the rest of the repo's docs and the app's own labels:

- **Plain and short.** Sentence case. Short sentences. Second person ("Tap the card"). No marketing voice.
- **Name controls exactly as the app labels them**, in bold: **End turn**, **Play from here**, **Save current unfinished turn**. Mono labels the app shows in caps are written as the app shows them.
- **Lead with the task.** The first line says what it's for; then *how*, per device; then *Good to know*.
- **Lorcana words are Lorcana's** (ink, quest, challenge, exert, banish, lore). Other games' words go in `synonyms.json`, not in the prose.
- **No version history.** "Since v3.4" belongs in `features.md`, not in the manual.
- **The sandbox rule:** say where the Dojo doesn't enforce a rule ("The Dojo doesn't stop you from…"); the player is the referee (Field Unit principle 5).
- **Check it in the app.** Every article is checked against the live app at 1440 and 390 wide (§12) before `verified` is set.

### 5.6 Screenshots

Few, on purpose. Use one only where a picture explains layout better than words: *The screen at a glance* (desktop and phone), *Reading a node*, *Cards and plot*. Everything else uses *Show me*.

`tools/help.mjs shots` takes them with the dojo-screenshots tool, day and night, as `.webp` into `app/help/img/` (`<name>-<device>-<theme>.webp`); the viewer shows the one that matches the theme and the device switch. `node tools/refresh-landing.mjs` stays separate; the release checklist (§12) runs both.

### 5.7 As built (M0)
What the scaffolding settled, beyond the sketches above. Later milestones build to these.
- **64 stub articles** under `app/help/articles/`, one per id in §5.4. Each has full front matter and a `TODO` body; its `summary` is the writer's brief. A stub may carry `verified: none`; a written article must have a real version.
- **`targets.json`** is `{ "$comment", "targets": { name: { label, screen, any | desktop | phone } } }`. `label` is what a callout calls the control ("End turn"); `screen` is what must be open for it to show (`board`, `home`, `library`, `multiverse`, `mulligan`, `tweaks`, `drawer`, `challenge`, `shared`), for the spotlight and `--live`. A device key beats `any`. 88 targets.
- **New ids in `app/index.html`** (markup only, pixel-identical at 1440 and 390): `btn-home`, `btn-session-copy`, `btn-end-turn`, `btn-quest-all`, `btn-end-turn-mobile`, `btn-quest-all-mobile`, `sidebar`, `player-rows`, `mmv-ctl`, `card-preview`, `auto-save-row`, `top-/bottom-lore-badge`, `top-/bottom-lore-bar`, `top-/bottom-ink-bar`, `top-/bottom-deck`, `top-peek`, `turn-notes`, `mulligan-dialog`, `mulligan-craft`, `tree-import`, `tree-export`, `tree-log`, `tree-zoom-reset`, `tree-close`, `btn-example-log`, `btn-intake-file`, `btn-all-sessions`, `btn-lib-import`, `btn-deck-new`, `btn-deck-import-txt`, `btn-deck-from-replay`. On phones, controls that live in the ⋯ menu (Save, Save as copy, Share, Tweaks, the way home) target `#btn-topbar-more`.
- **`synonyms.json`** is `{ "$comment", "groups": [[…]] }`.
- **`manual.json`** (version 1): `{ format: "practice-dojo-manual", version, sections: [{ id, title, articles: [ids] }], articles: [{ id, section, title, summary, devices, aliases, targets, related, verified, todo, headings: [{ level, text, slug }], body }], targets, synonyms, tours }`. Articles come in section order, then `order`, then id. No timestamps or app version, so it only changes when a source does.
- **Heading slugs are made by the tool** (lowercase, punctuation dropped, spaces to hyphens, `-2` for repeats) and shipped in `headings`. The viewer and the search use those, never their own rule.
- **`field-unit.css`** ends with a *Help & tours* section holding one empty slot per milestone (M1, M2, M4, M5, M7).
- `app/help/README.md` is the writers' quick guide.

---

## 6. The manual viewer and search

### 6.1 Opening help

| Where | Desktop | Phone |
|---|---|---|
| Keyboard | `?` toggles help (not while typing) | — |
| Top bar | a **Help** paper tool (`?` icon) in the right group, beside Tweaks | in the ⋯ menu: **Help & tours** |
| Home screen | **Help** in the header, beside Library | same |
| In context | small `?` links on panels and dialogs (§6.5) | same |
| Link | `…/app/#help/<id>` or `#help/<id>/<heading-slug>` opens that article | same |

Opening help the first time fetches `manual.json` (one request, ~100–150 KB, smaller gzipped) and builds the search index. After that it's in memory; the browser cache serves it offline.

### 6.2 Layout

**Desktop: a side drawer, not a modal.** 400px, docked right under the top bar, over the draw-odds column. The board stays live, so a player can read and try at the same time. A paper module on the chassis, like the Library drawer.

```
┌ HELP ──────────────────────── [Desktop|Phone]  ✕ ┐
│ ┌──────────────────────────────────────────────┐ │
│ │ ⌕  Search the manual                     /   │ │
│ └──────────────────────────────────────────────┘ │
│ TOURS                                            │
│  Your first turn · 3 min                   ✓     │
│  The Multiverse · 3 min                          │
│  Study a Duels.ink game · 2 min                  │
│ GETTING STARTED                                  │
│  Start your first match                          │
│  The screen at a glance                          │
│ PLAYING A TURN                                   │
│  …                                               │
└──────────────────────────────────────────────────┘
```

Article view: a back chevron and the section (`‹ PLAYING A TURN`), the title, the article, *Show me* tools where they belong, then *Related*. Search stays at the top.

**Phone: a full-screen sheet**, framed like the phone board (8px of chassis, 16px corners, safe areas). Same parts. The search field uses 16px text so iOS doesn't zoom, `enterkeyhint="search"`, and doesn't take focus by itself (that would throw the keyboard over the contents). *Show me* closes the sheet first, then highlights.

**Keys inside help:** `/` focuses search; ↑ / ↓ move through results, Enter opens; Esc goes back from an article, then closes help; Backspace in an empty search goes back to the contents.

**State:** the last article and the device switch are remembered for the page's life, not saved. Help closes on *Leave to the dojo* and stays open across a render.

### 6.3 Search

**Engine:** Fuse.js 6.6.2, already loaded for the card search. No new dependency.

**Records are sections, not articles.** `DojoHelpSearch.build(manual)` splits each article at its `##` headings, so a search for "ready all" lands on *Your inkwell › Ready all*, scrolled to it. Each record:

```js
{ id: 'inkwell#ready-all', article: 'inkwell', anchor: 'ready-all',
  title: 'Your inkwell', heading: 'Ready all', section: 'Playing a turn',
  devices: ['desktop', 'phone'],   // from the article, narrowed by the blocks the section contains
  aliases: '…',                     // article aliases + synonyms of words in the record
  text: '…' }                       // plain text: no markdown, blocks for both devices
```

The article's lead paragraph is its own record (anchor `''`).

**Fuse options (starting point, tuned by the golden queries in §10):** keys `title` 0.35, `heading` 0.25, `aliases` 0.25, `text` 0.15; `ignoreLocation: true`, `threshold: 0.38`, `minMatchCharLength: 2`, `includeMatches: true`.

**Player words → Dojo words** (`synonyms.json`). Players arrive from other games and from plain English. Each group lists the Dojo word first:

```json
[
  ["ink", "mana", "land", "resource"],
  ["challenge", "attack", "fight", "combat"],
  ["exert", "tap", "turn sideways"],
  ["ready", "untap"],
  ["banish", "destroy", "kill", "dies", "graveyard"],
  ["discard", "graveyard", "trash", "bin"],
  ["lore", "points", "score", "victory points"],
  ["undo", "rewind", "take back", "go back", "oops"],
  ["multiverse", "timeline", "tree", "branch", "what if", "history"],
  ["mulligan", "redraw", "opening hand", "keep"],
  ["theme", "dark mode", "night mode", "light mode"]
]
```

At build time, a record whose text contains a group's Dojo word gets the rest of the group in `aliases`. So "attack" finds *Challenge* with no fuzzy luck needed. (`library` stays out: in the Dojo it's the Library drawer, not the deck.)

**Ranking tweaks after Fuse:**
- A record for the other device only drops by 0.15 and shows a *Phone* or *Desktop* tag. It's never hidden: a desktop player may be asking about their phone.
- One-character queries and key names (`m`, `space`, `esc`) match the *Keyboard shortcuts* rows first.
- Ties go to the article's lead record over a sub-section.

**Results:** each row shows the section path (`PLAYING A TURN › YOUR INKWELL`), the heading, and one line of text around the match with the matched words in ink weight. Live as you type (80 ms debounce), top 12. Opening a result scrolls to its heading and lights it briefly.

**No results:** say so, show the three closest article titles (a looser second pass at `threshold: 0.6`), and the sections. No telemetry: we don't record what people search for.

### 6.4 Rendering an article

1. Take the article's Markdown from the bundle.
2. Resolve device blocks for the current switch; drop the others.
3. Replace `{key:…}`, `{gesture:…}`, `show:` and `help:` links with placeholders.
4. `marked.parse`, then DOMPurify (the bundle comes from our repo, but every Markdown-to-HTML path in the app is sanitized).
5. Swap the placeholders for the real elements. *Show me* tools whose target isn't visible on this device are removed.
6. Give each `##` an id (its slug) for `#help/<id>/<slug>` and search hits.

### 6.5 Help in context

Any element with `data-help="<article-id>"` opens that article on click. One delegated listener in `help.js`; no per-button JavaScript. The markup is a small `?` paper tool (20px, `label/sm`, mute):

| Where | Article |
|---|---|
| Multiverse header, beside Plot | `multiverse` |
| Mulligan dialog head | `mulligan` |
| Library drawer head | `library` |
| Home intake readout (when it doesn't understand the paste) | `import-overview` |
| Share dialog | `share-links` |
| Tweaks head | `tweaks` |
| Draw odds head | `draw-odds` |
| Sign-in dialog | `account` |

Field Unit: these are mute paper tools, never signal; one per panel at most.

---

## 7. Spotlight ("Show me")

### 7.1 Named targets

Articles and tours never hold CSS selectors. They name a target, and `targets.json` maps it, per device:

```json
{
  "end-turn":   { "desktop": "#btn-end-turn", "phone": "#mobile-quick-actions .mqa-end" },
  "ink-bar":    { "desktop": "#bottom-ink", "phone": "#bottom-ink" },
  "hand":       { "desktop": "#bottom-hand", "phone": "#bottom-hand" },
  "multiverse": { "any": "#btn-multiverse" },
  "mini-multiverse": { "desktop": "#mmv" },
  "undo":       { "any": "#btn-undo" }
}
```
*(Selectors above are illustrations; M0 fills the real ones from `app/index.html`.)* Some controls have no id today (the sidebar's **End turn** is a bare `.btn-p1`). M0 gives them one, as a markup-only change, rather than pointing at fragile class chains.

When the UI moves, one line changes. `tools/help.mjs --check` fails if a target's selector no longer matches anything in `app/index.html` (ids are checked statically; class selectors are checked in the headless page, §10).

### 7.2 What the spotlight does

- **Dims the page** except the target: one fixed element with a large `box-shadow` spread around a cut-out the size of the target (+6px), radius matching the target.
- **Rings the target**: 2px, ink on the chassis, paper on glass. **Not the signal**: the signal already means *End turn*, *live lore* and *the branch you're on*, and the target is often one of those.
- **Callout**: a paper module beside the target (below if there's room, else above; on phones docked to the screen edge away from the target), with the text, a step count in mono mute for tours, and the buttons.
- **Follows the target** on resize, scroll and render (a `ResizeObserver` plus the render hook). If the target disappears (a dialog closed it), the callout centres and says so.
- **Scrolls the target into view** first (the multiverse canvas, a long discard list).
- **Let the target be used** (tours): the cut-out passes clicks and drags through; everything else is blocked while a tour step waits for an action.
- **Motion:** a 120 ms fade, no movement, none under *prefers-reduced-motion*.
- **Accessibility:** the callout is a `role="dialog"` with a label, focus moves into it, Esc closes, and the target gets `aria-describedby` pointing at the callout text while it's lit.

*Show me* from the manual is one step: light the target, callout with the article's sentence and **Got it**. Clicking anywhere ends it.

---

## 8. Guided tours

### 8.1 The tours

Three short tours. Short tours get finished; one long tour gets abandoned.

| id | Title | Starts on | Steps | Teaches |
|---|---|---|---|---|
| `basics` | Your first turn | a practice board (scripted, §8.4) | ~10 | mulligan, the board, ink, play, card details, end turn, the other player's turn, undo, where the Multiverse is |
| `multiverse` | The Multiverse | a practice copy of the Set 13 demo | ~8 | open it, read a node, select, play from here, change something and branch, save the turn you're in, plot view, the mini map (desktop) or thumb keys (phone) |
| `import` | Study a Duels.ink game | the home screen, then a practice board | ~5 | the intake field, the example log, the readout, study this game, the imported turns in the Multiverse |

Each tour has desktop and phone wording and targets where they differ (`text: { desktop, phone }`).

### 8.2 The offer (opt in)

- **New players:** the home screen shows one strip under the headline, paper on the chassis: *New here? Take the 3-minute tour.* **Start tour** · **Not now**. Shown when the player has never dismissed it, has no sessions in the device library, and didn't arrive through a share link. *Not now* (or starting the tour) hides it for good.
- **Everyone:** Help lists the tours at the top of its contents, with ✓ on finished ones. The *Guided tours* article lists them too.
- **No pop-ups, no auto-start, no "you haven't finished the tour" nags.**
- **Existing players** see no strip. When Feature 57 ships, a one-time toast (*New: Help and guided tours · press ?*; on phones *in the ⋯ menu*) says where it lives. Shown once, then remembered.

### 8.3 Tour file

```json
{
  "id": "basics",
  "title": "Your first turn",
  "minutes": 3,
  "start": { "scenario": "basics.dojo.json.gz" },
  "steps": [
    { "id": "welcome", "text": "This is a practice board. Nothing here is saved. Leave any time with ✕ or Esc." },
    { "id": "mulligan", "target": "mulligan-dialog", "until": "mulliganSettled",
      "text": { "desktop": "Click cards to send them to the bottom, then **Mulligan**. Or **Keep hand**.",
                "phone": "Tap cards to send them to the bottom, then **Mulligan**. Or **Keep hand**." },
      "learn": "mulligan" },
    { "id": "ink", "target": "hand", "until": "inkedThisTurn",
      "text": { "desktop": "Drag a card onto your **Ink** bar.", "phone": "Tap a card, then **Ink**." },
      "hint": { "desktop": "Or right-click a card and choose **Ink**." },
      "learn": "ink-a-card" }
  ]
}
```

- **A step without `until`** is read-only: **Next** moves on.
- **A step with `until`** waits for the player to do it. **Next** is replaced by *Skip this step*. `until` is the name of a predicate in `tour.js`, never code in the file.
- `text` is short Markdown (one or two sentences), plain or per device. `hint` appears after 20 seconds without progress. `learn` adds *Learn more* (opens the article in help, the tour pauses and resumes when help closes).
- `device: "desktop"` or `"phone"` on a step skips it on the other device.

**Predicates** (`DojoTour.until`, each reads `App.state` or the DOM and returns true or false): `mulliganSettled`, `inkedThisTurn`, `cardPlayed`, `cardExerted`, `quested`, `challenged`, `turnEnded`, `undone`, `drawerOpen`, `multiverseOpen`, `nodeSelected`, `playedFromNode`, `turnSaved`, `plotView`, `importRead`. They're checked after every render (the render hook, §11) and on a 400 ms timer while a step waits. New predicates are added as tours need them.

### 8.4 The practice board

A tour must never change the player's library or their match.

- **Scratch view.** The app already opens a shared session without saving it (`_sharedView`: *Shared · title · not saved yet · Save a copy*). M5 generalises that into a *scratch view* with a kind: `shared` (as today) or `tour`. While a tour board is up: no device autosave, no Continue entry, the banner reads *Practice · not saved*, and **Save** offers *Save a copy* like a shared session.
- **A match in progress is safe.** Starting a tour flushes the current session's autosave first (`flushDeviceSave`). Ending the tour returns to where the player was: the same session on the board, or the home screen.
- **Scripted start for `basics`.** `app/help/tours/basics.dojo.json.gz` is a session file made in the Dojo (two built-in Set 13 decks, a fixed deck order, Player 1's mulligan pending), so every step has a card to ink and a character to play. Made like any demo (`ARCH-accounts-and-library.md` §4.4).
- **`multiverse`** opens a scratch copy of the Set 13 demo; **`import`** pastes `app/defaults/examples/duels-ink-log.txt` and opens the result as a scratch view.

### 8.5 Running a tour

- **Exit any time:** ✕ on the callout, Esc, or leaving to the home screen. *Exit the tour?* is not asked; the board is a practice copy. The tour ends on a closing card (**Done**, the next tour, *Open help*).
- **Back:** a step can go back to a read-only step; it never undoes the player's actions.
- **Hotkeys** keep working on the board during a tour (the tour teaches Space and Undo). Esc goes to the tour first.
- **Saved progress** (`localStorage['lorcana_dojo_help']`): `{ offer: 'dismissed'|'taken', done: { basics: <ts> }, toldAboutHelp: true }`. Nothing else. No resume mid-tour: a reload ends it, and starting again takes three minutes.

---

## 9. Field Unit

Help follows `docs/DESIGN-field-unit.md`; nothing here needs a new token.

- **Drawer and sheet:** paper module on the chassis (12px radius, 12px padding), like the Library drawer. Day and Kiln for free through the role tokens.
- **Section labels** `label/sm` (mono caps, 0.14em). **Article title** Inter Display 20px 560. **H2** `title/md`. **Prose** Inter 14px / 1.5 in body tone (`body/sm` is too small for reading; this is the one place the app sets reading prose). **Lists** with hairline rules, not bullets in circles.
- **Keycaps:** the neutral function key (Bone `#E7E2D8`, `#312D28` on Kiln), mono 11px, the 2px darker foot. Never an ink colour.
- **Search field:** paper input, 1px line, `⌕` glyph, a `/` keycap hint on desktop.
- **Device switch:** the home screen's `.seg`.
- **Tours strip and callouts:** paper modules. **Start tour** and a tour's **Next** are the view's primary confirm, so they may be the signal key. Everything else is a paper tool.
- **Spotlight ring:** ink or paper, never the signal (§7.2). The dimmer is the chassis ink at 55% (by day) and black at 60% (Kiln).
- **Done marks** (✓ on tours) are mute ink, not green.

Mock-ups come first (M1, M5): two or three options as static pages in `docs/design/help/`, as `home-redesign/` and `library-clarity/` did, shot with the dojo-screenshots tool, and the choice recorded in §14.

---

## 10. Tooling: `tools/help.mjs`

One Node script, no dependencies beyond what's in the repo (Playwright through the dojo-screenshots tool for the live checks).

| Command | Does |
|---|---|
| `node tools/help.mjs` | Build `app/help/manual.json` from the articles, sections, targets, synonyms and tours. Validates front matter, unique ids, `related` and `help:` links, `learn` ids, device tags, unclosed `:::` blocks |
| `node tools/help.mjs --check` | Exit 1 if `manual.json` is stale, a link or id is broken, a target's id is missing from `app/index.html`, or an article's `verified` is a minor version or more behind `APP_VERSION` (that last one warns, doesn't fail) |
| `node tools/help.mjs --live` | Open the app headless at 1440 and 390, load the demo, and check every target selector matches a visible element on its device |
| `node tools/help.mjs --test` | Run the golden queries (`tools/help-golden.json`): each query must find its article in the top 3. Example: `"how do i go back" → undo`, `"mana" → ink-a-card`, `"attack" → challenge`, `"dark mode" → theme`, `"put card on bottom of deck" → move-cards`, `"what if" → branches`, `"cant see card pictures" → offline`, `"space" → keyboard-shortcuts`, `"long press" → turn-notes` |
| `node tools/help.mjs shots` | Retake the manual's few screenshots (§5.6) |

The search code is pure (`help-search.js` takes the bundle and Fuse), so `--test` loads it in Node with Fuse from `node_modules` if present, or the same pinned file fetched once into the scratchpad.

**AGENTS.md** gets a *Keeping the manual current* section, beside *Keeping the landing page current*: after a visible change to the app, find the articles that cover it (`grep -rl "<target or label>" app/help/articles`), update them and their `verified`, update `targets.json` if a control moved, then run `node tools/help.mjs` and commit what it changed.

---

## 11. Changes to `app/index.html`

Kept to hooks. Each milestone lists which it owns.

| Hook | Where | Milestone |
|---|---|---|
| `id`s on the controls `targets.json` needs that don't have one (e.g. the sidebar's End turn) | markup only | M0 |
| `<script src>` for `help-search.js`, `help.js`, `spotlight.js`, `tour.js` (with `defer`) | `<head>`, after `mini-multiverse.js` | M1, M2, M4, M5 |
| **Help** tool in the top bar's right group; **Help & tours** in `#topbar-menu`; **Help** in the home header | markup | M1 |
| `?` key opens help (in the global keydown, before game hotkeys; not while typing) | global keydown | M1 |
| Esc: tour first, then spotlight, then help, then today's chain | top of the Escape branch | M1, M4 |
| `if (window.DojoTour) DojoTour.onRender();` at the end of `render()` | `render()` | M5 |
| Scratch view: generalise `_sharedView` into `{ kind: 'shared' \| 'tour', title }`, `App.openScratch(data, opts)`, `App.closeScratch()` | session layer | M5 |
| Home: the tour offer strip; `#help/…` handled in `init()` | markup, `init()` | M7, M1 |
| `data-help` attributes on the panels in §6.5 | markup | M7 |

Everything else lives in the four new files.

---

## 12. Milestones

Built in parallel where the arrows allow. Every milestone is one branch and one PR, named by `AGENTS.md` (*Branch naming*). M0 is small and goes first: it fixes the contracts everyone else works to.

```
M0 Contracts ──┬──► M1 Viewer ─────────┬──► M7 Entry points & context links ──► M8 Release (F57)
               ├──► M2 Search ─────────┤                                              │
               ├──► M3a–e Content ─────┘                                              ▼
               └──► M4 Spotlight ──► M5 Tour engine ──► M6 Tour content ───────► M9 Release (F58)
                                                                     M10 Public /help/ page (later, optional)
```

Every milestone is checked at **1440 and 390 wide, day and night**, with the dojo-screenshots tool:
```bash
node .claude/skills/dojo-screenshots/shoot.mjs --demo --widths 1440,390 --themes day,night --steps <your steps module> --out <scratchpad>
```

### M0 · Contracts and scaffolding
- **Branch:** `claude/chore-help-scaffolding` · **Version:** none · **Depends on:** this doc
- **Delivers:** `app/help/` layout (§5.1) with `sections.json`, an empty article per id in §5.4 (front matter + `TODO` body, so links resolve), `targets.json` with real selectors for every target the §5.4 articles and §8.1 tours need (adding ids to controls that lack one, markup only, §11), `synonyms.json` (§6.3), `tools/help.mjs` with build and `--check` (no `--live`, `--test` or `shots` yet), `tools/help-golden.json` with ~30 queries, an empty `/* ===== Help & tours ===== */` section in `field-unit.css` with one sub-heading per milestone (so parallel PRs append in different places), and the `AGENTS.md` section from §10.
- **Done when:** `node tools/help.mjs --check` passes; the bundle lists every article.

### M1 · Manual viewer (`help.js`)
- **Branch:** `claude/feat-57-help-viewer` · **Version:** none until M8 · **Depends on:** M0. Uses M2's API; until M2 lands, search can be a plain substring filter behind the same call.
- **Delivers:** mock-ups first (`docs/design/help/`, 2–3 options, user picks); then the drawer (desktop) and sheet (phone), contents with sections, article view, device switch, Markdown extensions (§5.3, *Show me* calls `DojoSpotlight` if present, else hidden), `#help/<id>[/<slug>]`, entry points (§6.1: top bar, ⋯ menu, home header, `?`), keys (§6.2), Esc order. Styles in the M1 slot of `field-unit.css`.
- **Done when:** every article opens on both devices in both themes; deep links work from a cold load; the board stays usable with the drawer open on desktop; Esc and keys behave as §6.2.

### M2 · Search (`help-search.js`)
- **Branch:** `claude/feat-57-help-search` · **Depends on:** M0 (bundle format)
- **Delivers:** `DojoHelpSearch.build(manual, { device })` → index; `.query(q, { device, limit })` → `[{ record, score, matches }]`; section records, synonyms, the ranking tweaks and the no-results pass (§6.3); `tools/help.mjs --test`. The results list UI is M1's; M2 delivers the data and a `highlight(text, matches)` helper.
- **Done when:** all golden queries pass on the M3 content (re-run after each content PR); a query returns in under 5 ms for the full manual.

### M3 · Content (five parallel PRs)
Each writes the articles of its sections (§5.4), fills `summary`, `aliases`, `targets`, `related`, checks every sentence against the app on both devices, and sets `verified`. Adds golden queries for its articles. Runs `node tools/help.mjs` and commits the bundle (a bundle conflict between content PRs is resolved by re-running the tool, never by hand).

| PR | Branch | Sections |
|---|---|---|
| M3a | `claude/docs-help-start-and-turn` | 01 Getting started, 02 Playing a turn |
| M3b | `claude/docs-help-cards-and-import` | 03 Cards and decks, 05 Importing games |
| M3c | `claude/docs-help-multiverse` | 04 The Multiverse |
| M3d | `claude/docs-help-library-account-settings` | 06 Library, 07 Account, 08 Settings |
| M3e | `claude/docs-help-reference-faq` | 09 Help and fixes, 10 Reference (shortcuts read from the keydown handlers, gestures from the touch code, so the tables are complete) |

- **Depends on:** M0 only. Articles can be written before the viewer exists; read them as plain Markdown meanwhile.
- **Done when:** no `TODO` bodies left in its sections; `--check` passes; its golden queries pass once M2 is in.

### M4 · Spotlight (`spotlight.js`)
- **Branch:** `claude/feat-57-spotlight` · **Depends on:** M0 (targets)
- **Delivers:** `DojoSpotlight.show(target, { text, buttons, passThrough, onClose })`, `.hide()`, `.isOpen()`; everything in §7.2; `tools/help.mjs --live`.
- **Done when:** every target in `targets.json` lights correctly on its devices (an M4 steps module shoots each one); reduced motion respected; keyboard-only works.

### M5 · Tour engine (`tour.js`) and the scratch view
- **Branch:** `claude/feat-58-tour-engine` · **Depends on:** M4
- **Delivers:** callout mock-ups (2–3, user picks); the scratch view (§8.4) in `app/index.html`; the render hook; `DojoTour.start(id)`, `.stop()`, `.onRender()`, `.onKey(e)`; predicates from §8.3; device-aware steps; hints; *Learn more* pause and resume; saved progress; a throwaway test tour.
- **Done when:** a tour can run start to finish on both devices; the player's library and current session are byte-identical before and after a tour (check the IndexedDB stores); a reload mid-tour leaves no trace.

### M6 · Tour content
- **Branch:** `claude/feat-58-tours` · **Depends on:** M5; M3 for `learn` targets (ids exist from M0)
- **Delivers:** `basics.json` with its scripted `basics.dojo.json.gz`, `multiverse.json`, `import.json`; step text for both devices; any new predicates; the *Guided tours* article filled in.
- **Done when:** each tour is walked through on 1440 and 390 by following only its own instructions; a first-time tester (the user) finishes `basics` in under 4 minutes.

### M7 · Entry points and help in context
- **Branch:** `claude/feat-57-help-in-context` · **Depends on:** M1 (and M5 for the tour strip)
- **Delivers:** `data-help` links (§6.5), the home tour offer strip (§8.2), the one-time *New: Help* toast, a link to the manual from the landing page footer.

### M8 · Release Feature 57: the manual
- **Branch:** `claude/feat-57-help-release` (or folded into the last M1/M2/M7 PR) · **Version:** MINOR (v3.10.0 if nothing else ships first)
- **Delivers:** `APP_VERSION` bump; `features.md` Feature 57 details and its box ticked; a dev guide section; `docs/TEST-PROTOCOL-v3.10.0.md`; `node tools/refresh-landing.mjs` (the top bar changed); `node tools/help.mjs shots`; this doc's status updated.

### M9 · Release Feature 58: guided tours
- Same as M8 for tours. **Version:** the next MINOR.

### M10 · Public manual page (optional, later)
A static `/help/` page that reads the same `manual.json` with `help.js` in a page mode, so the manual is linkable from the landing page and findable by search engines (articles pre-rendered by `tools/help.mjs` into `help/<id>.html` for crawlers). Not needed for the in-app manual; decide after M8 (§13).

---

## 13. Open questions

All answered as proposed on 2026-10-10; see D1–D6 in §14.

| # | Question | Proposal |
|---|---|---|
| Q1 | Desktop help: a side drawer that keeps the board usable, or a centred modal? | Side drawer (§6.2). Read and try at once. |
| Q2 | Should `basics` start on a scripted board or on the player's own decks? | Scripted (§8.4). Every step is guaranteed to have something to ink, play and quest with. |
| Q3 | A **Help** button in the desktop top bar, or only `?` and the home screen? | Add it: icon-only paper tool beside Tweaks. The bar is busy, but a manual nobody can find doesn't help. |
| Q4 | The public `/help/` page (M10)? | Later. Do it if people ask how-to questions outside the app. |
| Q5 | Offer the tour to people who arrive through a share link? | No for now. They came to see a specific board; the banner already explains it. |
| Q6 | A command palette (type "night" → switch theme) in the help search? | Not now (§15). |

---

## 14. Decision log

| # | Decision | Date |
|---|---|---|
| D1 | Desktop help is a non-modal side drawer; the board stays usable while it's open (Q1) | 2026-10-10 |
| D2 | The `basics` tour starts on a scripted practice board, not the player's decks (Q2) | 2026-10-10 |
| D3 | The desktop top bar gets an icon-only **Help** paper tool beside Tweaks (Q3) | 2026-10-10 |
| D4 | The public `/help/` page (M10) waits until after Feature 57 ships (Q4) | 2026-10-10 |
| D5 | No tour offer for people who arrive through a share link (Q5) | 2026-10-10 |
| D6 | No command palette in the help search for now (Q6) | 2026-10-10 |
| D7 | Built in one go by the orchestrating session with parallel sub-agents, on one integration branch (`claude/feat-57-help-and-tours`) that the owner tests before anything reaches `main`. Milestone branches are local `wip/*` branches merged into it. The mock-up picks in M1 and M5 are made by the agents within Field Unit; the owner reviews them when testing | 2026-10-10 |

---

## 15. Deliberately not doing (until needed)

| Idea | Trigger to revisit |
|---|---|
| Search analytics, "Was this helpful?" | Never without a privacy decision; the Dojo doesn't track |
| An AI "ask the manual" box | The manual is complete and people still can't find answers |
| Command palette actions in search | Players ask for keyboard-driven settings |
| Video or GIF walkthroughs | A topic can't be shown with *Show me* and a sentence |
| Resuming a tour mid-way after a reload | Tours grow past ~3 minutes |
| Translations | A real request; the format already keeps words out of code |
| Tours for the Library, sharing and accounts | Players get stuck there (the manual covers them) |
| A changelog / "what's new" panel | Releases become frequent enough that players miss changes |
