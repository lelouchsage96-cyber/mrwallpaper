const MAX_TAG_LENGTH = 40;

export function trimAtWord(value: string, maxLength: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength + 1);
  const boundary = clipped.lastIndexOf(" ");
  return (boundary >= Math.floor(maxLength * 0.6) ? clipped.slice(0, boundary) : clean.slice(0, maxLength)).trim();
}

export function normalizeTag(value: string): string {
  return trimAtWord(value.trim().toLowerCase(), MAX_TAG_LENGTH);
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildWallpaperSeoFields(input: {
  title: string;
  description: string;
  primaryKeyword: string;
  brandName?: string;
}) {
  const title = input.title.replace(/\s+/g, " ").trim();
  const description = input.description.replace(/\s+/g, " ").trim();
  const keyword = trimAtWord(input.primaryKeyword, 80)
    .replace(/\bwallpaper\s+(?:phone\s+)?wallpaper\b/gi, "phone wallpaper")
    .replace(/\bphone\s+wallpaper\s+wallpaper\b/gi, "phone wallpaper")
    .replace(/\s+/g, " ")
    .trim();
  const brandName = input.brandName || "Mr Wallpapers";
  const subject = keyword || title.replace(/\bwallpaper\b/gi, "").replace(/\s+/g, " ").trim();
  const suffix = ` | ${brandName}`;
  const seoTitle = `${trimAtWord(titleCase(subject), 70 - suffix.length)}${suffix}`;
  const seoDescription = trimAtWord(description || `Download ${keyword || title} for phone and tablet.`, 180);
  return { seoTitle, seoDescription, primaryKeyword: keyword };
}

