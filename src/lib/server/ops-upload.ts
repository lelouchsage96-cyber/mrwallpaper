import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { SHA256 } from "@/lib/hash";
import { sniffImage } from "@/lib/media";
import { slugify } from "@/lib/seo";
import type { Category } from "@/lib/types";
import { sha256Buffer } from "./dupes";
import { fetchCategories, uniqueWallpaperSlug } from "./queries";
import { persistPlateMedia } from "./storage";
import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";

const MAX_PREVIEW = MAX_ORIGINAL_BYTES;
const MAX_THUMB = 800_000;
const MAX_TAGS = 8;

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

function formString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function formBuffer(form: FormData, key: string, max: number): Promise<Buffer | null> {
  const v = form.get(key);
  if (!(v instanceof Blob)) return null;
  if (v.size < 32 || v.size > max) return null;
  return Buffer.from(await v.arrayBuffer());
}

function formHex(form: FormData, key: string): string | null {
  const v = formString(form, key).toLowerCase();
  return SHA256.test(v) ? v : null;
}

function formDevice(form: FormData, width: number, height: number): DeviceType {
  const raw = formString(form, "deviceType");
  if (raw === "phone" || raw === "tablet" || raw === "both") return raw;
  return inferDeviceType(width, height);
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

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function parseTags(form: FormData): string[] {
  const raw = formString(form, "tags");
  const values = raw.split(",");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
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

export const getOpsUploadMeta = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ categories: Category[] }> => {
    await requireAdmin(context.userId);
    return { categories: await fetchCategories() };
  });

export const uploadOpsWallpaper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const title = formString(data, "title");
    const description = formString(data, "description").slice(0, 280);
    const categoryId = formString(data, "categoryId");
    const tagNames = parseTags(data);
    if (title.length < 2 || title.length > 60) return { ok: false as const, error: "title" };

    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === categoryId)) return { ok: false as const, error: "category" };

    const originalKey = formString(data, "originalKey");
    if (!originalKey) return { ok: false as const, error: "image" };
    const preview = await formBuffer(data, "preview", MAX_PREVIEW);
    const thumb = await formBuffer(data, "thumb", MAX_THUMB);
    if (!preview || !thumb) return { ok: false as const, error: "image" };

    const width = Number(formString(data, "width")) || 0;
    const height = Number(formString(data, "height")) || 0;
    const originalBytes = Number(formString(data, "bytes")) || 0;
    const mime = formString(data, "mime") || "image/jpeg";
    const format = (formString(data, "format") || "jpg") as "jpg" | "png" | "webp";
    const previewMeta = sniffImage(preview);
    const thumbMeta = sniffImage(thumb);
    if (width < 8 || height < 8 || !previewMeta || !thumbMeta) {
      return { ok: false as const, error: "image" };
    }

    const fileSha = formHex(data, "fileSha256") ?? sha256Buffer(preview);
    const sourceSha = formHex(data, "sourceSha256") ?? fileSha;
    const existing = await sql.query<{ id: string }>(
      `select id from wallpapers where sha256 = $1 or source_sha256 = $2 limit 1`,
      [fileSha, sourceSha],
    );
    if (existing[0]) return { ok: false as const, error: "duplicate" };

    const wallpaperId = `w${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const slug = await uniqueWallpaperSlug(slugify(title));
    const stored = await persistPlateMedia(sql, {
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

    await sql.query(
      `insert into wallpapers
         (id, title, description, category_id, creator_id, access_type, status,
          width, height, file_size_bytes, format, aspect_ratio, device_type,
          sha256, source_sha256, published_at, slug, alt_text, robots)
       values
         ($1, $2, $3, $4, null, 'free', 'approved', $5, $6, $7, $8, $9, $10,
          $11, $12, now(), $13, $14, 'index')`,
      [
        wallpaperId, title, description, categoryId, width, height, originalBytes,
        format, aspectLabel(width, height), formDevice(data, width, height), fileSha,
        sourceSha, slug, title,
      ],
    );

    await sql.query(
      `insert into wallpaper_assets
         (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
       values
         ($1, $2, 'thumbnail', 'public', $3, $4, $5, $6, 'image/jpeg', true),
         ($7, $2, 'preview', 'public', $8, $9, $10, $11, 'image/jpeg', true),
         ($12, $2, 'original', 'protected', $13, $14, $15, $16, $17, false)`,
      [
        `${wallpaperId}-athumb`, wallpaperId, stored.thumbPath, thumbMeta.width,
        thumbMeta.height, thumb.length, `${wallpaperId}-aprev`, stored.previewPath,
        previewMeta.width, previewMeta.height, preview.length, `${wallpaperId}-aorig`,
        stored.originalPath, width, height, originalBytes, mime,
      ],
    );

    await attachTags(sql, wallpaperId, tagNames);
    return { ok: true as const, id: wallpaperId, slug };
  });
