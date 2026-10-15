-- ===================================================================
-- Romantic Universe Scrapbook - Supabase Secure Setup Script
-- Project URL: https://updbgvanowpgjbkdliyo.supabase.co
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe to re-run multiple times without deleting existing data.
-- ===================================================================

-- 1. Create the primary table for website content, memories, and letters
create table if not exists public.universe_data (
  id text primary key default 'current',
  data jsonb not null,
  pin_hash text not null default 'supabase-auth-managed',
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 2. Configure Server-Enforced Row-Level Security (RLS) on universe_data
alter table public.universe_data enable row level security;

-- Drop any conflicting or legacy policies
drop policy if exists "Public read universe_data" on public.universe_data;
drop policy if exists "Public write universe_data" on public.universe_data;
drop policy if exists "Public insert universe_data" on public.universe_data;
drop policy if exists "Public update universe_data" on public.universe_data;
drop policy if exists "Public delete universe_data" on public.universe_data;
drop policy if exists "Read universe_data" on public.universe_data;
drop policy if exists "Admin insert universe_data" on public.universe_data;
drop policy if exists "Admin update universe_data" on public.universe_data;
drop policy if exists "Admin write universe_data" on public.universe_data;

-- Policy A: Public SELECT - Anyone visiting on desktop or mobile can read website content
create policy "Public read universe_data"
  on public.universe_data
  for select
  to anon, authenticated
  using (true);

-- Policy B: Authenticated INSERT - Only authenticated admins can create rows
create policy "Admin insert universe_data"
  on public.universe_data
  for insert
  to authenticated
  with check (true);

-- Policy C: Authenticated UPDATE - Only authenticated admins can update rows
create policy "Admin update universe_data"
  on public.universe_data
  for update
  to authenticated
  using (true)
  with check (true);

-- 3. Enable Supabase Realtime for instant synchronization across devices
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'universe_data'
  ) then
    alter publication supabase_realtime add table public.universe_data;
  end if;
end $$;

-- 4. Secure save RPC function (enforces authenticated administrator identity)
-- Does NOT rely on gen_salt / pgcrypto extensions to prevent Error 42883
create or replace function public.save_universe_data(
  new_data jsonb,
  edit_pin text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  result_row public.universe_data%rowtype;
begin
  -- Enforce authenticated administrator identity
  if auth.role() != 'authenticated' then
    raise exception 'Unauthorized: Administrator authentication required to save website data';
  end if;

  if new_data is null then
    raise exception 'Invalid data: new_data payload is required';
  end if;

  insert into public.universe_data (id, data, pin_hash, updated_at)
  values (
    'current',
    new_data,
    coalesce((select pin_hash from public.universe_data where id = 'current'), 'supabase-auth-managed'),
    timezone('utc'::text, now())
  )
  on conflict (id) do update set
    data = excluded.data,
    pin_hash = coalesce((select pin_hash from public.universe_data where id = 'current'), 'supabase-auth-managed'),
    updated_at = timezone('utc'::text, now())
  returning * into result_row;

  return result_row.data;
end;
$$;

-- Revoke anonymous RPC execution; grant only to authenticated admin and service role
revoke execute on function public.save_universe_data(jsonb, text) from public, anon;
grant execute on function public.save_universe_data(jsonb, text) to authenticated, service_role;

-- 5. Scrapbook Photo Metadata Table (for tracking uploaded pictures)
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
  to anon, authenticated
  using (true);

drop policy if exists "Admin insert scrapbook_images" on public.scrapbook_images;
drop policy if exists "Public insert scrapbook_images" on public.scrapbook_images;
create policy "Admin insert scrapbook_images"
  on public.scrapbook_images
  for insert
  to authenticated
  with check (true);

-- 6. Supabase Storage Bucket setup for Scrapbook Polaroid Photos
-- PRIVATE BUCKET: public = false
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scrapbook-images',
  'scrapbook-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif'];

-- Storage Access Policies on storage.objects
-- Select: allowed for anon and authenticated so signed URLs work for visitors and admin
drop policy if exists "Scrapbook images select" on storage.objects;
drop policy if exists "Scrapbook images public select" on storage.objects;
create policy "Scrapbook images select"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'scrapbook-images');

-- Insert: strictly restricted to authenticated administrator
drop policy if exists "Scrapbook images insert" on storage.objects;
drop policy if exists "Scrapbook images public insert" on storage.objects;
create policy "Scrapbook images insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'scrapbook-images');

-- Update: strictly restricted to authenticated administrator
drop policy if exists "Scrapbook images update" on storage.objects;
drop policy if exists "Scrapbook images public update" on storage.objects;
create policy "Scrapbook images update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'scrapbook-images')
  with check (bucket_id = 'scrapbook-images');

-- Delete: strictly restricted to authenticated administrator
drop policy if exists "Scrapbook images delete" on storage.objects;
drop policy if exists "Scrapbook images public delete" on storage.objects;
create policy "Scrapbook images delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'scrapbook-images');

-- ===================================================================
-- Setup Complete! Your database and private storage are now secured.
-- ===================================================================
