# TODO: Two-player tables — live and by turns

The working checklist for [`ARCH-two-player.md`](ARCH-two-player.md). The ARCH doc says *how*; this file
says *what's left*. Section numbers (§) point into the ARCH doc; M-numbers are its milestones (§13).

**Rules:** tick an item only when it is verified (say how in the note). Items marked **(you)** need a
decision, a dashboard or a hands-on test from the owner. New work found along the way goes into the
right milestone, or into *Parked* if it's outside the plan.

**Now:** everything is built as v4.0.0 on `claude/feat-64-two-player-tables`. The migration was run by hand
in the SQL editor (2026-10-20), and the two-player flows pass against the real Supabase project
(`node tools/table-checks.mjs --live`, 58/58). It reaches players when the branch merges to `main`; the
GitHub integration then runs the migration again, which is safe. Until then, try it on the branch preview:
https://claude-feat-64-two-player-tables-practicedojo.heavenideasdesign.workers.dev/app/

*Last updated: 2026-10-20 · live: v3.17.4 · built: v4.0.0 on `claude/feat-64-two-player-tables`*

| Milestone | Status |
|---|---|
| M0 · Review | ✅ Settled by building the recommendations; one release (§16) |
| M1 · Database | ✅ Built, tested on Postgres 16, applied by hand 2026-10-20 |
| M2 · Contract and stand-in | ✅ Built |
| M3 · Tables by turns (Feature 64) | ✅ Built, v4.0.0 |
| M4 · Real transport | ✅ Built; 58/58 against the real project (`--live`) |
| M5 · Live tables (Feature 65) | ✅ Built, v4.0.0 |

---

## M0 · Review
- [x] Q1 No *Live / By turns* switch: the table is live while both are at it (§16). *Built that way (D8)*
- [x] Q2 Watching keeps today's view, the active player at the bottom. *D8*
- [x] Q3 Storage rule: no new tables past 900 MB of project Storage or 150 MB in the `tables` bucket. *D8, in the migration*
- [x] Q4 The other player takes back an *End turn* with Undo. *D8; tested (`undo: Bea's Undo gives Ann the turn back`)*
- [x] Q5 The word "table". *D8*
- [x] Q6 One release, v4.0.0. *Owner, 2026-10-20 (D9)*
- [x] Decisions in the ARCH decision log (§17). *D1–D9*
- [ ] **(you)** Optional: Supabase → Realtime Settings → *Allow public access* off. Private channels are checked against the policies either way; turning it off also refuses public channels, which the app doesn't use

## M1 · Database (§10)
- [x] Migration `supabase/migrations/20261020120000_tables.sql`: `tables` row, RLS, guard trigger (seats fixed, revision +1). *`bash supabase/tests/run.sh`: all checks pass, migrations run twice*
- [x] `table_invite`, `join_table`, `leave_table`, `free_seat`. *Same run: one winner per seat, idempotent rejoin, last one out deletes*
- [x] Caps failing closed: 20 tables per identity, 10 MB a file, the Q3 storage rule. *Same run*
- [x] Private bucket `tables` and its policies. *Same run: seats read and write, strangers see nothing*
- [x] Realtime policies on `realtime.messages` for `table:<id>`. *Same run, with a stand-in `realtime.topic()`*
- [x] Tests on Postgres 16 with stand-in `auth`, `storage` and `realtime` schemas (`supabase/tests/`)
- [x] Migration applied. *Run by hand in the SQL editor, 2026-10-20; `table_invite` answers. The GitHub integration runs it again on merge (safe to run twice)*

## M2 · Contract and stand-in (§11.2, §18)
- [x] `DojoCloud` table functions with error codes (`seat_taken`, `table_limit`, `table_storage_full`, `gone`, `conflict`, `offline`)
- [x] Stand-in backend: rows, files and the channel in Node, relayed into two browser contexts (`tools/table-checks.mjs`)
- [x] Run in CI by `tools/app-checks.mjs`. *72/72 (14 app + 58 tables)*

## M3 · Tables by turns — Feature 64 (§4, §5, §7, §8, §9)
- [x] `app/js/table.js` (`DojoTable`): attach / detach, the pen, debounced writes, conflicts, pending upload
- [x] `DojoLibrary`: `table: { id, seat, revision, names, dirty }` on session rows; duplicates drop it
- [x] *Play with a friend*: a name, a side, a new device session, the link dialog with *Copy link*. *Checked headless and in screenshots, desktop and phone*
- [x] `?t=` join screen; a full table says so; a device that already has the table reopens its copy
- [x] Watching state: one capture-phase gate plus `tableLocked()` in the tree and note editors. *`pen:` checks*
- [x] End-of-turn auto-save node always on at a table
- [x] Hands: the other seat's hand face down; their mulligan not shown; looking is logged. *`hands:` checks and screenshots*
- [x] Proposals: banner, *Go there* / *Stay* / *Cancel*. *`propose:` and `refuse:` checks*
- [x] Conflict and incoming-board rule: keep "Left here". *`conflict:` checks, with one side offline*
- [x] *Your turn* / *Sam's turn* badges in *Pick up again* (first) and Library · Sessions. *`by turns:` checks*
- [x] Table chip and sheet: seats, link, *Take a copy*, *Leave the table*, *Free seat*
- [x] Live boards and downloaded files go through `sanitizeSessionData()`
- [x] Manual: *Play with a friend*, *Live and by turns*, *Move the table to another node*; target `play-with-a-friend`; 6 golden queries. *`help.mjs --check` and `--test` (134/134)*
- [x] features.md, dev guide §28, `TEST-PROTOCOL-v4.0.0.md`, v4.0.0, `node tools/refresh-landing.mjs`

## M4 · Real transport (§10, §11.2)
- [x] `DojoCloud` table functions against Supabase (claim, then upload; `tableRevision` in the file)
- [x] The Realtime calls `tableChannel` makes (subscribe, presence keyed by tab, `track`, broadcast with `self: false`, a 30 KB payload) checked against the live project on a public channel. *2026-10-20*
- [x] Every flow against the real project: `node tools/table-checks.mjs --live`, 58/58, including the private channel, a real offline conflict (`setOffline`), and a stranger refused the row, the file and the channel. *2026-10-20*
- [x] Found live and fixed: Storage served an overwritten file from a cache (three overwrites later `download()` still gave the first), so the other seat never got the turn. Downloads now go through `downloadFresh()` (a new URL each time, `cache: 'no-store'`). The account side's *Get newer copy* had the same bug and uses it too
- [ ] **(you)** After the merge: one by-turns game between a phone and a desktop (`TEST-PROTOCOL-v4.0.0.md` A–D)

## M5 · Live tables — Feature 65 (§6)
- [x] `tableChannel`: private channel, presence `{ seat, name }`
- [x] `board` streaming from `render()` (signature check, 250 ms, `seq`), only by the pen holder, dropped when stale. *`live:` checks*
- [x] Arrival sends the board; *End turn* goes as file + `table`, never as `board`
- [x] Proposals answered live; both boards move with the time flash
- [x] Size guard (over 200 KB → file + `table`)
- [x] Chip states: waiting / live / away; tab title on *Your turn*
- [ ] **(you)** After the merge: a live game across two devices, switching to by turns and back mid-game; sign in on a second device and keep the seat (`TEST-PROTOCOL-v4.0.0.md` E–G)

## Parked
- Deliberately not doing until a trigger fires: push or email notifications, spectators and more seats, chat, your own side at the bottom while watching, borrowing the pen, taking back your own *End turn* alone, peeking at a node, notes by the waiting player, real hidden information, table expiry. See ARCH §15
- The draw-odds pane follows the active player's deck, as it does solo, so a watcher sees the odds of the other player's deck. Trigger: someone minds
