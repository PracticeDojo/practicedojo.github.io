-- Stand-ins for the Supabase schemas the migrations use, so they can be tested on a
-- plain Postgres 16 (supabase/tests/run.sh). Not a migration: never applied to Supabase.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
-- auth.uid() / auth.jwt() read the claims the test sets with set_config('request.jwt.claims', …)
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
grant usage on schema auth to anon, authenticated;

create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id bigserial primary key, bucket_id text, name text, metadata jsonb default '{}');
alter table storage.objects enable row level security;
create function storage.filename(name text) returns text language sql immutable as $$
  select (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)] $$;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant usage on sequence storage.objects_id_seq to authenticated;

create schema realtime;
create table realtime.messages (id bigserial primary key, topic text, extension text, payload jsonb);
alter table realtime.messages enable row level security;
create function realtime.topic() returns text language sql stable as $$
  select nullif(current_setting('realtime.topic', true), '') $$;
grant usage on schema realtime to anon, authenticated;
grant select, insert on realtime.messages to authenticated;
grant usage on sequence realtime.messages_id_seq to authenticated;
grant usage on schema public to anon, authenticated;
