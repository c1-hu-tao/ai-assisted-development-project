import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bbozmdumdvefwtsfkjho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib3ptZHVtZHZlZnd0c2ZramhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDI4NzgsImV4cCI6MjA5NjA3ODg3OH0.6b4kdxxu6iQAyTeZ4BHh7stdjTCCr7jtLEKPv6VgGpY';

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

export const SETUP_SQL =
`-- Run once in Supabase → SQL Editor → New Query

create table if not exists public.recipes (
  id           uuid        default gen_random_uuid() primary key,
  title        text        not null,
  description  text        default '',
  category     text        default 'Other',
  ingredients  jsonb       default '[]'::jsonb,
  instructions text        default '',
  created_at   timestamptz default now()
);

-- Allow open read/write (shared app, no login required)
alter table public.recipes disable row level security;

-- Enable real-time sync between users
alter publication supabase_realtime add table public.recipes;
alter table public.recipes replica identity full;`;
