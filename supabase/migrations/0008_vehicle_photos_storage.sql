-- ============================================================
-- 0008_vehicle_photos_storage.sql
-- Storage bucket for vehicle photos, plus its access policies.
-- Run this AFTER 0007. Requires public.is_admin() (0002).
--
-- The bucket is PRIVATE. Photos are reached through short-lived signed URLs
-- generated at render time, never through a permanent public link.
--
-- PATH CONVENTION -- the policies depend on it:
--     <auth.uid()>/<vehicle_id>/<random>.<ext>
-- The first folder segment is the owner's user id, so ownership can be
-- checked with storage.foldername(name)[1] without a join back to vehicles.
-- The frontend (src/lib/storage.ts) builds paths in exactly this shape.
--
-- NOTE: public.vehicle_photos.url stores this storage PATH, not an https URL.
-- A signed URL expires, so persisting one would rot.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  false,
  10485760, -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lets a user upload only into their own <uid>/... folder; admins anywhere.
drop policy if exists vehicle_photos_object_insert on storage.objects;
create policy vehicle_photos_object_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Lets a user read only files under their own <uid>/... folder; admins all.
drop policy if exists vehicle_photos_object_select on storage.objects;
create policy vehicle_photos_object_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Lets a user replace their own files; admins any file.
drop policy if exists vehicle_photos_object_update on storage.objects;
create policy vehicle_photos_object_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'vehicle-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Lets a user delete their own files; admins any file.
drop policy if exists vehicle_photos_object_delete on storage.objects;
create policy vehicle_photos_object_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
