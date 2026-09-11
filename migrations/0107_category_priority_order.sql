-- Put the strongest Mr Wallpapers categories first across every surface that
-- consumes fetchCategories(), while keeping the remaining catalog curated.
update categories
set sort_order = case slug
  when 'motivational' then 1
  when 'bible-verse' then 2
  when 'aesthetic' then 3
  when 'amoled' then 4
  when 'minimal' then 5
  when 'anime' then 6
  when 'nature' then 7
  when 'cars' then 8
  when 'dark' then 9
  when 'space' then 10
  when 'abstract' then 11
  when 'islamic' then 12
  when 'love' then 13
  when 'city' then 14
  when 'animals' then 15
  when 'vintage' then 16
  else 100 + coalesce(sort_order, 0)
end;
