import type { HomePayload, WallpaperCard as Card } from "@/lib/types";

function takeUnique(pool: Card[], limit: number, used: Set<string>) {
  const items: Card[] = [];
  for (const wallpaper of pool) {
    if (used.has(wallpaper.id)) continue;
    used.add(wallpaper.id);
    items.push(wallpaper);
    if (items.length >= limit) break;
  }
  return items;
}

export function buildHomeDisplay(data: HomePayload) {
  const used = new Set<string>();
  if (data.wotd) used.add(data.wotd.id);
  const forYou = data.recommended.length
    ? takeUnique([...data.recommended, ...data.editors, ...data.fresh], 12, used)
    : [];
  if (data.wotd) used.delete(data.wotd.id);
  const fresh = takeUnique(
    data.wotd ? [data.wotd, ...data.fresh, ...data.editors, ...data.recent] : [...data.fresh, ...data.editors, ...data.recent],
    12,
    used,
  );
  const tablet = takeUnique(data.tablet ?? [], 6, used);
  return { forYou, fresh, tablet };
}
