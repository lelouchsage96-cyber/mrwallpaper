-- Clean obvious imported/malformed wallpaper metadata and move affected pages
-- to human-readable canonical slugs. Old public paths are retained as 301s.

-- Leading punctuation in title; slug is already clean.
update wallpapers
set title = 'David Goggins The Only Limit Is You',
    alt_text = 'David Goggins The Only Limit Is You',
    updated_at = now()
where id = 'w017b2c1147ec';

-- Missing first letter in both title and slug.
update wallpapers
set title = 'Vintage TV Standing In Your Way Quote',
    slug = 'vintage-tv-standing-in-your-way-quote',
    alt_text = 'Vintage TV Standing In Your Way Quote',
    canonical_path = case
      when canonical_path = '/wallpaper/intage-tv-standing-in-your-way-quote'
        then '/wallpaper/vintage-tv-standing-in-your-way-quote'
      else canonical_path
    end,
    updated_at = now()
where id = 'w751fd21e7e90'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'vintage-tv-standing-in-your-way-quote'
      and w2.id <> 'w751fd21e7e90'
  );

-- Remove importer/editor wording from the public URL and alt text.
update wallpapers
set slug = 'everything-s-gonna-be-okay',
    alt_text = 'Everything''s Gonna Be Okay',
    canonical_path = case
      when canonical_path = '/wallpaper/guest-check-everything-s-gonna-be-okay'
        then '/wallpaper/everything-s-gonna-be-okay'
      else canonical_path
    end,
    updated_at = now()
where id = 'w828c228f5bec'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'everything-s-gonna-be-okay'
      and w2.id <> 'w828c228f5bec'
  );

-- Replace raw import hashes with descriptive slugs.
update wallpapers
set slug = 'you-re-not-lost-you-re-here',
    alt_text = 'You''re Not Lost You''re Here',
    canonical_path = case
      when canonical_path = '/wallpaper/j09wsap4ziolvv0jmw2jwktpvyvmbchj-0a0772864a36'
        then '/wallpaper/you-re-not-lost-you-re-here'
      else canonical_path
    end,
    updated_at = now()
where id = 'r4197ad189fe4'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'you-re-not-lost-you-re-here'
      and w2.id <> 'r4197ad189fe4'
  );

update wallpapers
set slug = 'with-god-all-things-are-possible',
    alt_text = 'With God All Things Are Possible Bible verse wallpaper',
    canonical_path = case
      when canonical_path = '/wallpaper/j09wsap4ziolvv0jmw2jwktpvyvmbchj-12470a09384e'
        then '/wallpaper/with-god-all-things-are-possible'
      else canonical_path
    end,
    updated_at = now()
where id = 'r27e9b2570a05'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'with-god-all-things-are-possible'
      and w2.id <> 'r27e9b2570a05'
  );

-- Remove an import-label prefix from a Bible verse record and its slug.
update wallpapers
set title = 'Not My Will But Yours Be Done – Luke 22:42',
    slug = 'not-my-will-but-yours-be-done-luke-22-42',
    alt_text = 'Not My Will But Yours Be Done – Luke 22:42 Bible verse wallpaper',
    canonical_path = case
      when canonical_path = '/wallpaper/title-not-my-will-but-yours-be-done-luke-22-42'
        then '/wallpaper/not-my-will-but-yours-be-done-luke-22-42'
      else canonical_path
    end,
    updated_at = now()
where id = 'w0b035f1cb085'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'not-my-will-but-yours-be-done-luke-22-42'
      and w2.id <> 'w0b035f1cb085'
  );

-- Preserve all previously published URLs with permanent redirects. Each redirect
-- is inserted only if the target record successfully owns the clean slug.
insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/intage-tv-standing-in-your-way-quote', '/wallpaper/vintage-tv-standing-in-your-way-quote', 301
where exists (select 1 from wallpapers where id = 'w751fd21e7e90' and slug = 'vintage-tv-standing-in-your-way-quote')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/guest-check-everything-s-gonna-be-okay', '/wallpaper/everything-s-gonna-be-okay', 301
where exists (select 1 from wallpapers where id = 'w828c228f5bec' and slug = 'everything-s-gonna-be-okay')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/j09wsap4ziolvv0jmw2jwktpvyvmbchj-0a0772864a36', '/wallpaper/you-re-not-lost-you-re-here', 301
where exists (select 1 from wallpapers where id = 'r4197ad189fe4' and slug = 'you-re-not-lost-you-re-here')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/j09wsap4ziolvv0jmw2jwktpvyvmbchj-12470a09384e', '/wallpaper/with-god-all-things-are-possible', 301
where exists (select 1 from wallpapers where id = 'r27e9b2570a05' and slug = 'with-god-all-things-are-possible')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/title-not-my-will-but-yours-be-done-luke-22-42', '/wallpaper/not-my-will-but-yours-be-done-luke-22-42', 301
where exists (select 1 from wallpapers where id = 'w0b035f1cb085' and slug = 'not-my-will-but-yours-be-done-luke-22-42')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;
