alter table wallpapers add column if not exists slug text;
alter table wallpapers add column if not exists seo_title text;
alter table wallpapers add column if not exists seo_description text;
alter table wallpapers add column if not exists alt_text text;
alter table wallpapers add column if not exists canonical_path text;
alter table wallpapers add column if not exists robots text not null default 'index';

alter table categories add column if not exists seo_title text;
alter table categories add column if not exists seo_description text;
alter table categories add column if not exists alt_text text;
alter table categories add column if not exists canonical_path text;
alter table categories add column if not exists robots text not null default 'index';
alter table categories add column if not exists intro text;

create table if not exists seo_redirects (
  from_path text primary key,
  to_path text not null,
  status integer not null default 301,
  created_at timestamptz not null default now()
);

insert into app_settings (key, value)
values (
  'seo',
  '{"gaId":"","gscVerification":"","ogImage":"/og.jpg"}'::jsonb
)
on conflict (key) do nothing;

update wallpapers
set slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

update wallpapers
set slug = 'wallpaper'
where slug is null or slug = '';

update wallpapers w
set slug = w.slug || '-' || substr(replace(w.id, '-', ''), 1, 6)
where w.id in (
  select id from (
    select id, row_number() over (partition by slug order by created_at asc, id asc) as rn
    from wallpapers
    where slug is not null and slug <> ''
  ) ranked
  where rn > 1
);

create unique index if not exists wallpapers_slug_uidx on wallpapers (slug) where slug is not null and slug <> '';

update categories
set intro = description
where intro is null or intro = '';

insert into seo_redirects (from_path, to_path, status)
values
  ('/wallpapers/bible-verse', '/wallpapers/bible-verses', 301),
  ('/category/bible-verse', '/wallpapers/bible-verses', 301)
on conflict (from_path) do nothing;
