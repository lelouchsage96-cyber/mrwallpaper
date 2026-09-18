const MAX_TAG_LENGTH = 40;
const PREFERRED_META_DESCRIPTION_LENGTH = 170;
const HARD_META_DESCRIPTION_LENGTH = 280;

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

function completeMetaDescription(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= PREFERRED_META_DESCRIPTION_LENGTH) return clean;

  const preferred = clean.slice(0, PREFERRED_META_DESCRIPTION_LENGTH + 1);
  const sentenceMatches = [...preferred.matchAll(/[.!?](?=(?:["'”’)]|\s|$))/g)];
  const lastComplete = sentenceMatches.at(-1);
  if (lastComplete && lastComplete.index !== undefined && lastComplete.index >= 95) {
    let end = lastComplete.index + 1;
    while (end < clean.length && /["'”’)]/.test(clean[end])) end += 1;
    return clean.slice(0, end).trim();
  }

  // A complete description is more valuable than a source meta tag cut mid-sentence.
  // Upload/edit fields already cap normal descriptions at 280 characters.
  if (clean.length <= HARD_META_DESCRIPTION_LENGTH) return clean;

  const hard = clean.slice(0, HARD_META_DESCRIPTION_LENGTH + 1);
  const hardMatches = [...hard.matchAll(/[.!?](?=(?:["'”’)]|\s|$))/g)];
  const lastHardComplete = hardMatches.at(-1);
  if (lastHardComplete && lastHardComplete.index !== undefined) {
    let end = lastHardComplete.index + 1;
    while (end < clean.length && /["'”’)]/.test(clean[end])) end += 1;
    return clean.slice(0, end).trim();
  }

  return `${trimAtWord(clean, HARD_META_DESCRIPTION_LENGTH - 1)}…`;
}

function wallpaperDescriptor(title: string, keyword: string): string {
  if (/\b(?:wallpaper|background|lock screen)\b/i.test(title)) return "";
  if (/\bphone wallpaper\b/i.test(keyword)) return " Phone Wallpaper";
  if (/\bwallpaper\b/i.test(keyword)) return " Wallpaper";
  return "";
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
  const suffix = ` | ${brandName}`;

  // Keep the search title anchored to the human-visible page title (H1).
  // This also preserves apostrophes/capitalization instead of turning "It's" into "It'S".
  const subjectWithDescriptor = `${title || keyword}${wallpaperDescriptor(title, keyword)}`
    .replace(/\bwallpaper\s+(?:phone\s+)?wallpaper\b/gi, "phone wallpaper")
    .replace(/\s+/g, " ")
    .trim();
  const subject = title
    ? subjectWithDescriptor.length + suffix.length <= 80
      ? subjectWithDescriptor
      : title
    : trimAtWord(subjectWithDescriptor, 80 - suffix.length);
  const seoTitle = `${subject}${suffix}`;
  const seoDescription = completeMetaDescription(
    description || `Download ${keyword || title} for phone and tablet.`,
  );
  return { seoTitle, seoDescription, primaryKeyword: keyword };
}
