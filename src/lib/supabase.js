import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Fresh install — run this once in Supabase → SQL Editor → New Query
export const SETUP_SQL =
`-- 1. Create the recipes table
create table if not exists public.recipes (
  id                 uuid        default gen_random_uuid() primary key,
  title              text        not null,
  description        text        default '',
  category           text        default 'Other',
  ingredients        jsonb       default '[]'::jsonb,
  search_ingredients jsonb       default '[]'::jsonb,
  instructions       text        default '',
  owner_id           uuid        references auth.users(id),
  created_at         timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.recipes enable row level security;

-- 3. RLS policies
create policy "Anyone can read recipes"
  on public.recipes for select using (true);

create policy "Authenticated users can insert their own recipes"
  on public.recipes for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update their own recipes"
  on public.recipes for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete to authenticated
  using (auth.uid() = owner_id);

-- 4. Real-time
alter publication supabase_realtime add table public.recipes;
alter table public.recipes replica identity full;`;

// Existing install migration — run if the table already exists
export const MIGRATION_SQL =
`-- Add columns to existing recipes table
alter table public.recipes
  add column if not exists owner_id uuid references auth.users(id),
  add column if not exists search_ingredients jsonb default '[]'::jsonb,
  add column if not exists photo_url text;

-- Enable RLS (safe to run even if already enabled)
alter table public.recipes enable row level security;

-- Drop old open-access policies if any, then create correct ones
drop policy if exists "allow all" on public.recipes;

create policy "Anyone can read recipes"
  on public.recipes for select using (true);

create policy "Authenticated users can insert their own recipes"
  on public.recipes for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update their own recipes"
  on public.recipes for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete to authenticated
  using (auth.uid() = owner_id);`;

// Storage bucket setup — run once after the migration above
export const STORAGE_SQL =
`-- Create public bucket for recipe photos
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- Anyone can view photos
create policy "Anyone can view recipe photos"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

-- Authenticated users can upload
create policy "Authenticated users can upload recipe photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-photos');

-- Users can replace/delete their own photos (stored under their uid folder)
create policy "Users can update their own recipe photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own recipe photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-photos' and auth.uid()::text = (storage.foldername(name))[1]);`;
