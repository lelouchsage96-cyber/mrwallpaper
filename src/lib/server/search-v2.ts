import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import type { ExploreMeta, WallpaperCard } from "@/lib/types";
import { fetchCardsByIds, fetchCategories } from "./queries";
import { optionalAuthMiddleware } from "./optional-auth";

const PAGE_SIZE = 24;

const POPULAR_SEARCHES = [
  "motivational",
  "bible verse",
  "amoled",
  "anime",
  "cars",
  "nature",
  "minimal",
  "dark",
];

const STOP_WORDS = new Set([
  "wallpaper",
  "wallpapers",
  "background",
  "backgrounds",
  "download",
  "free",
  "4k",
  "hd",
  "uhd",
]);

const SEARCH_ALIASES: Record<string, string[]> = {
  motivation: ["motivational", "inspiration", "inspirational"],
  motivational: ["motivation", "inspiration", "inspirational"],
  inspiration: ["inspirational", "motivation", "motivational"],
  inspirational: ["inspiration", "motivation", "motivational"],
  bible: ["biblical", "scripture", "christian", "verse"],
  biblical: ["bible", "scripture", "christian", "verse"],
  scripture: ["bible", "biblical", "christian", "verse"],
  christian: ["bible", "biblical", "scripture", "verse"],
  amoled: ["oled"],
  oled: ["amoled"],
  car: ["cars", "automotive", "vehicle"],
  cars: ["car", "automotive", "vehicle"],
  automotive: ["car", "cars", "vehicle"],
  vehicle: ["car", "cars", "automotive"],
  city: ["urban"],
  urban: ["city"],
  nature: ["landscape", "scenery"],
  landscape: ["nature", "scenery"],
  scenery: ["nature", "landscape"],
  anime: ["manga"],
  manga: ["anime"],
  islam: ["islamic", "muslim", "quran"],
  islamic: ["islam", "muslim", "quran"],
  muslim: ["islam", "islamic", "quran"],
  quran: ["islam", "islamic", "muslim"],
  football: ["soccer"],
  soccer: ["football"],
  iphone: ["phone", "mobile"],
  android: ["phone", "mobile"],
  mobile: ["phone", "iphone", "android"],
  phone: ["mobile", "iphone", "android"],
  ipad: ["tablet"],
  tablet: ["ipad"],
};

type SearchSort = "latest" | "trending" | "downloads" | "favorites";
type SearchDevice = "all" | "phone" | "tablet";

function normalizeQuery(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9%+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchGroups(value: string): { phrase: string; groups: string[][] } {
  const normalized = normalizeQuery(value);
  if (!normalized) return { phrase: "", groups: [] };

  const rawTokens = normalized.split(" ").filter(Boolean);
  const usefulTokens = rawTokens.filter((token) => !STOP_WORDS.has(token));
  const tokens = (usefulTokens.length > 0 ? usefulTokens : rawTokens).slice(0, 6);
  const phrase = tokens.join(" ");

  const groups = tokens.map((token) => {
    const values = new Set<string>([token, ...(SEARCH_ALIASES[token] ?? [])]);
    if (token.length > 3) {
      if (token.endsWith("s")) values.add(token.slice(0, -1));
      else values.add(`${token}s`);
    }
    return [...values];
  });

  return { phrase, groups };
}

function baseOrder(sort: SearchSort): string {
  if (sort === "latest") return "w.published_at desc nulls last, w.created_at desc";
  if (sort === "downloads") return "w.download_count desc, w.published_at desc nulls last";
  if (sort === "favorites") return "w.favorite_count desc, w.download_count desc";
  return "w.download_count desc, w.favorite_count desc, w.published_at desc nulls last";
}

export const getSearchMetaV2 = createServerFn({ method: "GET" }).handler(async (): Promise<ExploreMeta> => {
  try {
    return {
      categories: await fetchCategories(),
      popular: POPULAR_SEARCHES,
    };
  } catch (error) {
    console.error("[search-v2] meta", error);
    return { categories: [], popular: POPULAR_SEARCHES };
  }
});

export const searchWallpapersV2 = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(
    z.object({
      q: z.string().optional(),
      access: z.enum(["free", "premium"]).optional(),
      sort: z.enum(["latest", "trending", "downloads", "favorites"]).optional(),
      offset: z.number().int().min(0).optional(),
      categorySlug: z.string().optional(),
      device: z.enum(["all", "phone", "tablet"]).optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<{ items: WallpaperCard[]; offset: number; hasMore: boolean }> => {
    try {
      const sql = await getSql();
      const params: unknown[] = [];
      const where = [
        "w.status = 'approved'",
        "(w.format is null or w.format not in ('mp4', 'mov', 'webm'))",
      ];

      if (data.categorySlug) {
        const categories = await fetchCategories();
        const category = categories.find((item) => item.slug === data.categorySlug);
        if (!category) return { items: [], offset: data.offset ?? 0, hasMore: false };
        params.push(category.id);
        where.push(`w.category_id = $${params.length}`);
      }

      if (data.access === "premium") where.push("w.access_type = 'premium'");
      if (data.access === "free") where.push("w.access_type = 'free'");

      const device: SearchDevice = data.device ?? "phone";
      if (device === "phone") where.push("w.device_type in ('phone', 'both')");
      if (device === "tablet") where.push("w.device_type in ('tablet', 'both')");

      const { phrase, groups } = searchGroups(data.q ?? "");
      let relevance = "0";

      if (phrase && groups.length > 0) {
        params.push(phrase);
        const exactAt = params.length;
        params.push(`${phrase}%`);
        const prefixAt = params.length;
        params.push(`%${phrase}%`);
        const containsAt = params.length;

        const groupMatches: string[] = [];
        const groupScores: string[] = [];

        for (const group of groups) {
          const patterns = group.map((term) => `%${term}%`);
          params.push(patterns);
          const at = params.length;
          const match = `(lower(w.title) like any($${at}::text[])
            or lower(c.name) like any($${at}::text[])
            or replace(lower(c.slug), '-', ' ') like any($${at}::text[])
            or lower(coalesce(w.alt_text, '')) like any($${at}::text[])
            or lower(coalesce(w.device_type, 'phone')) like any($${at}::text[])
            or exists (
              select 1 from wallpaper_tags wt
              join tags t on t.id = wt.tag_id
              where wt.wallpaper_id = w.id and lower(t.name) like any($${at}::text[])
            ))`;
          groupMatches.push(match);
          groupScores.push(`(
            case when lower(w.title) like any($${at}::text[]) then 18 else 0 end +
            case when lower(c.name) like any($${at}::text[]) or replace(lower(c.slug), '-', ' ') like any($${at}::text[]) then 12 else 0 end +
            case when exists (
              select 1 from wallpaper_tags wt
              join tags t on t.id = wt.tag_id
              where wt.wallpaper_id = w.id and lower(t.name) like any($${at}::text[])
            ) then 10 else 0 end +
            case when lower(coalesce(w.alt_text, '')) like any($${at}::text[]) then 5 else 0 end +
            case when lower(coalesce(w.device_type, 'phone')) like any($${at}::text[]) then 4 else 0 end
          )`);
        }

        where.push(groupMatches.join(" and "));
        relevance = `(
          case when lower(w.title) = $${exactAt} then 150 else 0 end +
          case when lower(w.title) like $${prefixAt} then 100 else 0 end +
          case when lower(c.name) = $${exactAt} or replace(lower(c.slug), '-', ' ') = $${exactAt} then 90 else 0 end +
          case when exists (
            select 1 from wallpaper_tags wt
            join tags t on t.id = wt.tag_id
            where wt.wallpaper_id = w.id and lower(t.name) = $${exactAt}
          ) then 85 else 0 end +
          case when lower(w.title) like $${containsAt} then 60 else 0 end +
          ${groupScores.join(" + ")}
        )`;
      }

      const offset = data.offset ?? 0;
      const sort = data.sort ?? "trending";
      params.push(PAGE_SIZE + 1);
      const limitAt = params.length;
      params.push(offset);
      const offsetAt = params.length;

      const rows = await sql.query<{ id: string; relevance: number | string }>(
        `select w.id, ${relevance} as relevance
         from wallpapers w
         join categories c on c.id = w.category_id
         where ${where.join(" and ")}
         order by ${phrase ? "relevance desc, " : ""}${baseOrder(sort)}
         limit $${limitAt} offset $${offsetAt}`,
        params,
      );

      const hasMore = rows.length > PAGE_SIZE;
      const ids = rows.slice(0, PAGE_SIZE).map((row) => row.id);
      const items = await fetchCardsByIds(ids, context.userId);
      return { items, offset: offset + items.length, hasMore };
    } catch (error) {
      console.error("[search-v2]", error);
      return { items: [], offset: data.offset ?? 0, hasMore: false };
    }
  });
