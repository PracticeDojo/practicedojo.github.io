# Library clarity: three proposals

> **Decision (2026-10-07):** B · Shelves, plus C's Library button on the home header, and the tab fix. Built as Feature 50 (v3.3.0).

**Question:** in the Library (home screen → *Library*), it isn't clear what lives only on this device and what is in your account on every device. How do we make that easy to read?

Three prototypes, all built on the app's own CSS (`app/css/base.css` + `field-unit.css`), the real home screen behind the drawer, and the same sample library:

| | Idea | Change size |
|---|---|---|
| **A · Lamps** (`A-lamps.html`) | Every row gets a status panel of labelled lamps: `DEVICE` `ACCOUNT` | Small. Lists stay as they are |
| **B · Shelves** (`B-shelves.html`) | Lists are grouped by place, each group with a coloured spine, a sentence and one bulk action | Medium. Re-sorts the lists |
| **C · Places map** (`C-places-map.html`) | A small map of where things live sits above the lists; each place is a filter | Large. New component |

Side by side: `screens/overview-signed-in.png`, `screens/overview-signed-out.png`.

## What's unclear today

Captured from v3.2.4 (`screens/today-*.png`):

1. **Where a session lives is in 10px mono, inside the details line.** *This device · Account*, *Changes not in account* and *Newer in account* look just like *Turn 9 · lore 14–11*.
2. **"Shared" is ambiguous.** The tab holds public links, but "shared" is also how people say "on all my devices", which is the very thing this is about.
3. **Signed out, nothing warns you.** One hint says "Kept on this device." Nothing says that clearing site data or switching browser loses everything, or that there's an alternative.
4. **Decks and sessions follow different rules,** and the Library never says so. Decks sync by themselves; sessions sync only when you press Save. Today only the account dialog explains it.
5. **Seven same-weight icons per row.** The cloud-up and cloud-down icons look alike, and the same slot changes meaning with the row's state.
6. **Every row has a filled orange Open.** Six signal keys in one view breaks Field Unit's "one signal key per view". It also leaves no colour free to mean anything.
7. **Bug (not part of the redesign):** `.home-tabs` has `overflow-x: auto`, so as a flex child of the drawer it shrinks to 1px once the list is taller than the drawer. With about 9 sessions on a phone (or a short desktop window), the Sessions / Decks / Shared tabs vanish (`screens/today-phone-sessions-in.png`). Fix: `flex-shrink: 0` on the drawer's children. The prototypes include it (`_shared.css`).

## Place colours

Each place gets one colour from the signal family's approved swaps, the same colours the card drawer already uses for function keys. None is an ink colour.

| Place | Colour | Why | Text on paper (AA) |
|---|---|---|---|
| This device | **Trace** `#2F9E96` | The instrument in your hand | `#1E716B` day, `#3DB2A9` night |
| Your account | **Olive** `#8C8A2E` | "The keys that bank a resource" (Quest, Ink) | `#66641E` day, `#C6C45A` night |
| Public links | **Coral** `#ED3F1C` | Hot: anyone with the link can open it | `#C23315` day, `#F26446` night |
| Built in | **Bone** | Neutral key: ships with the Dojo, same for everyone | body text |

- Ember / Radio (the theme's signal) keeps its one job: the live thing. That's Start match, plus Open on the session that's on the board.
- **Lit** (filled) means a copy is there. **Hollow** (1.5px outline) means it's there but out of date, like the hollow Play key when you're short on ink. **Dashed** means it isn't there.
- Caveat: if Tweaks → Accent swaps the signal to Coral, Olive or Trace, one place shares the signal's colour. DESIGN-field-unit.md already accepts this for function keys.
- If one of these ships, DESIGN-field-unit.md needs a short "Place colours" section, next to "Function keys".

## Changed in all three

- **Shared → Links**, with a link icon.
- **Open is a paper tool.** It only turns signal for the session on the board.
- **One labelled place action per row,** in Olive: *↑ Save to account*, *↓ Get newer copy*, or *Download & open*. Rename, Share a link, Duplicate, Export and Delete move into **⋯** (`screens/A-desk-menu-in.png`).
- **Plain sentences:** *Only on this device*, *On this device and in your account*, *Changed here since your last Save*, *Your account has a newer copy*, *Only in your account*.
- **Two-line rows:** title and actions on top, then place and details full width. On phones the actions move to the foot of the card.
- **Default decks are called "Built in".**
- The tab-collapse fix above.

## A · Lamps

Each row shows `DEVICE` and `ACCOUNT` lamps plus a sentence. A key under the tabs says what lit, hollow and dashed mean, and what Save does. Signed out, the key says clearing site data deletes everything, and offers *Sign in*. Pick up again on the home screen uses the same lamps.

- **For:** the smallest change. Each row explains itself, wherever it appears (Library, home, a future search result).
- **Against:** the lamps repeat on every row, which adds noise in a long list. The key costs about 100px.

## B · Shelves

Sessions are grouped into *In your account + this device*, *Only on this device* and *Only in your account*. Each group has a spine down its left side: two bars (Trace + Olive) when it's in both places, like a player's ink pair. Each group has a sentence and at most one action (*Save 2 to account*). Rows that are in sync carry no status at all; only an out-of-step row says so. Decks get *In your account*, *Only on this device* and *Built in*. Links get one Coral shelf. Signed out, an empty dashed *Your account · optional* shelf explains signing in where it matters. Pick up again keeps its recency order, adds the same spines, and sums the shelves at the foot.

- **For:** you know where something is before you read the row. The consequence sentences sit exactly where they apply. One click saves everything that's only here. It has the quietest rows of the three.
- **Against:** the list isn't purely newest-first any more. Your last session can sit on a lower shelf (Pick up again stays by recency, and each shelf is newest-first).

## C · Places map

A glass panel at the top of the drawer draws the model. *This device* ⇄ *Your account*, with *Save ▶* and *◀ Get* on the edge between them and the rules under it ("decks go both ways by themselves"). *Built in* and *Public links* sit below, then an *Out of step* readout (*2 only on this device*, *2 need a Save or a Get*). Every place and readout chip filters the list (`screens/C-desk-filter-onlydevice-in.png`). Rows carry a thin strip in their place colour, split when the row is in both. Signed out, *Your account* is a dashed node with *Sign in*. The home header's Library button becomes the map in miniature: `Library ▮5 ▮4`.

- **For:** teaches the model best. It doubles as the account usage readout (4/50 sessions), and the filters make "what isn't backed up?" one click.
- **Against:** the most new UI. It takes about 290px of the drawer before the first row (more on phones), so it probably wants to collapse to one line after a few visits.

## Recommendation

**B (Shelves), plus C's Library button on the home header** (`Library ▮5 ▮4`). B answers "where is it?" before you read anything, puts each consequence where it applies, and keeps rows quiet. The home button carries the same answer to the first screen. A is the fallback if re-sorting the lists feels like too much. C's map is worth keeping for a later "account" view.

## Opening the prototypes

Serve the repo root (for example `python3 -m http.server`) and open `/docs/design/library-clarity/A-lamps.html` (or `B-shelves.html`, `C-places-map.html`). The bar at the bottom left switches state. URL parameters: `acct=in|out`, `tab=sessions|decks|links`, `theme=day|night`, `drawer=0` (home only), `menu=<row id>` (e.g. `s-b`), `filter=device|account|only-device|needs` (C), and `shot` to hide the bar.

Files: `_home.js` is the real home screen as rendered in v3.2.4. `_data.js` holds the sample library and shared helpers. `_shared.css` holds the place tokens and the row changes common to all three.
