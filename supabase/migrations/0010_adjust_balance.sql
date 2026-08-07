-- ============================================================
-- 0010_adjust_balance.sql
-- The ONLY sanctioned way to move money.
-- Run this AFTER 0009.
--
-- Balance and transactions must never drift apart. This function writes both
-- or neither: a PL/pgSQL function runs inside the caller's transaction, so
-- any exception raised here rolls back every statement below it.
--
-- The client calls it with:
--   supabase.rpc('adjust_balance', { target_user, delta, note })
-- and must never UPDATE profiles.balance directly.
-- ============================================================

-- transactions had no note column; adjust_balance is required to record one.
alter table public.transactions
  add column if not exists note text;

create or replace function public.adjust_balance(
  target_user uuid,
  delta       numeric,
  note        text default null
)
returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_balance numeric;
begin
  -- Gate first, before anything is written.
  if not coalesce(public.is_admin(), false) then
    raise exception 'Only an admin can adjust a balance'
      using errcode = '42501';
  end if;

  if delta is null or delta = 0 then
    raise exception 'delta must be a non-zero number'
      using errcode = '22023';
  end if;

  -- Lock the profile row so two concurrent adjustments cannot interleave
  -- and lose one another's delta.
  perform 1 from public.profiles where id = target_user for update;
  if not found then
    raise exception 'No profile found for user %', target_user
      using errcode = 'P0002';
  end if;

  insert into public.transactions (user_id, amount, type, note)
  values (
    target_user,
    delta,
    case when delta > 0 then 'credit' else 'debit' end,
    nullif(btrim(coalesce(note, '')), '')
  );

  -- The arithmetic stays in SQL on a numeric column -- never in JS, where it
  -- would go through a binary float.
  --
  -- NOTE: the guard_privileged_profile_columns BEFORE UPDATE trigger (0003)
  -- also calls is_admin() here. That is intentional belt-and-braces: this
  -- statement only lands for a caller who is genuinely an admin.
  update public.profiles
     set balance = balance + delta
   where id = target_user
  returning balance into new_balance;

  return new_balance;
end;
$$;

revoke execute on function public.adjust_balance(uuid, numeric, text) from public, anon;
grant execute on function public.adjust_balance(uuid, numeric, text) to authenticated;
