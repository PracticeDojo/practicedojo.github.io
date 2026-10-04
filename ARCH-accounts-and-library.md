# ARCH: Deck & Session Library, Share Links, Optional Accounts

> **Status:** DRAFT v0.2 for discussion. Nothing here is implemented yet.
> **Scope:** Practice Dojo (`practice_dojo/practice_dojo.html`), designed to move with the app to
> `PracticeDojo/practicedojo.github.io`.
> Questions that are still open are marked **❓** and collected in [§14](#14-open-questions).

### What changed since v0.1
- **No feature walls.** Every feature works signed out: playing, Duels.ink imports, the deck library, the session library, default decks, and creating and opening share links. Signing in only adds *"keep my decks and sessions in my account so I can get them on any device."*
- **Default decks live in the repo** (`defaults/decks/`). Anyone loads them with no login and no Supabase call.
- **Demos move to the repo too** (gzipped), so there are no admin roles and no "featured" flags in the database.
- **Share links added.** Deck links need no backend. Session links use a public `shares` bucket.
- **Simpler sync.** No outbox, tombstones, or background sync engine. Saving to the account is explicit and uses a revision check.
- **Dropped:** `profiles` table, admin role, legacy deck import, `is_public`/`is_featured` on sessions, deck to session foreign keys.
- **Code split allowed** (YAGNI): new concerns get their own small script file, and existing code is not refactored for its own sake.
- **Recommended order changed:** move the repo **first**, then build (§12).

---

## 1. Principles

1. **Everything works without an account.** Login is a convenience layer and never a gate. If Supabase is down or paused, the only things that stop working are *my account* items and share links.
2. **The device is the first home.** Every deck and session a user creates is saved on their device (IndexedDB), whether or not they are signed in.
3. **No Supabase calls at startup when signed out.** Today the Dojo fetches every deck and demo from Supabase on load. After this change a signed-out visit touches only GitHub Pages, plus the card DB as today.
4. **YAGNI.** Every table, column, and module below has a feature that needs it now. Anything speculative goes into §13.

---

## 2. Where we are today

| Concern | Today |
|---|---|
| Decks | Global `decks` table in the shared heavenideas Supabase project. The Dojo reads every row at startup. |
| Cloud sessions / demos | Global `dojo_sessions` table (`session_data jsonb`), shown as "Cloud demos" |
| Local session | One slot: `localStorage['lorcana_dojo_session']` (the "Continue" card) |
| Card DB cache | IndexedDB `lorcana_dojo_cache` |
| Session file | `{version:1, currentState, bookmarks, autoSaves, history, deck1, deck2}` |

### 2.1 About session size (clarifying v0.1)

You're right: **saving to the cloud works.** `dojo_sessions` stores and restores large sessions fine. The problem is narrower and sits in the **local** slot:

- **Tested:** in headless Chromium, writing `multiverse_session_example_02.json` (13.2 M characters) to the local Continue slot with the same keys `saveToLocalStorage()` uses fails with **`QuotaExceededError`**. Browsers cap localStorage at about 5 M characters per site.
- `saveToLocalStorage()` catches that error and only logs `console.warn`. A big multiverse gets no "Continue" card on reload, and the user isn't told.
- This matters more now, because signed-out users will rely on device storage entirely. **IndexedDB** has no 5 MB cap (browsers allow hundreds of MB), so it fixes this.

For the cloud I still recommend **gzip + Supabase Storage** over `jsonb` rows. The new project's 500 MB database is shared by every user, and gzip shrinks these files about 63× (13 MB → 210 KB, 77 MB → 1.2 MB), while Postgres compresses `jsonb` far less. To check what your current demos actually cost in the database, run this in the old project's SQL editor:
```sql
select name, pg_size_pretty(pg_column_size(session_data)::bigint) as stored
from dojo_sessions order by pg_column_size(session_data) desc;
```
Writing a gzipped blob is a few lines with the browser-native `CompressionStream`, so this costs almost nothing in complexity.

---

## 3. Big picture

```
                         ┌──────────── GitHub Pages (static, same origin) ────────────┐
                         │  app (html + js)   defaults/decks/*.txt   defaults/demos/*.gz│
                         └───────────────────────────┬─────────────────────────────────┘
                                                     │ fetch (no auth)
┌──────────────────────────── Browser ───────────────┴──────────────────────────────────┐
│  Home screen / Board                                                                   │
│        │                                                                               │
│        ▼                                                                               │
│  DojoLibrary ── Defaults (read-only, from repo)                                        │
│        │      ── Device  (IndexedDB: my decks, my sessions)        ← always            │
│        │      ── Account (Supabase: my decks, my sessions)          ← only if signed in│
│        │                                                                               │
│  DojoShare ─── deck links: #deck=… in the URL (no backend)                             │
│            └── session links: ?share=… → Supabase `shares` (public read)               │
└────────────────────────────────────────────────┬───────────────────────────────────────┘
                                                 │ only for: sign-in, account items, session shares
                                                 ▼
                    ┌──────────── Supabase (new free project) ────────────┐
                    │ Auth: Discord, Google (+ invisible anonymous, §9.3) │
                    │ Postgres: decks, sessions, shares   (RLS)           │
                    │ Storage: `sessions` (private), `shares` (public)    │
                    └─────────────────────────────────────────────────────┘
```

| Feature | Signed out | Signed in | Needs Supabase? |
|---|---|---|---|
| Play, multiverse, every board feature | ✅ | ✅ | No |
| Duels.ink log / replay import | ✅ | ✅ | No |
| Default decks and demo sessions | ✅ | ✅ | No (repo) |
| My decks and my sessions on this device | ✅ | ✅ | No |
| Export / import `.json` files | ✅ | ✅ | No |
| Share a deck link | ✅ | ✅ | No |
| Share a session link (create / open) | ✅ / ✅ | ✅ / ✅ | Yes |
| My decks and sessions **on every device** | — | ✅ | Yes |

---

## 4. Default content in the repo

### 4.1 Layout
```
defaults/
  decks/
    manifest.json
    set-10/amber-steel-songs.txt
    set-10/ruby-sapphire-tempo.txt
    set-9/…
  demos/
    manifest.json
    t8-amber-steel-vs-ruby-sapphire.dojo.json.gz
```
(Until the move this is `practice_dojo/defaults/`. After it, `/app/defaults/` or `/defaults/`.)

### 4.2 Deck files
Plain decklist text, exactly what you'd paste into the Dojo today:
```
4 Tinker Bell - Giant Fairy
4 Maui - Hero to All
…
```

### 4.3 `defaults/decks/manifest.json`
```jsonc
{
  "groups": [
    {
      "title": "Set 10",
      "decks": [
        { "id": "s10-amber-steel-songs", "name": "Amber/Steel Songs",
          "file": "set-10/amber-steel-songs.txt", "notes": "Optional one-liner shown on hover" }
      ]
    },
    { "title": "Set 9", "decks": [ … ] }
  ]
}
```
- `id` is a stable string you choose. If you edit the list, the id stays the same, so a user's "last used P2 deck" keeps pointing at it.
- Ink pips and card counts are **computed in the app** from the decklist and card DB, not written by hand.
- Groups display in manifest order (newest set first). To retire a set, delete its group.
- A deck line that doesn't resolve shows a ⚠ badge, using the same validation `checkDeckInput()` does today, so typos are visible.

**Updating defaults:** add or edit a `.txt`, add a line to the manifest, and commit. GitHub Pages serves it within about 10 minutes. There's no database step.

### 4.4 Demos
The same idea for sessions. `defaults/demos/manifest.json` lists `{ id, title, file, summary }`, and files are gzipped v2 sessions (§6). The current `dojo_sessions` demos get exported once (load, then *Export*) and committed. **Opening a demo creates a device copy**, so the original never changes.

---

## 5. Device library (IndexedDB)

One IndexedDB database `practice_dojo` (the existing `lorcana_dojo_cache` card cache stays as it is):

| Store | Key | Value |
|---|---|---|
| `decks` | `id` (uuid) | `{ id, name, decklist, notes, createdAt, updatedAt, account?: { revision } }` |
| `sessions` | `id` (uuid) | `{ id, title, summary, createdAt, updatedAt, lastOpenedAt, account?: { revision } }` |
| `session_blobs` | `id` | gzipped v2 session `Blob` |
| `kv` | key | small prefs, e.g. `lastSessionId`, `lastDecks: {p1, p2}` |

- **Continue card** = the session with `lastSessionId`. This replaces the single localStorage slot.
- **One-time migration:** if `localStorage['lorcana_dojo_session']` exists, import it as a session and remove the key.
- **Autosave** (unchanged behavior, new target): every state change, debounced about 1 s, rewrites that session's blob in IndexedDB.
- **Storage persistence:** call `navigator.storage.persist()` once the user saves something, so the browser is less likely to evict the library.

---

## 6. Session file format (v2)

```jsonc
{
  "format": "practice-dojo-session",
  "version": 2,
  "app": "v2.19.0",
  "id": "uuid",
  "title": "Amber/Steel vs Ruby/Sapphire — T8 study",
  "savedAt": 1759600000000,
  "summary": { "inks": [["Amber","Steel"],["Ruby","Sapphire"]], "turn": 8, "lore": [12, 9], "nodes": 11, "lines": 2 },
  "data": { "currentState": {…}, "bookmarks": […], "autoSaves": […], "history": […], "deck1": "…", "deck2": "…" }
}
```
- `data` is the v1 payload, **unchanged**. *Refactor 1* can slim it later as `version: 3`.
- Stored and exported gzipped (`.dojo.json.gz`). Import accepts gzipped v2, plain v2, and plain v1 (every existing export keeps working).
- `summary` comes from the existing `buildSessionSummary()`.

---

## 7. Home screen (replaces `#setup-modal`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◆ Practice Dojo  v2.19.0                                [ Sign in ▾ ]    │
│                         Sign in to keep your decks & sessions everywhere │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌ Continue ───────────────────────────────────────────────────────────┐  │
│ │ ●● Amber/Steel vs ●● Ruby/Sapphire · Turn 8 · 11 nodes · 2h ago      │  │
│ │                                                   [ Resume match ]  │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│  [ New match ]   [ My sessions ]   [ Decks ]   [ Demos ]                 │
│ ──────────────────────────────────────────────────────────────────────── │
│  NEW MATCH                                                               │
│  ┌ Player 1 · You ──────────────────┐ ┌ Player 2 · Opponent ─────────┐   │
│  │ [ Choose deck ▾ ]  [ Paste ]      │ │ [ Choose deck ▾ ]  [ Paste ] │   │
│  │   My decks                        │ │                              │   │
│  │   Defaults › Set 10 › …           │ │                              │   │
│  │ ●● Amber/Steel Songs · 60         │ │ ●● Ruby/Sapphire Tempo · 60  │   │
│  └───────────────────────────────────┘ └──────────────────────────────┘   │
│                                                      [ Start match → ]   │
│  Open: [ .json / .gz file ]  [ Duels.ink log / replay ]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Decks tab:** two sections, **My decks** and **Default decks**, both treated the same everywhere (pick for P1 or P2, view, share link). Default decks are read-only. *Edit* on a default makes a copy in My decks. **Import deck** accepts paste, a `.txt` file, a deck link, or "my list from a Duels.ink replay" (the replay's exact `decklist`). A pasted list at New match gets a *Save to My decks* checkbox.
- **My sessions tab:** a list with ink pips, title, turn, lore, nodes, and updated time. Actions: Open, Rename, Duplicate, Export, Share link, Delete. Signed in, each row shows *This device*, *Account*, or both, with *Save to account* / *Download* buttons for the missing side.
- **Demos tab:** from `defaults/demos/`.
- **Duels.ink import:** unchanged parser. The result becomes a new device session automatically.
- **In-game:** the topbar shows an editable session title, plus **Save** (device and, if signed in, account), **Save as copy**, and **Share**.

---

## 8. Account (optional, Discord + Google)

### 8.1 Behavior
- *Sign in* → Discord or Google (PKCE redirect back to the page). Nothing else on screen changes, except that lists gain account items and the *Account* badges.
- **First sign-in on a device that has local items:** "Save 4 decks and 3 sessions from this device to your account?" with *All*, *Choose…*, or *Not now*.
- **Saving while signed in:** device always. The account copy is updated on **Save**, and when the tab is hidden while the session has unsaved changes. Autosave never uploads on every click, which keeps egress tiny.
- **Opening an account session on a new device** downloads it once into the device library.
- **Conflict** (the same session was saved from two devices): the upload sends `revision = N`. If the account already has a newer revision, the app asks *Overwrite* or *Save mine as a copy*. There is no merging.
- **Delete** asks *This device*, *Account*, or *Both*.
- **Sign out** asks whether to keep the downloaded account copies on this device (relevant on shared computers).

That's the entire "sync". There's no background engine, outbox, or tombstones. If it later proves too manual, §13 has the upgrade path.

### 8.2 Tables (migration `supabase/migrations/0001_init.sql`)

```sql
-- My decks
create table public.decks (
  id          uuid primary key,                         -- client-generated, same id on device and account
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  decklist    text not null check (char_length(decklist) <= 8000),
  notes       text check (char_length(notes) <= 4000),
  revision    integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- My sessions (metadata; payload in Storage bucket `sessions`)
create table public.sessions (
  id          uuid primary key,
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  summary     jsonb not null default '{}',
  blob_bytes  integer not null,
  revision    integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- blob path is derived, not stored: sessions/{owner_id}/{id}.json.gz

create index on public.decks    (owner_id, updated_at desc);
create index on public.sessions (owner_id, updated_at desc);
```

### 8.3 Access rules (RLS)

Anonymous users (§9.3) are signed in from Postgres's point of view, so account tables must **exclude** them explicitly:

```sql
create function public.is_real_user() returns boolean language sql stable as $$
  select auth.uid() is not null and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
$$;

alter table public.decks    enable row level security;
alter table public.sessions enable row level security;

create policy decks_owner    on public.decks    for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.is_real_user());
create policy sessions_owner on public.sessions for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.is_real_user());

-- Storage: private bucket `sessions`, 10 MB file limit
create policy sessions_blobs on storage.objects for all
  using      (bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_real_user());
```

**Revision check:** the client updates with `.update({..., revision: N+1}).eq('id', id).eq('revision', N)`. If zero rows come back, that's a conflict.

### 8.4 Quotas
A `before insert` trigger caps each account at **200 decks** and **50 sessions** (defaults, easy to change). The account menu shows usage. The device library has no cap.

---

## 9. Share links

### 9.1 Deck links: no backend
`https://practicedojo.github.io/app/#deck=<base64url(deflate-raw(decklist))>&name=<…>`
- A 60-card list compresses to a few hundred characters, which is fine for chat apps.
- It lives in the URL fragment, so it never hits a server, works forever, and costs nothing.
- Opening the link shows the deck with *Play as P1*, *Play as P2*, and *Save to My decks*.

### 9.2 Session links
`https://practicedojo.github.io/app/?share=<slug>` (slug = 10 random base62 characters)

- **Creating** uploads an **immutable snapshot** (gzipped v2) to the public bucket `shares` and inserts a `shares` row. Later edits to your session don't change the link. Share again to get a new one.
- **Opening** works for anyone with no sign-in. It loads straight onto the board with a banner reading *"Shared session · Save a copy"*. Any change the viewer makes lives in their own device copy.

```sql
create table public.shares (
  id          text primary key,                       -- slug
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  summary     jsonb not null default '{}',
  blob_bytes  integer not null,
  created_at  timestamptz not null default now()
);
alter table public.shares enable row level security;

-- Anyone signed in (incl. invisible anonymous) can create/delete their own shares; no updates (immutable).
create policy shares_insert on public.shares for insert with check (owner_id = auth.uid());
create policy shares_delete on public.shares for delete using (owner_id = auth.uid());
create policy shares_own    on public.shares for select using (owner_id = auth.uid());

-- Public read by slug only (no listing/enumeration of everyone's shares):
create function public.get_share(slug text) returns public.shares
language sql stable security definer set search_path = public as $$
  select * from public.shares where id = slug
$$;
grant execute on function public.get_share(text) to anon, authenticated;

-- Storage: public bucket `shares` (10 MB limit), objects at shares/{owner_id}/{slug}.json.gz
create policy shares_blobs_write on storage.objects for insert
  with check (bucket_id = 'shares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy shares_blobs_delete on storage.objects for delete
  using (bucket_id = 'shares' and (storage.foldername(name))[1] = auth.uid()::text);
```
A public bucket serves files by URL without auth, but nobody can list its contents, and the paths are unguessable.

### 9.3 Sharing without an account: invisible anonymous identity ❓
To keep *"create a session link"* free of any login, the first time a signed-out user clicks **Share**, the app silently calls `supabase.auth.signInAnonymously()`. The user sees no login UI. This gives them:
- an owner id, so RLS works and they can **delete their own links** later from the same browser ("My shared links" under *Share*);
- per-identity rate limits (below).

If that user later signs in with Discord or Google, `linkIdentity()` upgrades the anonymous identity, so their links stay theirs. This needs *Manual linking* enabled in Auth settings. If that Discord or Google account already exists, linking fails, and the links stay with the anonymous identity in that browser. That's acceptable for an edge case.

**Abuse protection** (public writes on a free project):
- Per-identity cap: **20 shares per day and 100 in total** (insert trigger), plus the 10 MB bucket limit.
- Supabase rate-limits anonymous sign-ins per IP (about 30 per hour by default).
- **Cloudflare Turnstile** (free, usually invisible) on anonymous sign-in. Supabase supports it natively. ❓ Turn on from day one, or only if abuse shows up?

---

## 10. Free-tier budget (new project)

| Resource | Free limit (verify on the pricing page) | Main consumer | Headroom |
|---|---|---|---|
| Postgres | 500 MB | Rows of about 1–2 KB | Hundreds of thousands of rows |
| Storage | 1 GB | Session and share blobs (about 200 KB typical) | About 5,000 blobs, so quotas matter |
| Egress | 5 GB / month | Opening account sessions and share links | About 25,000 opens of 200 KB per month |
| Auth MAU | 50,000 | Real and anonymous users | Plenty |
| **Pause** | After 7 days with no API activity | — | Only account items and session links are affected. Everything else is static. ❓ Weekly keep-alive (§14). |

Defaults, demos, deck links, and everything signed-out cost **zero** Supabase resources.

---

## 11. Code structure (YAGNI split)

| File | Contents | Phase |
|---|---|---|
| `app/index.html` | Today's `practice_dojo.html`. Its storage calls (`saveToLocalStorage`, `loadFromLocalStorage`, `exportTimelines`, `importTimelines`, `saveSessionToCloud`, `fetchDecksFromDatabase`, `fetchSessionsFromDatabase`, `loadExampleSession`) become thin calls into the modules below. **The rest is untouched.** | 1 |
| `app/js/library.js` | `DojoLibrary`: IndexedDB stores, defaults loader, v2 codec (gzip), deck-link encode/decode | 1 |
| `app/js/cloud.js` | `DojoCloud`: Supabase client, sign-in and out, account save and load, session shares, anonymous identity | 2–3 |
| `supabase/migrations/*.sql` | The SQL above, versioned | 2 |

- These are classic `<script src>` files exposing one global each, matching the current `App` style. **No build step, no bundler, no framework.**
- `cloud.js` is the only file that knows Supabase exists. The supabase-js CDN script is pinned to an exact version.
- **Splitting rule:** a new concern gets a new file when it has its own reason to change. Existing code is extracted only when a feature needs to change it substantially anyway. `AGENTS.md` and the dev guide get updated to replace the "never leave single-file" rule with this one.

---

## 12. Order of work and the repo move

**Recommendation: move the repo first, then build.**
Device storage (IndexedDB and localStorage) belongs to the site address. If we build device libraries on `heavenideas.github.io` and move later, every signed-out user's library is stranded on the old address. If we move first, today's users only lose the single *Continue* slot, and they can export it on the old site before switching. ❓

| Phase | Delivers | Supabase? |
|---|---|---|
| **0. Move** | New repo layout (`/` landing, `/app/` Dojo), old URL becomes a "we moved" page with an *Export my session* button. Large artifacts (`multiverse_examples/`, `_bundle/`) stay behind. | No |
| **1. Library** | `library.js`, IndexedDB library, `defaults/decks` and `defaults/demos`, new home screen, v2 gzip format, deck links, localStorage migration. **All feature work is done here, with no account.** | No |
| **2. Session links** | New Supabase project, `shares`, anonymous identity, Share button, `?share=` opening | Yes |
| **3. Accounts** | Discord and Google sign-in, `decks` and `sessions` tables, Save to account, first-sign-in upload, quotas | Yes |

Phases 2 and 3 can swap order if you'd rather have accounts first.

**Supabase setup checklist (Phase 2):** new project → run migrations → create buckets `sessions` (private) and `shares` (public), both with a 10 MB limit and `application/gzip` → Auth: enable Anonymous, Manual linking, Discord, and Google → URL config: Site URL `https://practicedojo.github.io`, redirects `https://practicedojo.github.io/**` and `http://localhost:*/**` → (Turnstile if chosen) → paste the project URL and anon key into `cloud.js`.

---

## 13. Deliberately not doing (until needed)

| Idea | Trigger to revisit |
|---|---|
| Background auto-sync between devices | Users complain about pressing Save / Download |
| Share-link expiry and cleanup job | Storage passes about 50% of 1 GB |
| Slimmer session format (*Refactor 1*) | Blobs regularly over about 2 MB gzipped |
| Public deck or session browsing / gallery | Real demand. The `shares` table could later grow an opt-in `listed` flag. |
| Playback mode (auto-step through nodes) | Not requested: replay = reopen and navigate |
| Keeping the raw Duels.ink file with the session | The importer changes and re-import becomes valuable |
| Profiles and display names | Something shows another user's name |

---

## 14. Open questions

| # | Question | Default if unanswered |
|---|---|---|
| **Q1** | To create a **session** link while signed out, is an invisible anonymous Supabase identity OK (§9.3)? The alternative is that session links need sign-in, which would conflict with "no walls". | **Yes, anonymous identity** |
| **Q2** | Turnstile captcha on anonymous sign-in from day one, or only if abused? | **From day one** (free, mostly invisible) |
| **Q3** | Move the repo **before** building (Phase 0 first)? | **Yes** |
| **Q4** | Demos: move the current cloud demos into `defaults/demos/` as gzipped files? | **Yes** |
| **Q5** | Do share links live forever, or should anonymous shares expire (for example after a year)? | **Forever for now** (see §13) |
| **Q6** | Free projects pause after 7 days without traffic, which would break session links. Add a weekly GitHub Actions ping to keep it awake? | **Yes, once Phase 2 ships** |
| **Q7** | Who besides you edits `defaults/`? If collaborators will, we can add a tiny check (GitHub Action) that every default deck resolves to 60 known cards. | **Just you, no check yet** |
