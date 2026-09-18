import type { WallpaperCard } from "@/lib/types";

const RECENTLY_VIEWED_KEY = "mrwallpapers.recently-viewed.v1";
const MAX_RECENT = 20;

function isWallpaperCard(value: unknown): value is WallpaperCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<WallpaperCard>;
  return Boolean(
    typeof card.id === "string" &&
      typeof card.slug === "string" &&
      typeof card.title === "string" &&
      typeof card.thumbnailUrl === "string" &&
      typeof card.categoryId === "string" &&
      typeof card.categoryName === "string",
  );
}

export function readRecentlyViewed(): WallpaperCard[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWallpaperCard).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function rememberRecentlyViewed(wallpaper: WallpaperCard): WallpaperCard[] {
  if (typeof window === "undefined") return [];
  const next = [
    wallpaper,
    ...readRecentlyViewed().filter((item) => item.id !== wallpaper.id),
  ].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // Browsing should keep working even when storage is unavailable.
  }
  return next;
}
