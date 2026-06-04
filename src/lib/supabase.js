import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bbozmdumdvefwtsfkjho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib3ptZHVtZHZlZnd0c2ZramhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDI4NzgsImV4cCI6MjA5NjA3ODg3OH0.6b4kdxxu6iQAyTeZ4BHh7stdjTCCr7jtLEKPv6VgGpY';

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
`-- Add owner_id to existing recipes table
alter table public.recipes
  add column if not exists owner_id uuid references auth.users(id),
  add column if not exists search_ingredients jsonb default '[]'::jsonb;

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
