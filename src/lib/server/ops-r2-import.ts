import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { mediaUrl, sniffImage } from "@/lib/media";
import { slugify } from "@/lib/seo";
import type { Category } from "@/lib/types";
import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";
import { sha256Buffer } from "./dupes";
import { fetchCategories, uniqueWallpaperSlug } from "./queries";
import { r2Config, r2Get, r2PublicUrlFor } from "./r2";
import { listR2Objects, type R2ListedObject } from "./r2-list";

const MAX_TAGS = 8;
const IMAGE_EXT = /\.(?:jpe?g|png|webp)$/i;
const DERIVED_PREFIX = /^(?:tmp|health|previews|thumbs)\//i;

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireAdmin(userId: string): Promise<Sql> {
  const sql = await getSql();
  const rows = await sql.query<{ role: string; status: string }>(
    `select role, status from profiles where user_id = $1 limit 1`,
    [userId],
  );
  const row = rows[0];
  if (!row || row.role !== "admin" || row.status !== "active") throw new ForbiddenError();
  return sql;
}

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function parseTags(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of raw.split(",")) {
    const name = value.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 24);
    if (name.length < 2) continue;
    const slug = slugifyTag(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(name);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

async function attachTags(sql: Sql, wallpaperId: string, names: string[]) {
  for (const name of names) {
    const slug = slugifyTag(name);
    if (!slug) continue;
    const id = `tag-${slug}`.slice(0, 40);
    await sql.query(
      `insert into tags (id, slug, name) values ($1, $2, $3)
       on conflict (slug) do nothing`,
      [id, slug, name],
    );
    const rows = await sql.query<{ id: string }>(`select id from tags where slug = $1 limit 1`, [slug]);
    const tagId = rows[0]?.id;
    if (!tagId) continue;
    await sql.query(
      `insert into wallpaper_tags (wallpaper_id, tag_id) values ($1, $2) on conflict do nothing`,
      [wallpaperId, tagId],
    );
  }
}

function aspectLabel(w: number, h: number): string {
  if (!w || !h) return "1:1";
  const r = w / h;
  const presets: [number, string][] = [
    [9 / 16, "9:16"], [16 / 9, "16:9"], [1, "1:1"], [4 / 3, "4:3"],
    [3 / 4, "3:4"], [3 / 2, "3:2"], [2 / 3, "2:3"], [21 / 9, "21:9"], [9 / 21, "9:21"],
  ];
  const hit = presets.find(([v]) => Math.abs(r - v) < 0.045);
  return hit ? hit[1] : `${w}:${h}`;
}

function deriveTitle(key: string): string {
  const leaf = key.split("/").pop() || "Wallpaper";
  const raw = leaf.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return "Wallpaper";
  return raw.replace(/\b\w/g, (m) => m.toUpperCase()).slice(0, 60);
}

function deviceFor(raw: string | undefined, width: number, height: number): DeviceType {
  if (raw === "phone" || raw === "tablet" || raw === "both") return raw;
  return inferDeviceType(width, height);
}

function keyFromAssetPath(path: string): string | null {
  try {
    if (/^https?:\/\//i.test(path)) {
      const url = new URL(path);
      return decodeURIComponent(url.pathname.replace(/^\//, ""));
    }
    if (path.startsWith("/")) return null;
    return path;
  } catch {
    return null;
  }
}

async function knownR2Keys(sql: Sql): Promise<Set<string>> {
  const set = new Set<string>();
  const media = await sql.query<{ storage_key: string | null }>(
    `select storage_key from media_files where storage = 'r2' and storage_key is not null`,
  );
  for (const row of media) if (row.storage_key) set.add(row.storage_key);
  const assets = await sql.query<{ path: string }>(`select path from wallpaper_assets where path is not null`);
  for (const row of assets) {
    const key = keyFromAssetPath(row.path);
    if (key) set.add(key);
  }
  return set;
}

export type OpsR2Candidate = R2ListedObject & { suggestedTitle: string };

export const listOpsR2Candidates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      cursor: z.string().nullish(),
      prefix: z.string().max(180).optional(),
    }).optional(),
  )
  .handler(async ({ context, data }): Promise<{
    items: OpsR2Candidate[];
    categories: Category[];
    nextCursor: string | null;
    truncated: boolean;
  }> => {
    const sql = await requireAdmin(context.userId);
    const [listed, categories, known] = await Promise.all([
      listR2Objects({
        continuationToken: data?.cursor ?? null,
        prefix: data?.prefix?.trim() || undefined,
        maxKeys: 100,
      }),
      fetchCategories(),
      knownR2Keys(sql),
    ]);
    const items = listed.items
      .filter((item) => IMAGE_EXT.test(item.key))
      .filter((item) => !DERIVED_PREFIX.test(item.key))
      .filter((item) => !known.has(item.key))
      .map((item) => ({ ...item, suggestedTitle: deriveTitle(item.key) }));
    return {
      items,
      categories,
      nextCursor: listed.nextToken,
      truncated: listed.truncated,
    };
  });

export const importOpsR2Wallpaper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      key: z.string().min(1).max(1024),
      title: z.string().trim().min(2).max(60),
      description: z.string().trim().max(280).optional(),
      categoryId: z.string().min(1),
      deviceType: z.enum(["phone", "tablet", "both"]).optional(),
      tags: z.string().max(300).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    if (!IMAGE_EXT.test(data.key) || DERIVED_PREFIX.test(data.key)) {
      return { ok: false as const, error: "file" };
    }
    const categories = await fetchCategories();
    if (!categories.some((c) => c.id === data.categoryId)) {
      return { ok: false as const, error: "category" };
    }

    const already = await sql.query<{ id: string }>(
      `select w.id
       from wallpapers w
       where exists (
         select 1 from wallpaper_assets a
         where a.wallpaper_id = w.id and (a.path = $1 or a.path like $2)
       )
       limit 1`,
      [data.key, `%/${data.key}`],
    );
    if (already[0]) return { ok: false as const, error: "duplicate" };

    const obj = await r2Get(data.key);
    if (!obj || obj.bytes.length < 32) return { ok: false as const, error: "missing" };
    if (obj.bytes.length > MAX_ORIGINAL_BYTES) return { ok: false as const, error: "size" };
    const meta = sniffImage(obj.bytes);
    if (!meta || meta.width < 8 || meta.height < 8) return { ok: false as const, error: "image" };

    const fileSha = sha256Buffer(obj.bytes);
    const hashHit = await sql.query<{ id: string }>(
      `select id from wallpapers where sha256 = $1 or source_sha256 = $1 limit 1`,
      [fileSha],
    );
    if (hashHit[0]) return { ok: false as const, error: "duplicate" };

    const wallpaperId = `r${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const slug = await uniqueWallpaperSlug(slugify(data.title));
    const cfg = await r2Config();
    const directUrl = r2PublicUrlFor(data.key, cfg);
    const originalMediaId = `${wallpaperId}-r2-orig`;
    const previewMediaId = `${wallpaperId}-r2-prev`;
    const thumbMediaId = `${wallpaperId}-r2-thumb`;

    await sql.query(
      `insert into media_files (id, mime, bytes, width, height, data, storage, storage_key)
       values
         ($1, $2, $3, $4, $5, $6, 'r2', $7),
         ($8, $2, $3, $4, $5, $6, 'r2', $7),
         ($9, $2, $3, $4, $5, $6, 'r2', $7)`,
      [
        originalMediaId,
        meta.mime,
        obj.bytes.length,
        meta.width,
        meta.height,
        Buffer.alloc(0),
        data.key,
        previewMediaId,
        thumbMediaId,
      ],
    );

    const previewPath = directUrl ?? mediaUrl(previewMediaId);
    const thumbPath = directUrl ?? mediaUrl(thumbMediaId);
    const originalPath = mediaUrl(originalMediaId);
    const format = meta.format === "png" ? "png" : meta.format === "webp" ? "webp" : "jpg";

    await sql.query(
      `insert into wallpapers
         (id, title, description, category_id, creator_id, access_type, status,
          width, height, file_size_bytes, format, aspect_ratio, device_type,
          sha256, source_sha256, published_at, slug, alt_text, robots)
       values
         ($1, $2, $3, $4, null, 'free', 'approved', $5, $6, $7, $8, $9, $10,
          $11, $11, now(), $12, $13, 'index')`,
      [
        wallpaperId,
        data.title,
        data.description ?? "",
        data.categoryId,
        meta.width,
        meta.height,
        obj.bytes.length,
        format,
        aspectLabel(meta.width, meta.height),
        deviceFor(data.deviceType, meta.width, meta.height),
        fileSha,
        slug,
        data.title,
      ],
    );

    await sql.query(
      `insert into wallpaper_assets
         (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
       values
         ($1, $2, 'thumbnail', 'public', $3, $4, $5, $6, $7, true),
         ($8, $2, 'preview', 'public', $9, $4, $5, $6, $7, true),
         ($10, $2, 'original', 'protected', $11, $4, $5, $6, $7, false)`,
      [
        `${wallpaperId}-athumb`,
        wallpaperId,
        thumbPath,
        meta.width,
        meta.height,
        obj.bytes.length,
        meta.mime,
        `${wallpaperId}-aprev`,
        previewPath,
        `${wallpaperId}-aorig`,
        originalPath,
      ],
    );

    await attachTags(sql, wallpaperId, parseTags(data.tags ?? ""));
    return { ok: true as const, id: wallpaperId, slug };
  });
