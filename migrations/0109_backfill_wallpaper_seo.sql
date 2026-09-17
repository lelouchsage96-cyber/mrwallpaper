update wallpapers
set seo_title = coalesce(
      nullif(seo_title, ''),
      left(initcap(coalesce(nullif(primary_keyword, ''), regexp_replace(title, '\mwallpaper\M', '', 'gi'))), 54) || ' | Mr Wallpapers'
    ),
    seo_description = coalesce(nullif(seo_description, ''), left(description, 180))
where status = 'approved'
  and (seo_title is null or btrim(seo_title) = '' or seo_description is null or btrim(seo_description) = '');

update tags set name = 'monochrome statue wallpaper' where name = 'monochrome statue wallpa';
update tags set name = 'sculpture phone wallpaper' where name = 'sculpture phone wallpape';
update tags set name = 'abstract pattern background' where name = 'abstract pattern backgro';
update tags set name = 'classical sculpture wallpaper' where name = 'classical sculpture wall';

