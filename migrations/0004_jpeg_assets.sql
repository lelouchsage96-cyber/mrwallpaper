-- Switch catalog media from SVG placeholders to generated JPEGs.
-- Also repair featured slot names if an earlier seed used 'editors'.

update categories
  set cover_url = replace(cover_url, '.svg', '.jpg')
  where cover_url like '%.svg';

update collections
  set cover_url = replace(cover_url, '.svg', '.jpg')
  where cover_url like '%.svg';

update wallpaper_assets
  set path = replace(path, '.svg', '.jpg'),
      mime = 'image/jpeg'
  where path like '%.svg';

update wallpapers
  set format = 'jpg'
  where format = 'svg';

insert into featured_wallpapers (id, slot, wallpaper_id, starts_at, ends_at, priority)
values
  ('feat-paper-moon', 'editors_choice', 'paper-moon', now() - interval '1 day', now() + interval '365 days', 10),
  ('feat-after-rain-sky', 'editors_choice', 'after-rain-sky', now() - interval '1 day', now() + interval '365 days', 8),
  ('feat-silent-satellite', 'editors_choice', 'silent-satellite', now() - interval '1 day', now() + interval '365 days', 7),
  ('feat-overlap-two', 'editors_choice', 'overlap-two', now() - interval '1 day', now() + interval '365 days', 6),
  ('feat-be-still', 'editors_choice', 'be-still', now() - interval '1 day', now() + interval '365 days', 5),
  ('feat-late-grid', 'editors_choice', 'late-grid', now() - interval '1 day', now() + interval '365 days', 4),
  ('feat-true-black', 'editors_choice', 'true-black', now() - interval '1 day', now() + interval '365 days', 3)
on conflict (id) do update set slot = excluded.slot, wallpaper_id = excluded.wallpaper_id;
