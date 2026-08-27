-- Phase 4: creator studio. Marketplace on. Seeded ateliers + unpublished plates.

create table if not exists creator_profiles (
  user_id text primary key,
  slug text not null unique,
  display_name text not null,
  bio text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text
);

create index if not exists creator_profiles_status_idx on creator_profiles (status, applied_at desc);

insert into creator_profiles (user_id, slug, display_name, bio, status, applied_at, reviewed_at)
values
  (
    'creator-atelier',
    'atelier-north',
    'Atelier North',
    'Quiet plates for tall screens. Rings, ridges, true black.',
    'approved',
    now() - interval '80 days',
    now() - interval '78 days'
  ),
  (
    'creator-lumen',
    'studio-lumen',
    'Studio Lumen',
    'Sky, scripture, and the last light of the harbour.',
    'approved',
    now() - interval '50 days',
    now() - interval '48 days'
  )
on conflict (user_id) do nothing;

update wallpapers set creator_id = 'creator-atelier'
 where id in ('quiet-orbit', 'one-line', 'paper-moon', 'ridge-line', 'true-black', 'soft-lock')
   and creator_id is null;

update wallpapers set creator_id = 'creator-lumen'
 where id in ('after-rain-sky', 'silent-satellite', 'be-still', 'late-grid', 'still-water', 'harbour-hour')
   and creator_id is null;

insert into wallpapers
  (id, title, description, category_id, access_type, status, width, height, file_size_bytes, format, aspect_ratio, download_count, favorite_count, published_at)
values
  ('ash-ring', 'Untitled plate', '', 'cat-minimal', 'free', 'draft', 1080, 1920, 636000, 'jpg', '9:16', 0, 0, null),
  ('cold-harbour', 'Untitled plate', '', 'cat-city', 'free', 'draft', 1080, 1920, 500000, 'jpg', '9:16', 0, 0, null),
  ('ink-fold', 'Untitled plate', '', 'cat-dark', 'free', 'draft', 1080, 1920, 521000, 'jpg', '9:16', 0, 0, null),
  ('pale-dune', 'Untitled plate', '', 'cat-iphone', 'free', 'draft', 1080, 1920, 677000, 'jpg', '9:16', 0, 0, null),
  ('night-rail', 'Untitled plate', '', 'cat-cars', 'free', 'draft', 1080, 1920, 362000, 'jpg', '9:16', 0, 0, null),
  ('soft-grid', 'Untitled plate', '', 'cat-abstract', 'free', 'draft', 1080, 1920, 589000, 'jpg', '9:16', 0, 0, null)
on conflict (id) do nothing;

insert into wallpaper_assets (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
values
  ('ash-ring-thumb', 'ash-ring', 'thumbnail', 'public', '/wallpapers/ash-ring.jpg', 400, 711, 160000, 'image/jpeg', true),
  ('ash-ring-prev', 'ash-ring', 'preview', 'public', '/wallpapers/ash-ring.jpg', 1080, 1920, 636000, 'image/jpeg', true),
  ('ash-ring-orig', 'ash-ring', 'original', 'protected', '/wallpapers/ash-ring.jpg', 1080, 1920, 636000, 'image/jpeg', false),
  ('cold-harbour-thumb', 'cold-harbour', 'thumbnail', 'public', '/wallpapers/cold-harbour.jpg', 400, 711, 125000, 'image/jpeg', true),
  ('cold-harbour-prev', 'cold-harbour', 'preview', 'public', '/wallpapers/cold-harbour.jpg', 1080, 1920, 500000, 'image/jpeg', true),
  ('cold-harbour-orig', 'cold-harbour', 'original', 'protected', '/wallpapers/cold-harbour.jpg', 1080, 1920, 500000, 'image/jpeg', false),
  ('ink-fold-thumb', 'ink-fold', 'thumbnail', 'public', '/wallpapers/ink-fold.jpg', 400, 711, 130000, 'image/jpeg', true),
  ('ink-fold-prev', 'ink-fold', 'preview', 'public', '/wallpapers/ink-fold.jpg', 1080, 1920, 521000, 'image/jpeg', true),
  ('ink-fold-orig', 'ink-fold', 'original', 'protected', '/wallpapers/ink-fold.jpg', 1080, 1920, 521000, 'image/jpeg', false),
  ('pale-dune-thumb', 'pale-dune', 'thumbnail', 'public', '/wallpapers/pale-dune.jpg', 400, 711, 169000, 'image/jpeg', true),
  ('pale-dune-prev', 'pale-dune', 'preview', 'public', '/wallpapers/pale-dune.jpg', 1080, 1920, 677000, 'image/jpeg', true),
  ('pale-dune-orig', 'pale-dune', 'original', 'protected', '/wallpapers/pale-dune.jpg', 1080, 1920, 677000, 'image/jpeg', false),
  ('night-rail-thumb', 'night-rail', 'thumbnail', 'public', '/wallpapers/night-rail.jpg', 400, 711, 90000, 'image/jpeg', true),
  ('night-rail-prev', 'night-rail', 'preview', 'public', '/wallpapers/night-rail.jpg', 1080, 1920, 362000, 'image/jpeg', true),
  ('night-rail-orig', 'night-rail', 'original', 'protected', '/wallpapers/night-rail.jpg', 1080, 1920, 362000, 'image/jpeg', false),
  ('soft-grid-thumb', 'soft-grid', 'thumbnail', 'public', '/wallpapers/soft-grid.jpg', 400, 711, 147000, 'image/jpeg', true),
  ('soft-grid-prev', 'soft-grid', 'preview', 'public', '/wallpapers/soft-grid.jpg', 1080, 1920, 589000, 'image/jpeg', true),
  ('soft-grid-orig', 'soft-grid', 'original', 'protected', '/wallpapers/soft-grid.jpg', 1080, 1920, 589000, 'image/jpeg', false)
on conflict (id) do nothing;

update app_settings
   set value = value || '{"creator_marketplace_enabled": true}'::jsonb,
       updated_at = now()
 where key = 'feature_flags';
