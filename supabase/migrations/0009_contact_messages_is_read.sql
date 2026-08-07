-- ============================================================
-- 0009_contact_messages_is_read.sql
-- Read/unread marker for the admin messages inbox.
-- Run this AFTER 0008.
-- ============================================================

alter table public.contact_messages
  add column if not exists is_read boolean not null default false;

-- Partial index: the inbox almost always asks "what is still unread?".
create index if not exists contact_messages_unread_idx
  on public.contact_messages (created_at desc)
  where is_read = false;

-- 0007 gave contact_messages no UPDATE policy at all, so marking a message
-- read would have failed silently (zero rows, no error). This adds the one
-- write path an admin needs.
--
-- Lets only admins flip a message between read and unread.
drop policy if exists contact_messages_update on public.contact_messages;
create policy contact_messages_update
  on public.contact_messages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant update (is_read) on public.contact_messages to authenticated;
