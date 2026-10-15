-- ===================================================================
-- Romantic Universe - Supabase Hardened Setup Script
-- This script preserves the current app architecture while locking down writes.
-- It does not delete existing data and is safe to re-run.
-- ===================================================================

-- 1. Enable pgcrypto for secure PIN hashing
create extension if not exists pgcrypto;

-- 2. Create or update the main data table used by the app
create table if not exists public.universe_data (
  id text primary key default 'current',
  data jsonb not null,
  pin_hash text not null default crypt('1234', gen_salt('bf')),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 3. RLS: allow read access to the public website, but keep writes server-side only
alter table public.universe_data enable row level security;

drop policy if exists "Public read universe_data" on public.universe_data;
drop policy if exists "Public insert universe_data" on public.universe_data;
drop policy if exists "Public update universe_data" on public.universe_data;

drop policy if exists "Read universe_data" on public.universe_data;

drop policy if exists "Public write universe_data" on public.universe_data;

create policy "Public read universe_data"
  on public.universe_data
  for select
  using (true);

-- Intentionally no public INSERT or UPDATE policies.
-- Writes must go through security-definer functions below.

-- 4. Realtime: keep the app's cross-device sync working
 do $$
 begin
   if not exists (
     select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'universe_data'
   ) then
     alter publication supabase_realtime add table public.universe_data;
   end if;
 end $$;

-- 5. Hardened save function: verifies the PIN in Postgres and writes JSON safely
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
  result_row public.universe_data%rowtype;
begin
  select pin_hash into stored_hash from public.universe_data where id = 'current';

  if stored_hash is null then
    insert into public.universe_data (id, data, pin_hash, updated_at)
    values ('current', new_data, crypt(edit_pin, gen_salt('bf')), now())
    returning * into result_row;
    return result_row.data;
  end if;

  if stored_hash != crypt(edit_pin, stored_hash) then
    raise exception 'Invalid PIN: authorization failed';
  end if;

  update public.universe_data
  set data = new_data, updated_at = now()
  where id = 'current'
  returning * into result_row;

  return result_row.data;
end;
$$;

-- 6. Hardened PIN update function: keeps the current UX but validates in Postgres
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
    raise exception 'No owner PIN present; initialize via save_universe_data first';
  end if;

  if stored_hash != crypt(current_pin, stored_hash) then
    raise exception 'Invalid current PIN: cannot update PIN';
  end if;

  update public.universe_data
  set pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now()
  where id = 'current';

  return true;
end;
$$;

-- 7. Metadata table for image records, so upload metadata can be stored without exposing files
create table if not exists public.scrapbook_images (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  uploader text,
  is_private boolean default true,
  metadata jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.scrapbook_images enable row level security;

drop policy if exists "Public read scrapbook_images" on public.scrapbook_images;
create policy "Public read scrapbook_images"
  on public.scrapbook_images
  for select
  using (is_private = false);

-- do not create any public insert/update/delete policies here.
-- these should be server-side and PIN-authenticated.

create or replace function public.insert_scrapbook_image(
  edit_pin text,
  file_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  is_private boolean,
  metadata jsonb
) returns public.scrapbook_images
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
  new_row public.scrapbook_images%rowtype;
begin
  select pin_hash into stored_hash from public.universe_data where id = 'current';

  if stored_hash is null then
    raise exception 'Owner PIN not set in database';
  end if;

  if stored_hash != crypt(edit_pin, stored_hash) then
    raise exception 'Invalid owner PIN: cannot add image metadata';
  end if;

  insert into public.scrapbook_images (
    file_path,
    file_name,
    mime_type,
    size_bytes,
    is_private,
    metadata
  )
  values (
    file_path,
    file_name,
    mime_type,
    size_bytes,
    is_private,
    metadata
  )
  returning * into new_row;

  return new_row;
end;
$$;

-- 8. Storage bucket setup for uploads
-- NOTE: For truly private images, use a private bucket and signed URLs. Do not expose
-- service-role keys in browser code. If you keep a public bucket, keep it explicitly public.
insert into storage.buckets (id, name, public)
values ('scrapbook-images', 'scrapbook-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Scrapbook images public read" on storage.objects;
drop policy if exists "Scrapbook images private upload" on storage.objects;
drop policy if exists "Scrapbook images private update" on storage.objects;
drop policy if exists "Scrapbook images private delete" on storage.objects;

-- Public read is intentionally omitted for private images by default.
-- Only use server-side signed URLs for private access.
create policy "Scrapbook images private upload"
  on storage.objects
  for insert
  with check (bucket_id = 'scrapbook-images');

create policy "Scrapbook images private update"
  on storage.objects
  for update
  using (bucket_id = 'scrapbook-images');

create policy "Scrapbook images private delete"
  on storage.objects
  for delete
  using (bucket_id = 'scrapbook-images');

-- End of script
