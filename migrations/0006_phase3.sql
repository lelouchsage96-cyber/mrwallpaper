-- Phase 3: taste, notifications, lock+home pairs.

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

insert into wallpaper_pairs
  (id, slug, name, description, lock_wallpaper_id, home_wallpaper_id, is_visible, sort_order)
values
  ('pair-quiet', 'quiet-pair', 'Quiet pair', 'A ring for lock. A line for home.', 'quiet-orbit', 'one-line', true, 1),
  ('pair-dune', 'lock-pair', 'Lock pair', 'Composed for a tall screen.', 'soft-lock', 'lock-dune', true, 2),
  ('pair-dusk', 'dusk-pair', 'Dusk pair', 'Ridge at lock. Water at home.', 'ridge-line', 'still-water', true, 3),
  ('pair-paper', 'paper-pair', 'Paper pair', 'Moon, then grain.', 'paper-moon', 'film-dust', true, 4),
  ('pair-black', 'black-pair', 'True black pair', 'OLED lock. Hairline home.', 'true-black', 'thin-cross', true, 5)
on conflict (id) do nothing;

update app_settings
   set value = value || '{"notifications_enabled": true}'::jsonb,
       updated_at = now()
 where key = 'feature_flags';
