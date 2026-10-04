# TEST PROTOCOL — Practice Dojo v2.19.0

Scope: **Feature 38 · Device library** (ARCH Phase 1). Covers the home screen, sessions and decks on
this device, the v2 `.dojo.json.gz` format, the one-time localStorage migration and the §9.4
untrusted-file fix. The game engine is unchanged.

File under test: `app/index.html` + `app/js/library.js`.

---

## Setup

1. Serve the repo root with any static server (or use https://practicedojo.github.io/app/ after deploy).
2. For the migration test (A), use a browser profile that still has a **Continue** session from
   v2.18.x. For everything else a clean profile is fine.
3. Confirm the home screen and sidebar show **v2.19.0**.
4. Open DevTools → Network. Keep it open for test B.1.

---

## A — Migration of the old Continue slot

| # | Step | Expected |
|---|------|----------|
| A.1 | Load v2.19.0 in a profile that had a v2.18 Continue session | The Continue card shows that match (ink pair, turn, lore). Its title is the ink matchup |
| A.2 | DevTools → Application → Local Storage | `lorcana_dojo_session` is gone |
| A.3 | DevTools → Application → IndexedDB → `practice_dojo` | Stores `decks`, `sessions`, `session_blobs`, `kv`. One row in `sessions` |
| A.4 | Click **Resume match** | The board, multiverse tree and auto-saves are exactly as before |

## B — Home screen

| # | Step | Expected |
|---|------|----------|
| B.1 | Reload with Network open | No request to `supabase.co`. Requests to `app/defaults/decks/…` only |
| B.2 | Look at the tabs | **New match**, **My sessions** (with a count), **Decks**, **Demos**. ←/→ moves between tabs |
| B.3 | New match → P1 deck picker | Groups *Default · Set 12* (and *My decks* once you have some). Picking **Amethyst/Ruby** fills the list: "60 of 60 cards recognised" |
| B.4 | Paste a list into P2 | **Save to My decks** appears under it. Pick a saved deck instead → the checkbox disappears |
| B.5 | Tick it and press **Start match** | Toast "Saved "<inks> · <date>" to My decks". The deck appears in Decks → My decks |
| B.6 | Go home (↻ in the topbar) with a match running | No "Leave this match?" dialog. **Back to match** is shown |
| B.7 | Reload, open the home screen | P1/P2 pickers preselect the decks of the last match |
| B.8 | Phone (390×844): every tab | Tabs stay visible and scroll sideways. Row actions wrap under the title. Start match only on New match |

## C — Sessions

| # | Step | Expected |
|---|------|----------|
| C.1 | Start a match, play a few actions, save a node | Topbar shows the session title (e.g. "Amethyst/Ruby vs Ruby/Steel") |
| C.2 | Wait 2 s, reload | Continue card = this match, "just now". Resume restores the node and lore |
| C.3 | Click the title in the topbar, type a new name, Enter | Title sticks. My sessions shows the new name. Esc while typing restores the old one |
| C.4 | Topbar **Save** | Toast "Saved "…" on this device" |
| C.5 | Topbar **Save as copy** → accept the suggested "(copy)" name | Toast "You're now in …". My sessions has both. Play on; the original doesn't change |
| C.6 | My sessions: **Rename**, **Duplicate** | Work on any row; the row on the board is marked *on the board* |
| C.7 | My sessions: **Delete** a session that isn't on the board | Confirm dialog, then gone. Continue card updates if it was that one |
| C.8 | Delete the one *on the board* | Back to match disappears; nothing autosaves any more; Start match still works |
| C.9 | Import a Duels.ink replay (`docs/samples/*.json`) | Board loads; title "HeavenIdeas vs Mia Ies (Duels.ink)"; it appears in My sessions |
| C.10 | Play a very large multiverse (or import a 10 MB+ v1 export), reload | It still resumes (the old 5 MB localStorage limit is gone) |

## D — Files

| # | Step | Expected |
|---|------|----------|
| D.1 | Timelines → **Export** (or My sessions → Export) | Downloads `<title>.dojo.json.gz`, much smaller than the old `.json` |
| D.2 | Import that `.gz` (home screen or Timelines → Import) | Loads; a **new** session with the same title (the original isn't overwritten) |
| D.3 | Import an old v1 `lorcana-session-….json` | Loads; title is the ink matchup |
| D.4 | Import a random `.json` | "Couldn't read file" dialog; the board is untouched |
| D.5 | `gunzip -c x.dojo.json.gz \| head -c 300` | Starts with `{"format":"practice-dojo-session","version":2,…` |

## E — Decks tab

| # | Step | Expected |
|---|------|----------|
| E.1 | **New deck** → name + list → Save deck | Row with ink pips, card count. ⚠ badge if a line isn't recognised |
| E.2 | **Import .txt** | Editor opens prefilled with the file name and list |
| E.3 | **From Duels.ink replay** with the sample replay | Editor: "Amethyst/Ruby · HeavenIdeas", 60 of 60 |
| E.4 | Default deck → copy icon | Editor "Save to My decks" with "(copy)" name; saving adds a My deck; the default stays |
| E.5 | **P1** / **P2** on any deck | Switches to New match with that deck in that slot |
| E.6 | Delete a My deck | Confirm, gone from the list and the pickers |

## F — Demos

| # | Step | Expected |
|---|------|----------|
| F.1 | Demos tab (manifest is empty today) | "No demos yet." |
| F.2 | Add an exported `.dojo.json.gz` + manifest line, reload, Open | Board loads; a copy appears in My sessions; the file in the repo is unchanged |

## G — Untrusted session files (§9.4)

Make a v1 file whose node **name**, **stats**, **comment**, a **turn note** and **player 1's name** are
`<img src=x onerror=alert(1)>`, whose node **id** is `x');alert(1);('`, plus a comment containing
`</textarea><img src=x onerror=alert(1)>`.

| # | Step | Expected |
|---|------|----------|
| G.1 | Import it, open the Multiverse | No alert. The tags show as text |
| G.2 | Edit that node (pen icon) | The textarea holds the whole comment as text; no alert |
| G.3 | Open Timelines; check the game log turn note | No alert. Text shown literally |
| G.4 | A node comment with `**bold**` and `[x](javascript:alert(1))` | Bold renders; the link has no `href` |
| G.5 | Restore / delete that node | Works (its id was re-issued on load) |
