# TODO: User manual, search and guided tours

The working checklist for [`ARCH-help-and-tour.md`](ARCH-help-and-tour.md). The ARCH doc says
*how*; this file says *what's left*. Section numbers (§) point into the ARCH doc; M-numbers are its milestones (§12).

**Rules:** tick an item only when it is on `main` and verified (say how in the note). Items marked
**(you)** need a decision or a hands-on test from the owner. New work found along the way goes
into the right milestone, or into *Parked* if it's outside the plan.

**Now (D7):** everything is being built on `claude/feat-57-help-and-tours` by one session with sub-agents; the owner tests that branch before it goes to `main`.

**Working in parallel:** claim a milestone by putting your branch name after its heading before you start, so two agents don't take the same one. M0 goes first; after it, M1, M2, M3a–e and M4 can all run at once.

*Last updated: 2026-10-10 · live: v3.9.1 · built: v3.11.0 on `claude/feat-57-help-and-tours`, waiting for the owner's test (`docs/TEST-PROTOCOL-v3.11.0.md`). Boxes below get ticked when it reaches `main`.*

| Milestone | Status |
|---|---|
| Review of the proposal | ✅ Done: all six as proposed (D1–D6) |
| M0 · Contracts and scaffolding | ✅ Built, on `claude/feat-57-help-and-tours` |
| M1 · Manual viewer | ✅ Built, on `claude/feat-57-help-and-tours` |
| M2 · Search | ✅ Built (128/128 golden queries), on `claude/feat-57-help-and-tours` |
| M3a–e · Content | ✅ Built (64 articles), on `claude/feat-57-help-and-tours` |
| M4 · Spotlight | ✅ Built (`--live`: 140 pass, 0 fail), on `claude/feat-57-help-and-tours` |
| M5 · Tour engine and scratch view | ✅ Built, on `claude/feat-57-help-and-tours` |
| M6 · Tour content | ✅ Built (3 tours), on `claude/feat-57-help-and-tours` |
| M7 · Entry points and help in context | ✅ Built, on `claude/feat-57-help-and-tours` |
| M8 · Release Feature 57 (manual) | ✅ v3.11.0 (with F58), on `claude/feat-57-help-and-tours` |
| M9 · Release Feature 58 (tours) | ✅ v3.11.0 (with F57), on `claude/feat-57-help-and-tours` |
| M10 · Public /help/ page | 💤 Later, optional |

---

## Review **(you)** — *decided 2026-10-10: every recommendation accepted*
- [x] Q1 Desktop help as a side drawer (board stays usable)
- [x] Q2 `basics` tour on a scripted board
- [x] Q3 A Help tool in the desktop top bar
- [x] Q4 Public `/help/` page later
- [x] Q5 No tour offer for people arriving by share link
- [x] Q6 No command palette for now
- [x] Decisions copied into the ARCH decision log (§14). *D1–D6, 2026-10-10*

## M0 · Contracts and scaffolding (§5, §7.1, §10) — `claude/chore-help-scaffolding`

*Built 2026-10-10 (ARCH §5.7); boxes get ticked when it reaches `main`. Verified: `node tools/help.mjs --check` passes; the validator caught every fault planted in a test article and a target; the board is pixel-identical at 1440 and 390 before and after the new ids.*

- [ ] `app/help/` layout: `articles/<NN-section>/`, `tours/`, `img/`, `sections.json`
- [ ] One stub article per id in §5.4 (front matter + `TODO` body)
- [ ] `targets.json` with real selectors for every target the articles and tours need; ids added to controls that lack one (markup only)
- [ ] `synonyms.json` (§6.3)
- [ ] `tools/help.mjs`: build `manual.json`, `--check` (front matter, unique ids, links, targets, stale bundle, `verified` warning)
- [ ] `tools/help-golden.json` with ~30 queries
- [ ] `field-unit.css`: an empty *Help & tours* section with one slot per milestone
- [ ] `AGENTS.md`: *Keeping the manual current* (§10) and the new docs in the context list

## M1 · Manual viewer — `app/js/help.js` (§6)
- [ ] **(you)** Pick a mock-up from `docs/design/help/` (2–3 options, desktop + phone, day + night)
- [ ] Drawer on desktop (non-modal), full-screen sheet on phones
- [ ] Contents: tours at the top, then sections
- [ ] Article view: back, title, device blocks, keycaps, gestures, `help:` links, *Show me* (via `DojoSpotlight` when present), Related
- [ ] Device switch *Desktop · Phone* (layout and input tags, tablets keep `touch`, §4)
- [ ] "Works differently on …" line when only the other device has a block
- [ ] `#help/<id>[/<slug>]` deep links, cold load included
- [ ] Entry points: top bar Help tool, ⋯ menu *Help & tours*, home header, `?` key
- [ ] Keys: `/`, ↑ ↓ Enter, Esc order, Backspace on empty search
- [ ] Markdown through `marked` + DOMPurify
- [ ] Checked at 1440 and 390, day and night

## M2 · Search — `app/js/help-search.js` (§6.3)
- [ ] `build(manual, { device })` with one record per `##` section plus the lead
- [ ] Synonyms folded into `aliases` at build time
- [ ] `query(q, { device, limit })`: Fuse weights, other-device penalty and tag, key-name queries to shortcuts, lead-record tie-break
- [ ] Looser no-results pass
- [ ] `highlight(text, matches)` for the result rows
- [ ] `tools/help.mjs --test` runs the golden queries in Node
- [ ] Under 5 ms a query on the full manual

## M3 · Content (§5.4, §5.5) — five PRs, any order
- [ ] M3a · 01 Getting started, 02 Playing a turn
- [ ] M3b · 03 Cards and decks, 05 Importing games
- [ ] M3c · 04 The Multiverse
- [ ] M3d · 06 Library and sharing, 07 Account, 08 Settings
- [ ] M3e · 09 Help and fixes, 10 Reference (shortcuts and gestures complete, read from the code)
- [ ] Screenshots for *The screen at a glance*, *Reading a node*, *Cards and plot* (`tools/help.mjs shots`)
- [ ] Every article: `verified` set, checked on both devices; golden queries added for it

## M4 · Spotlight — `app/js/spotlight.js` (§7)
- [ ] `show(target, opts)`, `hide()`, `isOpen()`
- [ ] Dim with cut-out, ink/paper ring (not signal), callout placement, phone docking
- [ ] Follows resize, scroll and render; scrolls the target into view; target gone → centred callout
- [ ] Pass-through for tour steps
- [ ] Reduced motion; keyboard-only; `role="dialog"` and `aria-describedby`
- [ ] `tools/help.mjs --live`: every target visible on its devices

## M5 · Tour engine — `app/js/tour.js` (§8)
- [ ] **(you)** Pick a callout mock-up
- [ ] Scratch view: `_sharedView` generalised to `{ kind: 'shared' | 'tour' }`, `openScratch` / `closeScratch`, *Practice · not saved* banner
- [ ] A match in progress is flushed before and restored after
- [ ] Render hook and Esc-first key hook
- [ ] Steps: read-only and `until`; device-specific steps; hints after 20 s; *Learn more* pauses and resumes
- [ ] Predicates from §8.3
- [ ] Progress in `localStorage['lorcana_dojo_help']`
- [ ] Library and current session identical before and after a tour (IndexedDB compared)

## M6 · Tour content (§8.1, §8.4)
- [ ] `basics.dojo.json.gz`: two built-in Set 13 decks, fixed order, Player 1's mulligan pending
- [ ] `basics.json`, desktop and phone wording
- [ ] `multiverse.json` on a scratch copy of the Set 13 demo
- [ ] `import.json` with the example log
- [ ] *Guided tours* article
- [ ] Each tour walked through at 1440 and 390 by its own instructions
- [ ] **(you)** First-time run of `basics` in under 4 minutes

## M7 · Entry points and help in context (§6.5, §8.2)
- [ ] `data-help` links on the panels in §6.5
- [ ] Home tour offer strip (new players only; *Not now* is forever)
- [ ] One-time *New: Help and guided tours* toast for existing players
- [ ] Landing page footer links to the manual

## M8 · Release Feature 57 — the manual
- [ ] `APP_VERSION` MINOR bump
- [ ] `features.md`: Feature 57 details, box ticked
- [ ] Dev guide section
- [ ] `docs/TEST-PROTOCOL-v<version>.md`
- [ ] `node tools/refresh-landing.mjs` and `node tools/help.mjs shots`
- [ ] ARCH status updated

## M9 · Release Feature 58 — guided tours
- [ ] Same steps as M8

## Owner testing (on `claude/feat-57-help-and-tours`)
- [x] Tour "Your first turn": **Skip this step** on the mulligan left the dialog up while the tour moved on. *Fixed: a predicate can carry a `skip` action; the mulligan steps settle the hand (Keep hand, or Start turn after a mulligan) and Player 2's step settles their hand and inks a card so Undo still has something to take back. A queued advance no longer fires after a skip has already moved the tour (it skipped a step). Checked in Chromium at 1440 and 390: skipping every mulligan step lands on the board step with the dialog closed*
- [x] Tour "Your first turn": the mulligan only showed **Keep hand**. *Now four steps: look at a card (magnifier on desktop, press and hold on phones, the spotlight grows to the held card), mark one for the bottom (the readout), **Mulligan**, then the new hand's NEW pip and **Start turn**. Walked through by its own instructions at 1440 and 390*

- [x] First-time players barely noticed the tour offer (a strip under the headline). *Now a welcome dialog over the home screen (a bottom sheet on phones) with **Start the tour** / **Explore on my own**; exploring points the spotlight at Help. The Help keys breathe in the signal until Help is first opened (paused in tours, steady under reduced motion); DESIGN-field-unit.md allows that use. Checked at 1440 and 390, day and night: welcome, explore → spotlight on Help, start → tour runs, Esc → home with no welcome, opening Help stops the breathing*

- [x] Help drawer: tours and sections looked the same, and links were black. *Tours now sit in a glass well (play mark, minutes, Start › or ✓ Again); the manual is ten numbered sections (signal mono index, title, count) that open and close, with their articles behind a hairline; the section you read stays open, Getting started opens first. Links are signal (by day deepened toward ink for AA, pure-signal underline; Radio at night); Related rows are signal with an arrow. Checked at 1440 and 390, day and night*

- [x] Suggestion: ask on a player's first match whether to take the tour first. *The first Start match without "Your first turn" done asks once (First match? Take the tour first / Just play). Take the tour first starts the match, runs the tour, and returns to that match; Just play starts it. Checked at 1440: both answers, the session kept, back at the mulligan after Esc*

- [x] Suggestion: tour panels jump and blend into the app. *Tours wear Trace (the key family's teal): a Trace callout panel, a 3px Trace ring, a Trace frame round the screen and a Trace Practice banner. Between steps the callout and cut-out glide (260 ms) and pulse on arrival; none under reduced motion. Show me from the manual stays paper. Checked at 1440 and 390, day and night*

- [x] Owner: tour colour Trace → Olive. *`--tour` / `--tour-ink` in field-unit.css (Olive `#8C8A2E` with `#141311` text, about 5:1; Kiln `#9C9A34`); the callout's primary key is that ink with paper text. Checked at 1440 and 390, day and night*

## Found while building (not fixed; outside this plan)
App bugs the writers noticed while checking articles. The manual describes today's behaviour.
- Desktop: clicking or hovering an unknown card in the active hand throws (`showContextMenu` reads `dbCard.cost`, `showPreview` reads `images`), so it can't be swapped there
- Q and Space act on the board while the Multiverse (and likely Inspect deck/discard, log import, card search) is open
- After opening the Multiverse with the mouse, Enter re-presses the focused top-bar button instead of playing from the selected node
- The auto-save switch isn't remembered across reloads
- Playing from an auto-save node copies its stock line and raw `**Turn recap**` Markdown into the turn note
- Esc with card search open over the deck grid closes the deck grid first (unsaved order lost)
- Esc doesn't close card search / log import while their text field has focus
- The deck grid's card menu needs `contextmenu`, which iOS Safari never fires (no swap from the deck grid on iPhone)
- Locations dragged from hand enter play ready (Play Card makes them exerted); `questWithAll` would quest with them, and reads `dbCard.lore` without a null check
- Shifting onto a character at a location by dragging moves the card to the location instead
- Separating a stack copies the top card's damage onto every card, exerted and drying
- Craft hand: removing one copy needs right-click (touch can only Clear); its dialog still has pre-Field Unit styling
- Return to hand from play isn't logged
- Peek button says "Hold to reveal hand" on phones, where it's a tap
- Space on a focused ink bar may also end the turn (code reading only)
- Library: renaming a non-live session doesn't flag the account copy as behind
- Save as copy / title edits do nothing on a shared session
- Copy: the first-sign-in "Choose…" toast says "cloud button" (it's **Save to account**); the Save tooltip always says "Save to this device"; the Save-as-copy dialog says "My sessions" (the tab is Sessions)
- The shared/practice banner draws over the open Multiverse on phones
- `features.md` ticks Feature 20 (fill all unknown cards) but nothing in the app implements it
- A copy saved from a tour is named after the tour

## Parked (outside the plan)
- See ARCH §15: analytics, AI answers, command palette, video, tour resume, translations, more tours, changelog panel.
