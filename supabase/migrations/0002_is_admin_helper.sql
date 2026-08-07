-- ============================================================
-- 0002_is_admin_helper.sql
-- Role helper used by every RLS policy in 0003.
-- Run this SECOND (after 0001, before 0003).
-- ============================================================

-- is_admin() returns true when the calling user has role = 'admin'.
--
-- SECURITY DEFINER is REQUIRED, not a shortcut: the policies on
-- public.profiles call this function, and the function reads
-- public.profiles. Without SECURITY DEFINER the read would re-enter the
-- profiles policy that is currently being evaluated and Postgres would
-- abort with "infinite recursion detected in policy for relation profiles".
-- Running as the definer bypasses RLS for this one narrow lookup.
--
-- The function takes no arguments and leaks nothing beyond "is the caller
-- an admin", so it is safe to expose to authenticated users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;
