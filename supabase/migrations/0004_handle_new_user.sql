-- ============================================================
-- 0004_handle_new_user.sql
-- Auto-create a profiles row whenever someone signs up.
-- Run this FOURTH (last).
-- ============================================================

-- handle_new_user() mirrors every new auth.users row into public.profiles.
--
-- SECURITY DEFINER is required because the trigger runs in the context of
-- the signing-up user, who has no INSERT policy on public.profiles (by
-- design -- see 0003).
--
-- SECURITY NOTE: role is hard-coded to 'user' and is deliberately NOT read
-- from raw_user_meta_data. That metadata comes straight from the client's
-- signUp() call, so trusting it would let anyone register as an admin.
-- Only full_name is taken from metadata, and it is only ever displayed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
