import type { WallpaperCard as Card } from "@/lib/types";

function isLegacyOriginal(url: string): boolean {
  try {
    return /\/originals\//i.test(new URL(url, "https://mrwallpaper.org").pathname);
  } catch {
    return false;
  }
}

function optimizedImage(url: string, width: number, quality: 75 | 85): string {
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

export function cardSource(wallpaper: Card): string {
  const url = wallpaper.thumbnailUrl;
  if (url && isLegacyOriginal(url)) return optimizedImage(url, 480, 75);
  return url;
}

export function highQualityPreview(wallpaper: Card, source: string, width: number): string | null {
  const original = wallpaper.thumbnailUrl;
  if (original && isLegacyOriginal(original)) return optimizedImage(original, width, 85);
  if (!source) return null;

  let path = source;
  try {
    path = new URL(source, "https://mrwallpaper.org").pathname;
  } catch {
    // Relative paths are already usable below.
  }

  const publicMediaThumb = path.match(/\/media\/(.+)-thumb\.(?:jpe?g|png|webp)$/i);
  if (publicMediaThumb) return `/media/${publicMediaThumb[1]}-preview.jpg`;

  if (path.startsWith("/api/media/") && /-thumb(?:\.|$)/i.test(path)) {
    return path.replace(/-thumb(?=\.|$)/i, "-prev");
  }

  const r2Thumb = path.match(/\/thumbs\/(.+?)-[a-f0-9]{8,}\.(?:jpe?g|png|webp)$/i);
  if (r2Thumb) return `/media/${wallpaper.slug || wallpaper.id}-preview.jpg`;

  const bundledThumb = path.match(/\/wallpapers\/thumbs\/([^/.]+)\.(?:jpe?g|png|webp)$/i);
  if (bundledThumb) return `/wallpapers/${bundledThumb[1]}.jpg`;

  return null;
}
