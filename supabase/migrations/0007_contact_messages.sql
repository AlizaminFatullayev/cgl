-- ============================================================
-- 0007_contact_messages.sql
-- Contact form submissions from the public site.
-- Run this AFTER 0001-0006. Requires public.is_admin() (0002).
--
-- Nothing is emailed anywhere -- the row is the record. An admin reads
-- these in the Prompt B admin panel.
-- ============================================================

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  vin        text,
  message    text        not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Without these GRANTs the policies below would never be reached.
grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;

-- Lets anyone at all, signed in or not, submit the contact form.
drop policy if exists contact_messages_insert on public.contact_messages;
create policy contact_messages_insert
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- Lets only admins read submitted messages. A submitter cannot read back
-- their own message, which is why the UI confirms from the INSERT result
-- rather than by re-querying the table.
drop policy if exists contact_messages_select on public.contact_messages;
create policy contact_messages_select
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());

-- No UPDATE or DELETE policy: messages are append-only for every client role.
