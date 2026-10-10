---
name: Practice Dojo
system: Field Unit
version: 3
theme_day: mineral
theme_night: kiln

colors:
  chassis: "#E7E2D8"
  paper: "#F4F0E8"
  glass: "#121212"
  glass-raised: "#1A1A1A"
  ink: "#161513"
  body: "#3C3934"
  mute: "#8A847A"
  line: "#D5CFC4"
  line-soft: "#E0DBD1"
  signal: "#E4572E"
  signal-ink: "#FFF8F4"
  amber: "#E0A23A"
  amethyst: "#7A5CFF"
  ruby: "#D64545"
  emerald: "#1F9D6A"
  sapphire: "#3C7DFF"
  steel: "#8E8C88"

colors_night:
  chassis: "#141311"
  paper: "#221F1B"
  glass: "#0C0C0C"
  glass-raised: "#161412"
  ink: "#F4F0E8"
  body: "#C9C3B8"
  mute: "#8A847A"
  line: "#2C2924"
  line-soft: "#2C2924"
  signal: "#E86B2A"
  signal-ink: "#1A0A05"

signals:
  ember: "#E4572E"      # day default
  radio: "#E86B2A"      # night default
  coral: "#ED3F1C"      # hotter numeral
  olive: "#8C8A2E"      # quiet, non-orange
  trace: "#2F9E96"      # non-orange instrument

keys:                   # function keys (phone card drawer and hand), fixed per verb
  coral: "#ED3F1C"      # challenge · text #FFF8F4
  olive: "#8C8A2E"      # quest, ink · text #141311
  trace: "#2F9E96"      # exert / ready · text #041413
  graphite: "#2B2925"   # banish, discard · label in danger red; night #0C0C0C + #2C2924 hairline
  bone: "#E7E2D8"       # neutral key on paper · night #312D28


typography:
  display: "Inter Display"
  body: "Inter"
  mono: "Liberation Mono"
  fallback_sans: "Inter, Noto Sans Display, sans-serif"
  fallback_mono: "Liberation Mono, DejaVu Sans Mono, ui-monospace, monospace"

spacing:
  unit: 4
  scale: [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32]

radius:
  key: 999
  chassis: 16
  module: 12
  card: 8
  control: 8
  inset: 10

motion:
  duration: "120ms"
  easing: "ease-out"
---

# Practice Dojo — Field Unit

## Overview

Practice Dojo is a theorycrafting sandbox for the Lorcana TCG. Import a duels.ink log, replay the match, rewind, branch, hot-swap. Field Unit is the visual language for the marketing site and the app: a calibrated instrument, not a fantasy table and not a marketing page.

The shell is warm mineral by day and warm black at night. Data lives in a recessed black glass well in both themes. One signal color is the confirm key, a live lore count, and the branch you are on. Ink colors identify cards and players. They are ticks, not a wash.

Day signal is Ember. Night signal is Radio. Coral, Olive, and Trace are the only approved swaps. Do not invent a fifth accent.

The app is information-dense. A restyle must keep every reading the live board already shows: players, deck and hand counts, the mini multiverse, the action log, both discard piles, ready counts, field cards with cost / strength / lore, hand actions, deck size, draw odds with copies remaining, and multiverse node recaps (played, inked, drawn, banished, quested, lore, note).

### Principles

1. Chassis outside, glass inside. Marketing and controls sit on the mineral shell. The match and the tree sit in the well.
2. Signal once. The accent is a state, not a theme. Day and night may use different approved signals, never two at once.
3. Engraved, not decorated. Mono indexes, hairlines, tabular numbers. No icons-in-circles, no gradients, no script.
4. Density is the product. Do not simplify a board by deleting a pile, a log, or a recap.
5. The user is the referee. The interface never looks like it is blocking a line.

## Colors

Name by role. Do not invent new accents.

- **Chassis**: `#E7E2D8` — app ground, page ground, the instrument body.
- **Paper**: `#F4F0E8` — cards, side panels, nodes, inputs, raised modules on the chassis.
- **Glass**: `#121212` — playfield, multiverse canvas, notes, active tool chip.
- **Glass raised**: `#1A1A1A` — lore box, hand tray, inset controls inside the well.
- **Ink**: `#161513` — primary text on chassis and paper.
- **Body**: `#3C3934` — secondary prose on chassis.
- **Mute**: `#8A847A` — labels, timestamps, empty odds, inactive tree edges.
- **Line**: `#D5CFC4` — borders on the chassis, top bar rule.
- **Line soft**: `#E0DBD1` — row rules, meter tracks, node bars that are not live.
- **Signal**: `#E4572E` Ember — day default. End turn, live lore numerals, the branch you are on, the multiverse cursor, auto-save when on, a single "new" pip. Nowhere else.
- **Signal ink**: `#FFF8F4` — text on an Ember, Coral, or Vermillion fill. Radio, Olive, and Trace use dark ink `#1A0A05` or `#141311`.

### Signal family

One signal per theme. It must not be an ink color. Amber `#E0A23A`, Ruby `#D64545`, Amethyst `#7A5CFF`, Emerald `#1F9D6A`, and Sapphire `#3C7DFF` already name cards.

Approved:

- **Ember** `#E4572E` — day default. Warm, not ruby. Text on fill is `#FFF8F4`.
- **Radio** `#E86B2A` — night default. Sanyo grille orange. Cleaner on warm black than Ember. Text on fill is `#1A0A05`.
- **Coral** `#ED3F1C` — Rams second key. Hotter numeral, still not Ruby. Use when lore has to win on the well. Text on fill is `#FFF8F4`.
- **Olive** `#8C8A2E` — Rams fourth key, lifted so it reads at night. Quiet confirm. Do not also use green for a "valid log" badge. Lore numeral may lift to `#C6C45A`. Text on fill is `#141311`.
- **Trace** `#2F9E96` — erase-key teal. Instrument, not Sapphire. Only if the signal should stop being orange. Text on fill is `#041413`.

Rejected for the signal role: Copper `#C4622D` (fails on glass), Cadmium `#FF5A1F` (too loud on the day chassis), Rams red `#BF1B1B` (reads as Ruby).

### Place colours

The Library sorts decks and sessions by where they live. Each place takes one colour from the key family (see Function keys), never an ink colour:

- **This device** — Trace `#2F9E96`. Coloured words `#1E716B` by day, `#3DB2A9` on Kiln.
- **Your account** — Olive `#8C8A2E` (`#9C9A34` on Kiln). The banking colour, as for Quest and Ink. Coloured words `#66641E` by day, `#C6C45A` on Kiln. Text on an Olive fill is `#141311`.
- **Public links** — Coral `#ED3F1C`. Coloured words `#C23315` by day, `#F26446` on Kiln.
- **Built in** — no colour: the strong line `#BDB6AA` (`#3E3933` on Kiln).

Places are a reading, not the signal: the signal stays for the match on the board. A place shows as a spine (3px bars, two when it's in both places, like an ink pair), as a mono shelf name, and as the outline of the one action that moves something between places (*Save to account*, *Get newer copy*). Don't fill a row or a panel with a place colour.

### Dark mode — Kiln

Kiln is the only dark theme. Do not ship a cool grey night or a pure `#000` page.

- **Chassis**: `#141311` — page and app ground.
- **Paper**: `#221F1B` — modules, side panels, nodes, inputs. Not grey.
- **Glass**: `#0C0C0C` — playfield, multiverse canvas, the lore well. Blacker than the chassis.
- **Glass raised**: `#161412` — hand tray, inset controls inside the well.
- **Ink**: `#F4F0E8` — primary text on chassis and paper.
- **Body**: `#C9C3B8` — secondary prose.
- **Mute**: `#8A847A` — labels, timestamps, inactive edges.
- **Line**: `#2C2924` — hairlines, top bar rule, meter tracks.
- **Signal**: `#E86B2A` Radio, unless the theme explicitly swaps to Coral, Olive, or Trace.
- **Signal ink**: `#1A0A05` on Radio.

Night type does not change size or family. The muted headline on marketing is `#8A847A`, not a second accent. Glass secondary text stays `#C9C3B8`. Inactive tree edges are `#6A655E`. The live edge is the night signal at 1.6px.

Auto-save off is `#2C2924` with an `#F4F0E8` knob. Auto-save on is the night signal with a `#141311` knob. Paper tools invert: `#221F1B` fill, `#2C2924` border, `#F4F0E8` text. The open tool is glass `#0C0C0C` with paper text.

Instrument `#101214` and Oxide `#1A1612` are studies, not themes. Do not mix them into Kiln.
- **Amber**: `#E0A23A` — Amber ink identity. Player tick, card cost pip.
- **Amethyst**: `#7A5CFF` — Amethyst ink identity.
- **Ruby**: `#D64545` — Ruby ink identity.
- **Emerald**: `#1F9D6A` — Emerald ink identity.
- **Sapphire**: `#3C7DFF` — Sapphire ink identity.
- **Steel**: `#8E8C88` — Steel ink identity.

Glass-on-glass borders are `#2A2A2A`. Glass secondary text is `#C9C3B8`. Glass mute is `#9A948A`.

Contrast: ink on paper and signal on glass must stay at least WCAG AA. Do not put mute text under 10px for anything the player must read to act.

## Typography

Families: Inter Display for names and numerals, Inter for prose, Liberation Mono for every label, index, stamp, and table figure. All three are self-hosted in `app/fonts/` (the app and the landing page share them) and never come from a font CDN. Inter is the Inter 4.1 variable font with both axes, so text sizes get their optical size; Inter Display is the same font pinned at the display optical size (opsz 32), every weight. Use the `--font-display` token for titles and numerals of 20px and up. Mono labels are uppercase with `letter-spacing: 0.14em`.

- **display/xl**: 72px, 500, 0.9, tracking -0.045em — marketing headline, and the app's home headline (the one exception inside the app). Sentence case.
- **display/lg**: 32px, 520, 1.0, tracking -0.04em — lore numerals inside the well. Color signal.
- **title/md**: 16px, 560, 1.2, tracking -0.02em — panel titles, node titles.
- **body/md**: 15px, 400, 1.45 — marketing prose. Not used inside the match board.
- **body/sm**: 12px, 400, 1.35 — card subtitles, log lines, hand actions.
- **label/sm**: 10px, 500, 1.3, mono, uppercase, tracking 0.14em — section labels, ready counts, column headers.
- **figure/sm**: 11px, 400, 1.3, mono, tabular-nums — odds, deck counts, BCR, LVI, lore pairs.

Do not set body copy in all caps. All caps is labels only.

## Layout and spacing

Base unit is 4px. App padding uses 8, 10, and 12. Marketing sections use 16, 24, and 28. Do not invent an 8px-only grid if a 6 or 10 keeps a table aligned.

The match board is a fixed instrument, not a scrolling marketing page.

- Top bar: 46px, chassis, 1px `#D5CFC4` bottom rule, 12px horizontal padding, 8px gaps.
- Columns: players/log 292px, board fluid, draw odds 286px. Minimum board width 720px before the odds column collapses under the board.
- Playfield: 8px margin from the columns, 16px radius, split in half by a 1px `#242424` rule. Opponent on top, you on bottom. Phones frame it the same way, like the multiverse canvas: 8px of chassis all round (plus the bottom safe area) and 16px corners. The phone hand tray sits on the well's bottom edge and its peeking cards are clipped by the well's corners.
- Each half: discard column 168px, field fluid, lore 92px, gap 8px. The lore box is as tall as the hand, and your turn note sits in the hand row too, so note, hand and lore share their top and bottom edges. The ready row and the field run under the lore column; the deck sits at the ready row's end, as on phones.
- Multiverse: chassis frame, glass canvas with 16px radius, nodes absolutely placed, edges 1.2px `#6A655E`, live edge 1.6px signal. A 340px paper panel docks beside the canvas, right by default or left by preference, 8px from it; phones stack it under the canvas.

Marketing grid is 12 columns, 48px page margin, modules at 22px radius. The app does not use that grid.

## Components

### Top bar

Chassis. Logo is `label/sm` weight 600. Version and matchup are 12px ink. Tools are 28px tall, 8px radius, paper fill, `#D5CFC4` border. The open tool (Multiverse, Challenge, Tweaks) inverts to glass with paper text. Turn chip is glass, 8px radius; the turn number is signal. "Not saved yet" is mute. Save a copy is a paper tool, not a signal button.

Grouped by job: the way home (`‹ DOJO` with the mark) and the session on the left; Undo, the turn chip and Challenge joined as one turn control in the centre; Multiverse and Tweaks on the right. Multiverse is a paper tool whose branch icon is signal (the branch you are on); never a filled signal key. Only Undo uses a circular arrow. Phones keep ☰, the turn control, Multiverse and a ⋯ menu for the session tools, Tweaks and the way home.

### Signal key

End turn, Launch, and the primary confirm are the only filled signal controls. Height 36–40px, radius 999px, label 13px paper, no border. Hover: `#C94A24`. Active: `#B3411E`. Disabled: `#E0DBD1` fill, `#8A847A` text, no orange. One signal key per view.

### Function keys

The card drawer is a panel of keys, like a device's front panel. It opens for a card on the board (touch) and for a card in the phone hand, so both read the same. Every control there is a key: radius 10px (damage segments 8px), no border, a 3px darker edge at the foot that drops to 1px when pressed, and a 1px press travel.

- **Neutral keys** for adjustments and moves: damage segments, −1 / +1, To hand, Deck top, Deck bottom, Put under, Swap. Bone `#E7E2D8` with ink text on paper; `#312D28` on Kiln paper.
- **Coloured keys**, one fixed colour per verb, so a key means the same thing everywhere:
  - Coral `#ED3F1C` (text `#FFF8F4`): Challenge.
  - Olive `#8C8A2E` (text `#141311`): Quest and Ink, the keys that bank a resource.
  - Trace `#2F9E96` (text `#041413`): Exert / Ready.
  - Graphite `#2B2925` with the label in danger red: Banish and Discard. On Kiln it is `#0C0C0C` with a hairline.
- **The view's primary confirm** (Play, for a hand card) is the signal key, squared off like its neighbours and two keys wide. Short on ink it turns hollow: a 1.5px signal outline and signal text, still tappable.
- **A key you can't press is hollow**: transparent, a 1px line, zero-tone text. Never a faded colour, so it can't be read as a neutral key.
- Lit damage segments are danger-red keys. The lethal segment keeps a red foot while unlit.
- Group labels (`Damage · tap a segment to set`, `Cost 5 · inkable … 8 ink ready`, `Move to`, `More`) are `label/sm` above their row; the figure on the right is mono ink, danger when it warns (lethal, short on ink).

The key colours are the Rams keys the signal family comes from, used as fixed function colours. They are not the signal: the signal stays one per theme for state (End turn, live lore, the active branch, auto-save on, the new pip). Never put an ink colour (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel) on a key; next to cards it reads as a card or a player. If Tweaks swaps the signal to Coral, Olive or Trace, the matching key shares that colour; that is accepted.

The drawer's head is the card's owner (ink ticks) and where it is: on the board its state (`P2 · exerted · 2 under`), in the hand its place (`P2 · in hand · 3 / 7`) with ‹ › keys beside Close. The full text card sits under it on glass, as in the text-mode preview, so the name, type and stats are not repeated. In the hand, a sideways swipe on the text (or ← / →) steps through the hand; the next card's text slides in from that side.

### Paper module

Background paper, 1px `#E0DBD1`, radius 10–12px, padding 8px. Used for players, the mini multiverse, hover-details, draw odds. Do not nest a paper module inside a paper module.

### Player row

Paper, 8px radius, 6px 8px padding. Two 3×16px ticks for the ink pair, then the name, then `figure/sm` mute for `24 deck · 2 hand`. Amber/Amethyst is amber then amethyst. Amethyst/Ruby is amethyst then ruby.

### Meter

Label is `label/sm`. Track is 3px `#E0DBD1`, radius 999. Marker is a 7px ink circle, not a filled gradient bar. Readouts on both ends are `figure/sm`. Used for the lore race to 20. Do not color the track orange.

### Mini multiverse

A paper module in the rail, under the players (desktop only). Head: `label/sm` "Multiverse", the node you're on (or the dot under the pointer) as `figure/sm` mute (`T14 · P2 · 8–8`), and a small paper tool that opens the full Multiverse. Then a glass well, 84px tall (about three lines; it pans to the rest), with the tree as lines: 15px a turn, 17px a line, 3.2px dots. Off the line you're on: `#6A655E` 1.2px hairlines and hollow dots. The line you're on: signal, 1.8px, filled dots. Ahead of you (the line you stepped back along): dashed signal and signal rings. The node you're on: a 1.6px signal ring, dashed once the board has changed since it. "Left here" snapshots: dashed hollow dots on dashed edges. A won branch: a square dot and a 2px paper stop. Every other turn numbered along the top in mono glass mute. The foot is a caption in `label/sm` glass mute (the counts), paper ("Edited · kept if you jump"), or 11px paper sentence case (the hovered dot's name). Under the well, six paper tools in one row: ⏮ ◀ ▶ ⏭, a hairline, ↑ ↓. No ink colours on the map: identity is in the readout.

### Log

10.5–11px, 1.35 line height, mute for steps, ink weight 560 for banishes, challenges, and quests. Turn boundaries are mono mute: `— Turn 17 begins —`. The log scrolls inside the rail. Do not truncate it to three lines.

### Note

Glass fill, paper text, 8px radius, 7px 8px padding, 11px. This is the turn note ("Play Hades on Agustin?"). It is not a toast and not a card.

A note looks the same wherever it is shown: the board's turn note and notes box, a multiverse node's comment, the Multiverse panel's note and the save form's note field. A `label/sm` row in glass mute says whose it is (`Turn 15 note · Player 2`, or `Note` inside a node) with a pen on the right; click anywhere on it to edit. Hover lights the hairline to `#C9C3B8`, and it stays lit while editing. Inside a paper node it is glass raised `#1A1A1A` with a 1px `#2A2A2A` hairline, so it sits on the card instead of reading as a hole through to the canvas. A node with nothing to show has no note; the panel shows a dashed `#6A655E` one, "Add a note…". The auto-save's stock line "Auto-saved at start of turn." is never shown.

### Lore box

Glass raised, 1px `#2A2A2A`, 10px radius. Label `label/sm` mute between − and +, numeral `display/lg` signal under it, nothing else (the hand's zone stats were dropped in v3.4.1). On the board it stretches to the hand's height with its count centred.

### Ready row

`label/sm` glass-mute: `0 / 9 ready`. Minus, plus, and Ready all are 22px glass-outline controls, 6px radius, 11px `#C9C3B8`. They are not signal.

### Discard pile

`label/sm` header. Rows are 10px glass-secondary, hairline `#222`, name left, cost/strength/lore right in mute tabular figures. Show the real pile. A `+N more` row is allowed only after eight visible rows, and it must be a control that expands.

### Card

Paper, 7–8px radius, 104×118 on the board, padding 6px. Name 11px weight 600. Subtitle 9px mute. Three pips: cost in the card's ink color, strength in `#E0DBD1`, lore in signal. Pip is 18px circle, 10px figure. Do not redraw card art. Do not add a gold frame. A "new" pip is signal, 8px type, only on cards that entered this turn.

### Deck

Paper slab with a card's 5:7 shape, the size of the ink cards beside it, radius 8px. Label `label/sm`, count 22px weight 520.

### Hand tray

Glass raised, 1px `#2A2A2A`, 8px radius. Card name and `cost / strength / lore`, plus Play and Ink as outline chips. Chips are not signal.

### Draw odds

Paper module. Header `label/sm`: `Draw odds · 24` and `1 · 2 · 4`. Columns: card, copies remaining, next draw, in 2, in 4. Figures are tabular, mute. Zero-copy rows are `#A39E94` with em dashes, not hidden. Row rule `#E4DFD6`.

### Auto-save

`label/sm` plus a 26×14 pill. On is signal with a paper knob. Off is `#E0DBD1` with an ink knob.

### Multiverse node

10px radius, 230px wide, padding 8px 9px, 1px border. Title 12px weight 620. Subline 10px mute: lore pair, timestamp, "auto-saved". Body is a 2-column grid, 10px: label `label/sm`, value ink.

The node's tone says whose turn it is, so the players part at a glance whatever their inks (mirror matches included):

- **P1** is paper: `#F4F0E8` with a `#E0DBD1` hairline. On Kiln it lifts to `#34302A` (line `#423D35`).
- **P2** is graphite, the Banish key's colour: `#2B2925` with a `#3E3933` hairline and paper text. On Kiln it drops to `#141210` (line `#38332C`), and its note to the well's `#0C0C0C`.

The node re-scopes the paper tokens, so everything inside follows its tone. The tone is identity, never state.

The foot is a bar along the node's bottom edge, cut by the node's own rounded corners so it follows them: 4px, in the node's hairline colour. Live node: 1px signal border plus a signal foot.

The arrow-key cursor (the node the panel shows) is four signal corner marks 9px outside the node: a different shape from the live node's solid border, so "looking at" and "you are here" never read as one.

A won branch's final node carries a plate under its note: glass raised with a hairline, the winner's lore as a 28px display numeral in paper, then `P2 wins · 11–20` / `Branch closed` in mono. Its foot is 6px, split in the winner's two inks. Its edge runs on 18px and ends in a 3px paper stop.

Node body must be able to show played, inked, drawn, discarded, banished, quested, hand size, and the note. Do not reduce a node to a title. With the card sections in the panel (the default) a node is lean: title, subline, its comment (the note and the turn recap text) as a glass Note, and the Played strip; "Show in nodes" brings every section back.

A pre-jump auto-save is a ghost of a node: glass raised, 1px dashed `#6A655E` border, no bar, mute text, a dashed edge to the node it was taken from. It is not a node until kept.

### Multiverse plot

The header's **Plot** tool (a saved preference; open, it inverts to glass) draws the same tree as a track sheet, to see a whole game at once. The card layout's columns become grid columns and its half-rows grid rows, 28px apart, ruled in `#242424`. A turn ruler runs along the top: the turn number in mono where it starts, whose step under each column.

- Each saved turn is a 9px dot in its deck's two inks, split down the middle: **P1 solid, P2 hatched** (as its deck icon, with a hairline ring in its inks). Dots are ink ticks, so they stay small.
- The turn number sits under each dot in mono mute.
- Edges run out of the parent, drop on the half-column and run in: `#6A655E` 1.2px, the live path signal 1.6px, auto-saves dashed.
- The node you are on has a 2px signal ring. The cursor is a signal crosshair, open at the centre, with a glass-raised readout tag (`T12 · P1 · 7–6`).
- A win is the winner's dot drawn square, a 2px paper stop, the lore as a 15px display numeral and `P1 WINS · 20–13` in mono.
- An auto-save is a dashed ring.
- A key in the well's corner (`label/sm`, glass mute) names all of it. Reset zoom fits the whole plot.
- **Phones** are the plot by default and open it at zoom 1 on the cursor. The key runs along the well's top as a glass strip over a `#242424` rule. Thumb keys sit at the foot, clustered right in two rows of three: zoom out (the whole game), ▲, ◎ (back to where you are); then ◀ ▼ ▶. The arrows move the cursor. Each is 44px, 10px radius, the neutral function key as it sits on dark in both themes (`#312D28`, paper glyph, a 3px darker foot that drops when pressed). ◎ carries the "you are here" ring in signal. A key that can't go anywhere is hollow on the well's glass; zoom out held down inverts to paper and leaves its place empty in the card view.

### Multiverse edge

On the glass canvas. Inactive `#6A655E` at 1.2px. The path to the node you are on is signal at 1.6px. No purple, no gold, no glow except the signal stroke. Canvas hint is `label/sm` mute: pan, zoom, click a node, arrow keys.

### Multiverse panel

Paper module, 12px radius, 12px padding, beside the canvas. Top: one emphasised paper tool, **Save current unfinished turn**, that opens a name, a note and the cards the node will keep. Then the selected node: `label/sm` "Selected" (signal "· you are here" on the live node), the node's name as `title/md` that edits in place on click, the subline in mono mute, **Play from here** (the view's one signal key) and a paper bin, the comment, note and turn recap text, as a glass Note (click to edit all of it; dashed when empty), the lore race (two meters to 20), and the turn recap as label · card thumbnails with the "Show in nodes" switch (ink when on, never signal).

### Marketing chassis

Used only on the public site. Paper modules on chassis, 22px radius. Headline `display/xl`. One signal key. Spec rows separated by 1px `#E0DBD1`, indexed `01–04` in signal mono. A black inset may show the turn stamp and a lore pair. Do not reuse marketing radius or display type inside the app; the home page's headline is the one exception (see Home).

### Library shelves

The Library drawer's lists are shelves, one per place. A shelf has a spine in its place colour down its left side, a `label/sm` name in the place's text colour (*In your account + this device* keeps ink for the name and mutes the second part), a mono count, one 12.5px sentence in body tone, and at most one shelf action (*Save all N to account*). Rows are paper (8px radius) with title and actions on top and the `figure/sm` details under them. A row repeats its place only when it's out of step, as an Olive line with an arrow. Open is a paper tool; the session on the board gets the signal key (*Back to it*). Everything else on a row sits behind ⋯. Signed out, the account shelf is an empty dashed slot with a filled Olive *Sign in*.

### Home

The app's front door, on the chassis. Two columns: the brand on the left (the mark in ink, about 232px wide; the name in mono caps, 14px weight 700, tracking 0.14em; the version as a mono figure; a two-beat tagline in Inter Display 22px, the second beat mute), and everything the player acts on to its right (theme and account controls, the headline, the glass intake well, the table and recent sessions). The headline is the marketing hero (`display/xl`, two beats, the second mute on its own line). No glows, gradients or watermarks. Tablets put the brand in a row beside the controls; phones stack it above them with a 44px mark.

## Do's and don'ts

- Do keep the live readings. A Field Unit board that drops the discard, the log, the odds, or the node recap is wrong.
- Do use the approved signal only for End turn / Launch, live lore, the active branch, the multiverse cursor, auto-save on, a new-card pip, and the Help key until Help is first opened (it breathes: a signal halo, never a fill).
- Do use Ember `#E4572E` by day and Radio `#E86B2A` on Kiln, unless a theme explicitly picks Coral, Olive, or Trace.
- Do keep Kiln paper at `#221F1B` and the well at `#0C0C0C`. Do not grey the night chassis.
- Do use ink colors only as player ticks and cost pips.
- Do keep mono labels uppercase and prose in sentence case.
- Don't import the current gold gradient, purple node glow, or amber table wash.
- Don't use script, brush underlines, brush banners, or stroke highlights.
- Don't put icons in circles as a feature list.
- Don't nest paper modules, and don't float cards on the chassis. Cards sit on glass.
- Don't color meter tracks or tree edges with the signal unless that reading is the live one.
- Don't use Amber, Ruby, Amethyst, Emerald, or Sapphire as the signal.
- Don't invent a signal outside Ember, Radio, Coral, Olive, and Trace.
- Don't replace card faces with generated illustration. Name, subtitle, and the three figures are enough.
- Don't hide zero-copy odds rows.
- Don't make a second filled button on the board or the shell. Challenge, Undo, Multiverse, and Save a copy stay paper tools. The card drawer is the exception: it is a panel of function keys (see Function keys).
- Don't put an ink colour on a function key, and don't invent a key colour outside Coral, Olive, Trace, Graphite and Bone.
- Don't colour a place (this device, your account, public links) with anything but its key colour, and don't wash a row or panel in it.
