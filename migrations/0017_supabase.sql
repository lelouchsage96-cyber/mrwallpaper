-- Studio plates can live in Supabase Storage. media_files keeps a pointer
-- (storage + storage_key) so /api/media still gates originals.

alter table media_files
  add column if not exists storage text not null default 'db';

alter table media_files
  add column if not exists storage_key text;
