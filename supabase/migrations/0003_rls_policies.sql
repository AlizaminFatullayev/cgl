-- ============================================================
-- 0003_rls_policies.sql
-- Row Level Security: enable on every table, then define policies.
-- Run this THIRD (requires public.is_admin() from 0002).
--
-- Reading guide: each policy has a one-line comment stating who it lets
-- do what. Anything not granted by a policy is denied by default.
--
-- Note on the service_role key (used only by server-side/admin tooling,
-- never by the frontend): it bypasses RLS entirely. Every rule below
-- applies to the anon and authenticated roles.
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.vehicles       enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.invoices       enable row level security;
alter table public.transactions   enable row level security;
alter table public.shipping_rates enable row level security;

-- ------------------------------------------------------------
-- Base table privileges. RLS narrows these further; without a GRANT the
-- policies would never even be reached.
-- ------------------------------------------------------------
grant select on public.shipping_rates to anon;

grant select, insert, update, delete
  on public.profiles, public.vehicles, public.vehicle_photos,
     public.invoices, public.transactions, public.shipping_rates
  to authenticated;

-- ============================================================
-- profiles
-- ============================================================

-- Lets a signed-in user read their own profile row; admins read every row.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Lets a signed-in user edit their own profile row; admins edit any row.
-- The privileged columns (role, balance) are locked down separately by the
-- profiles_guard_privileged_columns trigger below -- a WITH CHECK clause
-- cannot see the OLD row, so it cannot express "this column did not change".
drop policy if exists profiles_update on public.profiles;
create policy profiles_update
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- No INSERT policy: profile rows are created only by the handle_new_user
-- trigger (0004), which is SECURITY DEFINER and therefore bypasses RLS.
-- No DELETE policy: profiles disappear via ON DELETE CASCADE from auth.users.

-- Blocks privilege and balance escalation: a non-admin cannot change their
-- own role (no self-promotion to admin) or their own balance (no free
-- money), even though they may otherwise update their own row.
create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an admin can change profiles.role';
    end if;
    if new.balance is distinct from old.balance then
      raise exception 'Only an admin can change profiles.balance';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row
  execute function public.guard_privileged_profile_columns();

-- ============================================================
-- vehicles
-- ============================================================

-- Lets a user read only vehicles they own; admins read every vehicle.
drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select
  on public.vehicles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Lets a user file a vehicle under their own user_id, and ONLY at the
-- starting status 'At Auction'; admins may insert any row at any status.
-- This is the enforcement point for "status is never writable by a
-- non-admin": since UPDATE is admin-only (below), INSERT is the only way a
-- normal user could otherwise plant an arbitrary status such as
-- 'Delivered'. Omitting status in the INSERT is fine -- the column default
-- is 'At Auction', which satisfies this check.
drop policy if exists vehicles_insert on public.vehicles;
create policy vehicles_insert
  on public.vehicles
  for insert
  to authenticated
  with check (
    (user_id = auth.uid() and status = 'At Auction')
    or public.is_admin()
  );

-- Lets only admins modify a vehicle -- including its status, container and
-- booking numbers, and money columns. Users cannot update their own rows.
drop policy if exists vehicles_update on public.vehicles;
create policy vehicles_update
  on public.vehicles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lets only admins delete a vehicle.
drop policy if exists vehicles_delete on public.vehicles;
create policy vehicles_delete
  on public.vehicles
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- vehicle_photos
-- ============================================================

-- Lets a user see photos of vehicles they own; admins see all photos.
drop policy if exists vehicle_photos_select on public.vehicle_photos;
create policy vehicle_photos_select
  on public.vehicle_photos
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.vehicles v
      where v.id = vehicle_photos.vehicle_id
        and v.user_id = auth.uid()
    )
  );

-- Lets a user attach a photo only to a vehicle they own; admins to any.
drop policy if exists vehicle_photos_insert on public.vehicle_photos;
create policy vehicle_photos_insert
  on public.vehicle_photos
  for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.vehicles v
      where v.id = vehicle_photos.vehicle_id
        and v.user_id = auth.uid()
    )
  );

-- Lets only admins edit a photo row.
drop policy if exists vehicle_photos_update on public.vehicle_photos;
create policy vehicle_photos_update
  on public.vehicle_photos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lets only admins delete a photo row.
drop policy if exists vehicle_photos_delete on public.vehicle_photos;
create policy vehicle_photos_delete
  on public.vehicle_photos
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- invoices
-- ============================================================

-- Lets a user read only invoices addressed to them; admins read all.
drop policy if exists invoices_select on public.invoices;
create policy invoices_select
  on public.invoices
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Lets only admins raise an invoice.
drop policy if exists invoices_insert on public.invoices;
create policy invoices_insert
  on public.invoices
  for insert
  to authenticated
  with check (public.is_admin());

-- Lets only admins edit an invoice.
drop policy if exists invoices_update on public.invoices;
create policy invoices_update
  on public.invoices
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lets only admins delete an invoice.
drop policy if exists invoices_delete on public.invoices;
create policy invoices_delete
  on public.invoices
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- transactions
-- ============================================================

-- Lets a user read only their own balance movements; admins read all.
drop policy if exists transactions_select on public.transactions;
create policy transactions_select
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Lets only admins record a transaction (users cannot credit themselves).
drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert
  on public.transactions
  for insert
  to authenticated
  with check (public.is_admin());

-- Lets only admins edit a transaction.
drop policy if exists transactions_update on public.transactions;
create policy transactions_update
  on public.transactions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lets only admins delete a transaction.
drop policy if exists transactions_delete on public.transactions;
create policy transactions_delete
  on public.transactions
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- shipping_rates
-- ============================================================

-- Lets anyone at all, signed in or not, read the shipping rate table.
drop policy if exists shipping_rates_select on public.shipping_rates;
create policy shipping_rates_select
  on public.shipping_rates
  for select
  to anon, authenticated
  using (true);

-- Lets only admins add a rate row.
drop policy if exists shipping_rates_insert on public.shipping_rates;
create policy shipping_rates_insert
  on public.shipping_rates
  for insert
  to authenticated
  with check (public.is_admin());

-- Lets only admins edit a rate row.
drop policy if exists shipping_rates_update on public.shipping_rates;
create policy shipping_rates_update
  on public.shipping_rates
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lets only admins delete a rate row.
drop policy if exists shipping_rates_delete on public.shipping_rates;
create policy shipping_rates_delete
  on public.shipping_rates
  for delete
  to authenticated
  using (public.is_admin());
