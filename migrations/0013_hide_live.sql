-- Live wallpapers are paused. Unpublish motion clips so they leave the consumer catalog.
update wallpapers
set status = 'removed', updated_at = now()
where format in ('mp4', 'mov', 'webm')
  and status <> 'removed';

delete from featured_wallpapers
where wallpaper_id in (
  select id from wallpapers where format in ('mp4', 'mov', 'webm')
);
