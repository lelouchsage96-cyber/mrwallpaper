export const MAX_WALLPAPER_TAGS = 8;
export const MAX_WALLPAPER_TAG_LENGTH = 48;
export const MAX_WALLPAPER_TAG_SLUG_LENGTH = 64;
export const MAX_WALLPAPER_TITLE_LENGTH = 60;
export const MAX_WALLPAPER_ALT_LENGTH = 180;

function normalizeSpaces(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function truncateAtWord(input: string, maxLength: number): string {
  const text = normalizeSpaces(input);
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength + 1);
  const boundary = clipped.lastIndexOf(" ");
  return (boundary >= Math.floor(maxLength * 0.65) ? clipped.slice(0, boundary) : clipped.slice(0, maxLength)).trim();
}

/** Normalize editor/import titles without changing the meaning of the wallpaper name. */
export function cleanWallpaperTitle(input: string): string {
  return normalizeSpaces(input)
    .replace(/^title\s*:\s*/i, "")
    .slice(0, MAX_WALLPAPER_TITLE_LENGTH)
    .trim();
}

export function cleanWallpaperDescription(input: string): string {
  return normalizeSpaces(input).slice(0, 280).trim();
}

export function cleanWallpaperAltText(input: string): string {
  return truncateAtWord(normalizeSpaces(input).replace(/^title\s*:\s*/i, ""), MAX_WALLPAPER_ALT_LENGTH);
}

export function slugifyWallpaperTag(input: string): string {
  return normalizeSpaces(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_WALLPAPER_TAG_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

/**
 * Keep tags readable and SEO-safe. Unlike the old implementation this never
 * hard-cuts every tag at 24 characters in the middle of a word.
 */
export function normalizeWallpaperTags(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const name = truncateAtWord(value.toLowerCase(), MAX_WALLPAPER_TAG_LENGTH);
    if (name.length < 2) continue;
    const slug = slugifyWallpaperTag(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(name);
    if (out.length >= MAX_WALLPAPER_TAGS) break;
  }
  return out;
}
