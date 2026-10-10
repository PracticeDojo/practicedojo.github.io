# TODO: User manual, search and guided tours

The working checklist for [`ARCH-help-and-tour.md`](ARCH-help-and-tour.md). The ARCH doc says
*how*; this file says *what's left*. Section numbers (§) point into the ARCH doc; M-numbers are its milestones (§12).

**Rules:** tick an item only when it is on `main` and verified (say how in the note). Items marked
**(you)** need a decision or a hands-on test from the owner. New work found along the way goes
into the right milestone, or into *Parked* if it's outside the plan.

**Now (D7):** everything is being built on `claude/feat-57-help-and-tours` by one session with sub-agents; the owner tests that branch before it goes to `main`.

**Working in parallel:** claim a milestone by putting your branch name after its heading before you start, so two agents don't take the same one. M0 goes first; after it, M1, M2, M3a–e and M4 can all run at once.

*Last updated: 2026-10-10 · live: v3.9.1 · next up: M1, M2, M3a–e and M4 in parallel*

| Milestone | Status |
|---|---|
| Review of the proposal | ✅ Done: all six as proposed (D1–D6) |
| M0 · Contracts and scaffolding | 🟡 Built on `claude/chore-help-scaffolding`, waiting to merge |
| M1 · Manual viewer | 🔨 Agent on `wip/m1-viewer` |
| M2 · Search | 🔨 Agent on `wip/m2-search` |
| M3a–e · Content | 🔨 Five agents on `wip/m3a-content` … `wip/m3e-content` |
| M4 · Spotlight | 🔨 Agent on `wip/m4-spotlight` |
| M5 · Tour engine and scratch view | ⬜ |
| M6 · Tour content | ⬜ |
| M7 · Entry points and help in context | ⬜ |
| M8 · Release Feature 57 (manual) | ⬜ |
| M9 · Release Feature 58 (tours) | ⬜ |
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

## Parked (outside the plan)
- See ARCH §15: analytics, AI answers, command palette, video, tour resume, translations, more tours, changelog panel.
