import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { SHA256 } from "@/lib/hash";
import { resolveOwnedPreview, resolveOwnedThumb, sniffImage } from "@/lib/media";
import { authMiddleware } from "@/lib/auth/middleware";
import { optionalAuthMiddleware } from "./optional-auth";
import { inferDeviceType, parseDeviceType, type DeviceType } from "@/lib/device";
import { fetchCardsByIds, fetchCategories, fetchCreators, marketplaceEnabled, premiumEnabled } from "./queries";
import { suggestDuos, daySeed } from "@/lib/duos";
import { findDuplicate, sha256Buffer } from "./dupes";
import { persistPlateMedia, removePlateMedia } from "./storage";
import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";
import { uniqueWallpaperSlug } from "./queries";
import { slugify } from "@/lib/seo";
import type {
  Category,
  CreatorCard,
  CreatorPage,
  CreatorStatus,
  StudioDashboard,
  StudioPieceDetail,
} from "@/lib/types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NOTIONAL_PER_DOWNLOAD = 0.04;
const MAX_TAGS = 8;

export type StudioTagOption = {
  slug: string;
  name: string;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function formString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function formDevice(form: FormData, width: number, height: number): DeviceType {
  const raw = formString(form, "deviceType");
  if (raw === "phone" || raw === "tablet" || raw === "both") return raw;
  return inferDeviceType(width, height);
}

function formHex(form: FormData, key: string): string | null {
  const v = formString(form, key).toLowerCase();
  return SHA256.test(v) ? v : null;
}

function parseTagNames(form: FormData): string[] {
  const raw = formString(form, "tags");
  let items: unknown[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      items = raw.split(",");
    }
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const name = String(item ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .slice(0, 24);
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
  await sql.query(`delete from wallpaper_tags where wallpaper_id = $1`, [wallpaperId]);
  for (const name of names) {
    const slug = slugifyTag(name);
    if (!slug) continue;
    const id = `tag-${slug}`.slice(0, 40);
    await sql.query(
      `insert into tags (id, slug, name) values ($1, $2, $3)
       on conflict (slug) do nothing`,
      [id, slug, name],
    );
    const rows = await sql.query<{ id: string }>(
      `select id from tags where slug = $1 limit 1`,
      [slug],
    );
    const tagId = rows[0]?.id;
    if (!tagId) continue;
    await sql.query(
      `insert into wallpaper_tags (wallpaper_id, tag_id) values ($1, $2)
       on conflict do nothing`,
      [wallpaperId, tagId],
    );
  }
}

async function requireApprovedCreator(userId: string) {
  if (!(await marketplaceEnabled())) return { ok: false as const, error: "off" };
  const sql = await getSql();
  const profile = await sql.query<{ status: string }>(
    `select status from creator_profiles where user_id = $1 limit 1`,
    [userId],
  );
  if (profile[0]?.status !== "approved") return { ok: false as const, error: "forbidden" };
  return { ok: true as const, sql };
}

async function notify(
  userId: string,
  title: string,
  body: string,
  href: string,
  wallpaperId: string | null = null,
) {
  const sql = await getSql();
  await sql.query(
    `insert into notifications (id, user_id, kind, title, body, href, wallpaper_id)
     values ($1, $2, 'system', $3, $4, $5, $6)`,
    [crypto.randomUUID(), userId, title, body, href, wallpaperId],
  );
}

export const listCreators = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: CreatorCard[]; marketplaceOn: boolean }> => {
    const on = await marketplaceEnabled();
    if (!on) return { items: [], marketplaceOn: false };
    return { items: await fetchCreators(24), marketplaceOn: true };
  },
);

export const getCreatorPage = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ context, data }): Promise<{ creator: CreatorPage | null }> => {
    try {
    const sql = await getSql();
    const rows = await sql.query<{
      user_id: string;
      slug: string;
      display_name: string;
      bio: string;
    }>(
      `select user_id, slug, display_name, bio
       from creator_profiles
       where slug = $1 and status = 'approved'
       limit 1`,
      [data.slug],
    );
    const row = rows[0];
    if (!row) return { creator: null };
    const owned = await sql.query<{ id: string }>(
      `select id from wallpapers
       where creator_id = $1 and status = 'approved'
       order by download_count desc`,
      [row.user_id],
    );
    const items = await fetchCardsByIds(
      owned.map((r) => r.id),
      context.userId,
    );
    let pairs: CreatorPage["pairs"] = [];
    try {
      pairs = suggestDuos(items, { count: 3, seed: daySeed(row.slug) });
    } catch (err) {
      console.error("[creator] duos", err);
    }
    return {
      creator: {
        slug: row.slug,
        displayName: row.display_name,
        bio: row.bio,
        pieceCount: items.length,
        items,
        pairs,
      },
    };
    } catch (err) {
      console.error("[creator]", err);
      return { creator: null };
    }
  });

export const getStudioDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StudioDashboard> => {
    const sql = await getSql();
    const on = await marketplaceEnabled();
    const empty: StudioDashboard = {
      marketplaceOn: on,
      status: "none",
      slug: null,
      displayName: null,
      bio: "",
      liveCount: 0,
      pendingCount: 0,
      downloads: 0,
      estimatedShare: 0,
      creatorSharePercent: 80,
      minPayout: 50,
      pieces: [],
      platesLeft: 0,
    };
    if (!on) return empty;

    const shareRows = await sql.query<{ value: unknown }>(
      `select value from app_settings where key = 'creator_share_percent' limit 1`,
    );
    const minRows = await sql.query<{ value: unknown }>(
      `select value from app_settings where key = 'min_payout_amount' limit 1`,
    );
    const share = Number(parseJson<number>(shareRows[0]?.value, 80));
    const minPayout = Number(parseJson<number>(minRows[0]?.value, 50));

    const profile = await sql.query<{
      slug: string;
      display_name: string;
      bio: string;
      status: CreatorStatus;
    }>(
      `select slug, display_name, bio, status from creator_profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    const plates = await sql.query<{ n: number }>(
      `select count(*)::int as n from wallpapers
       where status = 'draft' and creator_id is null`,
    );
    empty.platesLeft = plates[0]?.n ?? 0;
    empty.creatorSharePercent = share;
    empty.minPayout = minPayout;

    const row = profile[0];
    if (!row) return empty;

    const pieces = await sql.query<{
      id: string;
      title: string;
      status: string;
      access_type: "free" | "premium";
      download_count: number;
      thumbnail_url: string | null;
    }>(
      `select w.id, w.title, w.status, w.access_type, w.download_count,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       where w.creator_id = $1 and w.status <> 'removed'
       order by w.created_at desc`,
      [context.userId],
    );
    const live = pieces.filter((p) => p.status === "approved");
    const pending = pieces.filter((p) => p.status === "pending");
    const downloads = live.reduce((sum, p) => sum + (Number(p.download_count) || 0), 0);

    return {
      marketplaceOn: on,
      status: row.status,
      slug: row.slug,
      displayName: row.display_name,
      bio: row.bio,
      liveCount: live.length,
      pendingCount: pending.length,
      downloads,
      estimatedShare: downloads * NOTIONAL_PER_DOWNLOAD * (share / 100),
      creatorSharePercent: share,
      minPayout,
      platesLeft: plates[0]?.n ?? 0,
      pieces: pieces.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        accessType: p.access_type,
        thumbnailUrl: resolveOwnedThumb(p.id, p.thumbnail_url),
        downloadCount: Number(p.download_count) || 0,
      })),
    };
  });

export const applyToStudio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      displayName: z.string().trim().min(2).max(40),
      slug: z.string().trim().min(3).max(32),
      bio: z.string().trim().max(280).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    if (!(await marketplaceEnabled())) return { ok: false as const, error: "off" };
    const slug = data.slug.toLowerCase();
    if (!SLUG.test(slug)) return { ok: false as const, error: "slug" };
    const sql = await getSql();
    await sql.query(
      `insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`,
      [context.userId],
    );
    const taken = await sql.query<{ user_id: string }>(
      `select user_id from creator_profiles where slug = $1 and user_id <> $2 limit 1`,
      [slug, context.userId],
    );
    if (taken[0]) return { ok: false as const, error: "taken" };

    const existing = await sql.query<{ status: CreatorStatus }>(
      `select status from creator_profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    if (existing[0]?.status === "approved" || existing[0]?.status === "pending") {
      return { ok: true as const };
    }

    await sql.query(
      `insert into creator_profiles (user_id, slug, display_name, bio, status, applied_at)
       values ($1, $2, $3, $4, 'pending', now())
       on conflict (user_id) do update
         set slug = $2, display_name = $3, bio = $4, status = 'pending',
             applied_at = now(), reviewed_at = null, review_note = null`,
      [context.userId, slug, data.displayName, data.bio ?? ""],
    );
    return { ok: true as const };
  });

export const listStudioPlates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
    }): Promise<{ categories: Category[]; tags: StudioTagOption[]; premiumOn: boolean }> => {
      const sql = await getSql();
      const profile = await sql.query<{ status: string }>(
        `select status from creator_profiles where user_id = $1 limit 1`,
        [context.userId],
      );
      if (profile[0]?.status !== "approved") return { categories: [], tags: [], premiumOn: false };
      const tagRows = await sql.query<{ slug: string; name: string }>(
        `select slug, name from tags order by name asc`,
      );
      return {
        categories: await fetchCategories(),
        tags: tagRows.map((r) => ({ slug: r.slug, name: r.name })),
        premiumOn: await premiumEnabled(),
      };
    },
  );

export const checkStudioDuplicate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      hashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(4),
      excludeId: z.string().min(1).nullish(),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const gate = await requireApprovedCreator(context.userId);
      if (!gate.ok) return { hit: false as const };
      const hit = await findDuplicate(gate.sql, data.hashes, data.excludeId);
      if (!hit) return { hit: false as const };
      return { hit: true as const, own: hit.creatorId === context.userId };
    } catch (err) {
      console.error("[studio] duplicate check failed", err);
      throw err;
    }
  });

export const getStudioPiece = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }): Promise<{ piece: StudioPieceDetail | null }> => {
    const gate = await requireApprovedCreator(context.userId);
    if (!gate.ok) return { piece: null };
    const rows = await gate.sql.query<{
      id: string;
      title: string;
      description: string;
      category_id: string;
      access_type: "free" | "premium";
      status: string;
      download_count: number;
      device_type?: string | null;
      thumbnail_url: string | null;
      preview_url: string | null;
    }>(
      `select w.id, w.title, w.description, w.category_id, w.access_type, w.status, w.download_count, w.device_type,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'preview' limit 1) as preview_url
       from wallpapers w
       where w.id = $1 and w.creator_id = $2 and w.status <> 'removed'
       limit 1`,
      [data.id, context.userId],
    );
    const row = rows[0];
    if (!row) return { piece: null };
    const tagRows = await gate.sql.query<{ name: string }>(
      `select t.name from wallpaper_tags wt
       join tags t on t.id = wt.tag_id
       where wt.wallpaper_id = $1`,
      [row.id],
    );
    return {
      piece: {
        id: row.id,
        title: row.title,
        description: row.description,
        categoryId: row.category_id,
        accessType: row.access_type,
        status: row.status,
        thumbnailUrl: resolveOwnedThumb(row.id, row.thumbnail_url),
        previewUrl: resolveOwnedPreview(row.id, row.preview_url),
        downloadCount: Number(row.download_count) || 0,
        tags: tagRows.map((t) => t.name),
        deviceType: parseDeviceType(row.device_type),
      },
    };
  });

const MAX_ORIGINAL = MAX_ORIGINAL_BYTES;
const MAX_PREVIEW = MAX_ORIGINAL_BYTES;
const MAX_THUMB = 800_000;

function aspectLabel(w: number, h: number): string {
  if (!w || !h) return "1:1";
  const r = w / h;
  const presets: [number, string][] = [
    [9 / 16, "9:16"],
    [16 / 9, "16:9"],
    [1, "1:1"],
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
    [21 / 9, "21:9"],
    [9 / 21, "9:21"],
  ];
  const hit = presets.find(([v]) => Math.abs(r - v) < 0.045);
  return hit ? hit[1] : `${w}:${h}`;
}

async function formBuffer(form: FormData, key: string, max: number): Promise<Buffer | null> {
  const v = form.get(key);
  if (!(v instanceof Blob)) return null;
  if (v.size < 32 || v.size > max) return null;
  return Buffer.from(await v.arrayBuffer());
}

export const uploadStudioPlate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const gate = await requireApprovedCreator(context.userId);
    if (!gate.ok) return { ok: false as const, error: gate.error };
    const sql = gate.sql;

    const title = formString(data, "title");
    const description = formString(data, "description").slice(0, 280);
    const categoryId = formString(data, "categoryId");
    const accessType = "free";
    const tagNames = parseTagNames(data);
    const sourceSha = formHex(data, "sourceSha256");
    if (title.length < 2 || title.length > 60) return { ok: false as const, error: "title" };
    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === categoryId)) return { ok: false as const, error: "category" };

    const originalKey = formString(data, "originalKey");
    const original = originalKey ? Buffer.alloc(0) : ((await formBuffer(data, "original", MAX_ORIGINAL)) ?? Buffer.alloc(0));
    const preview = await formBuffer(data, "preview", MAX_PREVIEW);
    const thumb = await formBuffer(data, "thumb", MAX_THUMB);
    if ((!original.length && !originalKey) || !preview || !thumb) return { ok: false as const, error: "image" };

    const imageMeta = original.length
      ? sniffImage(original)
      : {
          mime: formString(data, "mime") || "image/jpeg",
          format: (formString(data, "format") || "jpg") as "jpg" | "png" | "webp",
          width: Number(formString(data, "width")) || 0,
          height: Number(formString(data, "height")) || 0,
        };
    if (!imageMeta || imageMeta.width < 8 || imageMeta.height < 8) {
      return { ok: false as const, error: "ratio" };
    }
    const mime = imageMeta.mime;
    const format = imageMeta.format;
    const width = imageMeta.width;
    const height = imageMeta.height;
    const originalBytes = original.length || Number(formString(data, "bytes")) || 0;
    const previewMeta = sniffImage(preview);
    const thumbMeta = sniffImage(thumb);
    if (!previewMeta || previewMeta.format !== "jpg" || !thumbMeta || thumbMeta.format !== "jpg") {
      return { ok: false as const, error: "image" };
    }

    const fileSha = original.length ? sha256Buffer(original) : (formHex(data, "fileSha256") ?? sourceSha ?? "");
    if (!fileSha) return { ok: false as const, error: "image" };
    const dup = await findDuplicate(sql, [fileSha, sourceSha ?? fileSha]);
    if (dup) return { ok: false as const, error: "duplicate" };

    const wallpaperId = `p${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const slug = await uniqueWallpaperSlug(slugify(title));
    const stored = await persistPlateMedia(sql, {
      wallpaperId,
      original,
      originalKey: originalKey || null,
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
          width, height, file_size_bytes, format, aspect_ratio, device_type, sha256, source_sha256, published_at, slug, alt_text)
       values
         ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14, null, $15, $16)`,
      [
        wallpaperId,
        title,
        description,
        categoryId,
        context.userId,
        accessType,
        width,
        height,
        originalBytes,
        format,
        aspectLabel(width, height),
        formDevice(data, width, height),
        fileSha,
        sourceSha ?? fileSha,
        slug,
        title,
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
        `${wallpaperId}-athumb`,
        wallpaperId,
        stored.thumbPath,
        thumbMeta.width,
        thumbMeta.height,
        thumb.length,
        `${wallpaperId}-aprev`,
        stored.previewPath,
        previewMeta.width,
        previewMeta.height,
        preview.length,
        `${wallpaperId}-aorig`,
        stored.originalPath,
        width,
        height,
        originalBytes,
        mime,
      ],
    );
    await attachTags(sql, wallpaperId, tagNames);
    return { ok: true as const, id: wallpaperId };
  });

export const updateStudioPlate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const gate = await requireApprovedCreator(context.userId);
    if (!gate.ok) return { ok: false as const, error: gate.error };
    const sql = gate.sql;

    const pieceId = formString(data, "pieceId");
    const title = formString(data, "title");
    const description = formString(data, "description").slice(0, 280);
    const categoryId = formString(data, "categoryId");
    const accessType = "free";
    const tagNames = parseTagNames(data);
    const sourceSha = formHex(data, "sourceSha256");
    if (!pieceId) return { ok: false as const, error: "piece" };
    if (title.length < 2 || title.length > 60) return { ok: false as const, error: "title" };
    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === categoryId)) return { ok: false as const, error: "category" };

    const existing = await sql.query<{ id: string; status: string }>(
      `select id, status from wallpapers
       where id = $1 and creator_id = $2 and status <> 'removed'
       limit 1`,
      [pieceId, context.userId],
    );
    if (!existing[0]) return { ok: false as const, error: "piece" };

    const originalKey = formString(data, "originalKey");
    const original = originalKey ? Buffer.alloc(0) : ((await formBuffer(data, "original", MAX_ORIGINAL)) ?? Buffer.alloc(0));
    const preview = await formBuffer(data, "preview", MAX_PREVIEW);
    const thumb = await formBuffer(data, "thumb", MAX_THUMB);
    const replacing = Boolean((original.length || originalKey) && preview && thumb);

    if (replacing && preview && thumb) {
      const imageMeta = original.length
        ? sniffImage(original)
        : {
            mime: formString(data, "mime") || "image/jpeg",
            format: (formString(data, "format") || "jpg") as "jpg" | "png" | "webp",
            width: Number(formString(data, "width")) || 0,
            height: Number(formString(data, "height")) || 0,
          };
      const previewMeta = sniffImage(preview);
      const thumbMeta = sniffImage(thumb);
      if (!imageMeta || !previewMeta || previewMeta.format !== "jpg" || !thumbMeta || thumbMeta.format !== "jpg") {
        return { ok: false as const, error: "image" };
      }
      if (imageMeta.width < 8 || imageMeta.height < 8) return { ok: false as const, error: "ratio" };
      const originalBytes = original.length || Number(formString(data, "bytes")) || 0;
      const fileSha = original.length ? sha256Buffer(original) : (formHex(data, "fileSha256") ?? sourceSha ?? "");
      if (!fileSha) return { ok: false as const, error: "image" };
      const dup = await findDuplicate(sql, [fileSha, sourceSha ?? fileSha], pieceId);
      if (dup) return { ok: false as const, error: "duplicate" };

      await removePlateMedia(sql, pieceId);
      const stored = await persistPlateMedia(sql, {
        wallpaperId: pieceId,
        original,
        originalKey: originalKey || null,
        originalBytes,
        preview,
        thumb,
        mime: imageMeta.mime,
        format: imageMeta.format,
        width: imageMeta.width,
        height: imageMeta.height,
        previewWidth: previewMeta.width,
        previewHeight: previewMeta.height,
        thumbWidth: thumbMeta.width,
        thumbHeight: thumbMeta.height,
      });
      await sql.query(`delete from wallpaper_assets where wallpaper_id = $1`, [pieceId]);
      await sql.query(
        `insert into wallpaper_assets
           (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
         values
           ($1, $2, 'thumbnail', 'public', $3, $4, $5, $6, 'image/jpeg', true),
           ($7, $2, 'preview', 'public', $8, $9, $10, $11, 'image/jpeg', true),
           ($12, $2, 'original', 'protected', $13, $14, $15, $16, $17, false)`,
        [
          `${pieceId}-athumb`,
          pieceId,
          stored.thumbPath,
          thumbMeta.width,
          thumbMeta.height,
          thumb.length,
          `${pieceId}-aprev`,
          stored.previewPath,
          previewMeta.width,
          previewMeta.height,
          preview.length,
          `${pieceId}-aorig`,
          stored.originalPath,
          imageMeta.width,
          imageMeta.height,
          originalBytes,
          imageMeta.mime,
        ],
      );
      const nextStatus = existing[0].status === "approved" ? "pending" : existing[0].status;
      await sql.query(
        `update wallpapers
            set title = $1, description = $2, category_id = $3, access_type = $4,
                width = $5, height = $6, file_size_bytes = $7, format = $8, aspect_ratio = $9,
                device_type = $14,
                sha256 = $10, source_sha256 = $11, status = $12,
                published_at = case when $12 = 'pending' then null else published_at end,
                updated_at = now()
          where id = $13`,
        [
          title,
          description,
          categoryId,
          accessType,
          imageMeta.width,
          imageMeta.height,
          originalBytes,
          imageMeta.format,
          aspectLabel(imageMeta.width, imageMeta.height),
          fileSha,
          sourceSha ?? fileSha,
          nextStatus,
          pieceId,
          formDevice(data, imageMeta.width, imageMeta.height),
        ],
      );
    } else {
      await sql.query(
        `update wallpapers
            set title = $1, description = $2, category_id = $3, access_type = $4,
                device_type = $5, updated_at = now()
          where id = $6`,
        [title, description, categoryId, accessType, formDevice(data, 1080, 1920), pieceId],
      );
    }
    await attachTags(sql, pieceId, tagNames);
    return { ok: true as const, id: pieceId };
  });

export { notify, NOTIONAL_PER_DOWNLOAD };
