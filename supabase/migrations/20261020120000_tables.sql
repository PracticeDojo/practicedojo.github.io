-- Practice Dojo · two-player tables (Features 64–65)
-- docs/ARCH-two-player.md §10. Safe to run more than once.
--
-- A table is a session two seats share:
--   row  public.tables        who sits where, the file's revision, whose turn, a pending proposal
--   file tables/{id}.json.gz  the v2 session file (private bucket, seats only)
--   live realtime topic table:{id}  (private channel, seats only)
-- Anonymous identities (share links, §9.3 of the accounts plan) may create and join tables.
-- The link (?t=<id>) is the invitation: anyone holding it can take a free seat.

-- 1. Table -------------------------------------------------------------------
create table if not exists public.tables (
  id          text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
  seat0       uuid references auth.users on delete set null,   -- plays P1
  seat1       uuid references auth.users on delete set null,   -- plays P2
  name0       text check (char_length(name0) <= 40),            -- what the players call themselves
  name1       text check (char_length(name1) <= 40),
  title       text not null check (char_length(title) between 1 and 120),
  revision    integer not null default 1,
  turn_seat   smallint not null default 0 check (turn_seat in (0, 1)), -- activePlayer on the saved board
  summary     jsonb not null default '{}' check (pg_column_size(summary) <= 4096),
  proposal    jsonb check (pg_column_size(proposal) <= 1024),
  file_bytes  integer not null default 0 check (file_bytes between 0 and 10485760),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tables_seat0 on public.tables (seat0);
create index if not exists tables_seat1 on public.tables (seat1);

alter table public.tables enable row level security;

-- Seats read and write their table. Nobody else sees it; table_invite() shows
-- a stranger with the link only what the join screen needs.
revoke all on public.tables from anon, authenticated;
grant select, insert, update on public.tables to authenticated;

drop policy if exists tables_select on public.tables;
drop policy if exists tables_insert on public.tables;
drop policy if exists tables_update on public.tables;
create policy tables_select on public.tables for select to authenticated
  using (auth.uid() in (seat0, seat1));
create policy tables_insert on public.tables for insert to authenticated
  with check ((seat0 = auth.uid() and seat1 is null) or (seat1 = auth.uid() and seat0 is null));
create policy tables_update on public.tables for update to authenticated
  using (auth.uid() in (seat0, seat1))
  with check (auth.uid() in (seat0, seat1));

-- 2. Storage helpers (security definer: a storage policy can't sum storage.objects itself)
create or replace function public.tables_bucket_bytes()
returns bigint
language sql stable security definer set search_path = public, storage
as $$
  select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects where bucket_id = 'tables'
$$;
revoke all on function public.tables_bucket_bytes() from public, anon;
grant execute on function public.tables_bucket_bytes() to authenticated;

-- 3. Guard: limits that fail closed, and seats that only the functions below move
-- 20 tables per identity; no new tables once the project's Storage passes 900 MB
-- or the tables bucket passes 150 MB. Saving an existing table always works.
create or replace function public.tables_guard()
returns trigger
language plpgsql security definer set search_path = public, storage
as $$
declare
  n int;
  total_bytes bigint;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'not_signed_in' using errcode = 'P0001';
    end if;
    select count(*) into n from public.tables where auth.uid() in (seat0, seat1);
    if n >= 20 then
      raise exception 'table_limit' using errcode = 'P0001';
    end if;
    select coalesce(sum((metadata ->> 'size')::bigint), 0) into total_bytes from storage.objects;
    if total_bytes > 900 * 1024 * 1024 or public.tables_bucket_bytes() > 150 * 1024 * 1024 then
      raise exception 'table_storage_full' using errcode = 'P0001';
    end if;
    new.revision   := 1;
    new.created_at := now();
  else
    new.id         := old.id;
    new.created_at := old.created_at;
    -- Seats change only through join_table / leave_table / free_seat.
    if coalesce(current_setting('dojo.table_seats', true), '') <> 'on' then
      new.seat0 := old.seat0;
      new.seat1 := old.seat1;
      new.name0 := old.name0;
      new.name1 := old.name1;
    end if;
    -- A write moves the revision on by exactly one (the client's revision check).
    if new.revision <> old.revision and new.revision <> old.revision + 1 then
      raise exception 'bad_revision' using errcode = 'P0001';
    end if;
  end if;
  new.updated_at := now();
  return new;
end
$$;
revoke all on function public.tables_guard() from public, anon, authenticated;

drop trigger if exists tables_guard on public.tables;
create trigger tables_guard before insert or update on public.tables
  for each row execute function public.tables_guard();

-- 4. Functions ---------------------------------------------------------------
-- What the join screen shows to anyone with the link. Never the seats' ids.
create or replace function public.table_invite(p_id text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'title', t.title,
    'summary', t.summary,
    'names', jsonb_build_array(t.name0, t.name1),
    'free_seats', to_jsonb(array_remove(array[
      case when t.seat0 is null then 0 end,
      case when t.seat1 is null then 1 end], null)),
    'mine', case when auth.uid() = t.seat0 then 0 when auth.uid() = t.seat1 then 1 end)
  from public.tables t where t.id = p_id
$$;
revoke all on function public.table_invite(text) from public;
grant execute on function public.table_invite(text) to anon, authenticated;

-- Take a free seat. Already seated here: returns the row as it is.
create or replace function public.join_table(p_id text, p_seat integer, p_name text)
returns public.tables
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  t public.tables;
  n int;
begin
  if me is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  select * into t from public.tables where id = p_id;
  if not found then
    raise exception 'table_gone' using errcode = 'P0001';
  end if;
  if me in (t.seat0, t.seat1) then
    return t;
  end if;
  select count(*) into n from public.tables where me in (seat0, seat1);
  if n >= 20 then
    raise exception 'table_limit' using errcode = 'P0001';
  end if;
  if p_seat not in (0, 1) then
    raise exception 'bad_seat' using errcode = 'P0001';
  end if;
  perform set_config('dojo.table_seats', 'on', true);
  -- One statement, so two people racing for the seat get one winner.
  update public.tables set
    seat0 = case when p_seat = 0 then me else seat0 end,
    name0 = case when p_seat = 0 then left(nullif(trim(p_name), ''), 40) else name0 end,
    seat1 = case when p_seat = 1 then me else seat1 end,
    name1 = case when p_seat = 1 then left(nullif(trim(p_name), ''), 40) else name1 end
  where id = p_id and (case when p_seat = 0 then seat0 else seat1 end) is null
  returning * into t;
  perform set_config('dojo.table_seats', '', true);
  if not found then
    raise exception 'seat_taken' using errcode = 'P0001';
  end if;
  return t;
end
$$;
revoke all on function public.join_table(text, integer, text) from public, anon;
grant execute on function public.join_table(text, integer, text) to authenticated;

-- Leave your seat. The last one out deletes the row (the app removes the file first).
-- → true when the table is gone.
create or replace function public.leave_table(p_id text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  t public.tables;
begin
  select * into t from public.tables where id = p_id and me in (seat0, seat1);
  if not found then
    return false;
  end if;
  perform set_config('dojo.table_seats', 'on', true);
  update public.tables set
    seat0 = case when seat0 = me then null else seat0 end,
    name0 = case when seat0 = me then null else name0 end,
    seat1 = case when seat1 = me then null else seat1 end,
    name1 = case when seat1 = me then null else name1 end,
    proposal = null
  where id = p_id returning * into t;
  perform set_config('dojo.table_seats', '', true);
  if t.seat0 is null and t.seat1 is null then
    delete from public.tables where id = p_id;
    return true;
  end if;
  return false;
end
$$;
revoke all on function public.leave_table(text) from public, anon;
grant execute on function public.leave_table(text) to authenticated;

-- Free the other seat, so the link can invite someone else.
create or replace function public.free_seat(p_id text, p_seat integer)
returns public.tables
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  t public.tables;
begin
  perform set_config('dojo.table_seats', 'on', true);
  if p_seat = 0 then
    update public.tables set seat0 = null, name0 = null, proposal = null
      where id = p_id and seat1 = me returning * into t;
  elsif p_seat = 1 then
    update public.tables set seat1 = null, name1 = null, proposal = null
      where id = p_id and seat0 = me returning * into t;
  end if;
  perform set_config('dojo.table_seats', '', true);
  if t.id is null then
    raise exception 'not_your_table' using errcode = 'P0001';
  end if;
  return t;
end
$$;
revoke all on function public.free_seat(text, integer) from public, anon;
grant execute on function public.free_seat(text, integer) to authenticated;

-- 5. Storage: private bucket `tables`, 10 MB per file, gzip only -------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tables', 'tables', false, 10485760, array['application/gzip'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- One file per table, {id}.json.gz, read and written by its two seats. A new
-- file also checks the bucket cap; overwriting an existing one always works.
drop policy if exists table_files_select on storage.objects;
drop policy if exists table_files_insert on storage.objects;
drop policy if exists table_files_update on storage.objects;
drop policy if exists table_files_delete on storage.objects;
create policy table_files_select on storage.objects for select to authenticated using (
  bucket_id = 'tables'
  and exists (select 1 from public.tables t where t.id || '.json.gz' = name and auth.uid() in (t.seat0, t.seat1)));
create policy table_files_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'tables'
  and exists (select 1 from public.tables t where t.id || '.json.gz' = name and auth.uid() in (t.seat0, t.seat1))
  and public.tables_bucket_bytes() <= 150 * 1024 * 1024);
create policy table_files_update on storage.objects for update to authenticated
  using (bucket_id = 'tables'
    and exists (select 1 from public.tables t where t.id || '.json.gz' = name and auth.uid() in (t.seat0, t.seat1)))
  with check (bucket_id = 'tables'
    and exists (select 1 from public.tables t where t.id || '.json.gz' = name and auth.uid() in (t.seat0, t.seat1)));
create policy table_files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'tables'
  and exists (select 1 from public.tables t where t.id || '.json.gz' = name and auth.uid() in (t.seat0, t.seat1)));

-- 6. Realtime: private channel table:{id}, its two seats only -----------------
-- Needs Realtime Settings → "Allow public access" off to be enforced (§10.3).
drop policy if exists table_channel_receive on realtime.messages;
drop policy if exists table_channel_send on realtime.messages;
create policy table_channel_receive on realtime.messages for select to authenticated using (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (select 1 from public.tables t
              where 'table:' || t.id = (select realtime.topic()) and (select auth.uid()) in (t.seat0, t.seat1)));
create policy table_channel_send on realtime.messages for insert to authenticated with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (select 1 from public.tables t
              where 'table:' || t.id = (select realtime.topic()) and (select auth.uid()) in (t.seat0, t.seat1)));
