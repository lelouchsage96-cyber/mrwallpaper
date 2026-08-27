alter table wallpapers
  add column if not exists source_sha256 text;

create index if not exists wallpapers_sha256_idx
  on wallpapers (sha256);

create index if not exists wallpapers_source_sha256_idx
  on wallpapers (source_sha256);
