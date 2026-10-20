# ARCH: Two-player tables — live and by turns

> **Status:** v1.0, built as **v4.0.0** on `claude/feat-64-two-player-tables` (Features 64 and 65 in one release). The open questions were settled by building the recommendations, except Q6: one release (§16). As built: [§18](#18-as-built-v400). The migration reaches Supabase when the branch reaches `main`.
> **Scope:** Practice Dojo: `app/index.html` (small hooks), `app/js/cloud.js` (transport), a new `app/js/table.js`, one Supabase migration.
> What's done and what's left: [`TODO-two-player.md`](TODO-two-player.md). Planned as **Feature 64** (tables by turns) and **Feature 65** (live tables) in `docs/features.md`.
> Builds on [`ARCH-accounts-and-library.md`](ARCH-accounts-and-library.md): the session file (§6), the device library (§5), the anonymous identity (§9.3) and the revision check (§8.3).

---

## 1. What we're building

Two people share one Dojo session, called a **table**. Each sits in one seat: P1 or P2. The board and the whole multiverse belong to the table.

- **Live.** Both have the table open. Every move shows on the other screen within a second. Either player can ask to move the table to another node of the multiverse. When the other agrees, both boards go there.
- **By turns.** One player opens the table, plays a turn and ends it. The table then waits until the other player opens it and plays theirs. Nobody has to be online at the same time.
- **In and out at will.** Live and by turns are the same table with the same rules. The table is live while both players are at it, and by turns while one is away. There is no switch and nothing to convert: opening the table while the other is there makes it live, closing the tab makes it by turns. A solo session becomes a table with one button, and a table becomes a solo session again with *Take a copy* or *Leave*.

## 2. Principles

1. **One table, one set of rules.** Live only adds speed (streaming and presence). Everything works by turns first, so live can fail (network, free-tier limits) and the game carries on by turns.
2. **One writer at a time: the pen.** Only the seat whose turn it is changes the board. The other seat watches. *End turn* passes the pen. Two boards are never merged.
3. **No board is lost.** Whenever a board from the other player replaces a board with unsaved changes, the replaced board is kept first as a "Left here" snapshot. This is the safety net `restoreTimeline()` already uses.
4. **Moving the table takes both players.** At a table, loading another node or snapshot is a proposal. It happens only when the other seat says yes.
5. **Works signed out.** Tables use the invisible anonymous identity that share links already use. Signing in only lets you sit at your tables from any device.
6. **No Supabase until a table is used.** Startup stays free of calls (ARCH-accounts §1). The live connection opens only while a table is on the board.
7. **Still a sandbox.** The pen holder can still move any card, as today. Hidden cards are hidden on screen, not secret: both browsers hold the full board (§8).
8. **YAGNI.** Reuse the session file, the device library, the revision check, the anonymous identity, `restoreTimeline()` and `_applySessionData()`. New code goes in one new file plus small hooks.

---

## 3. Big picture

```
 Seat P1 (browser)                                          Seat P2 (browser)
┌──────────────────────────┐                              ┌──────────────────────────┐
│ App (board, multiverse)  │                              │ App (board, multiverse)  │
│   │ hooks                │                              │   │ hooks                │
│ DojoTable  (table.js)    │                              │ DojoTable  (table.js)    │
│   pen · proposals ·      │                              │   pen · proposals ·      │
│   conflicts · pending    │                              │   conflicts · pending    │
│ DojoLibrary: device copy │                              │ DojoLibrary: device copy │
│ DojoCloud  (cloud.js)    │                              │ DojoCloud  (cloud.js)    │
└───┬──────────────┬───────┘                              └──────┬─────────────┬─────┘
    │ by turns     │ live (only while open)                       │ live        │ by turns
    │              └─────── Realtime channel table:<id> ──────────┘             │
    │                       presence · board · table                             │
    ▼                                                                            ▼
┌────────────────────────────── Supabase (same project) ──────────────────────────────┐
│ Postgres  tables row: seats, revision, turn_seat, summary, proposal  (RLS: seats)   │
│ Storage   tables/<id>.json.gz : the v2 session file  (private, seats only)          │
│ Realtime  private channel per table  (RLS on realtime.messages: seats only)         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- **The table file** is the source of truth: a normal v2 session file (board, multiverse, undo history, decks). By turns, it is all there is.
- **The table row** is small: who sits where, the file's revision, whose turn it is and any pending proposal. The Library reads rows (not files) to show *Your turn*.
- **The channel** carries the board while it changes, and tells the other seat when the file or row has moved. It holds nothing; losing it loses nothing.

---

## 4. The table

### 4.1 Seats
- A table has two seats, `seat0` (plays P1) and `seat1` (plays P2). Each holds the user id of the person sitting there, or nothing.
- **Creating a table** from the board: *Play with a friend*. You pick your side (default: P1, the *You* deck). The current session is copied into a **new** device session linked to the table, so the solo session stays as it was.
- **The link** is `?t=<code>` (10 characters, the share-link generator). Anyone who opens it while a seat is free can take that seat. Once both seats are taken, the link works only for the two players. The creator can free the other seat to invite someone else.
- **Same person, other device:** a seat belongs to an identity. Signed out, that's this browser. Signing in moves the anonymous identity into the account with `linkIdentity()` (the user id stays the same), so the seats come along and work on every device where you sign in.

### 4.2 The pen
- **You hold the pen when it's your seat's turn on the latest table file:** `state.activePlayer === mySeat` and your file's revision is the row's revision. Nothing else decides it, so Undo, mulligans and jumps move the pen by themselves:
  - *End turn* flips `activePlayer`, so the pen goes to the other seat.
  - Undo by the new holder right after *End turn* gives the turn (and the pen) back. That's how a turn is taken back: the other player presses Undo.
  - Turn 1's mulligan (Feature 54) belongs to the seat whose mulligan it is.
  - After a jump, the pen goes to whoever is active on that node.
- **Watching** (not holding the pen): the board is read-only. Previews, the card drawer, the log, Inspect discard, the Multiverse and the Library still work. Board actions, drags, hotkeys and the turn buttons don't.
- The pen is enforced in the browser, not in the database. Both seats may write the row and file (RLS lets seats only), and the revision check (§9) stops one write from silently undoing another. The players are friends practising; the board is fully visible to both anyway.

### 4.3 What belongs to the table, and what stays on your screen

| Shared (in the file, and live on the channel) | Yours only |
|---|---|
| The board (`state`), including turn notes, log, modifiers | Panels open, zoom, Tweaks, theme, palette |
| Multiverse nodes and "Left here" snapshots | The node selected in the Multiverse, the Mini Multiverse trail |
| Undo history (in the file only, not streamed) | Challenge mode, the card drawer, the hand you're stepping through |
| Decklists (`deck1`, `deck2`), title | Your device copy and its library entry |

---

## 5. By turns

1. **Create.** *Play with a friend* → pick your side and your name → the table row and file are written → a dialog with the link (*Copy link*, and *Share…* on phones through `navigator.share`).
2. **Join.** The friend opens `?t=<code>`. The app reads the invite (title, free seat, decks; no sign-in needed), asks *Join as P2 · Amber/Steel?* and their name, takes the seat (signing in anonymously behind the scenes), downloads the file and opens it as a device session linked to the table.
3. **Play.** The pen holder plays as in a solo session. Every change saves to the device as today, and the table file is written about 5 seconds after the last change, when the tab is hidden, and at once on *End turn* or any Multiverse change.
4. **End turn.** The file is written first (with the end-of-turn auto-save node, which is always on at a table), then the row's `turn_seat` flips. A toast says *Saved. Sam plays next* with *Copy link* / *Share…*, for sending a nudge in whatever chat the two use.
5. **Come back later.** Opening the app shows the table in *Pick up again* and in Library · Sessions with a badge: **Your turn** or **Sam's turn**. *Your turn* tables come first. The badges come from one read of the rows of the tables on this device, made only when there are any.
6. **Open.** Opening a table reads its row. If the row's revision is newer than the device copy, the file is downloaded and applied through `_applySessionData()` (so the §9.4 sanitising runs). A pending proposal shows as a banner (§7).
7. **Offline.** You can play your turn offline. The device copy is marked `table.dirty`; it is uploaded when the tab comes back online or the table is next opened. If the other seat wrote in between, §9 applies.

The device copy of a table is a normal library session with one extra field, `table: { id, seat, revision, dirty }`, the same way account copies carry `account: { revision, uid }`. Table copies are not synced to the account; the table is their cloud copy.

---

## 6. Live

Live is by turns plus a Realtime channel. It opens when a table is on the board and closes when it isn't.

- **Channel:** private Supabase Realtime channel `table:<id>`, joinable only by the two seats (§10.3).
- **Presence:** each tab tracks `{ seat, name }`. When both seats are present, the table is live. The table chip says so (§12).

| Message | Sent by | Payload | The other side |
|---|---|---|---|
| `board` | the pen holder, at most every 250 ms while the board changes | `{ rev, seq, state }`: the compressed state with its log | Drops it unless `rev` is its own and `seq` is newer. Sanitises it, replaces `state`, renders, saves to its device copy. |
| `table` | whoever just wrote the row or the file | `{ rev }` | Reads the row; downloads the file if `rev` moved; shows or clears the proposal |

- **Board changes are caught in `render()`**, by comparing the board's signature with the last one sent. `boardSig()` (Feature 53) already runs once per render, and this also catches Undo, which doesn't call `saveState()`.
- **End turn never goes as a `board` message.** The file goes first, then `table`. The other seat holds the pen only once it has that file, so it never plays on a board missing the new node or the undo history.
- **Someone arrives:** when presence shows the other seat joining, the pen holder writes the file if it has unsaved changes and sends `board`, so the newcomer is current within a second.
- **Someone leaves:** nothing changes but the chip. If it was your turn, keep playing; *End turn* goes by turns.
- **Size guard:** the demo's state is about 23 KB at turn 16, against a 256 KB message limit. Over 200 KB, the pen holder writes the file and sends `table` instead.
- **Tab title:** when the pen arrives while the tab is hidden, the title becomes *● Your turn · <title>* until the tab is seen.

---

## 7. Moving the table (proposals)

At a table, everything that would load a node or a snapshot (the Multiverse panel, the Mini Multiverse, its step keys, *Left here* snapshots) proposes instead.

- **The row holds one proposal:** `{ id, by: 0|1, target, auto: bool, name, at }`. Your latest pick replaces your own pending proposal, so stepping through the Mini Multiverse moves the proposal rather than piling them up (debounced ~400 ms).
- **The proposer** sees a banner: *Waiting for Sam to go to "Turn 6 – Amber (unfinished)"* with *Cancel*. If it's their turn they can keep playing; if the table moves, that board is kept as "Left here" (§9).
- **The other player** sees: *Sam wants to go to "Turn 6 – Amber (unfinished)"* with **Go there** and **Stay**.
  - **Go there** runs `restoreTimeline(target, auto, { agreed: true })` on that side, with its normal safety net, writes the file, clears the proposal and sends `table`. The proposer downloads it and lands there with the same time flash. Accepting is the one write a watching seat makes.
  - **Stay** clears the proposal and sends `table`. The proposer sees *Sam stayed here*.
- **Live,** both boards move within a second. **By turns,** the proposal waits in the row and the other player sees the banner when they next open the table.
- A proposal whose node has since been deleted shows as *That node is gone* and clears.
- **Exploring alone:** *Take a copy* makes a solo device session from the table to try things without moving it (the existing *Save as copy*).

---

## 8. Hands and hidden information

- **Your hand is face up for you. The other seat's hand is face down,** wherever it shows: the top hand, the bottom hand while watching, the phone hand tray and the card drawer's hand steps. The mulligan dialog shows only for the seat whose mulligan it is.
- **The view stays as it is today:** the active player is at the bottom. While watching, your own hand is the top one, shown face up. (Your own side at the bottom while watching is parked, §15.)
- **Looking is never secret.** The pen holder can still *Reveal* the other's hand or inspect their deck, as the sandbox allows, but at a table it is written to the log (and the hand reveal is on the board), so the other player sees *Sam is looking at your hand*.
- **Not cheat-proof, on purpose.** Both browsers hold the whole board, deck order included. Hiding it for real needs a server that deals cards, which this tool doesn't want (dev guide §5: the user is the referee).

---

## 9. Conflicts and the safety net

Both seats can write, so every write carries the revision it started from, as account saves do (`revisedWrite`, dev guide §23.3):

1. **Claim the row:** `update … set revision = N + 1 … where id = $id and revision = N`. No row back means a conflict.
2. **Upload** `tables/<id>.json.gz`. The file records `tableRevision: N + 1`.
3. **Tell the other side:** send `table { rev: N + 1 }`.

- **A reader whose file is older than the row** (the writer is mid-upload, or crashed between 1 and 2) waits for the `table` message or retries once after 2 s, then takes the file it has and uses the row's revision for its next write. At worst the crashed writer's last 5 seconds are lost.
- **On a conflict:** download the table, apply it, and keep your own board as a "Left here" snapshot (skipped when it's identical to a node or snapshot already there), then write again. The other player's move always wins the board, and yours is one click away in the Multiverse.
- **Incoming boards** (live `board`, a downloaded file) replace the board only after the same check: if the board on screen has changes that were never sent or saved, it becomes "Left here" first.
- **Two tabs of the same seat** behave like two writers: the revision check and the existing two-tab guard keep both boards.

---

## 10. Backend

One new migration, `supabase/migrations/<date>_tables.sql`, in the style of the shares and accounts migrations. Sketch:

### 10.1 Row
```sql
create table if not exists public.tables (
  id          text primary key check (id ~ '^[A-Za-z0-9]{10}$'),   -- the link code: ?t=<id>
  seat0       uuid references auth.users on delete set null,        -- plays P1
  seat1       uuid references auth.users on delete set null,        -- plays P2
  title       text not null check (char_length(title) between 1 and 120),
  revision    int not null default 1,
  turn_seat   smallint not null default 0 check (turn_seat in (0, 1)), -- activePlayer on the saved board
  summary     jsonb check (pg_column_size(summary) <= 4096),         -- inks, turn, lore: for list rows
  proposal    jsonb check (pg_column_size(proposal) <= 1024),        -- §7, null when none
  file_bytes  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.tables enable row level security;
```
- **RLS:** select and update only when `auth.uid() in (seat0, seat1)`. Insert only with yourself in one seat and the other empty. No direct delete.
- **Guard trigger** on update: seats can't change (only the functions below change them), `revision` only goes up by one, `updated_at = now()`.
- **Caps, failing closed** like the shares guard: 20 tables per identity, file ≤ 10 MB, and a storage ceiling for the `tables` bucket (Q3).
- Anonymous identities may create and join tables (unlike account rows, which need `is_real_user()`).

### 10.2 Functions (security definer)
| Function | Who | Does |
|---|---|---|
| `table_invite(id)` | anyone (publishable key) | `{ title, summary, free_seats }` or null. Never the seats' ids. |
| `join_table(id, seat)` | signed in (anonymous counts) | Takes the seat if it's free (`seat_taken` otherwise), checks the cap, returns the row |
| `leave_table(id)` | a seat | Frees your seat; deletes the row when both seats are empty |
| `free_seat(id, seat)` | the other seat | Frees a seat so the link can invite someone else |

The client removes the file before the last seat leaves (Storage objects can't be deleted from SQL).

### 10.3 Storage and Realtime
- **Bucket `tables`:** private, 10 MB, `application/gzip`, one object `<id>.json.gz` per table. Select / insert / update / delete policies: `exists (select 1 from public.tables t where t.id = split_part(storage.filename(name), '.', 1) and auth.uid() in (t.seat0, t.seat1))`.
- **Realtime:** private channels. Policies on `realtime.messages` for select (receive) and insert (send): `exists (select 1 from public.tables t where 'table:' || t.id = (select realtime.topic()) and (select auth.uid()) in (t.seat0, t.seat1))`.
- **(owner)** *Realtime Settings → Allow public access* off, so only private channels work. The app uses no other Realtime channel.

---

## 11. Code

### 11.1 Files
| File | Contents |
|---|---|
| `app/js/cloud.js` (`DojoCloud`) | The table transport: row, file, invite, join, leave, channel. Stays the only file that knows Supabase. |
| `app/js/table.js` (`DojoTable`, new) | The table rules: which table is on the board, my seat, revision, the pen, proposals, debounced writes, conflicts, the pending upload. Knows nothing about cards; talks to the App through the hooks it's given. |
| `app/js/library.js` (`DojoLibrary`) | The `table` field on a session row, kept like `account`. |
| `app/index.html` | Hooks (§11.3) and the UI (§12). |
| `app/css/field-unit.css` | Styles for the chip, banner, badges and the watching state. |

### 11.2 Contract (lets the database, the transport and the app be built in parallel)
```js
// DojoCloud — table transport. Errors carry e.code: conflict (with e.current), seat_taken,
// limit, storage_full, too_big, gone, offline, unavailable.
DojoCloud.createTable({ title, seat, file /* gz ArrayBuffer */, summary, turnSeat }) // → { id, revision }
DojoCloud.tableInvite(id)                          // → { title, summary, freeSeats } | null   (no sign-in)
DojoCloud.joinTable(id, seat)                      // → row
DojoCloud.getTables(ids)                           // → [row]   (Library badges: one request)
DojoCloud.downloadTable(id)                        // → ArrayBuffer
DojoCloud.saveTable(id, { revision, file, summary, turnSeat }) // → newRevision  (claim, then upload)
DojoCloud.setProposal(id, proposal | null)         // → row     (no revision bump)
DojoCloud.leaveTable(id) / DojoCloud.freeSeat(id, seat)
DojoCloud.tableChannel(id, { seat, name }, { onBoard, onTable, onPresence })
  // → { sendBoard({ rev, seq, state }), sendTable({ rev }), close() }

// DojoTable — the rules. The App gives it hooks; it calls back.
DojoTable.attach(link /* { id, seat, revision } */, hooks /* { snapshot, applyFile, applyBoard,
  keepLeftHere, restore, onChange } */)
DojoTable.detach()
DojoTable.boardChanged()      // from render(), when the signature moved
DojoTable.endTurn()           // write now, then flip
DojoTable.propose({ target, auto, name }) / DojoTable.answer(yes) / DojoTable.cancel()
DojoTable.state()             // → { seat, holdsPen, live, other: { name, here }, proposal, pending }
```

For tests, a **stand-in** with the same `DojoCloud` table functions keeps the row and file in the test runner and relays channel messages between two browser contexts (the accounts work used the same trick, dev guide §23.5).

### 11.3 Hooks in `app/index.html`
| Where | Hook |
|---|---|
| `init()` | `?t=` opens the join screen or the table, like `?s=` (`openShareFromUrl`) |
| `render()` | `DojoTable.boardChanged()` when holding the pen and `boardSig` moved; the hand rule (§8); the chip and banners |
| `endTurn()` / `_drawStepAndAutoSave()` | auto-save node always on at a table; then `DojoTable.endTurn()` |
| `restoreTimeline()` | at a table and without `opts.agreed`: `DojoTable.propose(…)` and return |
| `saveToDevice()` / `flushDeviceSave()` | a local change by the pen holder schedules the table write; changes applied from the table don't |
| Board input | one flag, `App.watching`: checked in drag start, the card menu (view items only), the hotkey handler and the turn buttons. `saveState()` warns and does nothing more if it's reached while watching |
| `_applySessionData()` | reused to apply a downloaded file; keeps the "Left here" rule (§9) |
| `syncMulliganMode()` | only the seat whose mulligan it is sees the dialog |
| `inspectDeck()`, `setHandReveal()` | at a table, looking at the other seat's cards is logged (§8) |
| Library and *Pick up again* | the table badge; opening a table row goes through `DojoTable.attach` |
| `sanitizeSessionData()` | also run on every live `board` message (wrapped as `{ currentState }`) |

---

## 12. UI

Field Unit tokens and components only (`docs/DESIGN-field-unit.md`). Mock-ups go through the screenshot tool (`--inject`) before building.

1. **Play with a friend:** next to *Share* in the top bar and in a session's ⋯ menu in the Library. Dialog: your side, your name, *Create table*. Then the link dialog.
2. **Join screen** for `?t=`: the title, both decks, the seat on offer, your name, **Join** / *Not now*. A full table says so and offers nothing else.
3. **Table chip** in the top bar beside the session title. It shows who's there and whose turn it is: *Waiting for a player* · *● Live with Sam · your turn* · *Sam is away · Sam's turn*. It opens the **table sheet**: the seats and who's here, the link, *Take a copy*, *Leave the table* (and *Free Sam's seat*).
4. **Watching strip** over the hand area when it isn't your turn: *Sam's turn* (live) or *Sam plays next. We'll keep the table until they're back* (by turns), with *Copy link*. The turn buttons are hidden.
5. **Proposal banner** across the top of the board (§7), built like the shared-link banner (`#shared-banner`).
6. **Badges** in *Pick up again* and Library · Sessions: **Your turn** (signal colour) or *Sam's turn*.
7. **Tab title** *● Your turn · <title>* (§6).

The manual gets articles for *Play with a friend*, *Live and by turns* and *Moving the table*, with targets for the chip, the sheet and the banner (`app/help/targets.json`, `node tools/help.mjs`). No tour in this plan.

---

## 13. Order of work

Milestones, so agents can work in parallel. Claim one in the TODO before starting it.

| Milestone | Delivers | Needs |
|---|---|---|
| **M0 · Review** (owner) | Answers to §16, the storage budget, Realtime public access off | — |
| **M1 · Database** | The migration (§10) and its tests on Postgres 16 with stand-in `auth`, `storage` and `realtime` schemas | M0 |
| **M2 · Contract and stand-in** | `DojoCloud` table function stubs (§11.2), the test stand-in, a two-context runner in `tools/app-checks.mjs` | M0 |
| **M3 · Tables by turns** (Feature 64, minor bump) | `table.js`, the library field, create / join / open / end turn / badges / leave / take a copy, the pen and the watching state, hands (§8), proposals stored in the row, conflicts, offline upload, manual articles, test protocol | M2 |
| **M4 · Real transport** | The `DojoCloud` table functions against Supabase; an end-to-end run on a preview with two browsers | M1, M2 |
| **M5 · Live tables** (Feature 65, minor bump) | The channel, presence and the chip, `board` streaming, instant proposals, the size guard, the tab title, manual update, test protocol | M3, M4 |

- M1 and M2 run at once. M3 starts on the stand-in and doesn't wait for M1.
- Each feature ships with its manual changes, `node tools/refresh-landing.mjs`, features.md and the TODO ticks, as AGENTS.md asks.
- By turns ships first because it's the foundation: live is the same table plus a channel.

---

## 14. Testing

- **SQL (M1):** a stranger can't read a table, its file or its channel; two people racing for one seat get one winner and `seat_taken`; a stale revision updates nothing; seats can't be changed by update; caps fail closed; the last seat out deletes the row.
- **App, headless (M2–M5):** two browser contexts against the stand-in, run by `tools/app-checks.mjs` in CI: create and join; play a turn and end it; the other side gets the pen, the node and the history; Undo after *End turn* gives the pen back; a proposal accepted and one refused; a conflict keeps "Left here"; the other's hand is face down on both widths; live board messages arrive and old ones are dropped; offline *End turn* uploads later.
- **By hand:** a test protocol per feature, on a phone and a desktop with real Supabase: live and by turns, switching between them mid-game, signing in on a second device keeps the seat.

---

## 15. Free-tier budget, and what we're not doing

**Budget** (Supabase Free plan, checked 2026-10-20 in the Realtime limits docs):
- **Realtime:** 200 concurrent connections (about 100 live tables), 100 messages a second for the project, 256 KB a message. A live table sends at most 4 `board` messages a second and usually about one. If tables get popular, this is the first limit to hit; tables keep working by turns.
- **Storage:** the demo's whole session (50 nodes, undo history) is 31 KB gzipped, so a table file is tens to hundreds of KB. The 1 GB is already spoken for twice: the `shares` bucket stops at 700 MB, and new account sessions stop once the whole project passes 900 MB. Tables need their own rule (Q3).

**Not doing until a trigger fires:**

| Idea | Trigger to revisit |
|---|---|
| Push or email notifications for *Your turn* | Players miss turns with the badge and the link nudge |
| Spectators, or more than two seats | Someone asks to watch a match or coach |
| Chat | Players can't talk elsewhere (they use Discord) |
| Your own side at the bottom while watching | Watching the other's turn upside down bothers players |
| Borrowing the pen during the other's turn | A card effect needs the waiting player to act and talking it through isn't enough |
| Taking back your own *End turn* without the other | The other pressing Undo isn't enough |
| Peeking at a node without moving the table | *Take a copy* isn't enough |
| Notes by the waiting player | Asked for |
| Real hidden information (a server that deals) | Tables are used for competitive play, not practice |
| Expiry and cleanup of old tables | The storage cap is reached |

---

## 16. Open questions

*Settled 2026-10-20: the owner asked for a working v4.0.0, so Q1–Q5 were built as recommended and Q6 became one release. They can still be revisited; each is a small change.*

| # | Question | Recommendation |
|---|---|---|
| Q1 | Live and by turns follow who's at the table, with no switch. Or do you want an explicit *Live / By turns* switch? | No switch. Both are the same table; a switch would only add a state that can disagree with reality. |
| Q2 | While watching, keep today's view (the active player at the bottom) or put your own side at the bottom? | Keep today's view for v1. Flipping touches most of the board code. |
| Q3 | How do tables share the 1 GB of Storage with shares and account sessions? | The account rule: no new tables once the project passes 900 MB, while existing tables keep saving, plus a 150 MB ceiling on the `tables` bucket. |
| Q4 | Can a player take back their own *End turn* alone, before the other has played? | Not in v1: the other presses Undo. |
| Q5 | Is "table" the right word in the app? | Yes: *Play with a friend*, *the table*, *Leave the table*. |
| Q6 | Ship by turns (Feature 64) before live (Feature 65), or both in one release? | ~~Two releases~~ **One: v4.0.0** (owner, 2026-10-20). |

---

## 17. Decision log

| # | Decision | Date |
|---|---|---|
| D1 | A table is a v2 session file in a private bucket plus a small row; live is a Realtime channel on top | 2026-10-20 |
| D2 | One writer at a time: the seat whose turn it is. Enforced in the browser; the database enforces seats and revisions | 2026-10-20 |
| D3 | Loading a node or snapshot at a table is a proposal the other seat accepts | 2026-10-20 |
| D4 | A replaced board with unsaved changes is always kept as "Left here" | 2026-10-20 |
| D5 | Anonymous identities can create and join tables; signing in carries the seats to every device | 2026-10-20 |
| D6 | Hands are hidden on screen, not secret; looking at the other's cards is logged | 2026-10-20 |
| D7 | *Play with a friend* makes a new device session for the table; the solo session is untouched | 2026-10-20 |
| D8 | No live / by-turns switch (Q1); today's view while watching (Q2); tables stop being created past 900 MB of project Storage or 150 MB in their bucket (Q3); the other player's Undo takes back an *End turn* (Q4); "table" (Q5) | 2026-10-20 |
| D9 | Features 64 and 65 ship together as v4.0.0 (Q6) | 2026-10-20 |

---

## 18. As built (v4.0.0)

What differs from, or adds to, the plan above. The working detail is in the dev guide §28.

- **Contract.** `DojoTable.attach(link, hooks, sessionId)`; the hooks are `activePlayer`, `snapshot`, `boardState`, `applyFile`, `applyBoard`, `restore`, `saveLink`, `changed`, `gone` and `notify`. `DojoCloud.createTable` also takes the creator's `name`; `joinTable(id, seat, name)`. `DojoTable.info()` is what the chip, banner and sheet read.
- **Row.** The row also holds the players' names (`name0`, `name1`, ≤ 40 characters), so the Library and the join screen can say *Sam's turn* without downloading. `table_invite()` returns `{ title, summary, names, free_seats, mine }`; `mine` lets a signed-in player who already sits at the table reopen it on another device.
- **The pen waits for the first read.** Until the row has answered once, a table's board may be an older copy, so nobody holds the pen (the chip says *Catching up…*). An offline failure counts as an answer: a turn can be played offline and is sent later.
- **Live boards** are sent only by the pen holder and accepted only from the other seat on its own turn, at the receiver's revision, and never while the receiver is uploading (§6 as written let a late board from the old holder undo a turn).
- **The file** carries `tableRevision` and `board: { from, seq }` (the last live board sent before it), so a reader can tell a lagging file and put a newer live board back on top.
- **Left at a free seat.** Moving the table needs no answer while the other seat is empty. If the turn passes to an empty seat, the table waits for whoever joins; the banner says so and offers the link and *Take a copy*.
- **Not built (still §15):** the waiting player's own side at the bottom, borrowing the pen, notifications, spectators. The draw-odds pane follows the active player's deck, as solo.
- **Fresh downloads.** Supabase Storage answered a download of an overwritten file from a cache (found against the real project: three overwrites later `download()` still returned the first). `DojoCloud` reads private files through `downloadFresh()`: the authenticated endpoint with a new query string each time and `cache: 'no-store'`. Account sessions use it too.
- **Tests.** `tools/table-checks.mjs` (58 checks, two browsers plus a stranger; in CI through `tools/app-checks.mjs` against a stand-in backend with the SQL's rules) and `supabase/tests/run.sh` (the migration, twice, and its tests on Postgres 16). `node tools/table-checks.mjs --live` runs the same 58 against the real project: 58/58 on 2026-10-20, after the migration was run by hand.
