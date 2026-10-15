-- ===================================================================
-- Romantic Universe - Supabase Complete Setup Script
-- Run this entire script in your Supabase Project -> SQL Editor -> Run
-- ===================================================================

-- 1. Enable pgcrypto extension for secure PIN hashing
create extension if not exists pgcrypto;

-- 2. Create the universe_data table
create table if not exists public.universe_data (
  id text primary key default 'current',
  data jsonb not null,
  pin_hash text not null default crypt('1234', gen_salt('bf')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
alter table public.universe_data enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public read universe_data" on public.universe_data;
drop policy if exists "Public insert universe_data" on public.universe_data;
drop policy if exists "Public update universe_data" on public.universe_data;

-- Policy: Allow everyone (desktop, mobile, visitors) to view content
create policy "Public read universe_data"
  on public.universe_data
  for select
  using (true);

-- Direct update fallback policy (only if needed by client with anon key)
create policy "Public update universe_data"
  on public.universe_data
  for update
  using (true)
  with check (true);

create policy "Public insert universe_data"
  on public.universe_data
  for insert
  with check (true);

-- 4. Enable Supabase Realtime for instant cross-device updates
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'universe_data'
  ) then
    alter publication supabase_realtime add table public.universe_data;
  end if;
end $$;

-- 5. Secure Postgres RPC Function: save_universe_data
-- Verifies the PIN in PostgreSQL before updating the website data
create or replace function public.save_universe_data(
  edit_pin text,
  new_data jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
  result_row universe_data;
begin
  select pin_hash into stored_hash from public.universe_data where id = 'current';

  -- If no row exists yet, initialize it with the default PIN
  if stored_hash is null then
    insert into public.universe_data (id, data, pin_hash, updated_at)
    values ('current', new_data, crypt(edit_pin, gen_salt('bf')), now())
    returning * into result_row;
    return result_row.data;
  end if;

  -- Validate the PIN against stored hash or fallback
  if stored_hash != crypt(edit_pin, stored_hash) and stored_hash != edit_pin then
    raise exception 'Invalid PIN: authorization failed';
  end if;

  -- Update with the new data
  update public.universe_data
  set data = new_data, updated_at = now()
  where id = 'current'
  returning * into result_row;

  return result_row.data;
end;
$$;

-- 6. Secure Postgres RPC Function: update_owner_pin
-- Updates the secret PIN in PostgreSQL
create or replace function public.update_owner_pin(
  current_pin text,
  new_pin text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
begin
  select pin_hash into stored_hash from public.universe_data where id = 'current';
  if stored_hash is null then
    stored_hash := crypt('1234', gen_salt('bf'));
  end if;

  if stored_hash != crypt(current_pin, stored_hash) and stored_hash != current_pin then
    raise exception 'Invalid current PIN: cannot update PIN';
  end if;

  update public.universe_data
  set pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now()
  where id = 'current';

  return true;
end;
$$;

-- 7. Create Storage Bucket for Scrapbook Images
insert into storage.buckets (id, name, public)
values ('scrapbook-images', 'scrapbook-images', true)
on conflict (id) do update set public = true;

-- Storage Policies: Everyone can view photos
drop policy if exists "Public view scrapbook images" on storage.objects;
create policy "Public view scrapbook images"
  on storage.objects for select
  using (bucket_id = 'scrapbook-images');

-- Allow image uploads to scrapbook-images
drop policy if exists "Allow image uploads" on storage.objects;
create policy "Allow image uploads"
  on storage.objects for insert
  with check (bucket_id = 'scrapbook-images');

-- Allow image updates & deletes
drop policy if exists "Allow image updates" on storage.objects;
create policy "Allow image updates"
  on storage.objects for update
  using (bucket_id = 'scrapbook-images');

drop policy if exists "Allow image deletes" on storage.objects;
create policy "Allow image deletes"
  on storage.objects for delete
  using (bucket_id = 'scrapbook-images');
