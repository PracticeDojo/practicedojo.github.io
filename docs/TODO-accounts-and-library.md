# TODO: Library, share links and accounts

The working checklist for [`ARCH-accounts-and-library.md`](ARCH-accounts-and-library.md). The ARCH doc says
*how*; this file says *what's left*. Section numbers (§) point into the ARCH doc.

**Rules:** tick an item only when it is on `main` and verified (say how in the note). Items marked
**(you)** need someone with access to a dashboard or another repo. New work found along the way goes
into the right phase, or into *Parked* if it's outside the plan.

*Last updated: 2026-10-04 · live: v2.23.0*

| Phase | Status |
|---|---|
| 0 · Move | ✅ Done (v2.18.1) |
| 1 · Library | 🟢 Built (v2.19.0, v2.20.0); content and manual tests open |
| 2 · Share links | 🟢 Live (v2.21.0); a few checks open |
| 3 · Accounts | 🟡 Live (v2.23.0); database verified, waiting on a real Discord sign-in test |

---

## Phase 0 · Move (§12.1)

- [x] New repo `PracticeDojo/practicedojo.github.io` seeded with the Dojo's git history (D17)
- [x] New layout: `/` landing, `/app/` Dojo, `/img/`, `/docs/`, `/docs/samples/`, `AGENTS.md`, `.nojekyll`
- [x] Links fixed (landing → `app/`, images → `../img/`), v2.18.1
- [x] GitHub Pages serving `main` / root: https://practicedojo.github.io/app/

## Phase 1 · Library (§4–§7, §9.4) — v2.19.0 Feature 38, v2.20.0 Feature 39

Built:
- [x] `app/js/library.js`: IndexedDB `practice_dojo` with `decks`, `sessions`, `session_blobs`, `kv` (§5)
- [x] Every match is a device session; autosave debounced ~1 s and flushed when the tab is hidden (§5)
- [x] One-time migration of `localStorage['lorcana_dojo_session']` (§5)
- [x] `navigator.storage.persist()` on the first explicit save (§5)
- [x] Session file v2, exported as `<title>.dojo.json.gz`; import reads gzipped v2, plain v2 and plain v1 (§6)
- [x] Default decks from `app/defaults/decks/manifest.json`; demos from `app/defaults/demos/manifest.json` (§4)
- [x] Home screen: the inkwell field, seats and deck chips, *Pick up again*, Library drawer (§7, Feature 39)
- [x] Library · Sessions: open, rename, duplicate, export, delete, import file (§7)
- [x] Library · Decks: seat as You / Opponent, new deck, import `.txt`, from a Duels.ink replay, edit, copy a default (§7)
- [x] Topbar: editable session title, Save, Save as copy (§7)
- [x] Duels.ink log / replay import creates a device session (§7)
- [x] Security: session strings escaped, comments through DOMPurify, unsafe ids and CSS colours cleaned on load (§9.4)
- [x] No Supabase calls at startup; the old project's decks, demos and key removed (§1, D10)
- [x] `AGENTS.md` and the dev guide carry the YAGNI splitting rule (§11)

Open:
- [x] **(you)** Real default decks: Set 13 Princess Aggro, Amethyst/Amber Control, Evasive Tempo (+ the Set 12 sample). *All 60/60 cards recognised, 2026-10-04* (§4.1–§4.3)
- [x] **(you)** First demos in `app/defaults/demos/`: Set 13 example (Amber/Amethyst vs Amethyst/Ruby, turn 16). *Verified 2026-10-05 in Chromium: the "Explore" card shows under Pick up again on a fresh profile and opens a device copy at turn 16, lore 10–11, no errors* (§4.4)
- [ ] Manual pass of `TEST-PROTOCOL-v2.19.0.md` and `v2.20.0.md` on a real phone and in Safari / Firefox. *So far only automated Chromium runs*

## Phase 2 · Share links (§9, §10.1, §12.2) — v2.21.0 Feature 40

Setup:
- [x] **(you)** New free Supabase project, GitHub integration on `main`, *Deploy to production* on
- [x] Migration `supabase/migrations/20261004120000_shares.sql` applied: `shares` table, `get_share()`, guard trigger, `shares` bucket, storage policies. *Verified over the API, 2026-10-04*
- [x] **(you)** Anonymous sign-ins and manual linking on. *Verified: `anonymous_users: true`*
- [x] **(you)** Repo variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`
- [ ] **(you)** Authentication → URL Configuration: Site URL `https://practicedojo.github.io`, redirects `https://practicedojo.github.io/**` and `http://localhost:*/**`. *Not confirmed. Needed before Phase 3 sign-in*

App:
- [x] `app/js/cloud.js`: reads with plain fetch, loads supabase-js 2.117.2 (SRI) only to create links (§11)
- [x] Invisible anonymous identity on first share (§9.3)
- [x] Share from the topbar, Library · Sessions and Library · Decks; link dialog with Copy link
- [x] `?s=` deck link opens in the inkwell as a *Shared deck*; `?s=` session link opens on the board with *Save a copy*
- [x] Library · Shared: copy, open, delete your links
- [x] Plain-language messages for every limit: 20/day, 100 total, 10 MB, 700 MB storage cap (§9.3)
- [x] `.github/workflows/supabase-keepalive.yml`, Mon/Thu (§10.1)
- [x] End-to-end test against the live project (create, list, open fresh, save a copy, delete). *You also created and opened `?s=ap0nYnZBWW` on the live site*

Open:
- [ ] **(you)** Run the keep-alive once: Actions → *Supabase keep-alive* → *Run workflow*. *No runs yet as of 2026-10-04*
- [ ] Manual pass of `TEST-PROTOCOL-v2.21.0.md`, including the 21st-link limit and offline
- [ ] **(you, optional)** Delete the 3 anonymous test users from today's tests (Authentication → Users)

## Phase 3 · Accounts (§8) — v2.23.0 Feature 42, live

*App items below are ticked once they work with a real Discord sign-in (`TEST-PROTOCOL-v2.23.0.md`).
So far: app UI tested end to end against an in-memory stand-in for the account service; the database is live and checked over the API.*

Setup **(you)**, step by step in [`SETUP-sign-in.md`](SETUP-sign-in.md):
- [x] Discord OAuth app, enabled in Supabase. *Verified: `discord: true` in the project's auth settings, 2026-10-04*
- [ ] *(parked)* Google OAuth client. The sign-in dialog only lists providers that are switched on, so Google appears by itself once it's enabled (`SETUP-sign-in.md` §2)
- [ ] URL Configuration done (see Phase 2). *Discord's side is right (verified: Supabase sends Discord the correct callback); the return to the app can only be checked in the dashboard or by signing in*

Database (a new migration in `supabase/migrations/`):
- [x] `decks` and `sessions` tables (§8.2). *Migration `20261004200000_accounts.sql` applied by the GitHub integration; verified over the API, 2026-10-04*
- [x] `is_real_user()` and the owner-only RLS that excludes anonymous identities (§8.3). *Verified live: public key refused, an anonymous identity sees no rows and can't insert*
- [x] Private `sessions` bucket (10 MB, `application/gzip`) and its policies (§8.3). *Verified live: bucket exists, anonymous upload refused*
- [x] Quota triggers: 200 decks and 50 sessions per account; no *new* account sessions past 900 MB total storage (§8.4, §9.3). *Tested on Postgres 16; live with the same migration*

App:
- [ ] *Sign in* menu (Discord, Google) with PKCE redirect back; account menu with usage; *Sign out* (§8.1)
- [ ] `linkIdentity()`: the anonymous identity becomes the real account, so shared links come along (§9.3)
- [ ] First sign-in on a device with local items: "Save N decks and M sessions to your account?" *All / Choose… / Not now* (§8.1)
- [ ] **Save** writes device + account with the revision check; also when the tab is hidden with unsaved changes (§8.1, §8.3)
- [ ] Conflict prompt: *Overwrite* or *Save mine as a copy* (§8.1)
- [ ] Library rows show *This device* / *Account*, with *Save to account* / *Download* for the missing side (§7)
- [ ] Opening an account session on a new device downloads it once (§8.1)
- [ ] Delete asks *This device*, *Account* or *Both* (§8.1)
- [ ] Sign out asks whether to keep downloaded account copies (§8.1)
- [ ] Tests, docs (features, dev guide, ARCH status) and a test protocol; minor version bump

## Housekeeping (ongoing)

- [ ] GitHub turns off scheduled workflows after 60 days with no commits. If it emails, re-enable the keep-alive in Actions (§10.1)
- [ ] If Storage use climbs, check it with the §9.5 query and clean up there
- [ ] When updating supabase-js, change the version **and** its SRI hash in `app/js/cloud.js` together

## Parked (outside the ARCH plan)

- [x] Duels.ink's newer "You / Opponent" log format (`docs/IMP-newLog.md`). *Done in v2.22.0 (Feature 41); checked against the replay of the same game*
- Deliberately not doing until a trigger fires: captcha, share expiry, backend-free deck links, slimmer session format, public gallery, background sync, profiles. See §13
