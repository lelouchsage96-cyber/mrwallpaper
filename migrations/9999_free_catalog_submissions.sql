-- Free catalog + community wallpaper submissions.
-- Premium and creator-marketplace data is archived in place; public catalog behavior becomes free-only.

CREATE TABLE IF NOT EXISTS wallpaper_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL REFERENCES categories(id),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  alt_text TEXT NOT NULL DEFAULT '',
  primary_keyword TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'phone',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT 'jpg',
  mime TEXT NOT NULL DEFAULT 'image/jpeg',
  sha256 TEXT,
  source_sha256 TEXT,
  original_path TEXT NOT NULL,
  preview_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  preview_width INTEGER,
  preview_height INTEGER,
  preview_bytes BIGINT NOT NULL DEFAULT 0,
  thumbnail_width INTEGER,
  thumbnail_height INTEGER,
  thumbnail_bytes BIGINT NOT NULL DEFAULT 0,
  rights_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  published_wallpaper_id TEXT,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallpaper_submissions_status_created_idx
  ON wallpaper_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS wallpaper_submissions_user_created_idx
  ON wallpaper_submissions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wallpaper_submissions_source_sha_idx
  ON wallpaper_submissions(source_sha256);

CREATE TABLE IF NOT EXISTS ai_generation_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_generation_events_user_kind_created_idx
  ON ai_generation_events(user_id, kind, created_at DESC);

UPDATE wallpapers
SET access_type = 'free', updated_at = now()
WHERE access_type <> 'free';

UPDATE wallpapers
SET creator_id = NULL, updated_at = now()
WHERE creator_id IS NOT NULL AND status = 'approved';

UPDATE profiles
SET role = 'user', updated_at = now()
WHERE role = 'creator';

INSERT INTO app_settings (key, value)
VALUES (
  'feature_flags',
  '{"creator_marketplace_enabled":false,"premium_enabled":false,"lifetime_purchase_enabled":false}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = COALESCE(app_settings.value, '{}'::jsonb) || EXCLUDED.value,
    updated_at = now();
