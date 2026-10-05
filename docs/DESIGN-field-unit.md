---
name: Practice Dojo
system: Field Unit
version: 2
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

The app is information-dense. A restyle must keep every reading the live board already shows: players, deck and hand counts, BCR and LVI, the action log, both discard piles, ready counts, field cards with cost / strength / lore, hand actions, deck size, zone stats (CTL, BCR, RDS, LVI), draw odds with copies remaining, and multiverse node recaps (played, inked, drawn, banished, quested, lore, note).

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
- **Signal**: `#E4572E` Ember — day default. End turn, live lore numerals, the branch you are on, auto-save when on, a single "new" pip. Nowhere else.
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

Families: Inter Display for names and numerals, Inter for prose, Liberation Mono for every label, index, stamp, and table figure. Mono labels are uppercase with `letter-spacing: 0.14em`.

- **display/xl**: 72px, 500, 0.9, tracking -0.045em — marketing headline only. Sentence case.
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
- Playfield: 8px margin from the columns, 16px radius, split in half by a 1px `#242424` rule. Opponent on top, you on bottom.
- Each half: discard column 168px, field fluid, deck 92px, gap 8px.
- Multiverse: chassis frame, glass canvas with 16px radius, nodes absolutely placed, edges 1.2px `#6A655E`, live edge 1.6px signal.

Marketing grid is 12 columns, 48px page margin, modules at 22px radius. The app does not use that grid.

## Components

### Top bar

Chassis. Logo is `label/sm` weight 600. Version and matchup are 12px ink. Tools are 28px tall, 8px radius, paper fill, `#D5CFC4` border. The open tool (Multiverse, Timelines) inverts to glass with paper text. Turn chip is glass, 8px radius; the turn number is signal. "Not saved yet" is mute. Save a copy is a paper tool, not a signal button.

### Signal key

End turn, Launch, and the primary confirm are the only filled signal controls. Height 36–40px, radius 999px, label 13px paper, no border. Hover: `#C94A24`. Active: `#B3411E`. Disabled: `#E0DBD1` fill, `#8A847A` text, no orange. One signal key per view.

### Paper module

Background paper, 1px `#E0DBD1`, radius 10–12px, padding 8px. Used for players, win-probability, hover-details, draw odds. Do not nest a paper module inside a paper module.

### Player row

Paper, 8px radius, 6px 8px padding. Two 3×16px ticks for the ink pair, then the name, then `figure/sm` mute for `24 deck · 2 hand`. Amber/Amethyst is amber then amethyst. Amethyst/Ruby is amethyst then ruby.

### Meter

Label is `label/sm`. Track is 3px `#E0DBD1`, radius 999. Marker is a 7px ink circle, not a filled gradient bar. Readouts on both ends are `figure/sm`. BCR and LVI each get their own meter. Do not color the track orange.

### Log

10.5–11px, 1.35 line height, mute for steps, ink weight 560 for banishes, challenges, and quests. Turn boundaries are mono mute: `— Turn 17 begins —`. The log scrolls inside the rail. Do not truncate it to three lines.

### Note

Glass fill, paper text, 8px radius, 7px 8px padding, 11px. This is the turn note ("Play Hades on Agustin?"). It is not a toast and not a card.

### Lore box

Glass raised, 1px `#2A2A2A`, 10px radius. Label `label/sm` mute. Numeral `display/lg` signal. Zone stats directly under it, `figure/sm` glass-mute: `CTL 5.3 · BCR 4.2 · RDS 0.5 · LVI 0.6`.

### Ready row

`label/sm` glass-mute: `0 / 9 ready`. Minus, plus, and Ready all are 22px glass-outline controls, 6px radius, 11px `#C9C3B8`. They are not signal.

### Discard pile

`label/sm` header. Rows are 10px glass-secondary, hairline `#222`, name left, cost/strength/lore right in mute tabular figures. Show the real pile. A `+N more` row is allowed only after eight visible rows, and it must be a control that expands.

### Card

Paper, 7–8px radius, 104×118 on the board, padding 6px. Name 11px weight 600. Subtitle 9px mute. Three pips: cost in the card's ink color, strength in `#E0DBD1`, lore in signal. Pip is 18px circle, 10px figure. Do not redraw card art. Do not add a gold frame. A "new" pip is signal, 8px type, only on cards that entered this turn.

### Deck

Paper slab, 72×96, radius 8px. Label `label/sm`, count 22px weight 520.

### Hand tray

Glass raised, 1px `#2A2A2A`, 8px radius. Card name and `cost / strength / lore`, plus Play and Ink as outline chips. Chips are not signal.

### Draw odds

Paper module. Header `label/sm`: `Draw odds · 24` and `1 · 2 · 4`. Columns: card, copies remaining, next draw, in 2, in 4. Figures are tabular, mute. Zero-copy rows are `#A39E94` with em dashes, not hidden. Row rule `#E4DFD6`.

### Auto-save

`label/sm` plus a 26×14 pill. On is signal with a paper knob. Off is `#E0DBD1` with an ink knob.

### Multiverse node

Paper, 10px radius, 230px wide, padding 8px 9px, 1px `#E0DBD1`. Title 12px weight 620. Subline 10px mute: lore pair, timestamp, "auto-saved". Body is a 2-column grid, 10px: label `label/sm`, value ink. Bottom bar 2px. Live node: 1px signal border plus signal bar. Inactive bar is `#E0DBD1`.

Node body must be able to show played, inked, drawn, discarded, banished, quested, hand size, and the note. Do not reduce a node to a title.

### Multiverse edge

On the glass canvas. Inactive `#6A655E` at 1.2px. The path to the node you are on is signal at 1.6px. No purple, no gold, no glow except the signal stroke. Canvas hint is `label/sm` mute: pan, zoom, click a node, arrow keys.

### Marketing chassis

Used only on the public site. Paper modules on chassis, 22px radius. Headline `display/xl`. One signal key. Spec rows separated by 1px `#E0DBD1`, indexed `01–04` in signal mono. A black inset may show the turn stamp and a lore pair. Do not reuse marketing radius or display type inside the app.

## Do's and don'ts

- Do keep the live readings. A Field Unit board that drops the discard, the log, the odds, or the node recap is wrong.
- Do use the approved signal only for End turn / Launch, live lore, the active branch, auto-save on, and a new-card pip.
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
- Don't make a second filled button. Challenge, Undo, Timelines, and Save a copy stay paper tools.
