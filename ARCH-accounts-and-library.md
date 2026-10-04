# ARCH: Deck & Session Library, Share Links, Optional Accounts

> **Status:** v0.3. Design agreed and ready to break into features. Nothing here is implemented yet.
> **Scope:** Practice Dojo (`practice_dojo/practice_dojo.html`), designed to move with the app to
> `PracticeDojo/practicedojo.github.io`.
> The decision log is in [§14](#14-decision-log). There are no open questions; next step is Phase 0 (§12.1).

### What changed since v0.2
- **Anonymous identity for session links: accepted**, with the security analysis and hardening in §9.3–§9.4.
- **New must-fix (§9.4):** session files can inject HTML or script through bookmark names and comments. This has to be fixed **before** share links exist, so it moves into Phase 1.
- **No captcha.** Abuse is bounded by server-side caps that fail closed (sharing pauses, nothing else breaks).
- **Shares are count-limited, not time-limited.** No expiry job.
- **Demos start fresh.** §4.4 explains how to make your own.
- **Weekly keep-alive** GitHub Action added (§10.1).
- **Repo move first:** Phase 0 is now spelled out step by step (§12.1).
- **No default-deck validation check** for now.
- **All share links are short** (`?s=<slug>`), decks included. A deck's list is stored in the share row, and a session's file in Storage (§9.1). This replaces v0.2's URL-packed deck links.

### What changed in v0.2 (since v0.1)
- **No feature walls.** Every feature works signed out: playing, Duels.ink imports, the deck library, the session library, default decks, and creating and opening share links. Signing in only adds *"keep my decks and sessions in my account so I can get them on any device."*
- **Default decks live in the repo** (`defaults/decks/`). Anyone loads them with no login and no Supabase call.
- **Demos move to the repo too** (gzipped), so there are no admin roles and no "featured" flags in the database.
- **Share links added.** Deck links need no backend. Session links use a public `shares` bucket. *(Superseded in v0.3: all links are short.)*
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
│  DojoCloud ─── share links (decks + sessions): ?s=<slug> → Supabase `shares`           │
│            └── sign-in + my account items (optional)                                   │
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
| Share a deck or session link (create / open) | ✅ / ✅ | ✅ / ✅ | Yes |
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
The same idea for sessions. `defaults/demos/manifest.json` lists `{ id, title, file }`, and the Dojo computes each demo's summary when it loads the file. **Opening a demo creates a device copy**, so the original never changes. We start fresh: the old `dojo_sessions` demos are not carried over.

```jsonc
{ "demos": [
  { "id": "t8-amber-steel-vs-ruby-sapphire", "title": "Amber/Steel vs Ruby/Sapphire — turn 8 study",
    "file": "t8-amber-steel-vs-ruby-sapphire.dojo.json.gz" }
] }
```

**How to make a demo (you can start today):**
1. Play a session in the Dojo, or import a Duels.ink log or replay, and build the multiverse you want to show.
2. Open the Timelines drawer and click **Export** (the icon next to *Import*).
   - *Today* this downloads `lorcana-session-<timestamp>.json` (format v1).
   - *After Phase 1* it downloads `<title>.dojo.json.gz` (format v2, already gzipped).
3. Keep the file. Once `defaults/demos/` exists, drop it in, give it a readable name, and add one line to the manifest.

v1 `.json` files are accepted as-is, because the importer reads v1 and v2, gzipped or plain. Gzipping is optional but makes them about 60× smaller. On a Mac or Linux, `gzip -k my-session.json` produces `my-session.json.gz`; on Windows, 7-Zip → *Add to archive* → format *gzip*. Point the manifest's `file` at whichever file you commit.

Tip: before exporting a demo, delete autosaves and dead-end branches you don't want people to see. They're part of the file and make it bigger.

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

- **Decks tab:** two sections, **My decks** and **Default decks**, both treated the same everywhere (pick for P1 or P2, view, share link). Default decks are read-only. *Edit* on a default makes a copy in My decks. **Import deck** accepts paste, a `.txt` file, or "my list from a Duels.ink replay" (the replay's exact `decklist`). A pasted list at New match gets a *Save to My decks* checkbox.
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

## 9. Share links (short links for decks and sessions)

### 9.1 How they work
Every share link is short and has the same shape:

```
https://practicedojo.github.io/app/?s=k3J9xQ2mPa
```

`k3J9xQ2mPa` is a random 10-character code (a *slug*). The link carries nothing else. The Dojo looks the code up in Supabase and loads what it points to.

| Kind | Where the content lives | What opening the link does |
|---|---|---|
| **Deck** | The decklist text sits **inside the `shares` row** (a few KB at most) | Shows the deck with *Play as P1*, *Play as P2*, and *Save to My decks* |
| **Session** | The gzipped session file sits in the public Storage bucket `shares`. The row holds the title, summary, and size. | Loads straight onto the board with a banner: *"Shared session · Save a copy"* |

- **Anyone can open a link** without signing in.
- **A share is a frozen snapshot.** Later edits to your deck or session don't change the link. Share again to get a new one.
- Whatever the viewer changes lives in their own device copy.

**Why the session file isn't stored in the database row itself:** the free plan allows 500 MB of database and 1 GB of Storage. If the database goes over its limit, Supabase puts the **whole project into read-only mode**, which would also break account saves. If Storage fills up, only new uploads fail. Keeping rows tiny means sharing can never take the database down. The link is short either way.

### 9.2 Table, read function, and storage rules

```sql
create table public.shares (
  id          text primary key check (id ~ '^[A-Za-z0-9]{10}$'),  -- the slug in the link
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  kind        text not null check (kind in ('deck','session')),
  title       text not null check (char_length(title) between 1 and 120),
  deck_text   text check (char_length(deck_text) <= 8000),        -- kind = 'deck'
  summary     jsonb not null default '{}',                          -- kind = 'session'
  blob_bytes  integer,                                              -- kind = 'session'
  created_at  timestamptz not null default now(),
  check ((kind = 'deck' and deck_text is not null) or (kind = 'session' and blob_bytes is not null))
);
alter table public.shares enable row level security;

-- Owners (incl. invisible anonymous identities) create, see and delete their own shares.
-- No update policy: shares are immutable.
create policy shares_insert on public.shares for insert with check (owner_id = auth.uid());
create policy shares_select on public.shares for select using  (owner_id = auth.uid());
create policy shares_delete on public.shares for delete using  (owner_id = auth.uid());

-- Everyone else reads exactly one share by its slug. Nobody can list all shares.
create function public.get_share(slug text) returns public.shares
language sql stable security definer set search_path = public as $$
  select * from public.shares where id = slug
$$;
grant execute on function public.get_share(text) to anon, authenticated;

-- Storage: public bucket `shares`, 10 MB per file, MIME application/gzip.
-- Path {owner_id}/{slug}.json.gz, and an upload is only allowed if a matching session share row exists.
create policy share_blobs_insert on storage.objects for insert with check (
  bucket_id = 'shares'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.shares s
              where s.owner_id = auth.uid() and s.kind = 'session'
                and s.id || '.json.gz' = storage.filename(name)));
create policy share_blobs_delete on storage.objects for delete using (
  bucket_id = 'shares' and (storage.foldername(name))[1] = auth.uid()::text);
```

**Creating a session share:**
1. Insert the row. The guard trigger in §9.3 checks the limits first.
2. Upload the file to `{uid}/{slug}.json.gz`.
3. If the upload fails, delete the row. A row without a file opens as *"This share is no longer available."*

Files in a public bucket are readable by anyone who has the exact URL. Nobody can list the bucket, and the path contains a random slug.

### 9.3 Sharing while signed out: invisible anonymous identity (decided)
The first time a signed-out user clicks **Share**, the app calls `supabase.auth.signInAnonymously()` behind the scenes. They see no login screen. This gives them an owner id, so they can **delete their own links** later from the same browser ("My shared links" under *Share*), and the limits below apply per person.

If they later sign in with Discord or Google, `linkIdentity()` turns the anonymous identity into their real account, so their links come with them. This needs *Manual linking* enabled in Auth settings. If that Discord or Google account already exists, linking fails, and the links stay with the anonymous identity in that browser. That's acceptable for an edge case.

#### Is it secure enough? Yes, with three conditions

**What an anonymous identity can do:** create shares within the limits, and delete its own shares.

**What it can't do:**
- read or write anyone's account decks or sessions (`is_real_user()` blocks anonymous identities from those tables entirely, §8.3);
- list or browse shares (only an exact slug resolves, through `get_share`);
- change or overwrite anyone's share (there's no update rule, and uploads are tied to the uploader's own folder and own row).

| Risk | What stops it |
|---|---|
| Someone scripts thousands of shares to fill the free Storage | Per-person limits (20 a day, 100 in total). Supabase's own limit on anonymous sign-ins (about 30 an hour per IP). A **global cap**: no new session shares once the `shares` bucket passes 700 MB. **Worst case, sharing pauses** with a friendly message, and the library, accounts, and every other feature keep working. §9.5 shows how to clean up. |
| The bucket gets used to host unrelated files | Only `application/gzip`, at most 10 MB, and only at a path that matches the uploader's own share row |
| Guessing someone's link | 10 random letters and digits give about 8×10¹⁷ combinations, and only exact slugs resolve |
| The anon key is visible in the page | It's meant to be public, and the access rules (RLS) are the real lock. **The `service_role` key must never be committed.** |
| **A shared session carries malicious code** | **Must be fixed first** (§9.4) |

The three conditions: §9.4 ships in Phase 1 (before any links exist), the guard trigger below is in place, and the `service_role` key stays out of the repo. No captcha for now, as decided. §13 says when we'd add one.

```sql
create function public.shares_guard() returns trigger
language plpgsql security definer set search_path = public, storage as $$
declare mine_today int; mine_total int; bucket_bytes bigint;
begin
  select count(*) filter (where created_at > now() - interval '1 day'), count(*)
    into mine_today, mine_total
    from public.shares where owner_id = auth.uid();
  if mine_today >= 20 or mine_total >= 100 then
    raise exception 'share_limit_reached' using errcode = 'P0001';
  end if;
  if new.kind = 'session' then
    select coalesce(sum((metadata->>'size')::bigint), 0) into bucket_bytes
      from storage.objects where bucket_id = 'shares';
    if bucket_bytes > 700 * 1024 * 1024 then
      raise exception 'share_storage_full' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger shares_guard before insert on public.shares
  for each row execute function public.shares_guard();
```
The app turns `share_limit_reached` and `share_storage_full` into plain-language messages. Account sessions (§8.4) get the same kind of guard: no *new* account sessions once total Storage passes 900 MB. Re-saving an existing session is always allowed.

### 9.4 Must-fix before share links: untrusted text in session files
Session files can come from strangers (imported files today, share links tomorrow). Right now the Dojo trusts the text inside them:

| Where | What happens |
|---|---|
| `practice_dojo.html:10204`, `:10238` | Bookmark and autosave **names** are inserted into the page as raw HTML |
| `practice_dojo.html:10192` | Bookmark **comments** are placed raw inside a `<textarea>` (a comment containing `</textarea>` escapes it) |
| `practice_dojo.html:10207` | Comments go through `marked.parse()` **without sanitizing**, and marked passes HTML straight through |

A crafted file with a node named `<img src=x onerror=…>` runs its code as soon as the multiverse tree opens. Today the victim has to import a file by hand. With share links it takes **one click on a link**, and once accounts exist that code could act as the signed-in user, because supabase-js keeps the login token in the browser's storage.

**Fix (in Phase 1):**
- Escape every string that comes from a session file before it goes into HTML. The app already has `escapeHtml` and `_esc`.
- Run `marked` output through **DOMPurify** (one script from cdnjs).
- Check the remaining imported strings: player names, turn comments, deck text, section labels. The game log already uses `innerText`, which is safe.

### 9.5 Keeping an eye on shares (no expiry jobs)
Shares don't expire. They're limited by count and by the Storage cap. If Storage ever gets close to full:

```sql
-- what's using space, biggest and oldest first
select s.id, s.kind, s.title, s.created_at, pg_size_pretty(s.blob_bytes::bigint) as size, u.is_anonymous
from public.shares s join auth.users u on u.id = s.owner_id
order by s.blob_bytes desc nulls last, s.created_at;
```
To remove shares, delete their files under *Storage → shares* in the dashboard (Supabase doesn't allow deleting Storage files with SQL), then run `delete from public.shares where id in (…)`.

---

## 10. Free-tier budget (new project)

| Resource | Free limit (verify on the pricing page) | Main consumer | Headroom |
|---|---|---|---|
| Postgres | 500 MB (**read-only if exceeded**) | Rows of about 1–2 KB: decks, session metadata, shares | Hundreds of thousands of rows. No big payloads ever go in the database. |
| Storage | 1 GB | Account session files and shared session files (about 200 KB typical) | About 5,000 files. Guarded at 700 MB for shares and 900 MB total. |
| Egress | 5 GB / month | Opening account sessions and session links | About 25,000 opens of 200 KB per month |
| Auth MAU | 50,000 | Real and anonymous users | Plenty |
| **Pause** | After 7 days with no API activity | — | Covered by the keep-alive below |

Defaults, demos, the device library, Duels.ink imports, and everything else signed-out cost **zero** Supabase resources. Only sign-in, account items, and share links use the project.

### 10.1 Keep-alive (decided)
A GitHub Action in the new repo pings the project twice a week, so a quiet week can't pause it and break share links.

```yaml
# .github/workflows/supabase-keepalive.yml
name: Supabase keep-alive
on:
  schedule:
    - cron: '17 6 * * 1,4'     # Mon & Thu, 06:17 UTC
  workflow_dispatch:            # "Run workflow" button for testing
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Touch the database
        run: |
          curl -fsS -X POST "$SUPABASE_URL/rest/v1/rpc/get_share" \
            -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
            -d '{"slug":"keepalive0"}'
        env:
          SUPABASE_URL: ${{ vars.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ vars.SUPABASE_ANON_KEY }}
```
- Store the URL and anon key as repository **variables** (*Settings → Secrets and variables → Actions → Variables*). They're public values already, so they don't need to be secrets.
- **Caveat:** GitHub turns off scheduled workflows in a public repo after **60 days without commits**. It emails you first. Any commit resets the clock, or you can re-enable the workflow with one click in the *Actions* tab.

---

## 11. Code structure (YAGNI split)

| File | Contents | Phase |
|---|---|---|
| `app/index.html` | Today's `practice_dojo.html`. Its storage calls (`saveToLocalStorage`, `loadFromLocalStorage`, `exportTimelines`, `importTimelines`, `saveSessionToCloud`, `fetchDecksFromDatabase`, `fetchSessionsFromDatabase`, `loadExampleSession`) become thin calls into the modules below. **The rest is untouched**, apart from the §9.4 escaping fix. | 1 |
| `app/js/library.js` | `DojoLibrary`: IndexedDB stores, defaults loader, v2 codec (gzip) | 1 |
| `app/js/cloud.js` | `DojoCloud`: Supabase client, share links (create and open), anonymous identity, sign-in, account save and load | 2–3 |
| `supabase/migrations/*.sql` | The SQL in this doc, versioned | 2 |
| `.github/workflows/supabase-keepalive.yml` | §10.1 | 2 |

- These are classic `<script src>` files exposing one global each, matching the current `App` style. **No build step, no bundler, no framework.**
- `cloud.js` is the only file that knows Supabase exists. The supabase-js CDN script is pinned to an exact version.
- **Splitting rule:** a new concern gets a new file when it has its own reason to change. Existing code is extracted only when a feature needs to change it substantially anyway. `AGENTS.md` and the dev guide get updated to replace the "never leave single-file" rule with this one.

---

## 12. Order of work

Device storage belongs to the site address, so we **move first** (decided). Device libraries are then created on the final address from day one.

| Phase | Delivers | Supabase? |
|---|---|---|
| **0. Move** | New repo, new layout, old URL becomes a "we moved" page (§12.1) | No |
| **1. Library** | `library.js`, IndexedDB library, `defaults/decks` and `defaults/demos`, new home screen, v2 gzip format, one-time migration of the localStorage Continue slot, **§9.4 security fix** | No |
| **2. Share links** | New Supabase project (§12.2), `shares` table with guard, anonymous identity, Share button for decks and sessions, `?s=` opening, keep-alive | Yes |
| **3. Accounts** | Discord and Google sign-in, `decks` and `sessions` tables, Save to account, first-sign-in upload, quotas | Yes |

Phases 2 and 3 can swap order if you'd rather have accounts first.

### 12.1 Phase 0: the move, step by step
1. **Seed the new repo, keeping the Dojo's git history** (D17): on a fresh clone of `heavenideas.github.io`, run `git filter-repo --subdirectory-filter practice_dojo`. That keeps only the Dojo's history and moves its files to the root. Push the result to `PracticeDojo/practicedojo.github.io` `main`.
2. **Reorganize in one commit:**
   ```
   /index.html                ← landing page (was practice_dojo/index.html)
   /app/index.html            ← the Dojo (was practice_dojo/practice_dojo.html)
   /app/img/…                 ← images the app uses
   /img/…                     ← images the landing page uses
   /docs/                     ← features.md, personal_dojo_dev_guide.md, ARCH-*, IMP-*, RSC-*, TEST-PROTOCOL-*
   /docs/samples/             ← logs/*.md and the Duels.ink replay .json (test fixtures)
   /AGENTS.md                 ← paths updated + the new splitting rule (§11)
   ```
   **Left behind:** `multiverse_examples/` (90 MB) and `_bundle/` (the old chunked-restore loader).
3. **Fix the links:** landing → `app/`, the app's "home" → `../`, and image paths. Bump the patch version.
4. **Turn on GitHub Pages:** *Settings → Pages → Deploy from a branch → `main` / root*. Smoke-test: start a match, import a Duels.ink replay, export a session and import it back.
5. **Old site** (`heavenideas.github.io`):
   - `practice_dojo/practice_dojo.html` becomes a **"We've moved"** page. It links to the new app and, if this browser has a saved Continue session, offers **Download my last session**. That's the same v1 file *Export* makes today, which the new site can import.
   - `practice_dojo/index.html` redirects to the new landing page.
   - The link card in the root `index.html` points to the new site.
   - Everything else in `practice_dojo/` stays as it is (D18).

### 12.2 Supabase setup checklist (Phase 2)
1. Create a new project (free plan, closest region).
2. Run `supabase/migrations/*.sql` in the SQL editor.
3. Create the buckets:
   - `shares`: public, 10 MB, `application/gzip`
   - `sessions`: private, 10 MB, `application/gzip` (needed at Phase 3)
4. In *Auth → Providers*, enable **Anonymous sign-ins** and **Manual linking** (and **Discord** and **Google** at Phase 3).
5. In *Auth → URL configuration*, set the Site URL to `https://practicedojo.github.io`, with redirects `https://practicedojo.github.io/**` and `http://localhost:*/**`.
6. Put the project URL and anon key into `cloud.js` and into the repo variables for the keep-alive. **Never commit the `service_role` key.**

---

## 13. Deliberately not doing (until needed)

| Idea | Trigger to revisit |
|---|---|
| Background auto-sync between devices | Users complain about pressing Save / Download |
| Captcha (Cloudflare Turnstile) on anonymous sign-in | The share guard is hit by abuse, not by real use |
| Share expiry and a cleanup job | The Storage cap is reached repeatedly |
| Backend-free deck links (decklist packed in the URL) | Supabase reliability becomes a problem |
| Slimmer session format (*Refactor 1*) | Files regularly over about 2 MB gzipped |
| Public browsing of shares / a gallery | Real demand. `shares` could grow an opt-in `listed` flag. |
| Playback mode (auto-step through nodes) | Not requested: replay = reopen and navigate |
| Keeping the raw Duels.ink file with a session | The importer changes and re-import becomes valuable |
| Profiles and display names | Something shows another user's name |
| A check that every default deck is valid | Someone besides you edits `defaults/` |

---

## 14. Decision log

| # | Decision | Date |
|---|---|---|
| D1 | Every Dojo feature works without an account. Login only keeps your decks and sessions in your account. | 2026-10-04 |
| D2 | Duels.ink log and replay import stays fully available signed out | 2026-10-04 |
| D3 | A new, dedicated free Supabase project for the Dojo | 2026-10-04 |
| D4 | Sign-in with Discord and Google | 2026-10-04 |
| D5 | "Replay" = reopen a saved session and navigate its multiverse (already exists) | 2026-10-04 |
| D6 | Signed-out users keep their library on their own device (IndexedDB) | 2026-10-04 |
| D7 | All decks are treated the same. Default decks per set live in the repo (`defaults/decks/`) and load with no login. | 2026-10-04 |
| D8 | Share links for decks and sessions. Short `?s=<slug>` links resolved through Supabase. Anyone can open and create them. | 2026-10-04 |
| D9 | Break the single file into a few modules, following YAGNI | 2026-10-04 |
| D10 | Legacy decks and old cloud demos are not carried over. Demos start fresh in `defaults/demos/`. | 2026-10-04 |
| D11 | Anonymous identity for sharing while signed out, under the §9.3 conditions | 2026-10-04 |
| D12 | No captcha for now | 2026-10-04 |
| D13 | Move the repo before building (Phase 0 first) | 2026-10-04 |
| D14 | Weekly keep-alive via GitHub Actions | 2026-10-04 |
| D15 | Shares are limited by count and the Storage cap, with no time limit | 2026-10-04 |
| D16 | No validation check for default decks yet | 2026-10-04 |
| D17 | The new repo keeps the Dojo's git history (`git filter-repo --subdirectory-filter practice_dojo`) | 2026-10-04 |
| D18 | On the old site, only the two entry pages become "we moved" pages. The rest of `practice_dojo/` is left as it is. | 2026-10-04 |
