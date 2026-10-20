# TODO: Two-player tables — live and by turns

The working checklist for [`ARCH-two-player.md`](ARCH-two-player.md). The ARCH doc says *how*; this file
says *what's left*. Section numbers (§) point into the ARCH doc; M-numbers are its milestones (§13).

**Rules:** tick an item only when it is on `main` and verified (say how in the note). Items marked
**(you)** need a decision, a dashboard or a hands-on test from the owner. New work found along the way
goes into the right milestone, or into *Parked* if it's outside the plan.

**Working in parallel:** claim a milestone by putting your branch name after its heading before you
start. M0 goes first; then M1 and M2 run at once; M3 needs M2; M4 needs M1 and M2; M5 needs M3 and M4.

*Last updated: 2026-10-20 · live: v3.17.4 · plan v0.1, nothing built*

| Milestone | Status |
|---|---|
| M0 · Review | ⏳ Waiting for the owner |
| M1 · Database | ⬜ |
| M2 · Contract and stand-in | ⬜ |
| M3 · Tables by turns (Feature 64) | ⬜ |
| M4 · Real transport | ⬜ |
| M5 · Live tables (Feature 65) | ⬜ |

---

## M0 · Review **(you)**
- [ ] Q1 No *Live / By turns* switch: the table is live while both are at it (§16)
- [ ] Q2 Watching keeps today's view, the active player at the bottom
- [ ] Q3 Storage rule for tables
- [ ] Q4 The other player takes back an *End turn* with Undo
- [ ] Q5 The word "table"
- [ ] Q6 By turns ships before live
- [ ] Decisions copied from P1–P7 into the ARCH decision log (§17)
- [ ] **(you)** Supabase → Realtime Settings → *Allow public access* off (§10.3)

## M1 · Database (§10)
- [ ] Migration `supabase/migrations/<date>_tables.sql`: `tables` row, RLS, guard trigger (seats fixed, revision +1)
- [ ] `table_invite`, `join_table`, `leave_table`, `free_seat`
- [ ] Caps failing closed: 20 tables per identity, 10 MB a file, the Q3 storage rule
- [ ] Private bucket `tables` and its policies
- [ ] Realtime policies on `realtime.messages` for `table:<id>`
- [ ] Tests on Postgres 16 with stand-in `auth`, `storage` and `realtime` schemas (§14)
- [ ] **(you)** Migration applied by the GitHub integration; checked over the API

## M2 · Contract and stand-in (§11.2)
- [ ] `DojoCloud` table functions declared with the error codes (stubs that throw `unavailable`)
- [ ] Stand-in backend for tests: row and file in the test runner, channel relayed between two browser contexts
- [ ] Two-context runner in `tools/app-checks.mjs`, run in CI

## M3 · Tables by turns — Feature 64 (§4, §5, §7, §8, §9)
- [ ] `app/js/table.js` (`DojoTable`): attach / detach, the pen, debounced writes, `endTurn`, conflicts, pending upload
- [ ] `DojoLibrary`: `table: { id, seat, revision, dirty }` on session rows
- [ ] *Play with a friend*: pick a side and a name, new device session, link dialog with *Copy link* / *Share…*
- [ ] `?t=` join screen; a full table says so
- [ ] Watching state: one `App.watching` flag on drags, the card menu, hotkeys and the turn buttons
- [ ] End-of-turn auto-save node always on at a table
- [ ] Hands: the other seat's hand face down everywhere; mulligan dialog for its own seat only; looking is logged
- [ ] Proposals in the row: banner, *Go there* / *Stay* / *Cancel*, Mini Multiverse steps move the proposal
- [ ] Conflict and incoming-board rule: keep "Left here"
- [ ] *Your turn* / *Sam's turn* badges in *Pick up again* and Library · Sessions (one read, only when there are tables)
- [ ] Table chip and sheet: seats, link, *Take a copy*, *Leave the table*, *Free seat*
- [ ] Every live `board` message and downloaded file goes through `sanitizeSessionData()`
- [ ] Headless checks (§14) green against the stand-in
- [ ] Manual: *Play with a friend*, *Moving the table*; targets; `node tools/help.mjs`
- [ ] features.md, dev guide section, `TEST-PROTOCOL-v3.18.0.md`, minor bump, `node tools/refresh-landing.mjs`

## M4 · Real transport (§10, §11.2)
- [ ] `DojoCloud` table functions against Supabase (claim, then upload; `tableRevision` in the file)
- [ ] End-to-end on a preview with two browsers: create, join, end turn, proposal, leave
- [ ] **(you)** One by-turns game between a phone and a desktop

## M5 · Live tables — Feature 65 (§6)
- [ ] `tableChannel`: private channel, presence `{ seat, name }`
- [ ] `board` streaming from `render()` (signature check, 250 ms, `seq`), dropped when stale
- [ ] Arrival sends the board; *End turn* goes as file + `table`, never as `board`
- [ ] Proposals answered live; both boards move with the time flash
- [ ] Size guard (over 200 KB → file + `table`)
- [ ] Chip states: waiting / live / away; tab title on *Your turn*
- [ ] Headless checks for live (§14)
- [ ] Manual: *Live and by turns*; features.md, dev guide, `TEST-PROTOCOL-v3.19.0.md`, minor bump, landing refresh
- [ ] **(you)** A live game across two devices, switching to by turns and back mid-game; sign in on a second device and keep the seat

## Parked
- Deliberately not doing until a trigger fires: push or email notifications, spectators and more seats, chat, your own side at the bottom while watching, borrowing the pen, taking back your own *End turn* alone, peeking at a node, notes by the waiting player, real hidden information, table expiry. See ARCH §15
