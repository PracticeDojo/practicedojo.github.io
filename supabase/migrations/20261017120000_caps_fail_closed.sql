-- Practice Dojo · caps that really fail closed (docs/ARCH-accounts-and-library.md §9.3, §10)
-- Safe to run more than once.
--
-- 1. `summary` had no size limit, so a few rows with huge summaries could fill
--    the 500 MB database, which then goes read-only for everyone. The app's
--    summaries are about 120 bytes. NOT VALID: checks new writes, skips old rows.
-- 2. The 700 MB shares cap was only checked when a share row was made, so many
--    rows made at once all passed and then each uploaded 10 MB. The upload is
--    now checked too.

-- 1. Summary size --------------------------------------------------------------
alter table public.shares drop constraint if exists shares_summary_size;
alter table public.shares add constraint shares_summary_size
  check (pg_column_size(summary) <= 4096) not valid;
alter table public.sessions drop constraint if exists sessions_summary_size;
alter table public.sessions add constraint sessions_summary_size
  check (pg_column_size(summary) <= 4096) not valid;

-- 2. Shares bucket cap at upload time ------------------------------------------
-- security definer: a storage policy can't read storage.objects itself (it would
-- recurse into its own policy), and the uploader may only see their own files.
create or replace function public.shares_bucket_bytes()
returns bigint
language sql stable security definer set search_path = public, storage
as $$
  select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects where bucket_id = 'shares'
$$;
revoke all on function public.shares_bucket_bytes() from public, anon;
grant execute on function public.shares_bucket_bytes() to authenticated;

drop policy if exists share_blobs_insert on storage.objects;
create policy share_blobs_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'shares'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.shares s
              where s.owner_id = auth.uid() and s.kind = 'session'
                and s.id || '.json.gz' = storage.filename(name))
  and public.shares_bucket_bytes() <= 700 * 1024 * 1024);
