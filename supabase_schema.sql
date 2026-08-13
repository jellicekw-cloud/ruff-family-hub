-- Run this once in your Supabase project's SQL Editor
-- (Project: dgqqfgmxejswjbqhkzok -> SQL Editor -> New Query -> paste -> Run)

create table if not exists pantry_items (
  id text primary key,
  name text not null,
  category text not null,
  quantity numeric not null default 0,
  unit text not null default 'pcs',
  status text not null default 'in_stock',
  expiry_date date,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists shopping_items (
  id text primary key,
  name text not null,
  category text not null,
  quantity text not null default '1',
  added_by_member_id text,
  assigned_to_member_id text,
  is_completed boolean not null default false,
  urgent boolean not null default false,
  source_pantry_item_id text,
  source_recipe_title text,
  created_at timestamptz not null default now()
);

-- Row Level Security: enabled with a permissive "allow all" policy since this
-- app uses the public anon key with no login (private family tablet + your phone).
-- Anyone with the anon key (visible in the deployed frontend's JS bundle) can
-- read/write these two tables. That's expected for a household app like this,
-- but don't reuse this same open policy for anything containing sensitive data.

alter table pantry_items enable row level security;
alter table shopping_items enable row level security;

create policy "Allow all access to pantry_items"
  on pantry_items for all
  using (true)
  with check (true);

create policy "Allow all access to shopping_items"
  on shopping_items for all
  using (true)
  with check (true);
