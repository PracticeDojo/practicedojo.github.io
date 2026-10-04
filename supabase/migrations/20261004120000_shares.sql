-- Practice Dojo · Phase 2: share links
-- docs/ARCH-accounts-and-library.md §9. Safe to run more than once.
--
-- A share is a frozen snapshot behind a short link (?s=<slug>):
--   deck    → the decklist text lives in the row
--   session → the gzipped session file lives in Storage: shares/{owner_id}/{slug}.json.gz
-- Anyone can open a link (get_share). Only the owner, including an invisible
-- anonymous identity, can create, list and delete their own shares.

-- 1. Table -------------------------------------------------------------------
create table if not exists public.shares (
  id          text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  kind        text not null check (kind in ('deck', 'session')),
  title       text not null check (char_length(title) between 1 and 120),
  deck_text   text check (char_length(deck_text) <= 8000),
  summary     jsonb not null default '{}',
  blob_bytes  integer check (blob_bytes between 1 and 10485760),
  created_at  timestamptz not null default now(),
  check ((kind = 'deck' and deck_text is not null) or (kind = 'session' and blob_bytes is not null))
);
create index if not exists shares_owner_created on public.shares (owner_id, created_at desc);

alter table public.shares enable row level security;

-- New projects don't expose tables to the API by default. Grant exactly what
-- the app needs. Signed-out visitors (anon) only ever use get_share(). Shares
-- are immutable, so there is no update.
revoke all on public.shares from anon, authenticated;
grant select, insert, delete on public.shares to authenticated;

drop policy if exists shares_insert on public.shares;
drop policy if exists shares_select on public.shares;
drop policy if exists shares_delete on public.shares;
create policy shares_insert on public.shares for insert to authenticated with check (owner_id = auth.uid());
create policy shares_select on public.shares for select to authenticated using (owner_id = auth.uid());
create policy shares_delete on public.shares for delete to authenticated using (owner_id = auth.uid());

-- 2. Read one share by its slug. Nobody can list shares. --------------------
create or replace function public.get_share(slug text)
returns public.shares
language sql stable security definer set search_path = public
as $$
  select * from public.shares where id = slug
$$;
revoke all on function public.get_share(text) from public;
grant execute on function public.get_share(text) to anon, authenticated;

-- 3. Guard: limits that fail closed (sharing pauses; nothing else breaks) ----
create or replace function public.shares_guard()
returns trigger
language plpgsql security definer set search_path = public, storage
as $$
declare
  mine_today int;
  mine_total int;
  bucket_bytes bigint;
begin
  -- The database decides who and when, so a share can't be backdated
  -- around the daily limit or filed under someone else.
  new.owner_id   := auth.uid();
  new.created_at := now();
  if new.owner_id is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;

  select count(*) filter (where created_at > now() - interval '1 day'), count(*)
    into mine_today, mine_total
    from public.shares where owner_id = new.owner_id;
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
end
$$;
revoke all on function public.shares_guard() from public, anon, authenticated;

drop trigger if exists shares_guard on public.shares;
create trigger shares_guard before insert on public.shares
  for each row execute function public.shares_guard();

-- 4. Storage: public bucket `shares`, 10 MB per file, gzip only --------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shares', 'shares', true, 10485760, array['application/gzip'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload only into your own folder, and only for a session share row you own
-- whose slug matches the file name. Files are read by their public URL; the
-- select policy lets owners see (and so delete) only their own folder, so
-- nobody can list anyone else's files.
drop policy if exists share_blobs_insert on storage.objects;
drop policy if exists share_blobs_select on storage.objects;
drop policy if exists share_blobs_delete on storage.objects;
create policy share_blobs_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'shares'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.shares s
              where s.owner_id = auth.uid() and s.kind = 'session'
                and s.id || '.json.gz' = storage.filename(name)));
create policy share_blobs_delete on storage.objects for delete to authenticated using (
  bucket_id = 'shares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy share_blobs_select on storage.objects for select to authenticated using (
  bucket_id = 'shares' and (storage.foldername(name))[1] = auth.uid()::text);
