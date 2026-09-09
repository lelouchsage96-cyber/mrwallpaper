-- Add Islamic as a visible featured category, positioned after Bible Verses.
do $$
begin
  if not exists (select 1 from categories where id = 'cat-islamic' or slug = 'islamic') then
    update categories
    set sort_order = sort_order + 1
    where sort_order >= 11;

    insert into categories (
      id,
      slug,
      name,
      description,
      cover_url,
      sort_order,
      is_visible,
      is_featured
    ) values (
      'cat-islamic',
      'islamic',
      'Islamic',
      'Islamic reminders, Quran-inspired verses, and peaceful faith wallpapers.',
      null,
      11,
      true,
      true
    );
  else
    update categories
    set
      id = 'cat-islamic',
      slug = 'islamic',
      name = 'Islamic',
      description = 'Islamic reminders, Quran-inspired verses, and peaceful faith wallpapers.',
      sort_order = 11,
      is_visible = true,
      is_featured = true
    where id = 'cat-islamic' or slug = 'islamic';
  end if;
end $$;
