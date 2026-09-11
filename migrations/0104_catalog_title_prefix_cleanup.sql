-- Remove the remaining obvious "Title:" importer artifacts from published wallpapers.
-- Clean slugs are guarded against collisions and all old public URLs remain as 301 redirects.

update wallpapers
set slug = 'garp-and-koby-fiery-energy',
    alt_text = 'Garp and Koby Fiery Energy',
    canonical_path = case
      when canonical_path = '/wallpaper/title-garp-and-koby-fiery-energy'
        then '/wallpaper/garp-and-koby-fiery-energy'
      else canonical_path
    end,
    updated_at = now()
where id = 'w73f4367536a8'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'garp-and-koby-fiery-energy'
      and w2.id <> 'w73f4367536a8'
  );

update wallpapers
set slug = 'god-s-plan-crown-of-thorns',
    alt_text = 'God''s Plan Crown of Thorns',
    canonical_path = case
      when canonical_path = '/wallpaper/title-god-s-plan-crown-of-thorns'
        then '/wallpaper/god-s-plan-crown-of-thorns'
      else canonical_path
    end,
    updated_at = now()
where id = 'rb2a17754b7bd'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'god-s-plan-crown-of-thorns'
      and w2.id <> 'rb2a17754b7bd'
  );

update wallpapers
set title = 'Silver Chrome Crosses Aesthetic',
    slug = 'silver-chrome-crosses-aesthetic',
    alt_text = 'Silver Chrome Crosses Aesthetic',
    canonical_path = case
      when canonical_path = '/wallpaper/title-silver-chrome-crosses-aesthetic'
        then '/wallpaper/silver-chrome-crosses-aesthetic'
      else canonical_path
    end,
    updated_at = now()
where id = 'r41620f08bc21'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'silver-chrome-crosses-aesthetic'
      and w2.id <> 'r41620f08bc21'
  );

update wallpapers
set title = 'Psalm 23:2 Green Pastures',
    slug = 'psalm-23-2-green-pastures',
    alt_text = 'Psalm 23:2 Green Pastures Bible verse wallpaper',
    canonical_path = case
      when canonical_path = '/wallpaper/title-psalm-23-2-green-pastures'
        then '/wallpaper/psalm-23-2-green-pastures'
      else canonical_path
    end,
    updated_at = now()
where id = 'r661c62ba1342'
  and not exists (
    select 1 from wallpapers w2
    where w2.slug = 'psalm-23-2-green-pastures'
      and w2.id <> 'r661c62ba1342'
  );

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/title-garp-and-koby-fiery-energy', '/wallpaper/garp-and-koby-fiery-energy', 301
where exists (select 1 from wallpapers where id = 'w73f4367536a8' and slug = 'garp-and-koby-fiery-energy')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/title-god-s-plan-crown-of-thorns', '/wallpaper/god-s-plan-crown-of-thorns', 301
where exists (select 1 from wallpapers where id = 'rb2a17754b7bd' and slug = 'god-s-plan-crown-of-thorns')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/title-silver-chrome-crosses-aesthetic', '/wallpaper/silver-chrome-crosses-aesthetic', 301
where exists (select 1 from wallpapers where id = 'r41620f08bc21' and slug = 'silver-chrome-crosses-aesthetic')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

insert into seo_redirects (from_path, to_path, status)
select '/wallpaper/title-psalm-23-2-green-pastures', '/wallpaper/psalm-23-2-green-pastures', 301
where exists (select 1 from wallpapers where id = 'r661c62ba1342' and slug = 'psalm-23-2-green-pastures')
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;
