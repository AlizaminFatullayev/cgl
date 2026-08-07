-- ============================================================
-- 0011_admin_read_helpers.sql
-- Read-only helpers for the admin panel.
-- Run this AFTER 0010 (last).
--
-- Two things the frontend cannot do on its own:
--   1. auth.users.email is not reachable through PostgREST, so the customer
--      list needs a definer function to join it in.
--   2. Money aggregates must be summed as SQL numeric, not as JS floats.
--
-- Both raise (rather than quietly returning nothing) for a non-admin, so the
-- UI gets a real error instead of an empty screen it might read as "no data".
-- ============================================================

-- Counts and money totals for the /admin overview.
create or replace function public.admin_overview_stats()
returns table (
  customers        bigint,
  vehicles_total   bigint,
  at_auction       bigint,
  in_transit       bigint,
  at_port          bigint,
  on_ocean         bigint,
  delivered        bigint,
  unread_messages  bigint,
  outstanding      numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles where role = 'user'),
    (select count(*) from public.vehicles),
    (select count(*) from public.vehicles where status = 'At Auction'),
    (select count(*) from public.vehicles where status = 'In Transit'),
    (select count(*) from public.vehicles where status = 'At Port'),
    (select count(*) from public.vehicles where status = 'On Ocean'),
    (select count(*) from public.vehicles where status = 'Delivered'),
    (select count(*) from public.contact_messages where is_read = false),
    -- Outstanding never goes below zero per vehicle: an overpaid car must not
    -- silently offset another car's debt.
    (select coalesce(sum(greatest(coalesce(total_amount, 0) - coalesce(paid, 0), 0)), 0)
       from public.vehicles);
end;
$$;

revoke execute on function public.admin_overview_stats() from public, anon;
grant execute on function public.admin_overview_stats() to authenticated;

-- Customer list with the email joined in from auth.users, plus vehicle count.
create or replace function public.admin_list_customers()
returns table (
  id            uuid,
  full_name     text,
  email         text,
  balance       numeric,
  role          text,
  created_at    timestamptz,
  vehicle_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    u.email::text,
    p.balance,
    p.role,
    p.created_at,
    count(v.id) as vehicle_count
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.vehicles v on v.user_id = p.id
  group by p.id, p.full_name, u.email, p.balance, p.role, p.created_at
  order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_customers() from public, anon;
grant execute on function public.admin_list_customers() to authenticated;
