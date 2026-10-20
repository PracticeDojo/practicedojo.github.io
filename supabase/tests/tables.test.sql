-- Tests for 20261020120000_tables.sql on a plain Postgres 16 with stubs.sql (run.sh).
-- Every check is an assert; the first failure stops the run.
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set C '''cccccccc-0000-0000-0000-000000000003'''
\set D '''dddddddd-0000-0000-0000-000000000004'''
insert into auth.users values (:A), (:B), (:C), (:D);

-- expect_error(sql, error text): runs sql as the current role and asserts it fails with that text.
create function public.expect_error(sql text, want text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'expected "%" from: %', want, sql;
exception when others then
  if position(want in sqlerrm) = 0 then raise exception 'expected "%" from %, got: %', want, sql, sqlerrm; end if;
end $$;
grant execute on function public.expect_error(text, text) to anon, authenticated;

create function public.claims(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'is_anonymous', true)::text, false) $$;
grant execute on function public.claims(uuid) to anon, authenticated;

-- 1. Creating: only into your own seat, revision starts at 1 ---------------------
set role authenticated; select claims(:A);
insert into public.tables (id, seat0, name0, title, revision, turn_seat, summary)
  values ('TableAAAA1', :A, 'Ann', 'Ann vs ?', 99, 0, '{"turn":1}');
do $$ begin assert (select revision from public.tables where id = 'TableAAAA1') = 1, 'revision forced to 1'; end $$;
select expect_error($q$insert into public.tables (id, seat0, title) values ('TableXXXX1', 'bbbbbbbb-0000-0000-0000-000000000002', 'x')$q$, 'row-level security');
select expect_error($q$insert into public.tables (id, seat0, seat1, title) values ('TableXXXX2', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'x')$q$, 'row-level security');
select expect_error($q$insert into public.tables (id, seat0, title) values ('bad id', 'aaaaaaaa-0000-0000-0000-000000000001', 'x')$q$, 'check constraint');

-- 2. Strangers see nothing; the invite shows only the join screen's facts --------
select claims(:C);
do $$ begin assert (select count(*) from public.tables) = 0, 'stranger sees no tables'; end $$;
update public.tables set title = 'mine now' where id = 'TableAAAA1';
reset role;
do $$ begin assert (select title from public.tables where id = 'TableAAAA1') = 'Ann vs ?', 'stranger cannot update'; end $$;
set role anon; select claims(null);
select expect_error($q$select * from public.tables$q$, 'permission denied');
do $$ declare j jsonb := public.table_invite('TableAAAA1'); begin
  assert j->>'title' = 'Ann vs ?', 'invite title';
  assert j->'free_seats' = '[1]'::jsonb, 'invite free seats';
  assert j->'names' = '["Ann", null]'::jsonb, 'invite names';
  assert j->>'mine' is null, 'anon holds no seat';
  assert not (j ? 'seat0'), 'invite never shows seat ids';
  assert public.table_invite('Nonexisten') is null, 'unknown table → null';
end $$;
select expect_error($q$select public.join_table('TableAAAA1', 1, 'x')$q$, 'permission denied');

-- 3. Joining: one winner per seat, idempotent for a seated player -----------------
set role authenticated; select claims(:B);
do $$ declare t public.tables := public.join_table('TableAAAA1', 1, '  Bea  '); begin
  assert t.seat1 = 'bbbbbbbb-0000-0000-0000-000000000002' and t.name1 = 'Bea', 'B takes seat 1, name trimmed';
  assert (public.join_table('TableAAAA1', 0, 'again')).seat1 = t.seat1, 'joining again returns the row';
  assert (public.table_invite('TableAAAA1'))->>'mine' = '1', 'invite says which seat is mine';
end $$;
select claims(:C);
select expect_error($q$select public.join_table('TableAAAA1', 1, 'Cy')$q$, 'seat_taken');
select expect_error($q$select public.join_table('TableAAAA1', 0, 'Cy')$q$, 'seat_taken');
select expect_error($q$select public.join_table('TableAAAA1', 2, 'Cy')$q$, 'bad_seat');
select expect_error($q$select public.join_table('Nonexisten', 0, 'Cy')$q$, 'table_gone');

-- 4. Writing: the revision check, seats can't be moved by an update ---------------
select claims(:A);
do $$ declare n int; begin
  update public.tables set revision = 2, turn_seat = 1 where id = 'TableAAAA1' and revision = 1;
  get diagnostics n = row_count; assert n = 1, 'write at the right revision';
  update public.tables set revision = 2 where id = 'TableAAAA1' and revision = 1;
  get diagnostics n = row_count; assert n = 0, 'a stale write updates nothing';
  update public.tables set proposal = '{"by":0,"target":"x"}' where id = 'TableAAAA1';
  get diagnostics n = row_count; assert n = 1, 'a proposal needs no revision';
  update public.tables set seat1 = 'cccccccc-0000-0000-0000-000000000003', name1 = 'Cy' where id = 'TableAAAA1';
end $$;
do $$ begin assert (select seat1 from public.tables where id = 'TableAAAA1') = 'bbbbbbbb-0000-0000-0000-000000000002', 'seats only move through the functions'; end $$;
select expect_error($q$update public.tables set revision = 9 where id = 'TableAAAA1'$q$, 'bad_revision');
select claims(:B);
do $$ declare n int; begin
  update public.tables set revision = 3, proposal = null where id = 'TableAAAA1' and revision = 2;
  get diagnostics n = row_count; assert n = 1, 'the other seat writes too';
end $$;

-- 5. Storage: the two seats only ------------------------------------------------
select claims(:A);
insert into storage.objects (bucket_id, name, metadata) values ('tables', 'TableAAAA1.json.gz', '{"size":1000}');
select claims(:B);
do $$ begin assert (select count(*) from storage.objects where bucket_id = 'tables') = 1, 'seat B reads the file'; end $$;
update storage.objects set metadata = '{"size":2000}' where name = 'TableAAAA1.json.gz';
select claims(:C);
do $$ begin assert (select count(*) from storage.objects where bucket_id = 'tables') = 0, 'stranger sees no file'; end $$;
select expect_error($q$insert into storage.objects (bucket_id, name) values ('tables', 'TableAAAA1.json.gz')$q$, 'row-level security');
select expect_error($q$insert into storage.objects (bucket_id, name) values ('tables', 'TableCCCC1.json.gz')$q$, 'row-level security');

-- 6. Realtime: the two seats only, on their own topic ---------------------------
select set_config('realtime.topic', 'table:TableAAAA1', false);
select claims(:B);
insert into realtime.messages (topic, extension) values ('table:TableAAAA1', 'broadcast');
insert into realtime.messages (topic, extension) values ('table:TableAAAA1', 'presence');
do $$ begin assert (select count(*) from realtime.messages) = 2, 'seat B receives'; end $$;
select claims(:C);
select expect_error($q$insert into realtime.messages (topic, extension) values ('table:TableAAAA1', 'broadcast')$q$, 'row-level security');
do $$ begin assert (select count(*) from realtime.messages) = 0, 'stranger receives nothing'; end $$;
select set_config('realtime.topic', 'table:Nonexisten', false);
select claims(:B);
select expect_error($q$insert into realtime.messages (topic, extension) values ('table:Nonexisten', 'broadcast')$q$, 'row-level security');

-- 7. Freeing a seat, leaving, the last one out deletes ---------------------------
select claims(:A);
do $$ declare t public.tables := public.free_seat('TableAAAA1', 1); begin
  assert t.seat1 is null and t.name1 is null and t.proposal is null, 'A frees B''s seat';
end $$;
select expect_error($q$select public.free_seat('TableAAAA1', 0)$q$, 'not_your_table');
select claims(:C);
do $$ begin assert (public.join_table('TableAAAA1', 1, 'Cy')).seat1 = 'cccccccc-0000-0000-0000-000000000003', 'C takes the freed seat'; end $$;
do $$ begin assert public.leave_table('TableAAAA1') = false, 'C leaves, A still seated'; end $$;
select claims(:A);
do $$ begin assert public.leave_table('TableAAAA1') = true, 'last one out'; end $$;
reset role;
do $$ begin assert not exists (select 1 from public.tables where id = 'TableAAAA1'), 'row deleted'; end $$;
set role authenticated; select claims(:D);
do $$ begin assert public.leave_table('TableAAAA1') = false, 'leaving a gone table is harmless'; end $$;

-- 8. Caps: 20 tables per identity; no new tables when storage is full --------------
select claims(:D);
do $$ begin
  for i in 1..20 loop
    insert into public.tables (id, seat0, title) values ('TableDDD' || lpad(i::text, 2, '0'), 'dddddddd-0000-0000-0000-000000000004', 't');
  end loop;
end $$;
select expect_error($q$insert into public.tables (id, seat0, title) values ('TableDDD21', 'dddddddd-0000-0000-0000-000000000004', 't')$q$, 'table_limit');
select claims(:A);
insert into public.tables (id, seat0, title) values ('TableAAAA2', :A, 't');
select claims(:D);
select expect_error($q$select public.join_table('TableAAAA2', 1, 'D')$q$, 'table_limit');
reset role;
insert into storage.objects (bucket_id, name, metadata) values ('sessions', 'x/y.json.gz', '{"size":943718400}');
set role authenticated; select claims(:B);
select expect_error($q$insert into public.tables (id, seat0, title) values ('TableBBBB1', 'bbbbbbbb-0000-0000-0000-000000000002', 't')$q$, 'table_storage_full');
reset role;
delete from storage.objects where bucket_id = 'sessions';
insert into storage.objects (bucket_id, name, metadata) values ('tables', 'TableDDD01.json.gz', '{"size":157286401}');
set role authenticated; select claims(:B);
select expect_error($q$insert into public.tables (id, seat0, title) values ('TableBBBB1', 'bbbbbbbb-0000-0000-0000-000000000002', 't')$q$, 'table_storage_full');
select claims(:A);
select expect_error($q$insert into storage.objects (bucket_id, name) values ('tables', 'TableAAAA2.json.gz')$q$, 'row-level security');

\echo 'tables: all checks passed'
