-- Guard columns that queries depend on. Safe on fresh PGLite and on Neon
-- databases that applied an older 0002 without collections.sort_order.

alter table collections add column if not exists sort_order integer not null default 0;

alter table wallpaper_pairs add column if not exists sort_order integer not null default 0;
alter table wallpaper_pairs add column if not exists is_visible boolean not null default true;

alter table wallpapers add column if not exists slug text;
alter table wallpapers add column if not exists seo_title text;
alter table wallpapers add column if not exists seo_description text;
alter table wallpapers add column if not exists alt_text text;
alter table wallpapers add column if not exists canonical_path text;
alter table wallpapers add column if not exists robots text;
alter table wallpapers add column if not exists device_type text;

alter table categories add column if not exists seo_title text;
alter table categories add column if not exists seo_description text;
alter table categories add column if not exists alt_text text;
alter table categories add column if not exists canonical_path text;
alter table categories add column if not exists robots text;
alter table categories add column if not exists intro text;
alter table categories add column if not exists sort_order integer not null default 0;

update collections
   set sort_order = case id
     when 'col-amoled' then 1
     when 'col-minimal-iphone' then 2
     when 'col-dark' then 3
     else 10
   end
 where sort_order = 0;

create table if not exists seo_redirects (
  from_path text primary key,
  to_path text not null,
  status integer not null default 301,
  created_at timestamptz not null default now()
);
