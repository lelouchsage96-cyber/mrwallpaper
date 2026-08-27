-- Creator uploads: image bytes live in Postgres so preview and Vercel both work
-- without a writable filesystem. Served at /api/media/:id.

create table if not exists media_files (
  id text primary key,
  mime text not null,
  bytes integer not null,
  width integer not null,
  height integer not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
