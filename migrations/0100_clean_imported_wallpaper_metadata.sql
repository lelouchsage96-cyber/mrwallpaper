-- Replace raw R2 import filenames with clean human-readable metadata.
-- Keep the existing slugs so previously shared URLs remain valid.

update wallpapers
set title = 'Motivational Lock Screen 01',
    description = 'A clean motivational wallpaper for your phone lock screen, available as a free HD download.',
    updated_at = now()
where id = 'r27e9b2570a05';

update wallpapers
set title = 'Motivational Lock Screen 02',
    description = 'A simple motivational phone wallpaper made for a clear, focused lock screen and free HD download.',
    updated_at = now()
where id = 'r4197ad189fe4';

insert into tags (id, slug, name)
values
  ('tag-motivational', 'motivational', 'motivational'),
  ('tag-lock-screen', 'lock-screen', 'lock screen'),
  ('tag-phone-wallpaper', 'phone-wallpaper', 'phone wallpaper'),
  ('tag-hd-wallpaper', 'hd-wallpaper', 'hd wallpaper')
on conflict (slug) do update set name = excluded.name;

delete from wallpaper_tags
where wallpaper_id in ('r27e9b2570a05', 'r4197ad189fe4');

insert into wallpaper_tags (wallpaper_id, tag_id)
select wallpaper_id, tag_id
from (values
  ('r27e9b2570a05', 'motivational'),
  ('r27e9b2570a05', 'lock-screen'),
  ('r27e9b2570a05', 'phone-wallpaper'),
  ('r27e9b2570a05', 'hd-wallpaper'),
  ('r4197ad189fe4', 'motivational'),
  ('r4197ad189fe4', 'lock-screen'),
  ('r4197ad189fe4', 'phone-wallpaper'),
  ('r4197ad189fe4', 'hd-wallpaper')
) as wanted(wallpaper_id, tag_slug)
join tags on tags.slug = wanted.tag_slug
cross join lateral (select tags.id as tag_id) resolved
on conflict do nothing;
