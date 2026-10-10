# TEST PROTOCOL — Practice Dojo v3.11.0

Scope: **Feature 57 · Help (manual, search, Show me)** and **Feature 58 · Guided tours.** Use a desktop browser at about 1440×900 and a phone (or 390×844). Run once by day and once at night. For the first-visit checks use a private window (no sessions, no `lorcana_dojo_help` in localStorage).

## A — Opening Help
| # | Step | Expected |
|---|------|----------|
| A.1 | Desktop board: the **?** at the top right | A Help drawer opens on the right; the board stays usable beside it; the search has focus |
| A.2 | Press `?` on the board, then `?` again | Help opens, then closes. Typing `?` in a text field types it |
| A.3 | Phone: ⋯ → **Help & tours** | A full-screen Help sheet; the keyboard does not pop up by itself |
| A.4 | Home screen: **Help** | Help opens over the home screen |
| A.5 | The small **?** on the Multiverse header, the mulligan, the Library, Tweaks, Draw odds, the Share dialog, the Sign-in dialog | Each opens its own article |
| A.6 | Open `…/app/#help/ink-a-card` in a new tab | The app loads with that article open |

## B — Reading
| # | Step | Expected |
|---|------|----------|
| B.1 | Contents | Tours at the top, then ten sections; no "Being written" entries |
| B.2 | Open *Ink a card* on desktop, then switch to **Phone** | The instructions change to the phone's (tap, card drawer); **Show me** hides on the other device's view |
| B.3 | Keycaps, gesture chips, links to other articles, *Related* | Render cleanly in day and night; links open their article |
| B.4 | **Show me** on desktop (e.g. *End your turn*) | The page dims, the End turn button is ringed, a callout explains it; a click or Esc closes it |
| B.5 | **Show me** for Draw odds (under the drawer) | The drawer steps aside while the spotlight shows, then comes back |
| B.6 | **Show me** on a phone | The sheet closes first, then the spotlight shows |
| B.7 | Esc in Help | Clears the search, then goes back from an article, then closes Help |

## C — Search
| # | Step | Expected |
|---|------|----------|
| C.1 | Type `attack`, `mana`, `rewind`, `dark mode`, `graveyard` | Challenge, Ink a card, Undo, Day/night, Your discard pile near the top |
| C.2 | Type a typo: `chalenge`, `mulliagn` | Still finds Challenge / Mulligan |
| C.3 | Type `space` or `q` | Keyboard shortcuts first |
| C.4 | ↓ / Enter on results | Opens the result at its heading |
| C.5 | Type `xyzzy` | "No results", with a few suggestions |
| C.6 | Search on a phone for `long press` | Turn notes near the top |

## D — Tours
| # | Step | Expected |
|---|------|----------|
| D.1 | Private window, home screen | A welcome dialog: *New here? Take the 3-minute tour.* **Start the tour** · **Explore on my own** (a bottom sheet on a phone) |
| D.2 | **Explore on my own** (or Esc), then reload | The spotlight points at **Help**; after the reload the welcome stays gone |
| D.3 | A browser that already has sessions | No welcome; one toast says where Help is, once |
| D.3b | Before opening Help | The **?** (desktop), **Help** (home) and **⋯** (phone) keys breathe in orange; not during a tour; once Help has been opened they stop for good |
| D.4 | Open a share link (`?s=…`) in a private window | No tour strip |
| D.5 | Help → *Your first turn*, follow it on desktop | Banner *Practice · not saved*; each step lights a real control; waiting steps continue when you do the action; Space works on the end-turn step; ends on a closing card |
| D.6 | Same tour on a phone | Steps use the card drawer and the phone's controls; nothing hidden behind the callout |
| D.7 | *The Multiverse* tour | Runs on a copy of the Set 13 demo; Plot setting restored afterwards |
| D.8 | *Study a Duels.ink game* tour | The example log imports onto a practice board; no new session in the Library |
| D.9 | Start a tour with a match on the board, then press ✕ | The same match is back, unchanged; Library unchanged |
| D.10 | During a tour: **Learn more** | Help opens; closing it resumes the tour |
| D.11 | During a tour: Save → Save a copy | The practice board becomes a new session in the Library |
| D.12 | Finished tours | ✓ beside them in Help |

## E — Regressions
| # | Step | Expected |
|---|------|----------|
| E.1 | Open a real share link | Still opens with *Shared · title · not saved yet · Save a copy* |
| E.2 | Hotkeys on the board with Help closed (M, T, Q, Space, C, E, B, 0–9) | Unchanged |
| E.3 | Autosave: play a turn, reload | The match is still there (Continue) |
| E.4 | No errors in the browser console through A–D | |
