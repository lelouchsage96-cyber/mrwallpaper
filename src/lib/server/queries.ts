import { getSql } from "@/lib/db";
import { parseDeviceType, deviceWhere, type DeviceFilter } from "@/lib/device";
import { asCardThumb, isLiveFormat, resolveThumb, resolvePreview } from "@/lib/media";
import { wallpaperAlt } from "@/lib/seo";
import { daySeed, mergeHomeDuos, parseDuoSlug, suggestCompanion, suggestDuos } from "@/lib/duos";
import type {
  Category,
  Collection,
  CreatorCard,
  WallpaperCard,
  WallpaperDetail,
  WallpaperPair,
} from "@/lib/types";

type CardRow = {
  id: string;
  slug?: string | null;
  title: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  access_type: "free" | "premium";
  download_count: number | string;
  favorite_count: number | string;
  is_favorite?: boolean | number;
  format?: string | null;
  device_type?: string | null;
  width?: number | string | null;
  height?: number | string | null;
  thumbnail_url?: string | null;
  alt_text?: string | null;
};

type DetailRow = CardRow & {
  description: string;
  file_size_bytes: number | string;
  creator_id: string | null;
  preview_url?: string | null;
  original_url?: string | null;
  creator_name: string | null;
  creator_slug: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_path?: string | null;
  robots?: string | null;
};

const CARD_SELECT = `
  w.id, w.slug, w.title, w.category_id, w.alt_text,
  c.name as category_name, c.slug as category_slug,
  w.access_type, w.download_count, w.favorite_count, w.format,
  w.device_type, w.width, w.height,
  (select a.path from wallpaper_assets a
     where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
`;

const STILL_ONLY = `(w.format is null or w.format not in ('mp4', 'mov', 'webm'))`;

async function tryRows<T>(label: string, run: () => Promise<T[]>, fallback: T[] = []): Promise<T[]> {
  try {
    return await run();
  } catch (err) {
    console.error(`[db] ${label}`, err);
    return fallback;
  }
}

function toBool(v: boolean | number | null | undefined): boolean {
  return v === true || v === 1;
}

export function mapCard(row: CardRow, _premiumOn = true): WallpaperCard {
  const width = Number(row.width) || 1080;
  const height = Number(row.height) || 1920;
  const deviceType = parseDeviceType(row.device_type);
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    accessType: "free",
    thumbnailUrl: resolveThumb(row.id, row.thumbnail_url, row.slug),
    downloadCount: Number(row.download_count) || 0,
    favoriteCount: Number(row.favorite_count) || 0,
    isFavorite: toBool(row.is_favorite),
    isLive: false,
    deviceType,
    width,
    height,
    altText: wallpaperAlt({
      title: row.title,
      categoryName: row.category_name,
      deviceType,
      altText: row.alt_text,
    }),
  };
}

export async function fetchCardList(
  userId: string | null,
  opts: {
    order: "trending" | "fresh" | "downloads" | "favorites" | "premium";
    limit: number;
    offset?: number;
    categoryId?: string;
    categoryIds?: string[];
    access?: "free" | "premium";
    search?: string;
    device?: DeviceFilter;
  },
): Promise<WallpaperCard[]> {
  const sql = await getSql();
  const params: unknown[] = [];
  let fav = "false as is_favorite";
  if (userId) {
    params.push(userId);
    fav = `exists(select 1 from favorites f where f.wallpaper_id = w.id and f.user_id = $${params.length}) as is_favorite`;
  }
  const where = [`w.status = 'approved'`, STILL_ONLY];
  if (opts.categoryId) {
    params.push(opts.categoryId);
    where.push(`w.category_id = $${params.length}`);
  }
  if (opts.categoryIds?.length) {
    params.push(opts.categoryIds);
    where.push(`w.category_id = any($${params.length})`);
  }
  if (opts.access === "premium") where.push(`w.access_type = 'premium'`);
  if (opts.search?.trim()) {
    params.push(`%${opts.search.trim().toLowerCase()}%`);
    where.push(
      `(lower(w.title) like $${params.length} or lower(c.name) like $${params.length} or exists (
          select 1 from wallpaper_tags wt join tags t on t.id = wt.tag_id
          where wt.wallpaper_id = w.id and lower(t.name) like $${params.length}
        ))`,
    );
  }
  const deviceSql = deviceWhere(opts.device ?? "phone");
  if (deviceSql) where.push(deviceSql);
  const order =
    opts.order === "fresh"
      ? "w.published_at desc nulls last, w.created_at desc"
      : opts.order === "downloads"
        ? "w.download_count desc, w.published_at desc"
        : opts.order === "favorites"
          ? "w.favorite_count desc, w.download_count desc"
          : opts.order === "premium"
            ? "w.download_count desc"
            : "w.download_count desc, w.favorite_count desc, w.published_at desc";
  const extra = opts.order === "premium" ? " and w.access_type = 'premium'" : "";
  params.push(opts.limit);
  const limitAt = params.length;
  params.push(opts.offset ?? 0);
  const offsetAt = params.length;
  const rows = await sql.query<CardRow>(
    `select ${CARD_SELECT}, ${fav}
     from wallpapers w
     join categories c on c.id = w.category_id
     where ${where.join(" and ")}${extra}
     order by ${order}
     limit $${limitAt} offset $${offsetAt}`,
    params,
  );
  const premiumOn = await premiumEnabled();
  return rows.filter((r) => !isLiveFormat(r.format)).map((r) => mapCard(r, premiumOn));
}

export async function fetchCardsByIds(ids: string[], userId: string | null): Promise<WallpaperCard[]> {
  if (!ids.length) return [];
  const sql = await getSql();
  const params: unknown[] = [ids];
  let fav = "false as is_favorite";
  if (userId) {
    params.push(userId);
    fav = `exists(select 1 from favorites f where f.wallpaper_id = w.id and f.user_id = $${params.length}) as is_favorite`;
  }
  const rows = await sql.query<CardRow>(
    `select ${CARD_SELECT}, ${fav}
     from wallpapers w
     join categories c on c.id = w.category_id
     where w.id = any($1) and w.status = 'approved' and ${STILL_ONLY}`,
    params,
  );
  const premiumOn = await premiumEnabled();
  const mapped = rows.map((r) => mapCard(r, premiumOn));
  const byId = new Map(mapped.map((w) => [w.id, w]));
  return ids.map((id) => byId.get(id)).filter((w): w is WallpaperCard => Boolean(w));
}

export async function fetchDetail(id: string, userId: string | null): Promise<WallpaperDetail | null> {
  const sql = await getSql();
  const params: unknown[] = [id];
  let fav = "false as is_favorite";
  if (userId) {
    params.push(userId);
    fav = `exists(select 1 from favorites f where f.wallpaper_id = w.id and f.user_id = $${params.length}) as is_favorite`;
  }
  const rows = await sql.query<DetailRow>(
    `select ${CARD_SELECT}, ${fav},
            w.description, w.width, w.height, w.file_size_bytes, w.format, w.creator_id,
            w.seo_title, w.seo_description, w.canonical_path, w.robots,
            (select a.path from wallpaper_assets a
              where a.wallpaper_id = w.id and a.kind = 'preview' limit 1) as preview_url,
            (select a.path from wallpaper_assets a
              where a.wallpaper_id = w.id and a.kind = 'original' limit 1) as original_url,
            cp.display_name as creator_name, cp.slug as creator_slug
     from wallpapers w
     join categories c on c.id = w.category_id
     left join creator_profiles cp
       on cp.user_id = w.creator_id and cp.status = 'approved'
     where w.status = 'approved' and ${STILL_ONLY} and (w.id = $1 or w.slug = $1)
     limit 1`,
    params,
  );
  const row = rows[0];
  if (!row) return null;
  if (isLiveFormat(row.format)) return null;
  const tagRows = await sql.query<{ name: string }>(
    `select t.name from wallpaper_tags wt
     join tags t on t.id = wt.tag_id
     where wt.wallpaper_id = $1`,
    [row.id],
  );
  const premiumOn = await premiumEnabled();
  return {
    ...mapCard(row, premiumOn),
    description: row.description,
    previewUrl: resolvePreview(row.id, row.preview_url, row.slug),
    width: Number(row.width),
    height: Number(row.height),
    fileSizeBytes: Number(row.file_size_bytes) || 0,
    format: row.format || "jpg",
    tags: tagRows.map((t) => t.name),
    creatorName: row.creator_name,
    creatorSlug: row.creator_slug,
    videoUrl: null,
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    canonicalPath: row.canonical_path ?? null,
    robots: row.robots === "noindex" ? "noindex" : "index",
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const sql = await getSql();
  type CatRow = {
    id: string;
    slug: string;
    name: string;
    description: string;
    cover_url: string | null;
    sort_order?: number;
    is_featured?: boolean | number;
    intro?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    canonical_path?: string | null;
    robots?: string | null;
  };
  const map = (r: CatRow): Category => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    coverUrl: asCardThumb(r.cover_url),
    sortOrder: Number(r.sort_order) || 0,
    isFeatured: r.is_featured === true || r.is_featured === 1,
    intro: r.intro || r.description,
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,
    canonicalPath: r.canonical_path ?? null,
    robots: r.robots === "noindex" ? "noindex" : "index",
  });
  const full = await tryRows<CatRow>("categories", () =>
    sql.query<CatRow>(
      `select id, slug, name, description,
              coalesce(cover_url, (
                select a.path
                from wallpapers w
                join wallpaper_assets a on a.wallpaper_id = w.id and a.kind = 'thumbnail'
                where w.category_id = categories.id and w.status = 'approved' and ${STILL_ONLY}
                order by w.download_count desc, w.published_at desc nulls last
                limit 1
              )) as cover_url,
              sort_order, is_featured,
              intro, seo_title, seo_description, canonical_path, robots
       from categories where is_visible = true order by sort_order asc, name asc`,
    ),
  );
  if (full.length) return full.map(map);
  return (
    await tryRows<CatRow>("categories.basic", () =>
      sql.query<CatRow>(
        `select id, slug, name, description,
                coalesce(cover_url, (
                  select a.path
                  from wallpapers w
                  join wallpaper_assets a on a.wallpaper_id = w.id and a.kind = 'thumbnail'
                  where w.category_id = categories.id and w.status = 'approved' and ${STILL_ONLY}
                  order by w.download_count desc, w.published_at desc nulls last
                  limit 1
                )) as cover_url,
                sort_order, is_featured
         from categories where is_visible = true order by sort_order asc, name asc`,
      ),
    )
  ).map(map);
}

export async function fetchCollections(): Promise<Collection[]> {
  const sql = await getSql();
  type ColRow = {
    id: string;
    slug: string;
    name: string;
    description: string;
    cover_url: string | null;
    wallpaper_count: number;
  };
  const select = `select id, slug, name, description, cover_url,
            (select count(*)::int from collection_wallpapers cw where cw.collection_id = collections.id) as wallpaper_count
     from collections where is_visible = true`;
  const rows = await tryRows<ColRow>("collections", () =>
    sql.query<ColRow>(`${select} order by sort_order asc, name asc`),
  );
  const list =
    rows.length > 0
      ? rows
      : await tryRows<ColRow>("collections.basic", () => sql.query<ColRow>(`${select} order by name asc`));
  return list.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    coverUrl: asCardThumb(r.cover_url),
    wallpaperCount: Number(r.wallpaper_count) || 0,
  }));
}

export async function fetchFeaturedIds(slot: string): Promise<string[]> {
  const sql = await getSql();
  const rows = await sql.query<{ wallpaper_id: string }>(
    `select wallpaper_id from featured_wallpapers
     where slot = $1
     order by priority desc, starts_at desc`,
    [slot],
  );
  return rows.map((r) => r.wallpaper_id);
}

async function fetchCuratedPairs(userId: string | null): Promise<WallpaperPair[]> {
  const sql = await getSql();
  const rows = await tryRows<{
    id: string;
    slug: string;
    name: string;
    description: string;
    lock_wallpaper_id: string;
    home_wallpaper_id: string;
  }>("pairs", () =>
    sql.query(
      `select id, slug, name, description, lock_wallpaper_id, home_wallpaper_id
       from wallpaper_pairs
       where is_visible is not false
       order by sort_order asc
       limit 12`,
    ),
  );
  if (!rows.length) return [];
  const ids = rows.flatMap((r) => [r.lock_wallpaper_id, r.home_wallpaper_id]);
  const cards = await fetchCardsByIds(ids, userId);
  const byId = new Map(cards.map((w) => [w.id, w]));
  return rows
    .map((r) => {
      const lock = byId.get(r.lock_wallpaper_id);
      const home = byId.get(r.home_wallpaper_id);
      if (!lock || !home) return null;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        lock,
        home,
      } satisfies WallpaperPair;
    })
    .filter((p): p is WallpaperPair => Boolean(p));
}

export async function fetchHomeDuos(userId: string | null, tasteIds?: string[]): Promise<WallpaperPair[]> {
  try {
    const curated = await fetchCuratedPairs(userId);
    const pool = await fetchCardList(userId, {
      order: "trending",
      limit: 40,
      device: "phone",
      categoryIds: tasteIds?.length ? tasteIds : undefined,
    });
    const used = new Set(curated.flatMap((p) => [p.lock.id, p.home.id]));
    const suggested = suggestDuos(pool, { count: 6, seed: daySeed("home"), used });
    return mergeHomeDuos(curated, suggested, 6);
  } catch (err) {
    console.error("[db] duos", err);
    return [];
  }
}

export async function fetchPairForWallpaper(
  wallpaperId: string,
  userId: string | null,
): Promise<WallpaperPair | null> {
  try {
    const curated = await fetchCuratedPairs(userId);
    const hit = curated.find((p) => p.lock.id === wallpaperId || p.home.id === wallpaperId);
    if (hit) return hit;
    const plate = (await fetchCardsByIds([wallpaperId], userId))[0];
    if (!plate || plate.isLive || plate.deviceType === "tablet") return null;
    const [sameCat, trending] = await Promise.all([
      fetchCardList(userId, {
        order: "trending",
        limit: 24,
        device: "phone",
        categoryId: plate.categoryId,
      }),
      fetchCardList(userId, { order: "trending", limit: 32, device: "phone" }),
    ]);
    const seen = new Set<string>();
    const pool: WallpaperCard[] = [];
    for (const w of [...sameCat, ...trending]) {
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      pool.push(w);
    }
    return suggestCompanion(plate, pool);
  } catch (err) {
    console.error("[db] pair-for-wallpaper", err);
    return null;
  }
}

export async function fetchPairBySlug(slug: string, userId: string | null): Promise<WallpaperPair | null> {
  try {
    const curated = await fetchCuratedPairs(userId);
    const hit = curated.find((p) => p.slug === slug);
    if (hit) return hit;
    const parsed = parseDuoSlug(slug);
    if (!parsed) return null;
    const cards = await fetchCardsByIds([parsed.lockId, parsed.homeId], userId);
    const byId = new Map(cards.map((w) => [w.id, w]));
    const lock = byId.get(parsed.lockId);
    const home = byId.get(parsed.homeId);
    if (!lock || !home) return null;
    return {
      id: slug,
      slug,
      name: `${lock.title} + ${home.title}`,
      description: "Suggested lock and home, composed to live together.",
      lock,
      home,
      suggested: true,
    };
  } catch (err) {
    console.error("[db] pair", err);
    return null;
  }
}

export async function fetchCreators(limit = 12): Promise<CreatorCard[]> {
  const sql = await getSql();
  const rows = await sql.query<{
    slug: string;
    display_name: string;
    bio: string;
    cover_id: string | null;
    cover_slug: string | null;
    cover: string | null;
    piece_count: number;
  }>(
    `select cp.slug, cp.display_name, cp.bio,
            w.id as cover_id, w.slug as cover_slug, a.path as cover,
            (select count(*)::int from wallpapers x
              where x.creator_id = cp.user_id and x.status = 'approved') as piece_count
     from creator_profiles cp
     left join lateral (
       select id, slug from wallpapers
       where creator_id = cp.user_id and status = 'approved'
       order by published_at desc nulls last, updated_at desc
       limit 1
     ) w on true
     left join wallpaper_assets a on a.wallpaper_id = w.id and a.kind = 'thumbnail'
     where cp.status = 'approved'
     order by piece_count desc, cp.applied_at desc
     limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    slug: r.slug,
    displayName: r.display_name,
    bio: r.bio,
    coverUrl: r.cover_id ? resolveThumb(r.cover_id, r.cover, r.cover_slug) : asCardThumb(r.cover) || "",
    pieceCount: Number(r.piece_count) || 0,
  }));
}

export async function featureFlags(): Promise<{
  creator_marketplace_enabled: boolean;
  premium_enabled: boolean;
}> {
  const sql = await getSql();
  const raw = (
    await sql.query<{ value: unknown }>(`select value from app_settings where key = 'feature_flags' limit 1`)
  )[0]?.value;
  let flags: { creator_marketplace_enabled?: boolean; premium_enabled?: boolean } = {};
  if (typeof raw === "string") {
    try {
      flags = JSON.parse(raw) as typeof flags;
    } catch {
      flags = {};
    }
  } else if (raw && typeof raw === "object") {
    flags = raw as typeof flags;
  }
  return {
    creator_marketplace_enabled: flags.creator_marketplace_enabled === true,
    premium_enabled: flags.premium_enabled === true,
  };
}

export async function marketplaceEnabled(): Promise<boolean> {
  return (await featureFlags()).creator_marketplace_enabled;
}

export async function premiumEnabled(): Promise<boolean> {
  return (await featureFlags()).premium_enabled;
}

export async function lookupWallpaperRef(key: string) {
  const sql = await getSql();
  const rows = await sql.query<{ id: string; slug: string | null; status: string }>(
    `select id, slug, status from wallpapers where id = $1 or slug = $1 limit 1`,
    [key],
  );
  return rows[0] ?? null;
}

export async function fetchSeoRedirect(fromPath: string) {
  const sql = await getSql();
  try {
    const rows = await sql.query<{ to_path: string; status: number }>(
      `select to_path, status from seo_redirects where from_path = $1 limit 1`,
      [fromPath],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function uniqueWallpaperSlug(base: string, excludeId?: string): Promise<string> {
  const sql = await getSql();
  let slug = base || "wallpaper";
  for (let i = 0; i < 12; i += 1) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const rows = await sql.query<{ id: string }>(
      excludeId
        ? `select id from wallpapers where slug = $1 and id <> $2 limit 1`
        : `select id from wallpapers where slug = $1 limit 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (!rows[0]) return candidate;
  }
  return `${slug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function recordSeoRedirect(fromPath: string, toPath: string) {
  if (!fromPath || !toPath || fromPath === toPath) return;
  const sql = await getSql();
  await sql.query(
    `insert into seo_redirects (from_path, to_path, status) values ($1, $2, 301)
     on conflict (from_path) do update set to_path = excluded.to_path, status = 301`,
    [fromPath, toPath],
  );
}

export async function fetchSitemapEntries(): Promise<{
  wallpapers: { slug: string; updated: string; image: string; title: string }[];
  categories: { slug: string }[];
  collections: { slug: string }[];
  creators: { slug: string }[];
  pairs: { slug: string }[];
}> {
  const sql = await getSql();
  type PlateRow = {
    slug: string | null;
    id: string;
    updated_at: string;
    title: string;
    thumbnail_url: string | null;
  };
  const wallpaperSql = `select w.id, w.slug, w.title, w.updated_at,
            (select a.path from wallpaper_assets a
              where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
     from wallpapers w
     where w.status = 'approved'
       and (w.format is null or w.format not in ('mp4', 'mov', 'webm'))
     order by w.updated_at desc
     limit 5000`;
  const wallpapers = await tryRows<PlateRow>("sitemap.wallpapers", () =>
    sql.query<PlateRow>(
      `select w.id, w.slug, w.title, w.updated_at,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       where w.status = 'approved' and (w.robots is null or w.robots = 'index')
         and (w.format is null or w.format not in ('mp4', 'mov', 'webm'))
       order by w.updated_at desc
       limit 5000`,
    ),
  );
  const plates =
    wallpapers.length > 0
      ? wallpapers
      : await tryRows<PlateRow>("sitemap.wallpapers.basic", () => sql.query<PlateRow>(wallpaperSql));
  const categories = await tryRows<{ slug: string }>("sitemap.categories", () =>
    sql.query<{ slug: string }>(
      `select slug from categories where is_visible = true and (robots is null or robots = 'index')`,
    ),
  );
  const collections = await tryRows<{ slug: string }>("sitemap.collections", () =>
    sql.query<{ slug: string }>(`select slug from collections where is_visible = true`),
  );
  const creators = await tryRows<{ slug: string }>("sitemap.creators", () =>
    sql.query<{ slug: string }>(`select slug from creator_profiles where status = 'approved'`),
  );
  const pairs = await tryRows<{ slug: string }>("sitemap.pairs", () =>
    sql.query<{ slug: string }>(`select slug from wallpaper_pairs where is_visible is not false`),
  );
  return {
    wallpapers: plates.map((w) => ({
      slug: w.slug || w.id,
      updated: w.updated_at,
      image: resolveThumb(w.id, w.thumbnail_url, w.slug),
      title: w.title,
    })),
    categories:
      categories.length > 0
        ? categories
        : await tryRows<{ slug: string }>("sitemap.categories.basic", () =>
            sql.query<{ slug: string }>(`select slug from categories where is_visible = true`),
          ),
    collections,
    creators,
    pairs,
  };
}

export async function readSeoSettings(): Promise<{ gaId: string; gscVerification: string; ogImage: string }> {
  const sql = await getSql();
  const fallback = { gaId: "", gscVerification: "", ogImage: "/og.jpg" };
  try {
    const raw = (await sql.query<{ value: unknown }>(`select value from app_settings where key = 'seo' limit 1`))[0]
      ?.value;
    if (!raw) return fallback;
    if (typeof raw === "string") return { ...fallback, ...(JSON.parse(raw) as typeof fallback) };
    if (typeof raw === "object") return { ...fallback, ...(raw as typeof fallback) };
    return fallback;
  } catch {
    return fallback;
  }
}

export async function loadPublicPlate(filename: string): Promise<{
  redirect?: string;
  bytes?: Buffer;
  mime?: string;
  downloadName?: string;
} | null> {
  const hit = /^(.*)-(thumb|preview)\.(jpe?g|png|webp)$/i.exec(filename);
  if (!hit) return null;
  const slug = hit[1];
  const kind = hit[2] === "thumb" ? "thumbnail" : "preview";
  const sql = await getSql();
  const rows = await sql.query<{ id: string; path: string | null }>(
    `select w.id, a.path
     from wallpapers w
     left join wallpaper_assets a on a.wallpaper_id = w.id and a.kind = $2
     where (w.slug = $1 or w.id = $1) and w.status = 'approved'
     limit 1`,
    [slug, kind],
  );
  const row = rows[0];
  if (!row) return null;
  const path = row.path;
  if (!path) {
    return {
      redirect: kind === "thumbnail" ? `/wallpapers/thumbs/${row.id}.webp` : `/wallpapers/${row.id}.jpg`,
    };
  }
  if (path.startsWith("/wallpapers/")) {
    return {
      redirect: kind === "thumbnail" ? `/wallpapers/thumbs/${row.id}.webp` : `/wallpapers/${row.id}.jpg`,
    };
  }
  if (path.startsWith("https://")) {
    return { redirect: path };
  }
  const id = path.startsWith("/api/media/") ? path.slice("/api/media/".length) : path;
  const { loadMediaFile } = await import("./storage");
  const file = await loadMediaFile(id);
  if (!file) return null;
  const ext = file.mime.includes("webp") ? "webp" : file.mime.includes("png") ? "png" : "jpg";
  return {
    bytes: file.bytes,
    mime: file.mime,
    downloadName: `${slug}-${kind}.${ext}`,
  };
}
