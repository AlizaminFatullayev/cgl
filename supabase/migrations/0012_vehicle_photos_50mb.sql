-- ============================================================
-- 0012_vehicle_photos_50mb.sql
-- Raises the vehicle-photos per-file ceiling from 10 MB to 50 MB.
-- Run this AFTER 0008.
--
-- WHY: customers upload straight off a camera or a desktop folder, where a
-- single photo is routinely 8-15 MB. The old 10 MB ceiling rejected those at
-- the storage layer, and the client mirrored the same number, so a batch of
-- ten ~10 MB photos could not be added to a vehicle at all.
--
-- The browser now downscales and re-encodes before upload (see
-- src/lib/image-compress.ts), so files should normally arrive around 2 MB.
-- The 50 MB ceiling is headroom for the pass-through cases -- a photo that is
-- already small, or a format the canvas pipeline declines to re-encode -- not
-- a target.
--
-- NOTHING ELSE CHANGES. The bucket stays PRIVATE, the allowed MIME types are
-- untouched, and none of the four storage policies from 0008 are altered:
-- this statement only updates the two columns named below.
-- ============================================================

update storage.buckets
   set file_size_limit = 52428800 -- 50 MB
 where id = 'vehicle-photos';

-- Verify:
--   select id, public, file_size_limit, allowed_mime_types
--     from storage.buckets where id = 'vehicle-photos';
-- Expect: public = false, file_size_limit = 52428800,
--         allowed_mime_types = {image/jpeg,image/png,image/webp,image/avif}
