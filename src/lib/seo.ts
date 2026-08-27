import { brand } from "@/lib/brand";
import type { DeviceType } from "@/lib/device";

export const SITE_URL = brand.shareBaseUrl.replace(/\/$/, "");
export const PAGE_SIZE = 24;

export type SeoPage = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  robots?: string;
  jsonLd?: unknown[];
  noindex?: boolean;
  prev?: string;
  next?: string;
};

export function absUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Strip tracking params; keep crawlable pagination (`?page=n`). */
export function canonicalPath(path: string): string {
  const [rawPath, rawQuery] = (path || "/").split("?");
  let clean = (rawPath || "/").split("#")[0] || "/";
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  if (!rawQuery) return clean || "/";
  const params = new URLSearchParams(rawQuery);
  const page = params.get("page");
  if (page && Number(page) > 1) return `${clean}?page=${Number(page)}`;
  return clean || "/";
}

export function slugify(input: string, fallback = "wallpaper"): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || fallback;
}

export function wallpaperPath(slug: string): string {
  return `/wallpaper/${slug}`;
}

export function categoryPath(slug: string): string {
  return `/wallpapers/${slug}`;
}

export function wallpaperAlt(opts: {
  title: string;
  categoryName?: string;
  deviceType?: DeviceType;
  altText?: string | null;
}): string {
  if (opts.altText?.trim()) return opts.altText.trim().slice(0, 125);
  const device =
    opts.deviceType === "tablet"
      ? "iPad wallpaper"
      : opts.deviceType === "both"
        ? "phone and tablet wallpaper"
        : "phone wallpaper";
  const cat = opts.categoryName ? ` in ${opts.categoryName}` : "";
  return `${opts.title} ${device}${cat}`.slice(0, 125);
}

export function wallpaperMeta(opts: {
  title: string;
  categoryName: string;
  deviceType: DeviceType;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): { title: string; description: string } {
  const device =
    opts.deviceType === "tablet"
      ? "iPad wallpaper"
      : opts.deviceType === "both"
        ? "phone and tablet wallpaper"
        : "phone wallpaper";
  const title =
    opts.seoTitle?.trim() || `${opts.title} – ${opts.categoryName} ${device} | ${brand.name}`;
  const extra = opts.description?.trim();
  const description =
    opts.seoDescription?.trim() ||
    (extra
      ? `${opts.title} ${device} in ${opts.categoryName}. ${extra}`.slice(0, 160)
      : `Download ${opts.title}, a free HD ${opts.categoryName.toLowerCase()} ${device} for iPhone, Android and iPad from ${brand.name}.`.slice(
          0,
          160,
        ));
  return { title: title.slice(0, 70), description: description.slice(0, 160) };
}

export function categoryMeta(opts: {
  name: string;
  slug: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  page?: number;
}): { title: string; description: string } {
  const pageBit = opts.page && opts.page > 1 ? ` – Page ${opts.page}` : "";
  const title =
    opts.seoTitle?.trim() ||
    `${opts.name} Wallpapers for iPhone, Android & iPad | ${brand.name}${pageBit}`;
  const description =
    opts.seoDescription?.trim() ||
    (opts.description?.trim()
      ? `${opts.description.trim()} Browse ${opts.name.toLowerCase()} wallpapers for phone and tablet.`.slice(
          0,
          160,
        )
      : `HD and 4K ${opts.name.toLowerCase()} wallpapers for iPhone, Android, iPad and tablets. Free downloads from ${brand.name}.`.slice(
          0,
          160,
        ));
  return { title: title.slice(0, 70), description: description.slice(0, 160) };
}

export const HOME_TITLE = "Mr Wallpapers – HD & 4K Wallpapers for Phone & Tablet";
export const HOME_DESCRIPTION =
  "Discover HD and 4K wallpapers for iPhone, Android, iPad and tablets. Explore motivational, Bible verse, minimalist, aesthetic and other wallpaper collections.";

export const DEVICE_HUBS: Record<
  string,
  { name: string; intro: string; device: "phone" | "tablet" | "all"; title: string; description: string }
> = {
  iphone: {
    name: "iPhone",
    device: "phone",
    intro:
      "Portrait plates composed for a tall iPhone lock and home screen. Quiet color, sharp type, and room for the clock.",
    title: "iPhone Wallpapers HD & 4K | Mr Wallpapers",
    description:
      "HD and 4K iPhone wallpapers for lock screen and home screen. Minimal, nature, aesthetic and more — free downloads.",
  },
  android: {
    name: "Android",
    device: "phone",
    intro: "High-resolution phone wallpapers that hold up on OLED Android screens. Deep blacks, calm grain, no clutter.",
    title: "Android Wallpapers HD & 4K | Mr Wallpapers",
    description:
      "HD and 4K Android wallpapers for AMOLED and LCD phones. Download free lock screen and home screen plates.",
  },
  ipad: {
    name: "iPad",
    device: "tablet",
    intro: "Wider plates for iPad lock and home. Landscape and portrait, still enough for widgets and Split View.",
    title: "iPad Wallpapers HD & 4K | Mr Wallpapers",
    description: "HD and 4K iPad wallpapers for portrait and landscape. Free downloads for iPad and iPad Pro.",
  },
  tablet: {
    name: "Tablet",
    device: "tablet",
    intro: "Tablet-first wallpapers with room for a larger clock, dock, and widgets. Phone crops stay in the phone catalog.",
    title: "Tablet Wallpapers HD & 4K | Mr Wallpapers",
    description: "HD and 4K tablet wallpapers for iPad and Android tablets. Free landscape and portrait downloads.",
  },
  all: {
    name: "All",
    device: "all",
    intro: "Every HD and 4K plate in the catalog — phone and tablet, lock and home.",
    title: "All Wallpapers HD & 4K | Mr Wallpapers",
    description: "Browse every wallpaper on Mr Wallpapers. Free HD and 4K downloads for iPhone, Android, iPad and tablets.",
  },
};

export function pageHead(page: SeoPage) {
  const url = absUrl(canonicalPath(page.path));
  const image = absUrl(page.image || "/og.jpg");
  const robots = page.noindex
    ? "noindex, nofollow"
    : page.robots === "noindex"
      ? "noindex, follow"
      : "index, follow";
  const jsonLd = page.jsonLd ?? [];
  const links: Array<Record<string, string>> = [{ rel: "canonical", href: url }];
  if (page.prev) links.push({ rel: "prev", href: absUrl(canonicalPath(page.prev)) });
  if (page.next) links.push({ rel: "next", href: absUrl(canonicalPath(page.next)) });
  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { name: "robots", content: robots },
      { name: "googlebot", content: robots },
      { property: "og:site_name", content: brand.name },
      { property: "og:type", content: page.path.startsWith("/wallpaper/") ? "article" : "website" },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: page.imageAlt || page.title },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: page.title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: page.imageAlt || page.title },
    ],
    links,
    scripts: jsonLd.map((block) => ({
      type: "application/ld+json",
      children: JSON.stringify(block),
    })),
  };
}

export function noindexHead(title: string, path = "/") {
  return pageHead({
    title,
    description: brand.positioning,
    path,
    noindex: true,
  });
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: SITE_URL,
    description: HOME_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/wallpapers?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: SITE_URL,
    logo: absUrl("/icon-512.png"),
    sameAs: [brand.social.instagram, brand.social.x].filter(Boolean),
    email: brand.supportEmail,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function imageObjectJsonLd(opts: {
  title: string;
  description: string;
  image: string;
  path: string;
  width: number;
  height: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: opts.title,
    description: opts.description,
    contentUrl: absUrl(opts.image),
    url: absUrl(opts.path),
    width: opts.width,
    height: opts.height,
    creditText: brand.name,
    acquireLicensePage: absUrl(brand.legal.copyright),
  };
}

export function itemListJsonLd(opts: {
  name: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: absUrl(opts.path),
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absUrl(item.path),
    })),
  };
}

export function prettyMediaPath(slug: string, kind: "thumb" | "preview" | "original") {
  return `/media/${slug}-${kind}.jpg`;
}
