-- Phase 3: taste, notifications, lock+home pairs schema.
-- Demo pair records were removed.

alter table profiles
  add column if not exists notifications_on boolean not null default true;

create table if not exists user_tastes (
  user_id text not null,
  category_id text not null references categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  kind text not null check (kind in ('wotd', 'pair', 'collection', 'premium', 'taste', 'report', 'system')),
  title text not null,
  body text not null default '',
  wallpaper_id text references wallpapers(id) on delete set null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);

create table if not exists wallpaper_pairs (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  lock_wallpaper_id text not null references wallpapers(id),
  home_wallpaper_id text not null references wallpapers(id),
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

update app_settings
   set value = value || '{"notifications_enabled": true}'::jsonb,
       updated_at = now()
 where key = 'feature_flags';
