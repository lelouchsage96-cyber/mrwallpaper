import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { parseDeviceType, type DeviceType } from "@/lib/device";
import { resolveOwnedThumb, sniffImage } from "@/lib/media";
import { fetchCategories } from "./queries";
import type { Category } from "@/lib/types";
import { buildWallpaperSeoFields, normalizeTag } from "@/lib/wallpaper-seo";
import { SHA256 } from "@/lib/hash";
import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";
import { sha256Buffer } from "./dupes";
import { persistPlateMedia, removeMediaFiles, removePlateMediaExcept } from "./storage";

const MAX_TAGS = 18;
const MAX_PREVIEW = MAX_ORIGINAL_BYTES;
const MAX_THUMB = 800_000;

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

function normalizeTags(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const name = normalizeTag(value);
    if (name.length < 2) continue;
    const slug = slugifyTag(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(name);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

async function replaceTags(sql: Sql, wallpaperId: string, names: string[]) {
  await sql.query(`delete from wallpaper_tags where wallpaper_id = $1`, [wallpaperId]);
  for (const name of names) {
    const slug = slugifyTag(name);
    if (!slug) continue;
    const id = `tag-${slug}`.slice(0, 40);
    await sql.query(
      `insert into tags (id, slug, name) values ($1, $2, $3)
       on conflict (slug) do update set name = excluded.name`,
      [id, slug, name],
    );
    const rows = await sql.query<{ id: string }>(`select id from tags where slug = $1 limit 1`, [slug]);
    if (!rows[0]?.id) continue;
    await sql.query(
      `insert into wallpaper_tags (wallpaper_id, tag_id) values ($1, $2) on conflict do nothing`,
      [wallpaperId, rows[0].id],
    );
  }
}

export type OpsWallpaperEditData = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  deviceType: DeviceType;
  status: "draft" | "pending" | "approved" | "rejected" | "removed";
  thumbnailUrl: string | null;
  tags: string[];
  altText: string;
  primaryKeyword: string;
  width: number;
  height: number;
};

export const getOpsWallpaperEdit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ wallpaperId: z.string().min(1) }))
  .handler(async ({ context, data }): Promise<{ wallpaper: OpsWallpaperEditData | null; categories: Category[] }> => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query<{
      id: string;
      title: string;
      description: string | null;
      category_id: string;
      category_name: string;
      device_type: string | null;
      status: string;
      slug: string | null;
      thumbnail_url: string | null;
      alt_text: string | null;
      primary_keyword: string | null;
      width: number;
      height: number;
    }>(
      `select w.id, w.title, w.description, w.category_id, c.name as category_name,
              w.device_type, w.status, w.slug,
              w.alt_text, w.primary_keyword, w.width, w.height,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       join categories c on c.id = w.category_id
       where w.id = $1
       limit 1`,
      [data.wallpaperId],
    );
    const row = rows[0];
    const categories = await fetchCategories();
    if (!row) return { wallpaper: null, categories };
    const tagRows = await sql.query<{ name: string }>(
      `select t.name
       from wallpaper_tags wt
       join tags t on t.id = wt.tag_id
       where wt.wallpaper_id = $1
       order by t.name`,
      [data.wallpaperId],
    );
    const allowedStatus = ["draft", "pending", "approved", "rejected", "removed"] as const;
    const status = allowedStatus.includes(row.status as (typeof allowedStatus)[number])
      ? (row.status as OpsWallpaperEditData["status"])
      : "draft";
    return {
      categories,
      wallpaper: {
        id: row.id,
        title: row.title,
        description: row.description || "",
        categoryId: row.category_id,
        categoryName: row.category_name,
        deviceType: parseDeviceType(row.device_type),
        status,
        thumbnailUrl: resolveOwnedThumb(row.id, row.thumbnail_url, row.slug),
        tags: tagRows.map((t) => t.name),
        altText: row.alt_text || "",
        primaryKeyword: row.primary_keyword || "",
        width: row.width,
        height: row.height,
      },
    };
  });

export const updateOpsWallpaperMetadata = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      wallpaperId: z.string().min(1),
      title: z.string().trim().min(2).max(60),
      description: z.string().trim().max(280),
      categoryId: z.string().min(1),
      deviceType: z.enum(["phone", "tablet", "both"]),
      status: z.enum(["draft", "pending", "approved", "rejected", "removed"]),
      tags: z.array(z.string()).max(MAX_TAGS),
      altText: z.string().trim().max(180),
      primaryKeyword: z.string().trim().max(80),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === data.categoryId)) {
      return { ok: false as const, error: "category" as const };
    }
    const tags = normalizeTags(data.tags);
    const seo = buildWallpaperSeoFields({ title: data.title, description: data.description, primaryKeyword: data.primaryKeyword });
    await sql.query(
      `update wallpapers
       set title = $1,
           description = $2,
           category_id = $3,
           device_type = $4,
           status = $5,
           alt_text = $6,
           primary_keyword = $7,
           seo_title = $8,
           seo_description = $9,
           updated_at = now()
       where id = $10`,
      [
        data.title.trim(),
        data.description.trim(),
        data.categoryId,
        data.deviceType,
        data.status,
        data.altText.trim(),
        seo.primaryKeyword,
        seo.seoTitle,
        seo.seoDescription,
        data.wallpaperId,
      ],
    );
    await replaceTags(sql, data.wallpaperId, tags);
    return { ok: true as const };
  });

function editFormString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function editFormBuffer(form: FormData, key: string, max: number): Promise<Buffer | null> {
  const value = form.get(key);
  if (!(value instanceof Blob)) return null;
  if (value.size < 32 || value.size > max) return null;
  return Buffer.from(await value.arrayBuffer());
}

function editFormHex(form: FormData, key: string): string | null {
  const value = editFormString(form, key).toLowerCase();
  return SHA256.test(value) ? value : null;
}

function replacementAspectLabel(width: number, height: number): string {
  if (!width || !height) return "1:1";
  const ratio = width / height;
  const presets: [number, string][] = [
    [9 / 16, "9:16"],
    [9 / 19.5, "9:19.5"],
    [9 / 20, "9:20"],
    [16 / 9, "16:9"],
    [1, "1:1"],
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
    [21 / 9, "21:9"],
    [9 / 21, "9:21"],
  ];
  const hit = presets.find(([value]) => Math.abs(ratio - value) < 0.045);
  return hit ? hit[1] : `${width}:${height}`;
}

export const replaceOpsWallpaperImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const wallpaperId = editFormString(data, "wallpaperId");
    if (!wallpaperId) return { ok: false as const, error: "not_found" as const };

    const current = await sql.query<{ id: string }>(
      `select id from wallpapers where id = $1 limit 1`,
      [wallpaperId],
    );
    if (!current[0]) return { ok: false as const, error: "not_found" as const };

    const assetRows = await sql.query<{ kind: string }>(
      `select kind from wallpaper_assets
       where wallpaper_id = $1 and kind in ('thumbnail', 'preview', 'original')`,
      [wallpaperId],
    );
    const assetKinds = new Set(assetRows.map((row) => row.kind));
    if (!assetKinds.has("thumbnail") || !assetKinds.has("preview") || !assetKinds.has("original")) {
      return { ok: false as const, error: "assets" as const };
    }

    const attemptId = editFormString(data, "attemptId").slice(0, 40) || "unknown";
    const originalKey = editFormString(data, "originalKey");
    const preview = await editFormBuffer(data, "preview", MAX_PREVIEW);
    const thumb = await editFormBuffer(data, "thumb", MAX_THUMB);
    if (!originalKey || !preview || !thumb) {
      console.warn("[ops-wallpaper-edit] replacement rejected", {
        wallpaperId,
        attemptId,
        reason: "missing_image_payload",
        hasOriginalKey: Boolean(originalKey),
        previewBytes: preview?.length ?? 0,
        thumbBytes: thumb?.length ?? 0,
      });
      return { ok: false as const, error: "image" as const, stage: "validation" as const };
    }

    const width = Number(editFormString(data, "width")) || 0;
    const height = Number(editFormString(data, "height")) || 0;
    const originalBytes = Number(editFormString(data, "bytes")) || 0;
    const rawMime = editFormString(data, "mime");
    const mime = /^(image\/jpeg|image\/png|image\/webp)$/i.test(rawMime) ? rawMime : "image/jpeg";
    const rawFormat = editFormString(data, "format");
    const format: "jpg" | "png" | "webp" =
      rawFormat === "png" || rawFormat === "webp" ? rawFormat : "jpg";
    const previewMeta = sniffImage(preview);
    const thumbMeta = sniffImage(thumb);
    if (width < 8 || height < 8 || originalBytes < 1 || !previewMeta || !thumbMeta) {
      console.warn("[ops-wallpaper-edit] replacement rejected", {
        wallpaperId,
        attemptId,
        reason: "invalid_image_metadata",
        width,
        height,
        originalBytes,
        previewBytes: preview.length,
        thumbBytes: thumb.length,
        previewDetected: Boolean(previewMeta),
        thumbDetected: Boolean(thumbMeta),
        mime,
        format,
      });
      return { ok: false as const, error: "image" as const, stage: "validation" as const };
    }

    const fileSha = editFormHex(data, "fileSha256") ?? sha256Buffer(preview);
    const sourceSha = editFormHex(data, "sourceSha256") ?? fileSha;
    const duplicate = await sql.query<{ id: string }>(
      `select id from wallpapers
       where id <> $3 and (sha256 = $1 or source_sha256 = $2)
       limit 1`,
      [fileSha, sourceSha, wallpaperId],
    );
    if (duplicate[0]) {
      console.warn("[ops-wallpaper-edit] replacement rejected", {
        wallpaperId,
        attemptId,
        reason: "duplicate",
        duplicateWallpaperId: duplicate[0].id,
      });
      return { ok: false as const, error: "duplicate" as const };
    }

    let stage: "storage" | "database" = "storage";
    let stored: Awaited<ReturnType<typeof persistPlateMedia>> | null = null;
    let keepIds: string[] = [];

    try {
      stored = await persistPlateMedia(sql, {
        wallpaperId,
        original: Buffer.alloc(0),
        originalKey,
        originalBytes,
        preview,
        thumb,
        mime,
        format,
        width,
        height,
        previewWidth: previewMeta.width,
        previewHeight: previewMeta.height,
        thumbWidth: thumbMeta.width,
        thumbHeight: thumbMeta.height,
      });
      keepIds = [stored.originalId, stored.previewId, stored.thumbId];
      stage = "database";

      const updated = await sql.query<{ id: string; asset_count: number }>(
        `with changed_assets as (
           update wallpaper_assets
           set bucket = case when kind = 'original' then 'protected' else 'public' end,
               path = case kind
                 when 'thumbnail' then $9
                 when 'preview' then $13
                 else $17
               end,
               width = case kind
                 when 'thumbnail' then $10
                 when 'preview' then $14
                 else $2
               end,
               height = case kind
                 when 'thumbnail' then $11
                 when 'preview' then $15
                 else $3
               end,
               bytes = case kind
                 when 'thumbnail' then $12
                 when 'preview' then $16
                 else $4
               end,
               mime = case when kind = 'original' then $18 else 'image/jpeg' end,
               is_public = case when kind = 'original' then false else true end
           where wallpaper_id = $1 and kind in ('thumbnail', 'preview', 'original')
           returning kind
         ),
         changed_wallpaper as (
           update wallpapers
           set width = $2,
               height = $3,
               file_size_bytes = $4,
               format = $5,
               aspect_ratio = $6,
               sha256 = $7,
               source_sha256 = $8,
               updated_at = now()
           where id = $1
           returning id
         )
         select w.id, (select count(*)::int from changed_assets) as asset_count
         from changed_wallpaper w`,
        [
          wallpaperId,
          width,
          height,
          originalBytes,
          format,
          replacementAspectLabel(width, height),
          fileSha,
          sourceSha,
          stored.thumbPath,
          thumbMeta.width,
          thumbMeta.height,
          thumb.length,
          stored.previewPath,
          previewMeta.width,
          previewMeta.height,
          preview.length,
          stored.originalPath,
          mime,
        ],
      );
      if (!updated[0]?.id) {
        throw new Error("Wallpaper assets could not be updated.");
      }
      if (updated[0].asset_count < 3) {
        console.error("[ops-wallpaper-edit] replacement updated fewer assets than expected", {
          wallpaperId,
          assetCount: updated[0].asset_count,
        });
      }
    } catch (error) {
      if (keepIds.length) {
        await removeMediaFiles(sql, keepIds).catch((cleanupError) =>
          console.error("[ops-wallpaper-edit] replacement cleanup", {
            wallpaperId,
            attemptId,
            cleanupError,
          }),
        );
      }
      console.error("[ops-wallpaper-edit] replacement failed", {
        wallpaperId,
        attemptId,
        stage,
        error: error instanceof Error ? error.message : String(error),
      });
      return { ok: false as const, error: "replace_failed" as const, stage };
    }

    if (!stored) {
      console.error("[ops-wallpaper-edit] replacement failed", {
        wallpaperId,
        attemptId,
        stage: "storage",
        error: "Storage completed without a stored media result.",
      });
      return { ok: false as const, error: "replace_failed" as const, stage: "storage" as const };
    }

    await removePlateMediaExcept(sql, wallpaperId, keepIds).catch((error) =>
      console.error("[ops-wallpaper-edit] old media cleanup", { wallpaperId, attemptId, error }),
    );

    console.info("[ops-wallpaper-edit] replacement complete", {
      wallpaperId,
      attemptId,
      width,
      height,
    });

    return {
      ok: true as const,
      width,
      height,
      thumbnailUrl: stored.thumbPath,
    };
  });

