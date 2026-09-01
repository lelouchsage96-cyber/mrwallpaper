-- Legacy media compatibility only. Demo featured wallpaper seeds were removed.
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
