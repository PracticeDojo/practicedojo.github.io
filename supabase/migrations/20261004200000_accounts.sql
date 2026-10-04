-- Practice Dojo · Phase 3: optional accounts
-- docs/ARCH-accounts-and-library.md §8. Safe to run more than once.
--
-- Signing in (Discord or Google) keeps your decks and sessions in your
-- account so they're on every device. The device library stays the first
-- home; nothing here is needed to play.
--   decks    → the decklist lives in the row
--   sessions → metadata in the row; the gzipped file in the private bucket
--              `sessions` at {owner_id}/{id}.json.gz
-- Anonymous identities (used for share links, §9.3) are signed in as far as
-- Postgres is concerned, so every rule below also requires is_real_user().

-- 1. Who counts as a real account ---------------------------------------------
create or replace function public.is_real_user()
returns boolean
language sql stable
as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;
grant execute on function public.is_real_user() to anon, authenticated;

-- 2. Tables -------------------------------------------------------------------
create table if not exists public.decks (
  id          uuid primary key,                      -- client-generated, same id on device and account
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  decklist    text not null check (char_length(decklist) <= 8000),
  notes       text check (char_length(notes) <= 4000),
  revision    integer not null default 1 check (revision >= 1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sessions (
  id          uuid primary key,
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  summary     jsonb not null default '{}',
  blob_bytes  integer not null check (blob_bytes between 1 and 10485760),
  revision    integer not null default 1 check (revision >= 1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists decks_owner_updated on public.decks (owner_id, updated_at desc);
create index if not exists sessions_owner_updated on public.sessions (owner_id, updated_at desc);

alter table public.decks enable row level security;
alter table public.sessions enable row level security;

-- New projects don't expose tables to the API by default; grant only what
-- the app uses, and only to signed-in roles.
revoke all on public.decks, public.sessions from anon, authenticated;
grant select, insert, update, delete on public.decks, public.sessions to authenticated;

drop policy if exists decks_owner on public.decks;
drop policy if exists sessions_owner on public.sessions;
create policy decks_owner on public.decks for all to authenticated
  using (owner_id = auth.uid() and public.is_real_user())
  with check (owner_id = auth.uid() and public.is_real_user());
create policy sessions_owner on public.sessions for all to authenticated
  using (owner_id = auth.uid() and public.is_real_user())
  with check (owner_id = auth.uid() and public.is_real_user());

-- 3. Guard: ownership, timestamps and quotas (§8.4) --------------------------
-- 200 decks and 50 sessions per account; no *new* account sessions once the
-- project's Storage passes 900 MB. Re-saving an existing session always works.
create or replace function public.account_guard()
returns trigger
language plpgsql security definer set search_path = public, storage
as $$
declare
  n int;
  total_bytes bigint;
begin
  if tg_op = 'INSERT' then
    new.owner_id   := auth.uid();
    new.created_at := now();
    if new.owner_id is null then
      raise exception 'not_signed_in' using errcode = 'P0001';
    end if;
    if tg_table_name = 'decks' then
      select count(*) into n from public.decks where owner_id = new.owner_id;
      if n >= 200 then
        raise exception 'account_deck_limit' using errcode = 'P0001';
      end if;
    else
      select count(*) into n from public.sessions where owner_id = new.owner_id;
      if n >= 50 then
        raise exception 'account_session_limit' using errcode = 'P0001';
      end if;
      select coalesce(sum((metadata ->> 'size')::bigint), 0) into total_bytes from storage.objects;
      if total_bytes > 900 * 1024 * 1024 then
        raise exception 'account_storage_full' using errcode = 'P0001';
      end if;
    end if;
  else
    -- A row never changes hands or identity.
    new.id         := old.id;
    new.owner_id   := old.owner_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end
$$;
revoke all on function public.account_guard() from public, anon, authenticated;

drop trigger if exists decks_guard on public.decks;
drop trigger if exists sessions_guard on public.sessions;
create trigger decks_guard before insert or update on public.decks
  for each row execute function public.account_guard();
create trigger sessions_guard before insert or update on public.sessions
  for each row execute function public.account_guard();

-- 4. Storage: private bucket `sessions`, 10 MB per file, gzip only -----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sessions', 'sessions', false, 10485760, array['application/gzip'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Only your own folder, only as a real account, and a file can only be
-- written for a session row you own (so the bucket can't outgrow the quota).
-- Saving again overwrites the file, which needs select + update as well.
drop policy if exists session_blobs_select on storage.objects;
drop policy if exists session_blobs_insert on storage.objects;
drop policy if exists session_blobs_update on storage.objects;
drop policy if exists session_blobs_delete on storage.objects;
create policy session_blobs_select on storage.objects for select to authenticated using (
  bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text and public.is_real_user());
create policy session_blobs_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text and public.is_real_user()
  and exists (select 1 from public.sessions s
              where s.owner_id = auth.uid() and s.id::text || '.json.gz' = storage.filename(name)));
create policy session_blobs_update on storage.objects for update to authenticated
  using (bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text and public.is_real_user())
  with check (bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text and public.is_real_user());
create policy session_blobs_delete on storage.objects for delete to authenticated using (
  bucket_id = 'sessions' and (storage.foldername(name))[1] = auth.uid()::text and public.is_real_user());
