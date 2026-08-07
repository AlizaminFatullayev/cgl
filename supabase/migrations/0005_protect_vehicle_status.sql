-- Blocks non-admins from changing a vehicle's status on UPDATE.
-- INSERT is already guarded (must start at 'At Auction'); this closes the UPDATE gap.
-- Only an admin may move a vehicle between statuses (At Auction -> Delivered).

create or replace function guard_vehicle_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not is_admin() then
    raise exception 'Only an admin can change a vehicle''s status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_vehicle_status on vehicles;

create trigger trg_guard_vehicle_status
  before update on vehicles
  for each row
  execute function guard_vehicle_status();