# TEST PROTOCOL — Practice Dojo v2.21.0

Scope: **Feature 40 · Share links**. Needs the live Supabase project (migration
`20261004120000_shares.sql` applied, anonymous sign-ins on). Use two browsers, or one normal window
and one private window: **A** shares, **B** opens.

---

## A — Creating links

| # | Step | Expected |
|---|------|----------|
| A.1 | A: fresh load, DevTools → Network | No request to `supabase.co` and no supabase-js download at startup |
| A.2 | A: Library → Decks → share icon on a default deck | Dialog "Link ready" with `…/app/?s=XXXXXXXXXX` (10 letters/digits) selected; supabase-js loads now (once) |
| A.3 | **Copy link** | Toast "Link copied"; the clipboard holds the link |
| A.4 | A: start a match, play a little, topbar **share** icon | A session link |
| A.5 | A: Library → Sessions → share icon on another session | A session link for that one |
| A.6 | A: Library → **Shared** | All three, newest first, kind, time, size for sessions |

## B — Opening links (signed out, empty library)

| # | Step | Expected |
|---|------|----------|
| B.1 | B: open the deck link | Home screen; the list is in the field; readout **SHARED DECK** with the deck's name; the address bar drops `?s=` |
| B.2 | *Play it as you* / *Save to My decks* | Seat / save as usual (save suggests the shared name) |
| B.3 | B: open a session link | Board loads; banner "Shared · <title> · not saved yet · Save a copy"; nothing new in B's Library |
| B.4 | B: play some moves, reload | The shared link opens again from scratch (nothing was saved) |
| B.5 | B: **Save a copy** (or topbar Save) | Banner goes; toast "Saved a copy…"; it's in B's Library; the address bar drops `?s=` |
| B.6 | B: open `…/app/?s=ZZZZZZZZZZ` | "This share is no longer available" then the home screen |
| B.7 | B: open `…/app/?s=abc` | "That share link isn't complete" |
| B.8 | A shared session whose node names contain `<img src=x onerror=alert(1)>` | No alert in B (§9.4) |

## C — Deleting and limits

| # | Step | Expected |
|---|------|----------|
| C.1 | A: Library → Shared → delete a link → confirm | Gone from the list; B opening it gets "no longer available" |
| C.2 | A: share a 21st link within 24 hours | "You've reached the sharing limit: 20 links a day and 100 in total…" |
| C.3 | Offline (DevTools → Offline): Share | "Couldn't reach the sharing service…" Nothing else breaks |

## D — Keep-alive

| # | Step | Expected |
|---|------|----------|
| D.1 | GitHub → Actions → *Supabase keep-alive* → **Run workflow** | Green; the log prints a JSON row of nulls |
