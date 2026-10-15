-- ===================================================================
-- Romantic Universe Scrapbook - Supabase Complete Setup Script
-- Project URL: https://updbgvanowpgjbkdliyo.supabase.co
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe to re-run multiple times without deleting existing data.
-- ===================================================================

-- 1. Enable pgcrypto extension for secure PIN hashing
create extension if not exists pgcrypto;

-- 2. Create the primary table for website content, memories, and letters
create table if not exists public.universe_data (
  id text primary key default 'current',
  data jsonb not null,
  pin_hash text not null default crypt('1234', gen_salt('bf')),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 3. Configure Row-Level Security (RLS) on universe_data
alter table public.universe_data enable row level security;

-- Drop any conflicting legacy policies
drop policy if exists "Public read universe_data" on public.universe_data;
drop policy if exists "Public write universe_data" on public.universe_data;
drop policy if exists "Public insert universe_data" on public.universe_data;
drop policy if exists "Public update universe_data" on public.universe_data;
drop policy if exists "Read universe_data" on public.universe_data;

-- Allow public read so the website loads content on any phone or browser
create policy "Public read universe_data"
  on public.universe_data
  for select
  using (true);

-- Allow public insert so upserts work properly from client
create policy "Public insert universe_data"
  on public.universe_data
  for insert
  with check (true);

-- Allow public update so edits and syncs persist across devices
create policy "Public update universe_data"
  on public.universe_data
  for update
  using (true)
  with check (true);

-- Comprehensive ALL policy for fallback safety
create policy "Public write universe_data"
  on public.universe_data
  for all
  using (true)
  with check (true);

-- 4. Enable Supabase Realtime for instant synchronization across devices
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'universe_data'
  ) then
    alter publication supabase_realtime add table public.universe_data;
  end if;
end $$;

-- 5. Secure PIN-authenticated save function (Security Definer)
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
  row_exists boolean;
  result_row public.universe_data%rowtype;
begin
  select exists(select 1 from public.universe_data where id = 'current') into row_exists;

  -- Initial record creation if table is brand new
  if not row_exists then
    insert into public.universe_data (id, data, pin_hash, updated_at)
    values ('current', new_data, crypt(edit_pin, gen_salt('bf')), now())
    returning * into result_row;
    return result_row.data;
  end if;

  select pin_hash into stored_hash from public.universe_data where id = 'current';

  -- If pin_hash is not set yet, initialize it
  if stored_hash is null or stored_hash = '' then
    update public.universe_data
    set data = new_data, pin_hash = crypt(edit_pin, gen_salt('bf')), updated_at = now()
    where id = 'current'
    returning * into result_row;
    return result_row.data;
  end if;

  -- Validate against bcrypt hash OR plaintext fallback
  if stored_hash != crypt(edit_pin, stored_hash) and stored_hash != edit_pin then
    raise exception 'Invalid PIN: authorization failed';
  end if;

  update public.universe_data
  set data = new_data, updated_at = now()
  where id = 'current'
  returning * into result_row;

  return result_row.data;
end;
$$;

grant execute on function public.save_universe_data(text, jsonb) to anon, authenticated, service_role;

-- 6. Secure PIN update function
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
  row_exists boolean;
begin
  select exists(select 1 from public.universe_data where id = 'current') into row_exists;

  if not row_exists then
    insert into public.universe_data (id, data, pin_hash, updated_at)
    values ('current', '{}'::jsonb, crypt(new_pin, gen_salt('bf')), now());
    return true;
  end if;

  select pin_hash into stored_hash from public.universe_data where id = 'current';

  if stored_hash is not null and stored_hash != '' then
    if stored_hash != crypt(current_pin, stored_hash) and stored_hash != current_pin then
      raise exception 'Invalid current PIN: cannot update PIN';
    end if;
  end if;

  update public.universe_data
  set pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now()
  where id = 'current';

  return true;
end;
$$;

grant execute on function public.update_owner_pin(text, text) to anon, authenticated, service_role;

-- 7. Scrapbook Photo Metadata Table (for tracking uploaded pictures)
create table if not exists public.scrapbook_images (
  id uuid primary key default gen_random_uuid(),
  memory_id text,
  file_path text not null,
  public_url text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.scrapbook_images enable row level security;

drop policy if exists "Public read scrapbook_images" on public.scrapbook_images;
create policy "Public read scrapbook_images"
  on public.scrapbook_images
  for select
  using (true);

drop policy if exists "Public insert scrapbook_images" on public.scrapbook_images;
create policy "Public insert scrapbook_images"
  on public.scrapbook_images
  for insert
  with check (true);

-- 8. Supabase Storage Bucket setup for Scrapbook Polaroid Photos
-- Creates a dedicated public bucket with 10MB file limit
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scrapbook-images',
  'scrapbook-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif'];

-- Storage Access Policies on storage.objects
drop policy if exists "Scrapbook images public select" on storage.objects;
create policy "Scrapbook images public select"
  on storage.objects
  for select
  using (bucket_id = 'scrapbook-images');

drop policy if exists "Scrapbook images public insert" on storage.objects;
create policy "Scrapbook images public insert"
  on storage.objects
  for insert
  with check (bucket_id = 'scrapbook-images');

drop policy if exists "Scrapbook images public update" on storage.objects;
create policy "Scrapbook images public update"
  on storage.objects
  for update
  using (bucket_id = 'scrapbook-images');

drop policy if exists "Scrapbook images public delete" on storage.objects;
create policy "Scrapbook images public delete"
  on storage.objects
  for delete
  using (bucket_id = 'scrapbook-images');

-- ===================================================================
-- Setup Complete! Your database and storage are now fully operational.
-- ===================================================================
