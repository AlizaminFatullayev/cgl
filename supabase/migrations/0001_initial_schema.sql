-- ============================================================
-- 0001_initial_schema.sql
-- Core tables for the car-import logistics app.
-- Run this FIRST. No RLS is enabled here (see 0003).
-- ============================================================

-- gen_random_uuid() ships with Postgres 13+ and is already available on
-- Supabase; this is a no-op guard for self-hosted instances.
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- profiles: one row per auth.users row, created by a trigger (see 0004).
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  balance    numeric     not null default 0,
  role       text        not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- vehicles: the imported cars themselves.
-- ------------------------------------------------------------
create table if not exists public.vehicles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles (id) on delete cascade,
  year             int,
  make             text,
  model            text,
  vin              text,
  lot_number       text,
  container_number text,
  booking_number   text,
  receiver         text,
  shipping_line    text,
  status           text        not null default 'At Auction'
                     check (status in ('At Auction', 'In Transit', 'At Port', 'On Ocean', 'Delivered')),
  total_amount     numeric     not null default 0,
  paid             numeric     not null default 0,
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists vehicles_user_id_idx on public.vehicles (user_id);
create index if not exists vehicles_status_idx on public.vehicles (status);

-- ------------------------------------------------------------
-- vehicle_photos: photos attached to a vehicle.
-- ------------------------------------------------------------
create table if not exists public.vehicle_photos (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  url        text,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_photos_vehicle_id_idx on public.vehicle_photos (vehicle_id);

-- ------------------------------------------------------------
-- invoices: amounts billed to a user, optionally tied to a vehicle.
-- ------------------------------------------------------------
create table if not exists public.invoices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  amount     numeric,
  status     text,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);

-- ------------------------------------------------------------
-- transactions: balance movements (top-ups, charges).
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,
  amount     numeric,
  type       text        not null default 'topup',
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);

-- ------------------------------------------------------------
-- shipping_rates: public rate lookup table.
-- Column names match the 435-row CSV import exactly.
-- ------------------------------------------------------------
create table if not exists public.shipping_rates (
  id         uuid primary key default gen_random_uuid(),
  state_code text,
  state_name text,
  branch     text,
  rate       int
);

create index if not exists shipping_rates_state_code_idx on public.shipping_rates (state_code);
