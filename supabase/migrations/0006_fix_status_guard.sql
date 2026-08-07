-- The status guard ran as SECURITY DEFINER, which changed the auth context
-- so is_admin() / auth.uid() did not resolve to the calling user, letting the
-- UPDATE slip through. The trigger function does not need definer rights —
-- is_admin() already carries its own. Recreate it as SECURITY INVOKER.

create or replace function guard_vehicle_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not coalesce(is_admin(), false) then
    raise exception 'Only an admin can change a vehicle''s status';
  end if;
  return new;
end;
$$;